const express = require('express');
const router = express.Router();
const db = require('../db');
const { userAuth } = require('../middleware/auth'); // For user-specific data

// --- Public Routes ---

// GET /api/categories - Get all categories
router.get('/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /api/shows - Get all shows
// Can be filtered by query: /api/shows?category=1
router.get('/shows', (req, res) => {
    const categoryId = req.query.category;
    let sql = `
        SELECT s.*, c.name as category_name 
        FROM shows s
        LEFT JOIN categories c ON s.category_id = c.id
    `;
    let params = [];

    if (categoryId) {
        sql += ' WHERE s.category_id = ?';
        params.push(categoryId);
    }
    sql += ' ORDER BY s.title';

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /api/shows/:id - Get details for a single show
router.get('/shows/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT s.*, c.name as category_name 
        FROM shows s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.id = ?
    `;
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Show not found.' });
        }
        res.json(row);
    });
});

// GET /api/shows/:id/episodes - Get all episodes for a show
router.get('/shows/:id/episodes', (req, res) => {
    const { id } = req.params;
    // Only show episodes that are scheduled to be published
    const sql = `
        SELECT * FROM episodes 
        WHERE show_id = ? AND publish_date <= CURRENT_TIMESTAMP
        ORDER BY ep_number
    `;
    db.all(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /api/episodes/:id - Get details for a single episode
router.get('/episodes/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            e.*, 
            s.title as show_title,
            (SELECT id FROM episodes 
             WHERE show_id = e.show_id AND ep_number = e.ep_number + 1) as next_episode_id
        FROM episodes e
        JOIN shows s ON e.show_id = s.id
        WHERE e.id = ? AND e.publish_date <= CURRENT_TIMESTAMP
    `;
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Episode not found or not yet published.' });
        }
        res.json(row);
    });
});

// GET /api/search - AJAX search
router.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
    const searchTerm = `%${query}%`;
    // Searches title, genres, and description in shows
    const sql = `
        SELECT s.*, c.name as category_name 
        FROM shows s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.title LIKE ? OR s.genres LIKE ? OR s.description LIKE ?
        LIMIT 20
    `;
    db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /api/slides - Get all hero slides
router.get('/slides', (req, res) => {
    db.all('SELECT * FROM hero_slides ORDER BY id', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});


// --- User-Specific Routes (Auth Required) ---

// GET /api/history - Get user's full watch history
router.get('/history', userAuth, (req, res) => {
    const userId = req.user.id;
    const sql = `
        SELECT e.id, e.title, e.thumbnail, s.title as show_title, wh.progress, wh.last_watched_at
        FROM watch_history wh
        JOIN episodes e ON wh.episode_id = e.id
        JOIN shows s ON e.show_id = s.id
        WHERE wh.user_id = ?
        ORDER BY wh.last_watched_at DESC
        LIMIT 20
    `;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /api/history/:episodeId - Get progress for one episode
router.get('/history/:episodeId', userAuth, (req, res) => {
    const userId = req.user.id;
    const { episodeId } = req.params;
    
    db.get(
        'SELECT * FROM watch_history WHERE user_id = ? AND episode_id = ?',
        [userId, episodeId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(row || { progress: 0 }); // Return 0 progress if no record
        }
    );
});

// POST /api/history/update - Add/update watch progress
router.post('/history/update', userAuth, (req, res) => {
    const userId = req.user.id;
    const { episode_id, progress } = req.body;

    if (!episode_id || progress === undefined) {
        return res.status(400).json({ error: 'Episode ID and progress are required.' });
    }

    // "UPSERT" - Update or Insert
    const sql = `
        INSERT INTO watch_history (user_id, episode_id, progress, last_watched_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, episode_id) 
        DO UPDATE SET progress = excluded.progress, last_watched_at = CURRENT_TIMESTAMP
    `;
    db.run(sql, [userId, episode_id, progress], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Progress saved.' });
    });
});

module.exports = router;