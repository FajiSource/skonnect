import React, { useState, useEffect } from 'react';
import { FaEdit, FaArchive, FaTrash, FaUndoAlt, FaLock, FaCheck, FaCheckSquare, FaSquare, FaEye, FaTrophy } from 'react-icons/fa';
import '../css/AwardTable.css';

const AwardTable = ({
  awards,
  loading,
  skUser,
  onEdit,
  onView,
  onArchive,
  onRestore,
  onDelete,
  onBulkArchive,
  onBulkRestore,
  onBulkDelete
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // When awards changes (after CRUD operations), reset selections
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [awards.length]);
  
  // Check if user has permission to edit/archive/delete
  const canManageAward = (award) => {
    // Federasyon can manage all awards
    if (skUser.sk_role === 'Federasyon') {
      return true;
    } 
    
    // Check if award was created by Federasyon (special protection)
    const createdByFederasyon = award.creator && award.creator.sk_role === 'Federasyon';
    if (createdByFederasyon && skUser.sk_role !== 'Federasyon') {
      return false;
    }
    
    // Chairman can manage their own awards and Kagawad awards in their station
    if (skUser.sk_role === 'Chairman') {
      return award.sk_station === skUser.sk_station && 
        (award.created_by === skUser.id || 
         (award.creator && award.creator.sk_role === 'Kagawad'));
    } 
    
    // Kagawad can only manage their own awards
    return award.created_by === skUser.id;
  };
  
  // Handle select all checkboxes
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      // Only select items the user can manage
      const manageable = awards.filter(award => canManageAward(award));
      setSelectedItems(manageable.map(award => award.id));
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
      const manageableIds = awards
        .filter(award => canManageAward(award))
        .map(award => award.id);
        
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
      const award = awards.find(a => a.id === id);
      return award && award.status === status;
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
      case 'leadership':
        return 'Leadership';
      case 'innovation':
        return 'Innovation';
      case 'service':
        return 'Community Service';
      case 'environment':
        return 'Environmental';
      case 'education':
        return 'Academic';
      case 'arts':
        return 'Arts & Culture';
      case 'sports':
        return 'Sports';
      case 'technology':
        return 'Technology';
      default:
        return category;
    }
  };

  const getCategoryClass = (category) => {
    switch(category) {
      case 'leadership':
        return 'sk-award-category-leadership';
      case 'innovation':
        return 'sk-award-category-innovation';
      case 'service':
        return 'sk-award-category-service';
      case 'environment':
        return 'sk-award-category-environment';
      case 'education':
        return 'sk-award-category-education';
      case 'arts':
        return 'sk-award-category-arts';
      case 'sports':
        return 'sk-award-category-sports';
      case 'technology':
        return 'sk-award-category-technology';
      default:
        return '';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="sk-award-table-container">
      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="sk-award-bulk-actions">
          <div className="sk-award-bulk-info">
            <FaCheck /> <span>{selectedItems.length} items selected</span>
          </div>
          <div className="sk-award-bulk-buttons">
            {selectedPublishedCount > 0 && (
              <button 
                className="sk-award-bulk-btn sk-award-bulk-archive"
                onClick={() => handleBulkArchive(getFilteredSelectedItems('published'))}
              >
                <FaArchive /> Archive Selected ({selectedPublishedCount})
              </button>
            )}
            
            {selectedArchivedCount > 0 && (
              <button 
                className="sk-award-bulk-btn sk-award-bulk-restore"
                onClick={() => handleBulkRestore(getFilteredSelectedItems('archived'))}
              >
                <FaUndoAlt /> Restore Selected ({selectedArchivedCount})
              </button>
            )}
            
            <button 
              className="sk-award-bulk-btn sk-award-bulk-delete"
              onClick={() => handleBulkDelete(selectedItems)}
            >
              <FaTrash /> Delete Selected ({selectedItems.length})
            </button>
            
            <button 
              className="sk-award-bulk-btn sk-award-bulk-cancel"
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
        <div className="sk-award-loading">
          <div className="sk-award-loading-spinner"></div>
          <p>Loading awards...</p>
        </div>
      ) : awards.length === 0 ? (
        <div className="sk-award-empty">
          <p>No awards found. Add a new award to get started.</p>
        </div>
      ) : (
        <div className="sk-award-table-wrapper">
          <table className="sk-award-table">
            <thead>
              <tr>
                <th className="sk-award-checkbox-col">
                  <div className="sk-award-checkbox" onClick={handleSelectAll}>
                    {selectAll ? <FaCheckSquare className="sk-award-checkbox-icon checked" /> : <FaSquare className="sk-award-checkbox-icon" />}
                  </div>
                </th>
                <th></th>
                <th>Title</th>
                <th>Category</th>
                <th>Recipients</th>
                <th>Date Awarded</th>
                <th>Year</th>
                <th>Station</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {awards.map(award => {
                const canManage = canManageAward(award);
                const isSelected = selectedItems.includes(award.id);
                
                return (
                  <tr 
                    key={award.id} 
                    className={`sk-award-row ${award.status === 'archived' ? 'sk-award-row-archived' : ''} ${isSelected ? 'sk-award-row-selected' : ''}`}
                  >
                    <td className="sk-award-checkbox-col">
                      <div 
                        className={`sk-award-checkbox ${!canManage ? 'sk-award-checkbox-disabled' : ''}`}
                        onClick={() => handleSelectItem(award.id, canManage)}
                      >
                        {isSelected ? 
                          <FaCheckSquare className="sk-award-checkbox-icon checked" /> : 
                          <FaSquare className="sk-award-checkbox-icon" />
                        }
                      </div>
                    </td>
                    <td className="sk-award-image-col">
                      <div className="sk-award-thumbnail">
                        <img 
                          src={`/storage/${award.main_image}`} 
                          alt={award.title} 
                          className="sk-award-thumbnail-img"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="sk-award-title-block">
                        <div className="sk-award-title">{award.title}</div>
                        <div className="sk-award-description">{award.description.substring(0, 100)}...</div>
                      </div>
                    </td>
                    <td>
                      <span className={`sk-award-category-badge ${getCategoryClass(award.category)}`}>
                        {getCategoryLabel(award.category)}
                      </span>
                    </td>
                    <td>{award.recipients}</td>
                    <td>{formatDate(award.date_awarded)}</td>
                    <td>{award.year}</td>
                    <td>{award.sk_station}</td>
                    <td>
                      <span className={`sk-award-status-badge ${award.status === 'published' ? 'sk-award-status-published' : 'sk-award-status-archived'}`}>
                        {award.status}
                      </span>
                    </td>
                    <td>
                      {award.creator ? (
                        <div className="sk-award-creator">
                          <div className="sk-award-creator-name">
                            {award.creator.first_name} {award.creator.last_name}
                          </div>
                          <div className="sk-award-creator-role">
                            {award.creator.sk_role === 'Federasyon' ? 
                              'Federasyon' : 
                              `${award.creator.sk_role} - ${award.creator.sk_station}`}
                          </div>
                        </div>
                      ) : (
                        <span>Unknown</span>
                      )}
                    </td>
                    <td>
                      <div className="sk-award-actions">
                        <button
                          className="sk-award-btn sk-award-btn-view"
                          onClick={() => onView(award)}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        
                        {canManage ? (
                          <>
                            <button
                              className="sk-award-btn sk-award-btn-edit"
                              onClick={() => onEdit(award)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            
                            {award.status === 'published' ? (
                              <button
                                className="sk-award-btn sk-award-btn-archive"
                                onClick={() => onArchive(award.id)}
                                title="Archive"
                              >
                                <FaArchive />
                              </button>
                            ) : (
                              <button
                                className="sk-award-btn sk-award-btn-restore"
                                onClick={() => onRestore(award.id)}
                                title="Restore"
                              >
                                <FaUndoAlt />
                              </button>
                            )}
                            
                            <button
                              className="sk-award-btn sk-award-btn-delete"
                              onClick={() => onDelete(award.id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        ) : (
                          <div className="sk-award-no-permission">
                            <FaLock />
                            <span>No Permission</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="sk-award-table-footer">
        <p>Showing {awards.length} award entries</p>
      </div>
    </div>
  );
};

export default AwardTable;