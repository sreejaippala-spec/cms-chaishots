/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('lessons', (table) => {
        table.string('content_language_primary').notNullable().defaultTo('en');
        table.specificType('content_languages_available', 'text[]').notNullable().defaultTo('{en}');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('lessons', (table) => {
        table.dropColumn('content_languages_available');
        table.dropColumn('content_language_primary');
    });
};
