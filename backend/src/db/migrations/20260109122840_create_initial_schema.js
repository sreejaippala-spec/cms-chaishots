/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Programs Table [6]
  await knex.schema.createTable('programs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.string('status').notNullable().defaultTo('draft'); // draft, published, archived
    table.string('language_primary').notNullable();
    table.specificType('languages_available', 'text[]').notNullable(); // Array of strings

    // Missing columns required by App/Controller
    table.text('description');
    table.jsonb('assets').defaultTo('{}');

    table.timestamp('published_at');
    table.timestamps(true, true);

    // Index Requirement [5]
    table.index(['status', 'language_primary', 'published_at']);
  });

  // 2. Terms Table [6]
  await knex.schema.createTable('terms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('program_id').references('id').inTable('programs').onDelete('CASCADE');
    table.integer('term_number').notNullable();
    table.string('title').notNullable();
    table.timestamps(true, true);

    // Constraint: Unique (program_id, term_number) [7]
    table.unique(['program_id', 'term_number']);
  });

  // 3. Lessons Table [6]
  await knex.schema.createTable('lessons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('term_id').references('id').inTable('terms').onDelete('CASCADE');
    table.integer('lesson_number').notNullable();
    table.string('title').notNullable();
    table.string('content_type').notNullable(); // video, article
    table.integer('duration_ms'); // Required if video
    table.boolean('is_paid').defaultTo(false);

    table.string('status').notNullable().defaultTo('draft');
    table.timestamp('publish_at');  // Scheduled time
    table.timestamp('published_at'); // Actual publish time

    // Multi-language content maps (JSONB is simpler for simple key-value maps) [8]
    table.jsonb('content_urls_by_language').defaultTo('{}');
    table.jsonb('subtitle_urls_by_language').defaultTo('{}');

    table.timestamps(true, true);

    // Constraint: Unique (term_id, lesson_number) [7]
    table.unique(['term_id', 'lesson_number']);

    // Worker Index Requirement: lesson(status, publish_at) [5]
    table.index(['status', 'publish_at']);
  });

  // 4. Topics & Junction Table [6]
  await knex.schema.createTable('topics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique(); // Unique constraint [7]
  });

  await knex.schema.createTable('program_topics', (table) => {
    table.uuid('program_id').references('id').inTable('programs').onDelete('CASCADE');
    table.uuid('topic_id').references('id').inTable('topics').onDelete('CASCADE');
    table.primary(['program_id', 'topic_id']); // M2M Join Index [5]
  });

  // 5. Option A: Normalized Assets [4]
  // We need this to validate "Portrait AND Landscape" strictly via SQL queries
  await knex.schema.createTable('program_assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('program_id').references('id').inTable('programs').onDelete('CASCADE');
    table.string('language').notNullable();
    table.string('variant').notNullable(); // portrait, landscape, etc.
    table.string('url').notNullable();

    // Ensure one variant per language per program
    table.unique(['program_id', 'language', 'variant']);
  });

  await knex.schema.createTable('lesson_assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').references('id').inTable('lessons').onDelete('CASCADE');
    table.string('language').notNullable();
    table.string('variant').notNullable();
    table.string('url').notNullable();

    // Ensure one variant per language per lesson
    table.unique(['lesson_id', 'language', 'variant']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('lesson_assets');
  await knex.schema.dropTableIfExists('program_assets');
  await knex.schema.dropTableIfExists('program_topics');
  await knex.schema.dropTableIfExists('topics');
  await knex.schema.dropTableIfExists('lessons');
  await knex.schema.dropTableIfExists('terms');
  await knex.schema.dropTableIfExists('programs');
};