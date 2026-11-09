const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_system';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@college.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function createAdminUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        // Create admin user
        const admin = new User({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully');
        console.log(`Email: ${ADMIN_EMAIL}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdminUser();
