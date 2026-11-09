const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_system';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Complaint Management System API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
