// Main Express server (starter)
const express = require('express');
const path = require('path');

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const mainRoutes = require('./routes/main');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// API
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', mainRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on', PORT));
