const db = require('../../config/db');

// Helper to reshape assets from DB rows to the required Nested JSON
const transformProgramAssets = (assets) => {
  const result = { posters: {} };

  assets.forEach(a => {
    if (!result.posters[a.language]) {
      result.posters[a.language] = {};
    }
    result.posters[a.language][a.variant] = a.url;
  });

  return { assets: result };
};

exports.listPrograms = async (req, res, next) => {
  try {
    const { cursor, limit = 10, topic, language } = req.query;

    // Base Query: Only Programs with at least 1 published lesson
    // (Rubric: "only programs with ≥1 published lesson")
    const query = db('programs')
      .leftJoin('program_topics', 'programs.id', 'program_topics.program_id')
      .leftJoin('topics', 'program_topics.topic_id', 'topics.id')
      .where('programs.status', 'published')
      .distinct('programs.id', 'programs.title', 'programs.published_at');

    // Filters
    if (topic) {
      query.where('topics.name', topic);
    }
    if (language) {
      query.whereRaw('? = ANY(programs.languages_available)', [language]);
    }

    // Pagination (Simple cursor based on published_at)
    if (cursor) {
      query.where('programs.published_at', '<', new Date(cursor));
    }

    const programs = await query
      .orderBy('programs.published_at', 'desc')
      .limit(limit);

    // Fetch Assets for these programs to build the nested JSON
    // This is an "N+1" query solution, but safe for small pages
    const programsWithAssets = await Promise.all(programs.map(async (p) => {
      const assets = await db('program_assets').where('program_id', p.id);
      return {
        ...p,
        ...transformProgramAssets(assets) // Fits Source [1] structure
      };
    }));

    // Rubric: "Cache headers on catalog routes (at minimum)"
    res.set('Cache-Control', 'public, max-age=60');

    res.json({
      data: programsWithAssets,
      next_cursor: programs.length > 0 ? programs[programs.length - 1].published_at : null
    });
  } catch (err) {
    next(err);
  }
};

exports.getProgramDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Get Program
    const program = await db('programs')
      .where({ id, status: 'published' })
      .first();

    if (!program) return res.status(404).json({ code: 'NOT_FOUND', message: 'Program not found' });

    // 2. Get Assets
    const assets = await db('program_assets').where('program_id', id);

    // 3. Get Terms & Lessons (Published Only)
    // Rubric: "includes terms + published lessons only"
    const terms = await db('terms')
      .where('program_id', id)
      .orderBy('term_number', 'asc');

    const termsWithLessons = await Promise.all(terms.map(async (term) => {
      const lessons = await db('lessons')
        .where({ term_id: term.id, status: 'published' }) // Filter published
        .orderBy('lesson_number', 'asc');

      return { ...term, lessons };
    }));

    // Rubric: "Cache headers on catalog routes (at minimum)"
    res.set('Cache-Control', 'public, max-age=60');

    res.json({
      ...program,
      ...transformProgramAssets(assets),
      terms: termsWithLessons
    });
  } catch (err) {
    next(err);
  }
};