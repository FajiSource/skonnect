import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from '../../Contexts/AuthContext';
import { 
  FaCheck, FaTimes, FaEye, FaSearch, FaFilter, FaChevronDown, 
  FaCalendarAlt, FaUserShield, FaHistory, FaListAlt, FaSort,
  FaUserCheck, FaUserTimes, FaInfoCircle, FaClock, FaBuilding,
  FaEnvelope, FaPhone, FaIdCard, FaUserCog, FaCommentDots, FaStickyNote,
  FaFilePdf, FaFileImage, FaLock, FaUnlock, FaUser, FaExternalLinkAlt, FaDownload
} from 'react-icons/fa';
import Notification from '../Components/Notification';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import '../css/SkUserAuthentication.css';

const SkUserAuthentication = () => {
  const { skUser } = useContext(AuthContext);
  
  // State for users and filtering
  const [pendingUsers, setPendingUsers] = useState([]);
  const [authenticatedUsers, setAuthenticatedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // State for tabs and views
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'authenticated', 'statistics', 'logs'
  const [currentView, setCurrentView] = useState('pending'); // 'pending' or 'authenticated'
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  
  // State for statistics
  const [stats, setStats] = useState({
    pending: 0,
    authenticated: 0,
    recent_authentications: 0,
    barangay_breakdown: {}
  });
  
  // State for logs
  const [authLogs, setAuthLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPerPage, setLogsPerPage] = useState(10);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewData, setPreviewData] = useState({ url: '', name: '', type: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkNotify, setBulkNotify] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmUserId, setConfirmUserId] = useState(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmNotify, setConfirmNotify] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    confirmColor: ''
  });
  const [notification, setNotification] = useState(null);
  
  const rowsPerPage = 10;
  const barangayOptions = ['All', 'Dela Paz', 'Manggahan', 'Maybunga', 'Pinagbuhatan', 'Rosario', 'San Miguel', 'Santa Lucia', 'Santolan'];
  const roleOptions = skUser?.sk_role === 'Chairman' ? ['Kagawad'] : ['All', 'Chairman', 'Kagawad'];

  // Check if user has permission (Federasyon or Chairman)
  const hasAuthPermission = skUser && (skUser.sk_role === 'Federasyon' || skUser.sk_role === 'Chairman');

  // Initial data loading
  useEffect(() => {
    if (hasAuthPermission) {
      fetchUsers();
      fetchAuthStats();
    }
  }, [hasAuthPermission, currentView]);

  // Load logs when on logs tab
  useEffect(() => {
    if (activeTab === 'logs' && hasAuthPermission) {
      fetchAuthLogs();
    }
  }, [activeTab, logsPage, logsPerPage]);

  // Filter users based on search and filters
  useEffect(() => {
    const usersList = currentView === 'pending' ? pendingUsers : authenticatedUsers;
    if (!usersList) return;
    
    let filtered = [...usersList];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(query) || 
        user.last_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    // Filter by barangay
    if (selectedBarangay !== 'All') {
      filtered = filtered.filter(user => user.sk_station === selectedBarangay);
    }
    
    // Filter by role
    if (selectedRole !== 'All') {
      filtered = filtered.filter(user => user.sk_role === selectedRole);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [pendingUsers, authenticatedUsers, currentView, searchQuery, selectedBarangay, selectedRole]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let params = {
        sort_by: sortBy,
        sort_direction: sortDirection,
        view: currentView
      };
      
      const response = await axios.get('/api/sk-pending-users', { params });
      
      if (currentView === 'pending') {
        setPendingUsers(response.data);
      } else {
        setAuthenticatedUsers(response.data);
      }
      
      setFilteredUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to load users. Please try again.', 'error');
      setLoading(false);
    }
  };

  // Fetch authentication statistics
  const fetchAuthStats = async () => {
    try {
      const response = await axios.get('/api/sk-auth-stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching auth stats:', error);
      showNotification('Failed to load statistics. Please try again.', 'error');
    }
  };

  // Fetch authentication logs
  const fetchAuthLogs = async () => {
    try {
      const response = await axios.get('/api/sk-auth-logs', {
        params: {
          page: logsPage,
          per_page: logsPerPage
        }
      });
      
      if (response.data.success) {
        setAuthLogs(response.data.logs.data);
        setLogsTotal(response.data.logs.total);
      }
    } catch (error) {
      console.error('Error fetching auth logs:', error);
      showNotification('Failed to load authentication logs. Please try again.', 'error');
    }
  };

  // Fetch user detail
  const fetchUserDetail = async (userId) => {
    try {
      const response = await axios.get(`/api/sk-user-profile/${userId}`);
      
      if (response.data.success) {
        setSelectedUser(response.data.user);
        setUserNotes(response.data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
      showNotification('Failed to load user details. Please try again.', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle confirm action
  const handleConfirmAction = (action, userId, config, reason = '', notify = false) => {
    setConfirmAction(() => action);
    setConfirmUserId(userId);
    setConfirmReason(reason);
    setConfirmNotify(notify);
    setConfirmConfig(config);
    setShowConfirmDialog(true);
  };

  // Handle confirm
  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    try {
      await confirmAction(confirmUserId, confirmReason, confirmNotify);
      showNotification(confirmConfig.successMessage, 'success');
      
      // Refresh data
      fetchUsers();
      fetchAuthStats();
      if (activeTab === 'logs') {
        fetchAuthLogs();
      }
      
      // Close user detail if open
      if (showUserDetail && selectedUser && selectedUser.id === confirmUserId) {
        setShowUserDetail(false);
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification(confirmConfig.errorMessage || 'An error occurred', 'error');
    }
  };

  // Handle bulk action dialog confirm
  const handleBulkConfirm = async () => {
    setShowBulkActionDialog(false);
    
    if (selectedUsers.length === 0) {
      showNotification('No users selected for bulk action.', 'error');
      return;
    }
    
    try {
      const response = await axios.post('/api/sk-bulk-authenticate', {
        user_ids: selectedUsers,
        status: bulkAction,
        reason: bulkReason,
        notify_users: bulkNotify
      });
      
      if (response.data.success) {
        showNotification(response.data.message, 'success');
        
        // Reset selection
        setSelectedUsers([]);
        
        // Refresh data
        fetchUsers();
        fetchAuthStats();
        if (activeTab === 'logs') {
          fetchAuthLogs();
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showNotification('Failed to process users. Please try again.', 'error');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowConfirmDialog(false);
    setConfirmReason('');
    setConfirmNotify(false);
  };

  // Handle authenticate
  const handleAuthenticate = (userId) => {
    const authenticateAction = async (id, reason, notify) => {
      await axios.put(`/api/sk-authenticate/${id}`, { 
        status: 'active',
        reason: reason,
        notify_user: notify
      });
    };
  
    handleConfirmAction(
      authenticateAction,
      userId,
      {
        title: 'Authenticate User',
        message: 'Are you sure you want to authenticate this user? They will be granted access to the SK portal.',
        confirmText: 'Authenticate',
        confirmColor: 'success',
        successMessage: 'User has been authenticated successfully!',
        errorMessage: 'Error authenticating user. Please try again.'
      },
      '',
      false
    );
  };

  // Handle de-authenticate
  const handleDeauthenticate = (userId) => {
    const deauthenticateAction = async (id, reason, notify) => {
      await axios.put(`/api/sk-authenticate/${id}`, { 
        status: 'not_active',
        reason: reason,
        notify_user: notify
      });
    };
  
    handleConfirmAction(
      deauthenticateAction,
      userId,
      {
        title: 'De-authenticate User',
        message: 'Are you sure you want to remove authentication for this user? They will lose access to the SK portal.',
        confirmText: 'De-authenticate',
        confirmColor: 'danger',
        successMessage: 'User has been de-authenticated successfully!',
        errorMessage: 'Error de-authenticating user. Please try again.'
      },
      '',
      false
    );
  };

  // Handle view ID
  const handleViewID = (user) => {
    if (!user.valid_id_url || !user.valid_id_exists) {
      showNotification('ID document not found or not accessible.', 'error');
      return;
    }
    
    const fileExtension = user.valid_id_extension?.toLowerCase() || '';
    const fileType = ['jpg', 'jpeg', 'png'].includes(fileExtension) ? 'image' : 'pdf';
    
    // Log for debugging
    console.log('ID URL:', user.valid_id_url);
    console.log('File Extension:', fileExtension);
    console.log('File Type:', fileType);
    
    setPreviewData({
      url: user.valid_id_url,
      name: `${user.first_name} ${user.last_name}'s ID`,
      type: fileType,
      extension: fileExtension
    });
    setShowImagePreview(true);
  };

  // Handle user selection for bulk actions
  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    
    // Refetch with new sort
    setTimeout(() => {
      fetchUsers();
    }, 100);
  };

  // Handle add note to user
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedUser) {
      return;
    }
    
    try {
      const response = await axios.post(`/api/sk-user-note/${selectedUser.id}`, {
        note: newNote
      });
      
      if (response.data.success) {
        showNotification('Note added successfully!', 'success');
        setUserNotes([response.data.note, ...userNotes]);
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showNotification('Failed to add note. Please try again.', 'error');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return moment(dateString).format('MMMM D, YYYY');
  };

  // Format time
  const formatTime = (dateString) => {
    return moment(dateString).format('h:mm A');
  };

  // Pagination variables and functions
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle view user detail
  const handleViewUser = async (user) => {
    await fetchUserDetail(user.id);
    setShowUserDetail(true);
  };

  // Close user detail view
  const handleCloseUserDetail = () => {
    setShowUserDetail(false);
    setSelectedUser(null);
    setUserNotes([]);
    setNewNote('');
  };

  // Change view between pending and authenticated
  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedUsers([]);
    setCurrentPage(1);
    // Update filteredUsers immediately to prevent UI issues
    if (view === 'pending') {
      setFilteredUsers(pendingUsers);
    } else {
      setFilteredUsers(authenticatedUsers);
    }
  };

  // Get icon for file type
  const getFileIcon = (fileExtension) => {
    const ext = fileExtension?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      return <FaFileImage />;
    } else if (ext === 'pdf') {
      return <FaFilePdf />;
    }
    return <FaIdCard />;
  };

  // If user doesn't have permission, show access denied
  if (!hasAuthPermission) {
    return (
      <div className="sk-auth-denied">
        <div className="sk-auth-denied-icon">
          <FaTimes />
        </div>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page. This page is only accessible to Federasyon and Chairman users.</p>
      </div>
    );
  }

  // Render the main component
  return (
    <div className="container user-auth-section" style={{ marginTop: "100px" }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmColor={confirmConfig.confirmColor}
      >
        <div className="dialog-form-group">
          <label htmlFor="confirmReason">Reason (optional):</label>
          <textarea
            id="confirmReason"
            className="form-control mb-2"
            value={confirmReason}
            onChange={(e) => setConfirmReason(e.target.value)}
            placeholder="Enter reason for this action..."
          ></textarea>
          
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="confirmNotify"
              checked={confirmNotify}
              onChange={(e) => setConfirmNotify(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="confirmNotify">
              Send email notification to user
            </label>
          </div>
        </div>
      </ConfirmationDialog>
      
      {/* Bulk Action Dialog */}
      <ConfirmationDialog
        isOpen={showBulkActionDialog}
        onClose={() => setShowBulkActionDialog(false)}
        onConfirm={handleBulkConfirm}
        title={`Bulk ${bulkAction === 'active' ? 'Authenticate' : 'De-authenticate'} Users`}
        message={`Are you sure you want to ${bulkAction === 'active' ? 'authenticate' : 'de-authenticate'} ${selectedUsers.length} selected users?`}
        confirmText={bulkAction === 'active' ? 'Authenticate All' : 'De-authenticate All'}
        confirmColor={bulkAction === 'active' ? 'success' : 'danger'}
      >
        <div className="dialog-form-group">
          <label htmlFor="bulkReason">Reason (optional):</label>
          <textarea
            id="bulkReason"
            className="form-control mb-2"
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
            placeholder="Enter reason for this bulk action..."
          ></textarea>
          
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="bulkNotify"
              checked={bulkNotify}
              onChange={(e) => setBulkNotify(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="bulkNotify">
              Send email notifications to users
            </label>
          </div>
        </div>
      </ConfirmationDialog>
      
      <div className="row mb-4">
        <div className="col-md-6 left-side">
          <div className="user-info">
            <div className="user-avatar">
              {skUser?.first_name?.charAt(0) || 'S'}
            </div>
            <div className="user-role-badge">
              {skUser?.sk_role}
            </div>
            <div className="user-name">
              {skUser?.first_name} {skUser?.last_name}
            </div>
          </div>
          <h2 className="auth-page-title">
            <FaUserShield className="me-2" />
            User Authentication Management
          </h2>
          <p className="auth-page-subtitle">Manage authentication for SK users</p>
        </div>
        
        <div className="col-md-6 right-side d-flex justify-content-end">
          <div className="sk-tab-buttons">
            <button 
              className={`sk-tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <FaUserCog className="me-2" />
              <span>Users</span>
            </button>
            
            <button 
              className={`sk-tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <FaListAlt className="me-2" />
              <span>Statistics</span>
            </button>
            
            <button 
              className={`sk-tab-button ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <FaHistory className="me-2" />
              <span>Activity Logs</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="row summary-cards mb-4">
        <div className="col-md-3">
          <div className="summary-card pending">
            <div className="summary-icon">
              <FaUserCog />
            </div>
            <div className="summary-content">
              <div className="summary-number">{stats.pending}</div>
              <div className="summary-title">Not Authenticated</div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="summary-card approved">
            <div className="summary-icon">
              <FaUserCheck />
            </div>
            <div className="summary-content">
              <div className="summary-number">{stats.authenticated}</div>
              <div className="summary-title">Authenticated</div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="summary-card recent">
            <div className="summary-icon">
              <FaClock />
            </div>
            <div className="summary-content">
              <div className="summary-number">{stats.recent_authentications}</div>
              <div className="summary-title">Recent Authentications</div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="summary-card total">
            <div className="summary-icon">
              <FaUserShield />
            </div>
            <div className="summary-content">
              <div className="summary-number">{stats.pending + stats.authenticated}</div>
              <div className="summary-title">Total Users</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <div className="row mb-3">
            <div className="col-md-6 d-flex align-items-center">
              <div className="view-toggle-btn-group me-3">
                <button 
                  className={`view-toggle-btn ${currentView === 'pending' ? 'active' : ''}`}
                  onClick={() => handleViewChange('pending')}
                >
                  <FaLock className="me-1" /> Not Authenticated
                </button>
                <button 
                  className={`view-toggle-btn ${currentView === 'authenticated' ? 'active' : ''}`}
                  onClick={() => handleViewChange('authenticated')}
                >
                  <FaUnlock className="me-1" /> Authenticated
                </button>
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="bulk-actions">
                  {currentView === 'pending' ? (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => {
                        setBulkAction('active');
                        setBulkReason('');
                        setBulkNotify(false);
                        setShowBulkActionDialog(true);
                      }}
                    >
                      <FaCheck className="me-1" /> Authenticate Selected ({selectedUsers.length})
                    </button>
                  ) : (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        setBulkAction('not_active');
                        setBulkReason('');
                        setBulkNotify(false);
                        setShowBulkActionDialog(true);
                      }}
                    >
                      <FaTimes className="me-1" /> De-authenticate Selected ({selectedUsers.length})
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="col-md-6">
              <div className="search-wrapper d-flex align-items-center justify-content-end w-100">
                <div className="search-input-wrapper flex-grow-1">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FaSearch className="search-icon" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-12 d-flex justify-content-end">
              <div className="filter-container">
                {/* Only show barangay filter for Federasyon */}
                {skUser?.sk_role === 'Federasyon' && (
                  <div className="filter-item">
                    <label className="me-2">Barangay:</label>
                    <div className="filter-dropdown-wrapper position-relative">
                      <select
                        className="form-control filter-dropdown"
                        value={selectedBarangay}
                        onChange={(e) => setSelectedBarangay(e.target.value)}
                      >
                        {barangayOptions.map((barangay, index) => (
                          <option key={index} value={barangay}>
                            {barangay === 'All' ? 'All Barangays' : barangay}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="dropdown-icon" />
                    </div>
                  </div>
                )}
                
                <div className="filter-item">
                  <label className="me-2">Role:</label>
                  <div className="filter-dropdown-wrapper position-relative">
                    <select
                      className="form-control filter-dropdown"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      {roleOptions.map((role, index) => (
                        <option key={index} value={role}>
                          {role === 'All' ? 'All Roles' : role}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="dropdown-icon" />
                  </div>
                </div>
                
                <div className="filter-item">
                  <button 
                    className="btn btn-outline-secondary btn-sm" 
                    onClick={() => fetchUsers()}
                    title="Refresh list"
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="sk-loading-container">
              <div className="sk-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="sk-empty-state">
              <div className="sk-empty-icon">
                {currentView === 'pending' ? <FaLock /> : <FaUnlock />}
              </div>
              <h3>No {currentView === 'pending' ? 'Not Authenticated' : 'Authenticated'} Users</h3>
              <p>There are no {currentView === 'pending' ? 'users waiting for authentication' : 'authenticated users'} at this time.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="sortable" onClick={() => handleSortChange('last_name')}>
                      <div className="d-flex align-items-center">
                        Name
                        {sortBy === 'last_name' && (
                          <FaSort className="ms-1" />
                        )}
                      </div>
                    </th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>
                      <div className="d-flex align-items-center">
                        Barangay
                        {sortBy === 'sk_station' && (
                          <FaSort className="ms-1" />
                        )}
                      </div>
                    </th>
                    <th>Role</th>
                    <th className="sortable" onClick={() => handleSortChange('created_at')}>
                      <div className="d-flex align-items-center">
                        {currentView === 'pending' ? 'Registration Date' : 'Authentication Date'}
                        {sortBy === 'created_at' && (
                          <FaSort className="ms-1" />
                        )}
                      </div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                          />
                        </div>
                      </td>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone_number}</td>
                      <td>{user.sk_station}</td>
                      <td>{user.sk_role}</td>
                      <td>{formatDate(currentView === 'pending' ? user.created_at : user.authenticated_at)}</td>
                      <td>
                        <button 
                          className="btn btn-info btn-sm me-1" 
                          onClick={() => handleViewUser(user)}
                          title="View Details"
                        >
                          <FaInfoCircle />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm me-1" 
                          onClick={() => handleViewID(user)}
                          disabled={!user.valid_id}
                          title={user.valid_id ? "View ID" : "No ID uploaded"}
                        >
                          {getFileIcon(user.valid_id_extension)}
                        </button>
                        {currentView === 'pending' ? (
                          <button 
                            className="btn btn-success btn-sm" 
                            onClick={() => handleAuthenticate(user.id)}
                            title="Authenticate User"
                          >
                            <FaUnlock />
                          </button>
                        ) : (
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDeauthenticate(user.id)}
                            title="De-authenticate User"
                          >
                            <FaLock />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredUsers.length > 0 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn" 
                onClick={handlePrevious} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="page-number">{currentPage}</div>
              <button 
                className="pagination-btn" 
                onClick={handleNext} 
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="statistics-container">
          <div className="row">
            <div className="col-md-12 mb-4">
              <div className="stats-card">
                <h3 className="stats-card-title">Authentication Statistics</h3>
                <div className="stats-content">
                  <p>Total authenticated users: <strong>{stats.authenticated}</strong></p>
                  <p>Total not authenticated users: <strong>{stats.pending}</strong></p>
                  <p>Recent authentications (last 7 days): <strong>{stats.recent_authentications}</strong></p>
                </div>
              </div>
            </div>
          </div>
          
          {skUser?.sk_role === 'Federasyon' && Object.keys(stats.barangay_breakdown).length > 0 && (
            <div className="row">
              <div className="col-md-12 mb-4">
                <div className="stats-card">
                  <h3 className="stats-card-title">Not Authenticated Users by Barangay</h3>
                  <div className="barangay-breakdown">
                    {Object.entries(stats.barangay_breakdown).map(([barangay, count]) => (
                      <div className="barangay-stat" key={barangay}>
                        <div className="barangay-name">{barangay}</div>
                        <div className="barangay-count">{count}</div>
                        <div className="barangay-bar">
                          <div 
                            className="barangay-bar-fill" 
                            style={{ 
                              width: `${Math.min(100, (count / Math.max(...Object.values(stats.barangay_breakdown))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="row">
            <div className="col-md-12">
              <div className="stats-card">
                <h3 className="stats-card-title">Authentication Guidelines</h3>
                <div className="stats-tips">
                  <div className="tip">
                    <div className="tip-icon">
                      <FaIdCard />
                    </div>
                    <div className="tip-content">
                      <h4>Verify Official IDs</h4>
                      <p>Always check that the ID provided is valid and matches the user's profile information.</p>
                    </div>
                  </div>
                  
                  <div className="tip">
                    <div className="tip-icon">
                      <FaBuilding />
                    </div>
                    <div className="tip-content">
                      <h4>Confirm Barangay Roles</h4>
                      <p>Verify that users are being assigned to the correct barangay and have the appropriate role.</p>
                    </div>
                  </div>
                  
                  <div className="tip">
                    <div className="tip-icon">
                      <FaUserShield />
                    </div>
                    <div className="tip-content">
                      <h4>Check Qualifications</h4>
                      <p>Ensure that users meet the required qualifications for their role before authenticating them.</p>
                    </div>
                  </div>
                  
                  <div className="tip">
                    <div className="tip-icon">
                      <FaCommentDots />
                    </div>
                    <div className="tip-content">
                      <h4>Add Notes</h4>
                      <p>Use the notes feature to document any special considerations or issues related to a user.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div className="logs-container">
          <div className="logs-header">
            <h3>Authentication Activity Logs</h3>
            <div className="logs-per-page">
              <label>Rows per page:</label>
              <select 
                value={logsPerPage} 
                onChange={(e) => setLogsPerPage(Number(e.target.value))}
                className="form-control form-control-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          
          {authLogs.length === 0 ? (
            <div className="no-logs">
              <p>No authentication logs found.</p>
            </div>
          ) : (
            <div className="logs-timeline">
              {authLogs.map((log, index) => {
                let parsedDetails = null;
                // Try to parse details if it's a JSON string
                if (log.log_type.includes('bulk_') && log.details) {
                  try {
                    parsedDetails = JSON.parse(log.details);
                  } catch (e) {
                    // If parsing fails, use the raw details
                    parsedDetails = null;
                  }
                }
                
                return (
                  <div className={`log-item ${log.log_type}`} key={log.id}>
                    <div className="log-icon">
                      {log.log_type === 'authentication' && <FaUserCheck />}
                      {log.log_type === 'deauthentication' && <FaUserTimes />}
                      {log.log_type === 'bulk_authentication' && <FaUserCheck />}
                      {log.log_type === 'bulk_deauthentication' && <FaUserTimes />}
                      {log.log_type === 'note' && <FaStickyNote />}
                    </div>
                    <div className="log-content">
                      <div className="log-header">
                        <span className="log-user">
                          {log.authenticator?.first_name} {log.authenticator?.last_name}
                        </span>
                        <span className="log-action">{log.action}</span>
                        {!log.log_type.includes('bulk_') && (
                          <span className="log-target">
                            {log.user?.first_name} {log.user?.last_name}
                          </span>
                        )}
                      </div>
                      {parsedDetails ? (
                        <div className="log-details">
                          {parsedDetails.reason && <p>Reason: {parsedDetails.reason}</p>}
                          <p>Processed {parsedDetails.processed_count} users, {parsedDetails.skipped_count} skipped</p>
                        </div>
                      ) : (
                        log.details && (
                          <div className="log-details">
                            {log.details}
                          </div>
                        )
                      )}
                      <div className="log-timestamp">
                        <FaCalendarAlt className="me-1" />
                        {formatDate(log.created_at)} at {formatTime(log.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="logs-pagination">
            <button 
              className="btn btn-outline-secondary btn-sm" 
              onClick={() => setLogsPage(p => Math.max(1, p - 1))}
              disabled={logsPage === 1}
            >
              Previous
            </button>
            <span className="logs-page-info">
              Page {logsPage} of {Math.ceil(logsTotal / logsPerPage) || 1}
            </span>
            <button 
              className="btn btn-outline-secondary btn-sm" 
              onClick={() => setLogsPage(p => p + 1)}
              disabled={logsPage >= Math.ceil(logsTotal / logsPerPage)}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseUserDetail}>
          <div className="modal-container user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Profile: {selectedUser.first_name} {selectedUser.last_name}</h3>
              <button className="close-modal-btn" onClick={handleCloseUserDetail}>×</button>
            </div>
            <div className="modal-body user-detail-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="user-detail-section">
                    <h4 className="user-detail-heading">
                      <FaUser className="me-2" />
                      Personal Information
                    </h4>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Full Name:</span>
                      <span className="user-detail-value">{selectedUser.first_name} {selectedUser.middle_name ? selectedUser.middle_name + ' ' : ''}{selectedUser.last_name}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Gender:</span>
                      <span className="user-detail-value">{selectedUser.gender}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Date of Birth:</span>
                      <span className="user-detail-value">{formatDate(selectedUser.birthdate)}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Age:</span>
                      <span className="user-detail-value">{selectedUser.age}</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="user-detail-section">
                    <h4 className="user-detail-heading">
                      <FaUserShield className="me-2" />
                      SK Information
                    </h4>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Barangay:</span>
                      <span className="user-detail-value">{selectedUser.sk_station}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Role:</span>
                      <span className="user-detail-value">{selectedUser.sk_role}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Authentication Status:</span>
                      <span className={`user-detail-value ${selectedUser.authentication_status === 'active' ? 'text-success' : 'text-danger'}`}>
                        {selectedUser.authentication_status === 'active' ? 'Authenticated' : 'Not Authenticated'}
                      </span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Registered On:</span>
                      <span className="user-detail-value">{formatDate(selectedUser.created_at)}</span>
                    </div>
                    {selectedUser.authenticated_at && (
                      <div className="user-detail-item">
                        <span className="user-detail-label">Authenticated On:</span>
                        <span className="user-detail-value">{formatDate(selectedUser.authenticated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row mt-3">
                <div className="col-md-6">
                  <div className="user-detail-section">
                    <h4 className="user-detail-heading">
                      <FaEnvelope className="me-2" />
                      Contact Information
                    </h4>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Email:</span>
                      <span className="user-detail-value">{selectedUser.email}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Phone:</span>
                      <span className="user-detail-value">{selectedUser.phone_number}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Address:</span>
                      <span className="user-detail-value">{selectedUser.address}</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="user-detail-section">
                    <h4 className="user-detail-heading">
                      <FaIdCard className="me-2" />
                      ID Verification
                    </h4>
                    {selectedUser.valid_id ? (
                      <div className="id-preview">
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleViewID(selectedUser)}
                        >
                          <FaEye className="me-1" /> View ID Document ({selectedUser.valid_id_extension?.toUpperCase()})
                        </button>
                      </div>
                    ) : (
                      <div className="no-id-message">
                        No ID document uploaded.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row mt-3">
                <div className="col-md-12">
                  <div className="user-detail-section">
                    <h4 className="user-detail-heading">
                      <FaStickyNote className="me-2" />
                      Admin Notes
                    </h4>
                    <div className="notes-input-area">
                      <textarea
                        className="form-control notes-textarea"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note about this user..."
                      ></textarea>
                      <button 
                        className="btn btn-primary"
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                      >
                        Add Note
                      </button>
                    </div>
                    
                    <div className="notes-list">
                      {userNotes.length > 0 ? (
                        userNotes.map((note, index) => (
                          <div className="note-item" key={note.id || index}>
                            <div className="note-header">
                              <span className="note-author">
                                {note.authenticator?.first_name} {note.authenticator?.last_name}
                              </span>
                              <span className="note-date">
                                {formatDate(note.created_at)} at {formatTime(note.created_at)}
                              </span>
                            </div>
                            <div className="note-content">
                              {note.details}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-notes-message">
                          No notes have been added yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer user-detail-footer">
              {selectedUser.authentication_status === 'not_active' ? (
                <button 
                  className="btn btn-success me-2"
                  onClick={() => {
                    handleAuthenticate(selectedUser.id);
                    handleCloseUserDetail();
                  }}
                >
                  <FaUnlock className="me-1" /> Authenticate User
                </button>
              ) : (
                <button 
                  className="btn btn-danger me-2"
                  onClick={() => {
                    handleDeauthenticate(selectedUser.id);
                    handleCloseUserDetail();
                  }}
                >
                  <FaLock className="me-1" /> De-authenticate User
                </button>
              )}
              <button 
                className="btn btn-secondary"
                onClick={handleCloseUserDetail}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ID Preview Modal */}
      {showImagePreview && (
        <div className="modal-overlay" onClick={() => setShowImagePreview(false)}>
          <div className="modal-container id-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ID Verification: {previewData.name}</h3>
              <button className="close-modal-btn" onClick={() => setShowImagePreview(false)}>×</button>
            </div>
            <div className="modal-body id-preview-body">
              {previewData.url ? (
                <div className="id-document-preview">
                  {previewData.type === 'image' ? (
                    <img 
                      src={previewData.url} 
                      alt={previewData.name} 
                      className="id-preview-image"
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        e.target.src = '/images/id-placeholder.png'; // Fallback image
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                    />
                  ) : previewData.type === 'pdf' ? (
                    <iframe
                      src={previewData.url}
                      title={previewData.name}
                      className="id-preview-pdf"
                      width="100%"
                      height="100%"
                      onError={(e) => {
                        console.error('PDF failed to load:', e);
                      }}
                    />
                  ) : (
                    <div className="id-not-available">
                      <p>Unsupported file type: {previewData.extension}</p>
                      <p>Click download to save the file and view it locally.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="id-not-available">
                  <p>ID document not available or could not be loaded.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {previewData.url && (
                <>
                  <a 
                    href={previewData.url} 
                    className="btn btn-info me-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaExternalLinkAlt className="me-1" /> Open in New Tab
                  </a>
                  <a 
                    href={previewData.url} 
                    download
                    className="btn btn-success me-2"
                  >
                    <FaDownload className="me-1" /> Download
                  </a>
                </>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => setShowImagePreview(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkUserAuthentication;