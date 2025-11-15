const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Setup for File Uploads ---

// Define storage location for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We save to public/uploads, sorted by type
        let dir = path.join(__dirname, '../../public/uploads/other');
        if (file.fieldname === 'poster' || file.fieldname === 'banner' || file.fieldname === 'thumbnail') {
            dir = path.join(__dirname, '../../public/uploads/images');
        } else if (file.fieldname === 'image') { // For hero slides
             dir = path.join(__dirname, '../../public/uploads/slides');
        }
        
        // Create directory if it doesn't exist
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

// Apply admin auth to all routes in this file
router.use(adminAuth);

// --- Analytics ---

// GET /api/admin/analytics - Basic Dashboard Stats
router.get('/analytics', (req, res) => {
    let stats = {};
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        stats.users = row.count || 0;
        db.get('SELECT COUNT(*) as count FROM shows', [], (err, row) => {
            stats.shows = row.count || 0;
            db.get('SELECT COUNT(*) as count FROM episodes', [], (err, row) => {
                stats.episodes = row.count || 0;
                // Placeholder for views
                stats.daily_views = 0; 
                res.json(stats);
            });
        });
    });
});

// --- Category Management ---

// POST /api/admin/categories
router.post('/categories', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name });
    });
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', (req, res) => {
    const { name } = req.body;
    db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Category updated.' });
    });
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', (req, res) => {
    db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(204).send(); // No Content
    });
});

// --- Show Management ---

// POST /api/admin/shows
router.post('/shows', upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
    const { title, description, genres, category_id } = req.body;
    
    // Get file paths relative to the /public folder
    const poster = req.files.poster ? `/uploads/images/${req.files.poster[0].filename}` : null;
    const banner = req.files.banner ? `/uploads/images/${req.files.banner[0].filename}` : null;

    const sql = 'INSERT INTO shows (title, description, genres, category_id, poster, banner) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [title, description, genres, category_id, poster, banner], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, title });
    });
});

// PUT /api/admin/shows/:id
router.put('/shows/:id', upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
    const { title, description, genres, category_id } = req.body;
    const poster = req.files.poster ? `/uploads/images/${req.files.poster[0].filename}` : null;
    const banner = req.files.banner ? `/uploads/images/${req.files.banner[0].filename}` : null;
    
    // Build query dynamically to only update images if they are uploaded
    let sql = 'UPDATE shows SET title = ?, description = ?, genres = ?, category_id = ?';
    let params = [title, description, genres, category_id];

    if (poster) {
        sql += ', poster = ?';
        params.push(poster);
    }
    if (banner) {
        sql += ', banner = ?';
        params.push(banner);
    }
    
    sql += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Show updated.' });
    });
});

// DELETE /api/admin/shows/:id
router.delete('/shows/:id', (req, res) => {
    // Note: Thanks to 'ON DELETE CASCADE' in schema,
    // deleting a show will automatically delete all its episodes.
    db.run('DELETE FROM shows WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(204).send(); // No Content
    });
});

// --- Episode Management ---

// POST /api/admin/episodes
router.post('/episodes', upload.single('thumbnail'), (req, res) => {
    const { show_id, ep_number, title, description, drive_url, publish_date } = req.body;
    const thumbnail = req.file ? `/uploads/images/${req.file.filename}` : null;
    
    // Default publish_date to now if not provided
    const pubDate = publish_date || new Date().toISOString();

    const sql = 'INSERT INTO episodes (show_id, ep_number, title, description, drive_url, thumbnail, publish_date) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [show_id, ep_number, title, description, drive_url, thumbnail, pubDate], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, title });
    });
});

// PUT /api/admin/episodes/:id
router.put('/episodes/:id', upload.single('thumbnail'), (req, res) => {
    const { ep_number, title, description, drive_url, publish_date } = req.body;
    const thumbnail = req.file ? `/uploads/images/${req.file.filename}` : null;
    
    let sql = 'UPDATE episodes SET ep_number = ?, title = ?, description = ?, drive_url = ?, publish_date = ?';
    let params = [ep_number, title, description, drive_url, publish_date];

    if (thumbnail) {
        sql += ', thumbnail = ?';
        params.push(thumbnail);
    }

    sql += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Episode updated.' });
    });
});

// DELETE /api/admin/episodes/:id
router.delete('/episodes/:id', (req, res) => {
    db.run('DELETE FROM episodes WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(204).send(); // No Content
    });
});

// --- Hero Slide Management ---

// GET /api/admin/slides (for admin panel list)
router.get('/slides', (req, res) => {
    db.all('SELECT * FROM hero_slides ORDER BY id', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /api/admin/slides/:id (to populate edit form)
router.get('/slides/:id', (req, res) => {
    db.get('SELECT * FROM hero_slides WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// POST /api/admin/slides
router.post('/slides', upload.single('image'), (req, res) => {
    const { title, subtitle, link } = req.body;
    const image = req.file ? `/uploads/slides/${req.file.filename}` : null;
    
    if (!image) {
        return res.status(400).json({ error: 'Image is required.' });
    }

    const sql = 'INSERT INTO hero_slides (title, subtitle, image, link) VALUES (?, ?, ?, ?)';
    db.run(sql, [title, subtitle, image, link], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, title });
    });
});

// PUT /api/admin/slides/:id
router.put('/slides/:id', upload.single('image'), (req, res) => {
    const { title, subtitle, link } = req.body;
    const image = req.file ? `/uploads/slides/${req.file.filename}` : null;
    
    let sql = 'UPDATE hero_slides SET title = ?, subtitle = ?, link = ?';
    let params = [title, subtitle, link];
    
    if (image) {
        sql += ', image = ?';
        params.push(image);
    }
    
    sql += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Slide updated.' });
    });
});

// DELETE /api/admin/slides/:id
router.delete('/slides/:id', (req, res) => {
    db.run('DELETE FROM hero_slides WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(5HA0).json({ error: err.message });
        }
        res.status(204).send(); // No Content
    });
});


module.exports = router;