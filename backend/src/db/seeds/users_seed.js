const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
    // Deletes ALL existing entries
    await knex('users').del();

    const passwordHash = await bcrypt.hash('password123', 10);

    await knex('users').insert([
        {
            email: 'admin@example.com',
            password_hash: passwordHash,
            role: 'admin'
        },
        {
            email: 'editor@example.com',
            password_hash: passwordHash,
            role: 'editor'
        },
        {
            email: 'viewer@example.com',
            password_hash: passwordHash,
            role: 'viewer'
        }
    ]);
};
