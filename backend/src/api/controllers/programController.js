const db = require('../../config/db');

exports.listAllPrograms = async (req, res, next) => {
    try {
        const programs = await db('programs')
            .select('programs.id', 'programs.title', 'programs.status', 'programs.language_primary', 'programs.updated_at', 'programs.created_at', 'programs.assets as meta_assets')
            .orderBy('programs.updated_at', 'desc');

        // Fetch thumbnails (using first available landscape poster)
        // Note: A join would be faster, but map is fine for now
        const programsWithAssets = await Promise.all(programs.map(async (p) => {
            const asset = await db('program_assets')
                .where({ program_id: p.id, variant: 'landscape' })
                .first(); // prefer any landscape

            return {
                ...p,
                thumbnail: asset ? asset.url : null
                // We leave p.assets or meta_assets as is, but UI should use thumbnail
            };
        }));

        res.json(programsWithAssets);
    } catch (err) {
        next(err);
    }
};

exports.getProgramDetailCMS = async (req, res, next) => {
    try {
        const { id } = req.params;
        const program = await db('programs').where({ id }).first();

        if (!program) return res.status(404).json({ error: 'Program not found' });

        const terms = await db('terms').where({ program_id: id }).orderBy('term_number');

        // Fetch lessons for all terms
        const termIds = terms.map(t => t.id);
        const lessons = await db('lessons').whereIn('term_id', termIds).orderBy('lesson_number');

        // Attach lessons to terms
        terms.forEach(term => {
            term.lessons = lessons.filter(l => l.term_id === term.id);
        });

        // Fetch topics
        const topics = await db('topics')
            .join('program_topics', 'topics.id', 'program_topics.topic_id')
            .where('program_topics.program_id', id)
            .select('topics.name', 'topics.id');

        program.terms = terms;
        program.topics = topics.map(t => t.name); // Send names for easier UI handling

        // Get assets from the normalized table
        const assetsRows = await db('program_assets').where({ program_id: id });
        const finalAssets = { posters: {} };
        assetsRows.forEach(row => {
            if (!finalAssets.posters[row.language]) finalAssets.posters[row.language] = {};
            finalAssets.posters[row.language][row.variant] = row.url;
        });
        program.assets = finalAssets;

        res.json(program);
    } catch (err) {
        next(err);
    }
};

exports.createProgram = async (req, res, next) => {
    try {
        const { title, description, language_primary } = req.body;
        const primaryLang = language_primary || 'en';
        const [program] = await db('programs').insert({
            title,
            description,
            language_primary: primaryLang,
            languages_available: [primaryLang],
            status: 'draft',
            assets: { posters: {} }
        }).returning('*');
        res.status(201).json(program);
    } catch (err) {
        next(err);
    }
};

exports.updateProgram = async (req, res, next) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        const updates = req.body;
        const { topics, ...programUpdates } = updates; // Extract topics

        delete programUpdates.id;
        delete programUpdates.created_at;

        // 1. Update Program Fields
        const [updated] = await trx('programs')
            .where({ id })
            .update({ ...programUpdates, updated_at: trx.fn.now() })
            .returning('*');

        if (!updated) {
            await trx.rollback();
            return res.status(404).json({ error: 'Program not found' });
        }

        // 2. Handle Topics Update (if provided)
        if (topics && Array.isArray(topics)) {
            // topics is array of strings (names)
            const topicIds = [];
            for (const tagName of topics) {
                // Find or Create Topic
                let topic = await trx('topics').where({ name: tagName }).first();
                if (!topic) {
                    const [newTopic] = await trx('topics').insert({ name: tagName }).returning('*');
                    topic = newTopic;
                }
                topicIds.push(topic.id);
            }

            // Sync M2M: Delete old -> Insert new
            await trx('program_topics').where({ program_id: id }).del();
            if (topicIds.length > 0) {
                const relations = topicIds.map(tid => ({ program_id: id, topic_id: tid }));
                await trx('program_topics').insert(relations);
            }
        }

        // Handle assets update if provided
        if (programUpdates.assets && programUpdates.assets.posters) {
            // For each language/variant in the JSON, upsert into program_assets
            // "assets": { "posters": { "en": { "portrait": "url" } } }
            const posters = programUpdates.assets.posters;
            for (const lang of Object.keys(posters)) {
                const variants = posters[lang];
                for (const variant of Object.keys(variants)) {
                    const url = variants[variant];
                    // Upsert
                    await trx('program_assets')
                        .insert({
                            program_id: id,
                            language: lang,
                            variant: variant,
                            url: url
                        })
                        .onConflict(['program_id', 'language', 'variant'])
                        .merge(); // Update URL if exists
                }
            }
        }

        await trx.commit();

        // Return updated program with topics
        const finalProgram = await db('programs').where({ id }).first();
        const finalTopics = await db('topics')
            .join('program_topics', 'topics.id', 'program_topics.topic_id')
            .where('program_topics.program_id', id)
            .select('topics.name');

        finalProgram.topics = finalTopics.map(t => t.name);

        // Fetch Normalized Assets for Program
        const assetsRows = await db('program_assets').where({ program_id: id });
        const finalAssets = { posters: {} };
        assetsRows.forEach(row => {
            if (!finalAssets.posters[row.language]) finalAssets.posters[row.language] = {};
            finalAssets.posters[row.language][row.variant] = row.url;
        });
        finalProgram.assets = finalAssets;

        res.json(finalProgram);
    } catch (err) {
        await trx.rollback();
        next(err);
    }
};

exports.getAllTopics = async (req, res, next) => {
    try {
        const topics = await db('topics').select('name', 'id').orderBy('name');
        res.json(topics);
    } catch (err) {
        next(err);
    }
};

exports.addTerm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        // Get highest term number
        const lastTerm = await db('terms')
            .where({ program_id: id })
            .orderBy('term_number', 'desc')
            .first();

        const term_number = lastTerm ? lastTerm.term_number + 1 : 1;

        const [term] = await db('terms').insert({
            program_id: id,
            title,
            term_number
        }).returning('*');

        res.status(201).json(term);
    } catch (err) {
        next(err);
    }
};
