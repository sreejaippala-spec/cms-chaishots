const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');

const programController = require('../controllers/programController');
const lessonController = require('../controllers/lessonController');
const authController = require('../controllers/authController');

// 1. List All Programs (Drafts + Scheduled included)
router.get('/programs', requireRole(['admin', 'editor', 'viewer']), programController.listAllPrograms);
router.post('/programs', requireRole(['admin', 'editor']), programController.createProgram);
router.get('/programs/:id', requireRole(['admin', 'editor', 'viewer']), programController.getProgramDetailCMS);
router.patch('/programs/:id', requireRole(['admin', 'editor']), programController.updateProgram);
router.get('/topics', requireRole(['admin', 'editor', 'viewer']), programController.getAllTopics);

router.post('/programs/:id/terms', requireRole(['admin', 'editor']), programController.addTerm);

router.get('/lessons/:id', requireRole(['admin', 'editor', 'viewer']), lessonController.getLessonDetailCMS);
router.patch('/lessons/:id/status', requireRole(['admin', 'editor']), lessonController.updateLessonStatus);
router.patch('/lessons/:id', requireRole(['admin', 'editor']), lessonController.updateLesson);

// New: Create Lesson under a Term
// Note: Frontend will use: POST /api/cms/terms/:id/lessons
router.post('/terms/:id/lessons', requireRole(['admin', 'editor']), lessonController.createLesson);
router.get('/lessons/:id', requireRole(['admin', 'editor', 'viewer']), lessonController.getLessonDetailCMS);

// 3. Mock Login (Source [3]: "Must include Login UI")
router.post('/login', authController.login);

module.exports = router;