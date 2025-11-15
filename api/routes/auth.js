const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, ADMIN_SECRET } = require('../middleware/auth');

// --- User Authentication ---

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error.' });
            }
            if (row) {
                return res.status(400).json({ error: 'Username already exists.' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Insert new user
            const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
            db.run(sql, [username, password_hash], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to register user.' });
                }
                
                // Create payload and sign token
                const payload = { user: { id: this.lastID, username: username } };
                jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
                    if (err) throw err;
                    res.status(201).json({ token });
                });
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/auth/login - Login a user
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // Create payload and sign token
        const payload = { user: { id: user.id, username: user.username } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    });
});

// --- Admin Authentication ---

// POST /api/auth/admin/login - Login an admin
// Note: We check against the same 'users' table, but could check for username 'admin'
// or a dedicated 'is_admin' column. For simplicity, we just check username 'admin'.
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    // In a real app, you'd have an 'is_admin' column. 
    // Here, we hardcode the 'admin' user check for simplicity.
    if (username !== 'admin') {
         return res.status(403).json({ error: 'Access denied.' });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, adminUser) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        if (!adminUser) {
            return res.status(400).json({ error: 'Admin account not found.' });
        }

        const isMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // Create admin payload with special flag and sign with ADMIN secret
        const payload = { 
            user: { 
                id: adminUser.id, 
                username: adminUser.username,
                isAdmin: true // This flag is crucial
            } 
        };
        jwt.sign(payload, ADMIN_SECRET, { expiresIn: '12h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    });
});

module.exports = router;