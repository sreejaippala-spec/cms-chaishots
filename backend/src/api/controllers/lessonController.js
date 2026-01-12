const db = require('../../config/db');

exports.updateLessonStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, publish_at } = req.body; // status: 'scheduled' | 'published'

        // Validation: If scheduling, need time
        if (status === 'scheduled' && !publish_at) {
            return res.status(400).json({ message: 'publish_at is required for scheduling' });
        }

        // Update
        await db('lessons').where({ id }).update({
            status,
            publish_at: status === 'scheduled' ? publish_at : null,
            published_at: status === 'published' ? new Date() : null
        });

        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.getLessonDetailCMS = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lesson = await db('lessons').where({ id }).first();

        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

        // Fetch Normalized Assets
        const assetsRows = await db('lesson_assets').where({ lesson_id: id });

        // Transform to expected JSON structure: { thumbnails: { en: { portrait: ... } } }
        const assets = { thumbnails: {} };
        assetsRows.forEach(row => {
            if (!assets.thumbnails[row.language]) assets.thumbnails[row.language] = {};
            assets.thumbnails[row.language][row.variant] = row.url;
        });

        lesson.assets = assets;

        res.json(lesson);
    } catch (err) {
        next(err);
    }
};

exports.createLesson = async (req, res, next) => {
    try {
        // Note: We get term_id from params, but implementation plan said POST /terms/:id/lessons
        // Let's assume request body has title and we use term_id from URI if route is structured that way
        // or just pass term_id in body. Let's look at route structure plan: `POST /terms/:id/lessons`
        const { id: term_id } = req.params;
        const { title, content_type } = req.body;

        const maxLesson = await db('lessons')
            .where({ term_id })
            .max('lesson_number as max')
            .first();

        const lesson_number = (maxLesson?.max || 0) + 1;

        const [lesson] = await db('lessons')
            .insert({
                term_id,
                title,
                lesson_number,
                content_type: content_type || 'video',
                status: 'draft'
            })
            .returning('*');

        res.status(201).json(lesson);
    } catch (err) {
        next(err);
    }
};

exports.updateLesson = async (req, res, next) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowed = ['title', 'content_type', 'duration_ms', 'assets', 'status', 'publish_at', 'content_urls_by_language', 'subtitle_urls_by_language', 'subtitle_languages'];
        const safeUpdates = {};

        // Extract fields for lessons table
        Object.keys(updates).forEach(key => {
            if (allowed.includes(key) && key !== 'assets') safeUpdates[key] = updates[key];
        });

        // Update Metadata
        safeUpdates.updated_at = trx.fn.now();

        const [lesson] = await trx('lessons')
            .where({ id })
            .update(safeUpdates)
            .returning('*');

        if (!lesson) {
            await trx.rollback();
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Handle Assets Sync (Thumbnails & Subtitles)
        if (updates.assets) {
            // "assets": { "thumbnails": { "en": { "portrait": "url" } } }
            if (updates.assets.thumbnails) {
                const thumbnails = updates.assets.thumbnails;
                for (const lang of Object.keys(thumbnails)) {
                    const variants = thumbnails[lang];
                    for (const variant of Object.keys(variants)) {
                        const url = variants[variant];
                        // Upsert Thumbnail
                        await trx('lesson_assets')
                            .insert({
                                lesson_id: id,
                                language: lang,
                                variant: variant,
                                url: url
                            })
                            .onConflict(['lesson_id', 'language', 'variant']) // Unique constraint
                            .merge();
                    }
                }
            }
        }

        await trx.commit();

        // Refetch full object (including assets) to ensure frontend state is correct
        const finalLesson = await db('lessons').where({ id }).first();
        const assetsRows = await db('lesson_assets').where({ lesson_id: id });
        const finalAssets = { thumbnails: {} };
        assetsRows.forEach(row => {
            if (!finalAssets.thumbnails[row.language]) finalAssets.thumbnails[row.language] = {};
            finalAssets.thumbnails[row.language][row.variant] = row.url;
        });
        finalLesson.assets = finalAssets;

        res.json(finalLesson);
    } catch (err) {
        await trx.rollback();
        next(err);
    }
};
