import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getMyComplaints, createComplaint, deleteComplaint } from '../api';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = ['Academics', 'Hostel', 'Canteen', 'Infrastructure', 'Transport', 'Others'];

    const fetchComplaints = useCallback(async () => {
        try {
            const response = await getMyComplaints();
            setComplaints(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load complaints');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await createComplaint(formData);
            setSuccess('Complaint submitted successfully!');
            setFormData({ category: '', title: '', description: '' });
            setShowForm(false);
            fetchComplaints();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit complaint');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this complaint?')) return;

        try {
            await deleteComplaint(id);
            setSuccess('Complaint deleted successfully');
            fetchComplaints();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete complaint');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Resolved':
                return 'bg-green-100 text-green-800 border-green-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length
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
                            <p className="text-secondary-600 font-medium mt-1">Student Portal</p>
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

                {/* Action Bar */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-secondary-900">My Complaints</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition duration-200 shadow-sm font-medium flex items-center gap-2"
                    >
                        {showForm ? 'Cancel' : '+ New Complaint'}
                    </button>
                </div>

                {/* Complaint Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-secondary-200 animate-fade-in-down">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Submit New Complaint</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="Brief title of the issue"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows="4"
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="Detailed description of the issue..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition duration-200 font-medium"
                                >
                                    Submit Complaint
                                </button>
                            </div>
                        </form>
                    </div>
                )}

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
                        <p className="text-secondary-500 text-lg">No complaints found. Submit one to get started.</p>
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
                                        </div>
                                        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{complaint.title}</h3>
                                        <p className="text-secondary-600 mb-4">{complaint.description}</p>

                                        {complaint.adminRemarks && (
                                            <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-100 mt-4">
                                                <p className="text-sm font-medium text-secondary-900 mb-1">Admin Remarks:</p>
                                                <p className="text-secondary-600 text-sm">{complaint.adminRemarks}</p>
                                            </div>
                                        )}
                                    </div>
                                    {complaint.status === 'Pending' && (
                                        <button
                                            onClick={() => handleDelete(complaint._id)}
                                            className="ml-4 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition duration-200"
                                            title="Delete Complaint"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 000-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
