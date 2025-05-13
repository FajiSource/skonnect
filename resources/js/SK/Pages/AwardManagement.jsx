import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../Contexts/AuthContext';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import Notification from '../Components/Notification';
import axios from 'axios';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import '../css/AwardManagement.css';
import AwardTable from '../Components/AwardTable';
import AwardForm from '../Components/AwardForm';
import AwardDetail from '../Components/AwardDetail';

const AwardManagement = () => {
  const { skUser } = useContext(AuthContext);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStation, setFilterStation] = useState('all');
  
  // Load awards
  const fetchAwards = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/awards');
      setAwards(response.data);
    } catch (error) {
      console.error('Failed to fetch awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load awards'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAwards();
  }, []);
  
  // Filter awards based on search, status, category, year, and station
  const filteredAwards = awards.filter(award => {
    const matchesSearch = 
      award.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.recipients.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || award.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || award.category === filterCategory;
    const matchesYear = filterYear === 'all' || award.year.toString() === filterYear;
    const matchesStation = filterStation === 'all' || award.sk_station === filterStation;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesYear && matchesStation;
  });
  
  // Add award
  const handleAddClick = () => {
    setEditItem(null);
    setShowForm(true);
  };
  
  // View award details
  const handleViewClick = (item) => {
    setViewItem(item);
    setShowDetail(true);
  };
  
  // Edit award
  const handleEditClick = (item) => {
    setEditItem(item);
    setShowForm(true);
  };
  
  // Archive award
  const handleArchiveClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Award',
      message: 'Are you sure you want to archive this award?',
      confirmText: 'Archive',
      confirmColor: 'warning',
      onConfirm: () => archiveAward(id)
    });
  };
  
  const archiveAward = async (id) => {
    try {
      await axios.put(`/api/awards/${id}/archive`);
      setNotification({
        type: 'success',
        message: 'Award archived successfully'
      });
      fetchAwards();
    } catch (error) {
      console.error('Failed to archive award:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to archive award'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Restore award
  const handleRestoreClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Award',
      message: 'Are you sure you want to restore this award?',
      confirmText: 'Restore',
      confirmColor: 'success',
      onConfirm: () => restoreAward(id)
    });
  };
  
  const restoreAward = async (id) => {
    try {
      await axios.put(`/api/awards/${id}/restore`);
      setNotification({
        type: 'success',
        message: 'Award restored successfully'
      });
      fetchAwards();
    } catch (error) {
      console.error('Failed to restore award:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to restore award'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Delete award
  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Award',
      message: 'Are you sure you want to delete this award? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'danger',
      onConfirm: () => deleteAward(id)
    });
  };
  
  const deleteAward = async (id) => {
    try {
      await axios.delete(`/api/awards/${id}`);
      setNotification({
        type: 'success',
        message: 'Award deleted successfully'
      });
      fetchAwards();
    } catch (error) {
      console.error('Failed to delete award:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to delete award'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk archive awards
  const handleBulkArchive = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Selected Awards',
      message: `Are you sure you want to archive ${ids.length} selected awards?`,
      confirmText: 'Archive All',
      confirmColor: 'warning',
      onConfirm: () => bulkArchiveAwards(ids)
    });
  };
  
  const bulkArchiveAwards = async (ids) => {
    try {
      await axios.post('/api/awards/bulk-archive', { ids });
      
      setNotification({
        type: 'success',
        message: `Awards archived successfully`
      });
      fetchAwards();
    } catch (error) {
      console.error('Failed to archive awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to archive some or all awards'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk restore awards
  const handleBulkRestore = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Selected Awards',
      message: `Are you sure you want to restore ${ids.length} selected awards?`,
      confirmText: 'Restore All',
      confirmColor: 'success',
      onConfirm: () => bulkRestoreAwards(ids)
    });
  };
  
  const bulkRestoreAwards = async (ids) => {
    try {
      await axios.post('/api/awards/bulk-restore', { ids });
      
      setNotification({
        type: 'success',
        message: `Awards restored successfully`
      });
      fetchAwards();
    } catch (error) {
      console.error('Failed to restore awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to restore some or all awards'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk delete awards
  const handleBulkDelete = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Awards',
      message: `Are you sure you want to delete ${ids.length} selected awards? This action cannot be undone.`,
      confirmText: 'Delete All',
      confirmColor: 'danger',
      onConfirm: () => bulkDeleteAwards(ids)
    });
  };
  
  const bulkDeleteAwards = async (ids) => {
    try {
      await axios.post('/api/awards/bulk-delete', { ids });
      
      setNotification({
        type: 'success',
        message: `Awards deleted successfully`
      });
      fetchAwards();
    } catch (error) {
      console.error('Failed to delete awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete some or all awards'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Save award (add or update)
  const handleSaveAward = async (formData) => {
    try {
      console.log('Saving award data...');
      
      if (editItem) {
        console.log('Updating existing award ID:', editItem.id);
        
        // For Laravel, we need to use POST with _method=PUT for file uploads
        // This is because browsers don't support sending files with PUT requests properly
        const response = await axios.post(`/api/awards/${editItem.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
        
        console.log('Update response:', response.data);
        
        setNotification({
          type: 'success',
          message: 'Award updated successfully'
        });
      } else {
        console.log('Creating new award');
        const response = await axios.post('/api/awards', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
        
        console.log('Create response:', response.data);
        
        setNotification({
          type: 'success',
          message: 'Award added successfully'
        });
      }
      
      setShowForm(false);
      fetchAwards(); // Reload the awards list
    } catch (error) {
      console.error('Failed to save award:', error);
      
      if (error.response?.data?.errors) {
        const errorsObj = error.response.data.errors;
        const errorMessages = Object.keys(errorsObj)
          .map(key => errorsObj[key].join(', '))
          .join('; ');
          
        setNotification({
          type: 'error',
          message: `Validation error: ${errorMessages}`
        });
      } else {
        setNotification({
          type: 'error',
          message: error.response?.data?.error || 'Failed to save award'
        });
      }
    }
  };
  
  // Get unique years for filter
  const years = ['all', ...new Set(awards.map(award => award.year.toString()))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return b - a; // Sort years in descending order
  });
  
  // Get unique stations for filter
  const stations = ['all', ...new Set(awards.map(award => award.sk_station))].sort((a, b) => {
    if (a === 'all') return -1;
    return a.localeCompare(b);
  });
  
  return (
    <div className="sk-award-mgmt-container">
      <div className="sk-award-mgmt-header">
        <h1 className="sk-award-mgmt-title">Award Management</h1>
        <p className="sk-award-mgmt-description">
          Manage awards and recognitions for the Youth Awards page
        </p>
      </div>
      
      <div className="sk-award-mgmt-actions">
        <div className="sk-award-mgmt-search">
          <div className="sk-award-mgmt-search-input">
            <FaSearch className="sk-award-mgmt-search-icon" />
            <input
              type="text"
              placeholder="Search by title, description, or recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sk-award-mgmt-input"
            />
          </div>
          
          <div className="sk-award-mgmt-filters">
            <div className="sk-award-mgmt-filter">
              <label>Status:</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="sk-award-mgmt-select"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="sk-award-mgmt-filter">
              <label>Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="sk-award-mgmt-select"
              >
                <option value="all">All Categories</option>
                <option value="leadership">Leadership</option>
                <option value="innovation">Innovation</option>
                <option value="service">Community Service</option>
                <option value="environment">Environmental</option>
                <option value="education">Academic</option>
                <option value="arts">Arts & Culture</option>
                <option value="sports">Sports</option>
                <option value="technology">Technology</option>
              </select>
            </div>
            
            <div className="sk-award-mgmt-filter">
              <label>Year:</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="sk-award-mgmt-select"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year === 'all' ? 'All Years' : year}</option>
                ))}
              </select>
            </div>
            
            <div className="sk-award-mgmt-filter">
              <label>Station:</label>
              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                className="sk-award-mgmt-select"
              >
                {stations.map(station => (
                  <option key={station} value={station}>{station === 'all' ? 'All Stations' : station}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <button 
          className="sk-award-mgmt-add-btn"
          onClick={handleAddClick}
        >
          <FaPlus /> Add Award
        </button>
      </div>
      
      <AwardTable
        awards={filteredAwards}
        loading={loading}
        skUser={skUser}
        onView={handleViewClick}
        onEdit={handleEditClick}
        onArchive={handleArchiveClick}
        onRestore={handleRestoreClick}
        onDelete={handleDeleteClick}
        onBulkArchive={handleBulkArchive}
        onBulkRestore={handleBulkRestore}
        onBulkDelete={handleBulkDelete}
      />
      
      {showForm && (
        <AwardForm
          show={showForm}
          onHide={() => setShowForm(false)}
          onSave={handleSaveAward}
          initialData={editItem}
          skUser={skUser}
        />
      )}
      
      {showDetail && viewItem && (
        <AwardDetail
          award={viewItem}
          onClose={() => setShowDetail(false)}
        />
      )}
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default AwardManagement;