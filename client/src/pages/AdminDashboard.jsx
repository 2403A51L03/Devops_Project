import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getAllComplaints, updateComplaintStatus, getDashboardStats } from '../api';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', category: '' });
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState({ status: '', adminRemarks: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = ['Academics', 'Hostel', 'Canteen', 'Infrastructure', 'Transport', 'Others'];
    const statuses = ['Pending', 'In Progress', 'Resolved'];

    const fetchStats = useCallback(async () => {
        try {
            const response = await getDashboardStats();
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load stats', err);
        }
    }, []);

    const fetchComplaints = useCallback(async () => {
        try {
            const response = await getAllComplaints(filters);
            setComplaints(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load complaints');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchStats();
        fetchComplaints();
    }, [fetchStats, fetchComplaints]);

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await updateComplaintStatus(selectedComplaint._id, statusUpdate);
            setSuccess('Complaint status updated successfully');
            setSelectedComplaint(null);
            setStatusUpdate({ status: '', adminRemarks: '' });
            fetchComplaints();
            fetchStats();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };

    const openComplaintModal = (complaint) => {
        setSelectedComplaint(complaint);
        setStatusUpdate({ status: complaint.status, adminRemarks: complaint.adminRemarks || '' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Resolved':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default:
                return 'bg-secondary-100 text-secondary-800 border-secondary-200';
        }
    };

    return (
        <div className="min-h-screen bg-secondary-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold leading-tight text-secondary-900">
                                Student Complaint and Feedback Management System
                            </h1>
                            <p className="text-secondary-600 font-medium mt-1">Admin Dashboard</p>
                            <p className="text-secondary-500 text-sm mt-1">Welcome, {user?.name}</p>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="flex-shrink-0 px-4 py-2 bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50 rounded-lg transition duration-200 font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-secondary-200">
                            <h3 className="text-secondary-500 text-sm font-medium uppercase tracking-wider">Total Complaints</h3>
                            <p className="text-3xl font-bold text-secondary-900 mt-2">{stats.total}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-secondary-200">
                            <h3 className="text-amber-600 text-sm font-medium uppercase tracking-wider">Pending</h3>
                            <p className="text-3xl font-bold text-amber-700 mt-2">{stats.pending}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-secondary-200">
                            <h3 className="text-blue-600 text-sm font-medium uppercase tracking-wider">In Progress</h3>
                            <p className="text-3xl font-bold text-blue-700 mt-2">{stats.inProgress}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-secondary-200">
                            <h3 className="text-emerald-600 text-sm font-medium uppercase tracking-wider">Resolved</h3>
                            <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.resolved}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-secondary-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Filter by Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Filter by Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r">
                        {success}
                    </div>
                )}

                {/* Complaints List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-secondary-200">
                        <p className="text-secondary-500 text-lg">No complaints found matching your filters.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {complaints.map((complaint) => (
                            <div key={complaint._id} className="bg-white rounded-xl shadow-sm p-6 border border-secondary-200 hover:shadow-md transition duration-200">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                            <span className="text-secondary-500 text-sm bg-secondary-100 px-2 py-0.5 rounded">
                                                {complaint.category}
                                            </span>
                                            <span className="text-secondary-400 text-sm">
                                                {new Date(complaint.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-secondary-500 text-sm">
                                                by {complaint.student?.name || 'Unknown Student'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{complaint.title}</h3>
                                        <p className="text-secondary-600 mb-4">{complaint.description}</p>

                                        {complaint.adminRemarks && (
                                            <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-100 mt-4 mb-4">
                                                <p className="text-sm font-medium text-secondary-900 mb-1">Current Remarks:</p>
                                                <p className="text-secondary-600 text-sm">{complaint.adminRemarks}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => openComplaintModal(complaint)}
                                            className="text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
                                        >
                                            Update Status & Remarks
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Update Modal */}
                {selectedComplaint && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in-up">
                            <h3 className="text-xl font-bold text-secondary-900 mb-4">Update Complaint Status</h3>
                            <form onSubmit={handleStatusUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                                    <select
                                        value={statusUpdate.status}
                                        onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        {statuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Admin Remarks</label>
                                    <textarea
                                        value={statusUpdate.adminRemarks}
                                        onChange={(e) => setStatusUpdate({ ...statusUpdate, adminRemarks: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="Add remarks..."
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedComplaint(null)}
                                        className="px-4 py-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition duration-200 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition duration-200 font-medium"
                                    >
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
