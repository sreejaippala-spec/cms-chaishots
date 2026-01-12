/**
 * Fix for missing columns in programs table if volume wasn't reset
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const hasAssets = await knex.schema.hasColumn('programs', 'assets');
    const hasDesc = await knex.schema.hasColumn('programs', 'description');

    await knex.schema.alterTable('programs', (table) => {
        if (!hasAssets) {
            table.jsonb('assets').defaultTo('{}');
        }
        if (!hasDesc) {
            table.text('description');
        }
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // We don't remove them strictly because they might be part of initial schema in fresh installs
    // But for correctness of "undoing" this specific migration:
    const hasAssets = await knex.schema.hasColumn('programs', 'assets');
    const hasDesc = await knex.schema.hasColumn('programs', 'description');

    // Only drop if we want to reverse this specific action, but risky if they were in initial.
    // Ideally down migrations should be exact opposites.
    // For this tactical fix, we can leave it empty or conditionally drop.
};
