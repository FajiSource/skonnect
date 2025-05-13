import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArchive, FaUndo, FaSearch, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaDownload, FaEye } from 'react-icons/fa';
import '../css/TemplateManagement.css';
import Notification from '../Components/Notification';
import ConfirmationDialog from '../Components/ConfirmationDialog';

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'reports',
    file: null
  });
  const [formErrors, setFormErrors] = useState({});

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'reports', name: 'Reports & Documentation' },
    { id: 'forms', name: 'Forms & Applications' },
    { id: 'letters', name: 'Official Letters' },
    { id: 'budget', name: 'Budget & Finance' },
    { id: 'events', name: 'Event Planning' }
  ];

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/templates', {
        params: {
          include_archived: showArchived,
          category: selectedCategory !== 'all' ? selectedCategory : null,
          search: searchQuery
        }
      });
      setTemplates(response.data);
      setFilteredTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showNotification('Failed to load templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [showArchived]);

  useEffect(() => {
    let filtered = [...templates];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) || 
        template.description.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  }, [searchQuery, selectedCategory, templates]);

  // Get file type icon
  const getFileIcon = (type) => {
    switch(type) {
      case 'docx':
      case 'doc':
        return <FaFileWord className="sk-file-icon docx" />;
      case 'xlsx':
      case 'xls':
        return <FaFileExcel className="sk-file-icon xlsx" />;
      case 'pptx':
      case 'ppt':
        return <FaFilePowerpoint className="sk-file-icon pptx" />;
      case 'pdf':
        return <FaFilePdf className="sk-file-icon pdf" />;
      default:
        return <FaFileAlt className="sk-file-icon" />;
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Handle modal open/close
  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        description: template.description,
        category: template.category,
        file: null
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        title: '',
        description: '',
        category: 'reports',
        file: null
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      title: '',
      description: '',
      category: 'reports',
      file: null
    });
    setFormErrors({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!editingTemplate && !formData.file) errors.file = 'File is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      
      if (formData.file) {
        data.append('file', formData.file);
      }
      
      let response;
      if (editingTemplate) {
        response = await axios.post(`/api/templates/${editingTemplate.id}`, data, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT'
          }
        });
      } else {
        response = await axios.post('/api/templates', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (response.data.success) {
        showNotification(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        closeModal();
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showNotification('Failed to save template', 'error');
    }
  };

  // Handle delete
  const handleDelete = (template) => {
    setConfirmDialog({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await axios.delete(`/api/templates/${template.id}`);
          if (response.data.success) {
            showNotification('Template deleted successfully');
            fetchTemplates();
          }
        } catch (error) {
          console.error('Error deleting template:', error);
          showNotification('Failed to delete template', 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  // Handle archive/restore
  const handleArchiveRestore = async (template) => {
    const isArchived = template.status === 'archived';
    const action = isArchived ? 'restore' : 'archive';
    
    try {
      const response = await axios.put(`/api/templates/${template.id}/${action}`);
      if (response.data.success) {
        showNotification(`Template ${isArchived ? 'restored' : 'archived'} successfully`);
        fetchTemplates();
      }
    } catch (error) {
      console.error(`Error ${action}ing template:`, error);
      showNotification(`Failed to ${action} template`, 'error');
    }
  };

  // Handle preview
  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewTemplate(null);
  };

  return (
    <div className="sk-template-management">
      <div className="sk-page-header">
        <h1 className="sk-page-title">Template Management</h1>
        <button className="sk-btn sk-btn-primary" onClick={() => openModal()}>
          <FaPlus /> Add Template
        </button>
      </div>

      <div className="sk-filters">
        <div className="sk-search-box">
          <FaSearch className="sk-search-icon" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sk-search-input"
          />
        </div>

        <div className="sk-filter-controls">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="sk-select"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label className="sk-checkbox-label">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="sk-checkbox"
            />
            Show Archived
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="sk-loading">
          <div className="sk-spinner"></div>
          <p>Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="sk-no-results">
          <FaFileAlt className="sk-no-results-icon" />
          <h3>No templates found</h3>
          <p>Try adjusting your search criteria or add a new template.</p>
        </div>
      ) : (
        <div className="sk-template-grid">
          {filteredTemplates.map(template => (
            <div key={template.id} className={`sk-template-card ${template.status === 'archived' ? 'archived' : ''}`}>
              <div className="sk-template-card-header">
                {getFileIcon(template.file_type)}
                <span className="sk-file-type">{template.file_type.toUpperCase()}</span>
              </div>
              
              <div className="sk-template-card-body">
                <h3 className="sk-template-title">{template.title}</h3>
                <p className="sk-template-description">{template.description}</p>
                
                <div className="sk-template-meta">
                  <span>Category: {categories.find(c => c.id === template.category)?.name}</span>
                  <span>Size: {template.file_size}</span>
                  <span>Downloads: {template.download_count}</span>
                </div>
              </div>
              
              <div className="sk-template-card-footer">
                <button className="sk-icon-btn" title="Preview" onClick={() => handlePreview(template)}>
                  <FaEye />
                </button>
                <button className="sk-icon-btn" title="Edit" onClick={() => openModal(template)}>
                  <FaEdit />
                </button>
                <button 
                  className="sk-icon-btn" 
                  title={template.status === 'archived' ? 'Restore' : 'Archive'}
                  onClick={() => handleArchiveRestore(template)}
                >
                  {template.status === 'archived' ? <FaUndo /> : <FaArchive />}
                </button>
                <button className="sk-icon-btn danger" title="Delete" onClick={() => handleDelete(template)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit Template */}
      {showModal && (
        <div className="sk-modal-overlay">
          <div className="sk-modal-content">
            <div className="sk-modal-header">
              <h2>{editingTemplate ? 'Edit Template' : 'Add New Template'}</h2>
              <button className="sk-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="sk-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={formErrors.title ? 'error' : ''}
                />
                {formErrors.title && <span className="sk-error-message">{formErrors.title}</span>}
              </div>
              
              <div className="sk-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={formErrors.description ? 'error' : ''}
                />
                {formErrors.description && <span className="sk-error-message">{formErrors.description}</span>}
              </div>
              
              <div className="sk-form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.filter(c => c.id !== 'all').map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sk-form-group">
                <label>Template File {editingTemplate && '(Leave blank to keep current file)'}</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                  className={formErrors.file ? 'error' : ''}
                />
                {formErrors.file && <span className="sk-error-message">{formErrors.file}</span>}
              </div>
              
              <div className="sk-modal-footer">
                <button type="button" className="sk-btn sk-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="sk-btn sk-btn-primary">
                  {editingTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="sk-modal-overlay" onClick={closePreviewModal}>
          <div className="sk-modal-content sk-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sk-modal-header">
              <h2>Preview: {previewTemplate.title}</h2>
              <button className="sk-modal-close" onClick={closePreviewModal}>×</button>
            </div>
            
            <div className="sk-preview-container">
              {previewTemplate.file_type === 'pdf' ? (
                <iframe
                  src={`/api/templates/${previewTemplate.id}/preview`}
                  title={previewTemplate.title}
                  className="sk-preview-iframe"
                />
              ) : (
                <div className="sk-preview-unavailable">
                  <FaFileAlt className="sk-preview-icon" />
                  <p>Preview not available for {previewTemplate.file_type.toUpperCase()} files</p>
                  <p>Please download the file to view its contents</p>
                  <a 
                    href={`/api/templates/${previewTemplate.id}/download`} 
                    className="sk-btn sk-btn-primary"
                    download
                  >
                    <FaDownload /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmationDialog
          isOpen={true}
          onClose={confirmDialog.onCancel}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />
      )}
    </div>
  );
};

export default TemplateManagement;