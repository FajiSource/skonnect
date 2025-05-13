import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../Contexts/AuthContext';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import Notification from '../Components/Notification';
import axios from 'axios';
import { FaPlus, FaSearch, FaFilter, FaNetworkWired, FaEye } from 'react-icons/fa';
import '../css/DirectoryManagement.css';
import DirectoryTable from '../Components/DirectoryTable';
import DirectoryForm from '../Components/DirectoryForm';
import OrganizationChartModal from '../../Components/OrganizationChartModal';

const DirectoryManagement = () => {
  const { skUser } = useContext(AuthContext);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
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
  const [filterStation, setFilterStation] = useState('all');
  
  // Organization chart modal
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [orgChartStation, setOrgChartStation] = useState('');
  
  // Load directories
  const fetchDirectories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/directories');
      setDirectories(response.data);
    } catch (error) {
      console.error('Failed to fetch directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load directories'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDirectories();
  }, []);
  
  // Filter directories based on search, status, category, and station
  const filteredDirectories = directories.filter(directory => {
    const matchesSearch = 
      directory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      directory.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (directory.email && directory.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || directory.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || directory.category === filterCategory;
    const matchesStation = filterStation === 'all' || directory.sk_station === filterStation;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesStation;
  });
  
  // Get unique stations with data for filter
  const stationOptions = useMemo(() => {
    const uniqueStations = ['all'];
    const stationsWithData = new Set();
    
    // Add stations that have data
    directories.forEach(dir => {
      stationsWithData.add(dir.sk_station);
    });
    
    // Always include user's station
    if (skUser && skUser.sk_station) {
      stationsWithData.add(skUser.sk_station);
    }
    
    // Add Federation only if it has data or user is Federasyon
    if (stationsWithData.has('Federation') || skUser.sk_role === 'Federasyon') {
      uniqueStations.push('Federation');
    }
    
    // Add remaining stations
    const otherStations = Array.from(stationsWithData)
      .filter(station => station !== 'Federation')
      .sort();
    
    return [...uniqueStations, ...otherStations];
  }, [directories, skUser]);
  
  // Get stations that actually have data for the org chart viewer
  const stationsWithData = useMemo(() => {
    const stations = new Set();
    directories.forEach(dir => {
      if (dir.status === 'published') {
        stations.add(dir.sk_station);
      }
    });
    return Array.from(stations).sort();
  }, [directories]);
  
  // Add directory
  const handleAddClick = () => {
    setEditItem(null);
    setShowForm(true);
  };
  
  // Edit directory
  const handleEditClick = (item) => {
    setEditItem(item);
    setShowForm(true);
  };
  
  // Show organization chart
  const handleViewOrgChart = (station) => {
    setOrgChartStation(station);
    setShowOrgChart(true);
  };
  
  // Archive directory
  const handleArchiveClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Directory',
      message: 'Are you sure you want to archive this directory entry?',
      confirmText: 'Archive',
      confirmColor: 'warning',
      onConfirm: () => archiveDirectory(id)
    });
  };
  
  const archiveDirectory = async (id) => {
    try {
      await axios.put(`/api/directories/${id}/archive`);
      setNotification({
        type: 'success',
        message: 'Directory archived successfully'
      });
      fetchDirectories();
    } catch (error) {
      console.error('Failed to archive directory:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to archive directory'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Restore directory
  const handleRestoreClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Directory',
      message: 'Are you sure you want to restore this directory entry?',
      confirmText: 'Restore',
      confirmColor: 'success',
      onConfirm: () => restoreDirectory(id)
    });
  };
  
  const restoreDirectory = async (id) => {
    try {
      await axios.put(`/api/directories/${id}/restore`);
      setNotification({
        type: 'success',
        message: 'Directory restored successfully'
      });
      fetchDirectories();
    } catch (error) {
      console.error('Failed to restore directory:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to restore directory'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Delete directory
  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Directory',
      message: 'Are you sure you want to delete this directory entry? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'danger',
      onConfirm: () => deleteDirectory(id)
    });
  };
  
  const deleteDirectory = async (id) => {
    try {
      await axios.delete(`/api/directories/${id}`);
      setNotification({
        type: 'success',
        message: 'Directory deleted successfully'
      });
      fetchDirectories();
    } catch (error) {
      console.error('Failed to delete directory:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to delete directory'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Optimize bulk operations
  const handleBulkArchive = async (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Selected Directories',
      message: `Are you sure you want to archive ${ids.length} selected directories?`,
      confirmText: 'Archive All',
      confirmColor: 'warning',
      onConfirm: () => bulkArchiveDirectories(ids)
    });
  };
  
  const bulkArchiveDirectories = async (ids) => {
    try {
      // Use Promise.all for parallel processing but with a small batch size
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(id => axios.put(`/api/directories/${id}/archive`)));
      }
      
      setNotification({
        type: 'success',
        message: `${ids.length} directories archived successfully`
      });
      
      fetchDirectories();
    } catch (error) {
      console.error('Failed to archive directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to archive some or all directories'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk restore directories - optimized with batching
  const handleBulkRestore = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Selected Directories',
      message: `Are you sure you want to restore ${ids.length} selected directories?`,
      confirmText: 'Restore All',
      confirmColor: 'success',
      onConfirm: () => bulkRestoreDirectories(ids)
    });
  };
  
  const bulkRestoreDirectories = async (ids) => {
    try {
      // Use batching for better performance
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(id => axios.put(`/api/directories/${id}/restore`)));
      }
      
      setNotification({
        type: 'success',
        message: `${ids.length} directories restored successfully`
      });
      
      fetchDirectories();
    } catch (error) {
      console.error('Failed to restore directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to restore some or all directories'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk delete directories - optimized with batching
  const handleBulkDelete = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Directories',
      message: `Are you sure you want to delete ${ids.length} selected directories? This action cannot be undone.`,
      confirmText: 'Delete All',
      confirmColor: 'danger',
      onConfirm: () => bulkDeleteDirectories(ids)
    });
  };
  
  const bulkDeleteDirectories = async (ids) => {
    try {
      // Use batching for better performance
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(id => axios.delete(`/api/directories/${id}`)));
      }
      
      setNotification({
        type: 'success',
        message: `${ids.length} directories deleted successfully`
      });
      
      fetchDirectories();
    } catch (error) {
      console.error('Failed to delete directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete some or all directories'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Save directory (add or update)
  const handleSaveDirectory = async (formData) => {
    try {
      if (editItem) {
        await axios.put(`/api/directories/${editItem.id}`, formData);
        setNotification({
          type: 'success',
          message: 'Directory updated successfully'
        });
      } else {
        await axios.post('/api/directories', formData);
        setNotification({
          type: 'success',
          message: 'Directory added successfully'
        });
      }
      setShowForm(false);
      fetchDirectories();
    } catch (error) {
      console.error('Failed to save directory:', error);
      
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
          message: error.response?.data?.error || 'Failed to save directory'
        });
      }
    }
  };
  
  return (
    <div className="sk-dir-mgmt-container">
      <div className="sk-dir-mgmt-header">
        <h1 className="sk-dir-mgmt-title">Directory Management</h1>
        <p className="sk-dir-mgmt-description">
          Manage directory listings for the Youth Directory page
        </p>
      </div>
      
      {/* Organization Charts Quickview */}
      {stationsWithData.length > 0 && (
        <div className="sk-dir-mgmt-org-charts">
          <div className="sk-dir-mgmt-org-charts-title">
            <FaNetworkWired /> Organization Charts
          </div>
          <div className="sk-dir-mgmt-org-charts-list">
            {stationsWithData.map(station => (
              <button 
                key={station}
                className="sk-dir-mgmt-org-chart-btn" 
                onClick={() => handleViewOrgChart(station)}
              >
                <FaEye /> {station} Org Chart
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="sk-dir-mgmt-actions">
        <div className="sk-dir-mgmt-search">
          <div className="sk-dir-mgmt-search-input">
            <FaSearch className="sk-dir-mgmt-search-icon" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sk-dir-mgmt-input"
            />
          </div>
          
          <div className="sk-dir-mgmt-filters">
            <div className="sk-dir-mgmt-filter">
              <label>Status:</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="sk-dir-mgmt-select"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="sk-dir-mgmt-filter">
              <label>Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="sk-dir-mgmt-select"
              >
                <option value="all">All Categories</option>
                <option value="executive">Executive Committee</option>
                <option value="committee">Committees</option>
                <option value="barangay">Barangay SK Chairpersons</option>
                <option value="partner">Partner Agencies</option>
              </select>
            </div>
            
            <div className="sk-dir-mgmt-filter">
              <label>Station:</label>
              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                className="sk-dir-mgmt-select"
              >
                {stationOptions.map(station => (
                  <option key={station} value={station}>
                    {station === 'all' ? 'All Stations' : station}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <button 
          className="sk-dir-mgmt-add-btn"
          onClick={handleAddClick}
        >
          <FaPlus /> Add Directory
        </button>
      </div>
      
      <DirectoryTable
        directories={filteredDirectories}
        loading={loading}
        skUser={skUser}
        onEdit={handleEditClick}
        onArchive={handleArchiveClick}
        onRestore={handleRestoreClick}
        onDelete={handleDeleteClick}
        onBulkArchive={handleBulkArchive}
        onBulkRestore={handleBulkRestore}
        onBulkDelete={handleBulkDelete}
      />
      
      {showForm && (
        <DirectoryForm
          show={showForm}
          onHide={() => setShowForm(false)}
          onSave={handleSaveDirectory}
          initialData={editItem}
          skUser={skUser}
        />
      )}
      
      {showOrgChart && (
        <OrganizationChartModal
          show={showOrgChart}
          onClose={() => setShowOrgChart(false)}
          stationName={orgChartStation}
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

export default DirectoryManagement;