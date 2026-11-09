const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { auth, isAdmin } = require('../middleware/auth');

// Create a complaint (Student only)
router.post('/', auth, async (req, res) => {
    try {
        const { category, title, description } = req.body;

        if (!category || !title || !description) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const complaint = new Complaint({
            userId: req.user.id,
            category,
            title,
            description
        });

        await complaint.save();
        res.status(201).json({ message: 'Complaint submitted successfully', complaint });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all complaints for logged-in student
router.get('/my', auth, async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific complaint
router.get('/:id', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id).populate('userId', 'name email');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Students can only view their own complaints
        if (req.user.role === 'student' && complaint.userId._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update complaint (Student - only if pending)
router.put('/:id', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Check ownership
        if (complaint.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Can only update if pending
        if (complaint.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot update complaint that is not pending' });
        }

        const { category, title, description } = req.body;

        if (category) complaint.category = category;
        if (title) complaint.title = title;
        if (description) complaint.description = description;

        await complaint.save();
        res.json({ message: 'Complaint updated successfully', complaint });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete complaint (Student - only if pending)
router.delete('/:id', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Check ownership
        if (complaint.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Can only delete if pending
        if (complaint.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot delete complaint that is not pending' });
        }

        await complaint.deleteOne();
        res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Get all complaints with filters
router.get('/admin/all', auth, isAdmin, async (req, res) => {
    try {
        const { status, category } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (category) filter.category = category;

        const complaints = await Complaint.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Update complaint status
router.put('/admin/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { status, adminRemarks } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Please provide status' });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.status = status;
        if (adminRemarks !== undefined) {
            complaint.adminRemarks = adminRemarks;
        }

        await complaint.save();
        res.json({ message: 'Complaint status updated successfully', complaint });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Get dashboard statistics
router.get('/admin/stats/dashboard', auth, isAdmin, async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
        const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
        const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });

        // Category-wise count
        const categoryStats = await Complaint.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            total: totalComplaints,
            pending: pendingComplaints,
            inProgress: inProgressComplaints,
            resolved: resolvedComplaints,
            byCategory: categoryStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
