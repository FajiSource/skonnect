import React, { useState, useEffect } from 'react';
import { FaEdit, FaArchive, FaTrash, FaUndoAlt, FaLock, FaCheck, FaCheckSquare, FaSquare } from 'react-icons/fa';
import '../css/DirectoryTable.css';

const DirectoryTable = ({
  directories,
  loading,
  skUser,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onBulkArchive,
  onBulkRestore,
  onBulkDelete
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // When directories changes (after CRUD operations), reset selections
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [directories.length]);
  
  // Check if user has permission to edit/archive/delete
  const canManageDirectory = (directory) => {
    // Federasyon can manage all directories
    if (skUser.sk_role === 'Federasyon') {
      return true;
    } 
    
    // Check if directory was created by Federasyon (special protection)
    const createdByFederasyon = directory.creator && directory.creator.sk_role === 'Federasyon';
    if (createdByFederasyon && skUser.sk_role !== 'Federasyon') {
      return false;
    }
    
    // Chairman can manage their own directories and Kagawad directories in their station
    if (skUser.sk_role === 'Chairman') {
      return directory.sk_station === skUser.sk_station && 
        (directory.created_by === skUser.id || 
         (directory.creator && directory.creator.sk_role === 'Kagawad'));
    } 
    
    // Kagawad can only manage their own directories
    return directory.created_by === skUser.id;
  };
  
  // Handle select all checkboxes
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      // Only select items the user can manage
      const manageable = directories.filter(dir => canManageDirectory(dir));
      setSelectedItems(manageable.map(dir => dir.id));
    }
    setSelectAll(!selectAll);
  };
  
  // Handle individual item selection
  const handleSelectItem = (id, canManage) => {
    if (!canManage) return;
    
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setSelectAll(false);
    } else {
      setSelectedItems([...selectedItems, id]);
      
      // If all manageable items are now selected, set selectAll to true
      const manageableIds = directories
        .filter(dir => canManageDirectory(dir))
        .map(dir => dir.id);
        
      const willAllBeSelected = manageableIds.every(id => 
        selectedItems.includes(id) || id === id
      );
      
      if (willAllBeSelected) {
        setSelectAll(true);
      }
    }
  };
  
  // Get filtered selected items by status
  const getFilteredSelectedItems = (status) => {
    return selectedItems.filter(id => {
      const dir = directories.find(d => d.id === id);
      return dir && dir.status === status;
    });
  };
  
  // Wrapper functions for bulk actions that handle clearing selections
  const handleBulkArchive = (ids) => {
    if (ids.length === 0) return;
    onBulkArchive(ids);
  };
  
  const handleBulkRestore = (ids) => {
    if (ids.length === 0) return;
    onBulkRestore(ids);
  };
  
  const handleBulkDelete = (ids) => {
    if (ids.length === 0) return;
    onBulkDelete(ids);
  };
  
  // Calculate counts
  const selectedPublishedCount = getFilteredSelectedItems('published').length;
  const selectedArchivedCount = getFilteredSelectedItems('archived').length;

  const getCategoryLabel = (category) => {
    switch(category) {
      case 'executive':
        return 'Executive Committee';
      case 'committee':
        return 'Committees';
      case 'barangay':
        return 'Barangay SK Chairpersons';
      case 'partner':
        return 'Partner Agencies';
      default:
        return category;
    }
  };

  const getCategoryClass = (category) => {
    switch(category) {
      case 'executive':
        return 'sk-dir-category-executive';
      case 'committee':
        return 'sk-dir-category-committee';
      case 'barangay':
        return 'sk-dir-category-barangay';
      case 'partner':
        return 'sk-dir-category-partner';
      default:
        return '';
    }
  };

  // Format creator display
  const formatCreatorDisplay = (creator) => {
    if (!creator) return 'Unknown';
    
    if (creator.sk_role === 'Federasyon') {
      return (
        <div className="sk-dir-creator">
          <div className="sk-dir-creator-name">
            {creator.first_name} {creator.last_name}
          </div>
          <div className="sk-dir-creator-role">
            Federasyon
          </div>
        </div>
      );
    }
    
    return (
      <div className="sk-dir-creator">
        <div className="sk-dir-creator-name">
          {creator.first_name} {creator.last_name}
        </div>
        <div className="sk-dir-creator-role">
          {creator.sk_role} - {creator.sk_station}
        </div>
      </div>
    );
  };

  // Filter out Federation station if it doesn't have any records
  const hasAnyFederationData = directories.some(dir => dir.sk_station === 'Federation');

  return (
    <div className="sk-dir-table-container">
      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="sk-dir-bulk-actions">
          <div className="sk-dir-bulk-info">
            <FaCheck /> <span>{selectedItems.length} items selected</span>
          </div>
          <div className="sk-dir-bulk-buttons">
            {selectedPublishedCount > 0 && (
              <button 
                className="sk-dir-bulk-btn sk-dir-bulk-archive"
                onClick={() => handleBulkArchive(getFilteredSelectedItems('published'))}
              >
                <FaArchive /> Archive Selected ({selectedPublishedCount})
              </button>
            )}
            
            {selectedArchivedCount > 0 && (
              <button 
                className="sk-dir-bulk-btn sk-dir-bulk-restore"
                onClick={() => handleBulkRestore(getFilteredSelectedItems('archived'))}
              >
                <FaUndoAlt /> Restore Selected ({selectedArchivedCount})
              </button>
            )}
            
            <button 
              className="sk-dir-bulk-btn sk-dir-bulk-delete"
              onClick={() => handleBulkDelete(selectedItems)}
            >
              <FaTrash /> Delete Selected ({selectedItems.length})
            </button>
            
            <button 
              className="sk-dir-bulk-btn sk-dir-bulk-cancel"
              onClick={() => {
                setSelectedItems([]);
                setSelectAll(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    
      {loading ? (
        <div className="sk-dir-loading">
          <div className="sk-dir-loading-spinner"></div>
          <p>Loading directories...</p>
        </div>
      ) : directories.length === 0 ? (
        <div className="sk-dir-empty">
          <p>No directories found. Add a new directory to get started.</p>
        </div>
      ) : (
        <div className="sk-dir-table-wrapper">
          <table className="sk-dir-table">
            <thead>
              <tr>
                <th className="sk-dir-checkbox-col">
                  <div className="sk-dir-checkbox" onClick={handleSelectAll}>
                    {selectAll ? <FaCheckSquare className="sk-dir-checkbox-icon checked" /> : <FaSquare className="sk-dir-checkbox-icon" />}
                  </div>
                </th>
                <th>Name</th>
                <th>Role/Position</th>
                <th>Contact Information</th>
                <th>Category</th>
                <th>Station</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {directories.map(directory => {
                const canManage = canManageDirectory(directory);
                const isSelected = selectedItems.includes(directory.id);
                
                return (
                  <tr 
                    key={directory.id} 
                    className={`sk-dir-row ${directory.status === 'archived' ? 'sk-dir-row-archived' : ''} ${isSelected ? 'sk-dir-row-selected' : ''}`}
                  >
                    <td className="sk-dir-checkbox-col">
                      <div 
                        className={`sk-dir-checkbox ${!canManage ? 'sk-dir-checkbox-disabled' : ''}`}
                        onClick={() => handleSelectItem(directory.id, canManage)}
                      >
                        {isSelected ? 
                          <FaCheckSquare className="sk-dir-checkbox-icon checked" /> : 
                          <FaSquare className="sk-dir-checkbox-icon" />
                        }
                      </div>
                    </td>
                    <td>{directory.name}</td>
                    <td>{directory.role}</td>
                    <td>
                      {directory.email && (
                        <div className="sk-dir-contact">
                          <span className="sk-dir-contact-label">Email:</span>
                          <a href={`mailto:${directory.email}`} className="sk-dir-contact-value">
                            {directory.email}
                          </a>
                        </div>
                      )}
                      {directory.phone && (
                        <div className="sk-dir-contact">
                          <span className="sk-dir-contact-label">Phone:</span>
                          <a href={`tel:${directory.phone}`} className="sk-dir-contact-value">
                            {directory.phone}
                          </a>
                        </div>
                      )}
                      {directory.location && (
                        <div className="sk-dir-contact">
                          <span className="sk-dir-contact-label">Location:</span>
                          <span className="sk-dir-contact-value">{directory.location}</span>
                        </div>
                      )}
                      {!directory.email && !directory.phone && !directory.location && 
                        <span className="sk-dir-no-contact">No contact info</span>
                      }
                    </td>
                    <td>
                      <span className={`sk-dir-category-badge ${getCategoryClass(directory.category)}`}>
                        {getCategoryLabel(directory.category)}
                      </span>
                    </td>
                    <td>{directory.sk_station}</td>
                    <td>
                      <span className={`sk-dir-status-badge ${directory.status === 'published' ? 'sk-dir-status-published' : 'sk-dir-status-archived'}`}>
                        {directory.status}
                      </span>
                    </td>
                    <td>
                      {formatCreatorDisplay(directory.creator)}
                    </td>
                    <td>
                      {canManage ? (
                        <div className="sk-dir-actions">
                          <button
                            className="sk-dir-btn sk-dir-btn-edit"
                            onClick={() => onEdit(directory)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          
                          {directory.status === 'published' ? (
                            <button
                              className="sk-dir-btn sk-dir-btn-archive"
                              onClick={() => onArchive(directory.id)}
                              title="Archive"
                            >
                              <FaArchive />
                            </button>
                          ) : (
                            <button
                              className="sk-dir-btn sk-dir-btn-restore"
                              onClick={() => onRestore(directory.id)}
                              title="Restore"
                            >
                              <FaUndoAlt />
                            </button>
                          )}
                          
                          <button
                            className="sk-dir-btn sk-dir-btn-delete"
                            onClick={() => onDelete(directory.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ) : (
                        <div className="sk-dir-no-permission">
                          <FaLock />
                          <span>No Permission</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="sk-dir-table-footer">
        <p>Showing {directories.length} directory entries</p>
      </div>
    </div>
  );
};

export default DirectoryTable;