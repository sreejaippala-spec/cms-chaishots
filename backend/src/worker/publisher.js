const db = require('../config/db');

async function publishScheduledLessons() {
  console.log(`[Worker] Checking for scheduled lessons at ${new Date().toISOString()}...`);

  // Start a Transaction
  await db.transaction(async (trx) => {
    
    // 1. Find & Lock Rows [2]
    // "FOR UPDATE SKIP LOCKED" is the key to concurrency safety in Postgres.
    // It locks the rows so other workers skip them immediately.
    const lessonsToPublish = await trx('lessons')
      .select('lessons.*', 'terms.program_id')
      .join('terms', 'lessons.term_id', 'terms.id') // Join to get program_id
      .where('lessons.status', 'scheduled')
      .andWhere('lessons.publish_at', '<=', new Date()) // Time has passed
      .forUpdate()
      .skipLocked();

    if (lessonsToPublish.length === 0) {
      return; // Nothing to do
    }

    console.log(`[Worker] Found ${lessonsToPublish.length} lessons to publish.`);

    for (const lesson of lessonsToPublish) {
      // 2. Publish the Lesson
      await trx('lessons')
        .where({ id: lesson.id })
        .update({
          status: 'published',
          published_at: trx.fn.now() // Set actual publish time
        });

      console.log(`   -> Published Lesson: ${lesson.title}`);

      // 3. Check Parent Program Status [2]
      // "A Program automatically becomes published when it has >= 1 published lesson"
      const parentProgram = await trx('programs')
        .where({ id: lesson.program_id })
        .first();

      if (parentProgram && parentProgram.status !== 'published') {
        await trx('programs')
          .where({ id: lesson.program_id })
          .update({
            status: 'published',
            published_at: trx.fn.now()
          });
        console.log(`   -> Also published parent Program: ${parentProgram.title}`);
      }
    }
  });
}

module.exports = publishScheduledLessons;