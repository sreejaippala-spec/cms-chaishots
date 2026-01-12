const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const seed = async () => {
  console.log('🌱 Starting Seed...');

  try {
    // Clear out old data
    console.log('Cleaning existing data...');
    await db('lesson_assets').del();
    await db('program_assets').del();
    await db('program_topics').del();
    await db('lessons').del();
    await db('terms').del();
    await db('topics').del();
    await db('programs').del();
    await db('users').del();

    // Create default users
    console.log('Seeding Users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    await db('users').insert([
      { id: uuidv4(), email: 'admin@example.com', password_hash: passwordHash, role: 'admin' },
      { id: uuidv4(), email: 'editor@example.com', password_hash: passwordHash, role: 'editor' },
      { id: uuidv4(), email: 'viewer@example.com', password_hash: passwordHash, role: 'viewer' }
    ]);

    // 3. Topics
    console.log('Seeding Topics...');
    const topicIds = {
      tech: uuidv4(),
      design: uuidv4(),
      business: uuidv4()
    };
    await db('topics').insert([
      { id: topicIds.tech, name: 'Technology' },
      { id: topicIds.design, name: 'Design' },
      { id: topicIds.business, name: 'Business' }
    ]);

    // 4. Programs
    console.log('Seeding Programs...');
    const prog1Id = uuidv4();
    const prog2Id = uuidv4();

    // Program 1: Published, Multi-language (EN, HI)
    await db('programs').insert({
      id: prog1Id,
      title: 'Full Stack Web Development',
      description: 'Master the art of web development with our comprehensive bootcamp.',
      language_primary: 'en',
      languages_available: ['en', 'hi'],
      status: 'published',
      published_at: new Date()
    });

    // Program 2: Draft, Single Language (EN)
    await db('programs').insert({
      id: prog2Id,
      title: 'UX Design Fundamentals',
      description: 'Learn how to design user-friendly interfaces.',
      language_primary: 'en',
      languages_available: ['en'],
      status: 'draft',
      published_at: null
    });

    // Program Topics
    await db('program_topics').insert([
      { program_id: prog1Id, topic_id: topicIds.tech },
      { program_id: prog2Id, topic_id: topicIds.design }
    ]);

    // Program Assets (Posters)
    // Prog 1 needs EN and HI posters (Portrait + Landscape)
    const assets = [];
    const addProgramAsset = (pid, lang, variant, url) => {
      assets.push({
        id: uuidv4(),
        program_id: pid,
        language: lang,
        variant,
        url
      });
    };

    // Prog 1: Web Dev images
    addProgramAsset(prog1Id, 'en', 'portrait', `https://miro.medium.com/1*IYQnAWgsoxvm8XPP2Rmzbg.jpeg`);
    addProgramAsset(prog1Id, 'en', 'landscape', `https://miro.medium.com/1*IYQnAWgsoxvm8XPP2Rmzbg.jpeg`);
    addProgramAsset(prog1Id, 'hi', 'portrait', `https://miro.medium.com/1*IYQnAWgsoxvm8XPP2Rmzbg.jpeg`);
    addProgramAsset(prog1Id, 'hi', 'landscape', `https://miro.medium.com/1*IYQnAWgsoxvm8XPP2Rmzbg.jpeg`);

    // Prog 2: UX Design - Design tools, color palettes
    addProgramAsset(prog2Id, 'en', 'portrait', `https://www.truevalueinfosoft.com/assets/img/blog/the-importance-of-uiux-design-in-web-and-mobile-development.jpg`);
    addProgramAsset(prog2Id, 'en', 'landscape', `https://www.truevalueinfosoft.com/assets/img/blog/the-importance-of-uiux-design-in-web-and-mobile-development.jpg`);

    await db('program_assets').insert(assets);

    // 5. Terms
    console.log('Seeding Terms...');
    const term1Id = uuidv4(); // Prog 1
    const term2Id = uuidv4(); // Prog 1
    const term3Id = uuidv4(); // Prog 2

    await db('terms').insert([
      { id: term1Id, program_id: prog1Id, term_number: 1, title: 'Frontend Basics' },
      { id: term2Id, program_id: prog1Id, term_number: 2, title: 'Backend Mastery' },
      { id: term3Id, program_id: prog2Id, term_number: 1, title: 'Design Thinking' }
    ]);

    // 6. Lessons
    console.log('Seeding Lessons...');
    const lessonAssets = [];
    const addLessonAsset = (lid, lang, variant, url) => {
      lessonAssets.push({
        id: uuidv4(),
        lesson_id: lid,
        language: lang,
        variant,
        url
      });
    };

    // We need 6 lessons total.
    // Prog 1 (Published) -> Needs valid published lessons
    // Prog 2 (Draft) -> Can have draft/scheduled lessons

    // Lesson 1: Published, Video, Multi-lang (EN, HI)
    // HTML/CSS Image
    const l1Img = 'photo-1542831371-29b0f74f9713';
    const l1Id = uuidv4();
    await db('lessons').insert({
      id: l1Id,
      term_id: term1Id,
      lesson_number: 1,
      title: 'HTML & CSS Intro',
      content_type: 'video',
      duration_ms: 600000,
      content_language_primary: 'en',
      content_languages_available: ['en', 'hi'],
      content_urls_by_language: { en: 'https://www.w3schools.com/html/mov_bbb.mp4', hi: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      status: 'published',
      published_at: new Date()
    });
    addLessonAsset(l1Id, 'en', 'portrait', `https://en.wikipedia.org/wiki/HTML`);
    addLessonAsset(l1Id, 'en', 'landscape', `https://en.wikipedia.org/wiki/HTML`);
    addLessonAsset(l1Id, 'hi', 'portrait', `https://en.wikipedia.org/wiki/HTML`);
    addLessonAsset(l1Id, 'hi', 'landscape', `https://en.wikipedia.org/wiki/HTML`);

    // Lesson 2: Published, Article
    // JS Image
    const l2Id = uuidv4();
    await db('lessons').insert({
      id: l2Id,
      term_id: term1Id,
      lesson_number: 2,
      title: 'JavaScript Basics',
      content_type: 'article',
      content_language_primary: 'en',
      content_languages_available: ['en'],
      status: 'published',
      published_at: new Date()
    });
    addLessonAsset(l2Id, 'en', 'portrait', `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQ4qe-TiNdb7kONl0a1C3a1R3H9TPWKSJeGg&s`);
    addLessonAsset(l2Id, 'en', 'landscape', `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQ4qe-TiNdb7kONl0a1C3a1R3H9TPWKSJeGg&s`);

    // Lesson 3: Draft
    const l3Id = uuidv4();
    await db('lessons').insert({
      id: l3Id,
      term_id: term2Id,
      lesson_number: 1,
      title: 'Node.js Setup',
      content_type: 'video',
      duration_ms: 300000,
      content_language_primary: 'en',
      content_languages_available: ['en'],
      status: 'draft'
    });
    addLessonAsset(l3Id, 'en', 'portrait', `https://www.mindrops.com/images/nodejs-image.webp`);
    addLessonAsset(l3Id, 'en', 'landscape', `https://www.mindrops.com/images/nodejs-image.webp`);

    // Lesson 4: Scheduled (Past - should auto publish if worker runs)
    // Wait, rubric says: "One scheduled lesson with publish_at within the next 2 minutes"
    const l4Id = uuidv4();
    const twoMinutesFromNow = new Date(Date.now() + 1000 * 90); // 90 seconds from now
    await db('lessons').insert({
      id: l4Id,
      term_id: term2Id,
      lesson_number: 2,
      title: 'Express.js Routing (Scheduled)',
      content_type: 'video',
      duration_ms: 400000,
      content_language_primary: 'en',
      content_languages_available: ['en'],
      status: 'scheduled',
      publish_at: twoMinutesFromNow
    });
    addLessonAsset(l4Id, 'en', 'portrait', `https://ajeetchaulagain.com/blog/express-js-getting-started/`); // Reuse server img
    addLessonAsset(l4Id, 'en', 'landscape', `https://ajeetchaulagain.com/blog/express-js-getting-started/`);

    // Lesson 5: Draft (Prog 2)
    // Design Personas
    const l5Img = 'photo-1552664730-d307ca884978'; // Team meeting/planning
    const l5Id = uuidv4();
    await db('lessons').insert({
      id: l5Id,
      term_id: term3Id,
      lesson_number: 1,
      title: 'User Personas',
      content_type: 'article',
      content_language_primary: 'en',
      content_languages_available: ['en'],
      status: 'draft'
    });
    addLessonAsset(l5Id, 'en', 'portrait', `https://res.cloudinary.com/vistaprint/images/f_auto,q_auto/v1706091508/ideas-and-advice-prod/en-us/Marketing-personas/Marketing-personas.jpg?_i=AA`);
    addLessonAsset(l5Id, 'en', 'landscape', `https://res.cloudinary.com/vistaprint/images/f_auto,q_auto/v1706091508/ideas-and-advice-prod/en-us/Marketing-personas/Marketing-personas.jpg?_i=AA`);

    // Lesson 6: Draft (Prog 2)
    // Wireframing
    const l6Id = uuidv4();
    await db('lessons').insert({
      id: l6Id,
      term_id: term3Id,
      lesson_number: 2,
      title: 'Wireframing',
      content_type: 'video',
      duration_ms: 500000,
      content_language_primary: 'en',
      content_languages_available: ['en'],
      status: 'draft'
    });
    addLessonAsset(l6Id, 'en', 'portrait', `https://cdn.sanity.io/images/599r6htc/regionalized/4c8605ad998d69b03a6eefb850cce5e23a0a96dc-2880x1440.png?w=2880&h=1440&q=75&fit=max&auto=format`);
    addLessonAsset(l6Id, 'en', 'landscape', `https://cdn.sanity.io/images/599r6htc/regionalized/4c8605ad998d69b03a6eefb850cce5e23a0a96dc-2880x1440.png?w=2880&h=1440&q=75&fit=max&auto=format`);

    await db('lesson_assets').insert(lessonAssets);

    console.log('✅ Seed Completed Successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seed Failed:', err);
    process.exit(1);
  }
};

seed();