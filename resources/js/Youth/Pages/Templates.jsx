import React, { useState, useEffect } from 'react';
import '../css/Templates.css';
import { FaDownload, FaEye, FaSearch, FaCalendarAlt, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaSpinner, FaTimesCircle, FaTimes } from 'react-icons/fa';
import YouthLayout from '../Components/YouthLayout';
import axios from 'axios';

const Templates = () => {
  // State for template filtering and display
  const [isLoading, setIsLoading] = useState(false);
  const [allTemplates, setAllTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Template categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'reports', name: 'Reports & Documentation' },
    { id: 'forms', name: 'Forms & Applications' },
    { id: 'letters', name: 'Official Letters' },
    { id: 'budget', name: 'Budget & Finance' },
    { id: 'events', name: 'Event Planning' }
  ];
  
  // Get file type icon
  const getFileIcon = (type) => {
    switch(type) {
      case 'docx':
      case 'doc':
        return <FaFileWord className="youth-tpl-file-icon docx" />;
      case 'xlsx':
      case 'xls':
        return <FaFileExcel className="youth-tpl-file-icon xlsx" />;
      case 'pptx':
      case 'ppt':
        return <FaFilePowerpoint className="youth-tpl-file-icon pptx" />;
      case 'pdf':
        return <FaFilePdf className="youth-tpl-file-icon pdf" />;
      default:
        return <FaFileAlt className="youth-tpl-file-icon" />;
    }
  };

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/templates');
        // Filter only active templates for the Youth side
        const activeTemplates = response.data.filter(template => template.status === 'active');
        setAllTemplates(activeTemplates);
        setFilteredTemplates(activeTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = [...allTemplates];
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) || 
        template.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  }, [searchQuery, selectedCategory, allTemplates]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Open template preview
  const openPreview = (template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
    document.body.classList.add('youth-tpl-modal-open');
  };

  // Close template preview
  const closePreview = () => {
    setIsPreviewOpen(false);
    document.body.classList.remove('youth-tpl-modal-open');
  };

  // Handle template download
  const handleDownload = async (templateId) => {
    try {
      window.location.href = `/api/templates/${templateId}/download`;
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  return (
    <YouthLayout>     
      <section className="youth-tpl-banner">
        <div className="youth-tpl-banner-content">
          <h1 className="youth-tpl-banner-title">Templates</h1>
          <p className="youth-tpl-banner-subtitle">Download official documents and forms for Sangguniang Kabataan operations</p>
        </div>
      </section>
      
      <div className="youth-tpl-content-wrapper">
        <div className="youth-tpl-header">
          <h2 className="youth-tpl-title">OFFICIAL TEMPLATES</h2>
          <p className="youth-tpl-description">
            Access standardized templates for Sangguniang Kabataan reports, forms, presentations, and official documents.
            These templates ensure consistency and professionalism in all SK communications and operations.
          </p>
        </div>
        
        <div className="youth-tpl-tools">
          {/* Search Bar */}
          <div className="youth-tpl-search">
            <div className="youth-tpl-search-wrapper">
              <FaSearch className="youth-tpl-search-icon" />
              <input 
                type="text" 
                className="youth-tpl-search-input" 
                placeholder="Search templates by name or description..." 
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button 
                  className="youth-tpl-search-clear" 
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <FaTimesCircle />
                </button>
              )}
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="youth-tpl-categories">
            {categories.map(category => (
              <button 
                key={category.id} 
                className={`youth-tpl-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="youth-tpl-loading">
            <div className="youth-tpl-spinner">
              <FaSpinner className="youth-tpl-spinner-icon" />
            </div>
            <p className="youth-tpl-loading-text">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="youth-tpl-no-results">
            <div className="youth-tpl-no-results-icon">
              <FaFileAlt />
            </div>
            <h3 className="youth-tpl-no-results-title">No templates found</h3>
            <p className="youth-tpl-no-results-text">Try adjusting your search criteria or check back later for more templates.</p>
          </div>
        ) : (
          <div className="youth-tpl-list">
            {filteredTemplates.map(template => (
              <div className="youth-tpl-item" key={template.id}>
                <div className="youth-tpl-info">
                  <div className="youth-tpl-icon">
                    {getFileIcon(template.file_type)}
                    <span className="youth-tpl-file-type">{template.file_type.toUpperCase()}</span>
                  </div>
                  <div className="youth-tpl-details">
                    <h3 className="youth-tpl-name">{template.title}</h3>
                    <p className="youth-tpl-desc">{template.description}</p>
                    <div className="youth-tpl-meta">
                      <span className="youth-tpl-meta-item">
                        <FaCalendarAlt className="youth-tpl-meta-icon" />
                        Updated: <span className="youth-tpl-meta-value">{formatDate(template.updated_at)}</span>
                      </span>
                      <span className="youth-tpl-meta-item">
                        <FaFileAlt className="youth-tpl-meta-icon" />
                        <span className="youth-tpl-meta-value">{template.file_size}</span>
                      </span>
                      <span className="youth-tpl-download-count">
                        <FaDownload className="youth-tpl-meta-icon" />
                        <span className="youth-tpl-meta-value">{template.download_count} downloads</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="youth-tpl-actions">
                  <button 
                    className="youth-tpl-preview-btn"
                    onClick={() => openPreview(template)}
                  >
                    <FaEye className="youth-tpl-btn-icon" /> Preview
                  </button>
                  <button onClick={() => handleDownload(template.id)} className="youth-tpl-download-btn">
                    <FaDownload className="youth-tpl-btn-icon" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="youth-tpl-request">
          <div className="youth-tpl-request-content">
            <h3 className="youth-tpl-request-title">Need a specific template?</h3>
            <p className="youth-tpl-request-text">
              If you can't find the template you need, submit a request and we'll develop it for you.
            </p>
            <button className="youth-tpl-request-btn">Request Template</button>
          </div>
        </div>
      </div>
      
      {/* Template Preview Modal */}
      {isPreviewOpen && previewTemplate && (
        <div className="youth-tpl-modal-overlay" onClick={closePreview}>
          <div className="youth-tpl-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="youth-tpl-modal-close" onClick={closePreview}>
              <FaTimes />
            </button>
            
            <div className="youth-tpl-modal-header">
              <div className="youth-tpl-modal-title-wrapper">
                <h2 className="youth-tpl-modal-title">{previewTemplate.title}</h2>
                <div className="youth-tpl-modal-file-type">
                  {getFileIcon(previewTemplate.file_type)}
                  <span className="youth-tpl-modal-file-ext">{previewTemplate.file_type.toUpperCase()}</span>
                </div>
              </div>
              <p className="youth-tpl-modal-description">{previewTemplate.description}</p>
            </div>
            
            <div className="youth-tpl-modal-preview">
              {previewTemplate.file_type === 'pdf' ? (
                <iframe
                  src={`/api/templates/${previewTemplate.id}/preview`}
                  title={previewTemplate.title}
                  className="youth-tpl-preview-iframe"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                />
              ) : (
                <div className="youth-tpl-preview-placeholder">
                  <FaFileAlt className="youth-tpl-preview-icon" />
                  <p className="youth-tpl-preview-message">Preview not available for {previewTemplate.file_type.toUpperCase()} files</p>
                  <p className="youth-tpl-preview-submessage">Please download the file to view its contents</p>
                </div>
              )}
            </div>
            
            <div className="youth-tpl-modal-info">
              <div className="youth-tpl-modal-meta">
                <div className="youth-tpl-modal-meta-item">
                  <span className="youth-tpl-modal-meta-label">Last Updated:</span>
                  <span className="youth-tpl-modal-meta-value">{formatDate(previewTemplate.updated_at)}</span>
                </div>
                <div className="youth-tpl-modal-meta-item">
                  <span className="youth-tpl-modal-meta-label">File Size:</span>
                  <span className="youth-tpl-modal-meta-value">{previewTemplate.file_size}</span>
                </div>
                <div className="youth-tpl-modal-meta-item">
                  <span className="youth-tpl-modal-meta-label">Downloads:</span>
                  <span className="youth-tpl-modal-meta-value">{previewTemplate.download_count}</span>
                </div>
              </div>
              <div className="youth-tpl-modal-actions">
                <button onClick={() => handleDownload(previewTemplate.id)} className="youth-tpl-download-btn">
                  <FaDownload className="youth-tpl-btn-icon" /> Download Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </YouthLayout>
  );
};

export default Templates;