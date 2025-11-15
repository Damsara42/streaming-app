const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const mainRoutes = require('./routes/main');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Enable CORS for all requests
app.use(cors());
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// --- Static File Serving ---
// Serve the main public-facing site (index.html, css, js, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// Serve the admin panel
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Serve uploaded files (posters, banners, thumbnails)
// This makes http://localhost:3000/uploads/images/poster-123.jpg work
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


// --- API Routes ---
app.use('/api', mainRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// --- Frontend Route Handling ---
// This ensures that refreshing on a frontend page like /show.html works.
// It serves the corresponding HTML file from the /public directory.

// Main site catch-all
app.get(['/show.html', '/watch.html', '/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public', req.path));
});

// Admin panel catch-all
// This redirects /admin/ (which might be a refresh on the dashboard)
// to the main admin SPA loader.
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Homepage catch-all
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});