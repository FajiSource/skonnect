import React, { useState, useEffect } from 'react';
import { FaTrophy, FaTimes, FaInfoCircle, FaPlus, FaTrash, FaEdit, FaExclamationCircle } from 'react-icons/fa';
import '../css/AwardForm.css';

const AwardForm = ({ show, onHide, onSave, initialData, skUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'leadership',
    recipients: '',
    date_awarded: '',
    year: new Date().getFullYear(),
    sk_station: skUser.sk_station
  });
  
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [removeMainImage, setRemoveMainImage] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [removedGalleryIndices, setRemovedGalleryIndices] = useState([]);
  
  // Determine if user can change the sk_station based on role
  const canChangeStation = skUser.sk_role === 'Federasyon';
  
  // Fill form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setIsEditing(true);
      
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'leadership',
        recipients: initialData.recipients || '',
        date_awarded: initialData.date_awarded ? new Date(initialData.date_awarded).toISOString().split('T')[0] : '',
        year: initialData.year || new Date().getFullYear(),
        sk_station: initialData.sk_station || skUser.sk_station
      });
      
      // Set main image preview from existing image
      if (initialData.main_image) {
        setMainImagePreview(`/storage/${initialData.main_image}`);
      }
      
      // Set gallery images and previews
      if (initialData.gallery && Array.isArray(initialData.gallery)) {
        setGalleryPreviews(initialData.gallery.map(item => ({
          preview: `/storage/${item.path}`,
          caption: item.caption || '',
          subcaption: item.subcaption || '',
          isExisting: true,
          path: item.path
        })));
      }
      
      // Reset remove flags
      setRemoveMainImage(false);
      setRemovedGalleryIndices([]);
    } else {
      // Reset form when adding new
      setIsEditing(false);
      setFormData({
        title: '',
        description: '',
        category: 'leadership',
        recipients: '',
        date_awarded: '',
        year: new Date().getFullYear(),
        sk_station: skUser.sk_station
      });
      setMainImage(null);
      setMainImagePreview('');
      setGalleryImages([]);
      setGalleryPreviews([]);
      setRemovedGalleryIndices([]);
      setRemoveMainImage(false);
    }
    
    setErrors({});
  }, [initialData, show, skUser.sk_station]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle main image selection
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
      setRemoveMainImage(false);
      
      // Clear validation error
      if (errors.main_image) {
        setErrors(prev => ({
          ...prev,
          main_image: null
        }));
      }
    }
  };
  
  // Handle main image removal
  const handleRemoveMainImage = () => {
    if (isEditing) {
      // If editing, mark for removal on server
      setRemoveMainImage(true);
      setMainImagePreview('');
      setMainImage(null);
    } else {
      // If adding new, just clear the state
      setMainImage(null);
      setMainImagePreview('');
    }
  };
  
  // Handle gallery image selection
  const handleGalleryImageAdd = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Add new images to existing ones
      setGalleryImages(prev => [...prev, ...files]);
      
      // Create previews for new images
      const newPreviews = files.map(file => ({
        preview: URL.createObjectURL(file),
        caption: '',
        subcaption: '',
        isExisting: false
      }));
      
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
    
    // Reset the input
    e.target.value = null;
  };
  
  // Handle gallery image removal
  const handleGalleryImageRemove = (index) => {
    // If it's an existing image, mark it for removal on the server
    if (galleryPreviews[index].isExisting) {
      setRemovedGalleryIndices(prev => [...prev, index]);
    }
    
    // Also remove from the preview
    const newGalleryPreviews = [...galleryPreviews];
    newGalleryPreviews.splice(index, 1);
    setGalleryPreviews(newGalleryPreviews);
    
    // Also remove from galleryImages if it's a new image
    if (!galleryPreviews[index].isExisting) {
      const newIndex = galleryPreviews.slice(0, index).filter(item => !item.isExisting).length;
      const newGalleryImages = [...galleryImages];
      newGalleryImages.splice(newIndex, 1);
      setGalleryImages(newGalleryImages);
    }
  };
  
  // Handle gallery caption/subcaption changes
  const handleGalleryCaptionChange = (index, field, value) => {
    const newGalleryPreviews = [...galleryPreviews];
    newGalleryPreviews[index] = {
      ...newGalleryPreviews[index],
      [field]: value
    };
    setGalleryPreviews(newGalleryPreviews);
  };
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.recipients.trim()) {
      newErrors.recipients = 'Recipients are required';
    }
    
    if (!formData.date_awarded) {
      newErrors.date_awarded = 'Award date is required';
    }
    
    if (!formData.year) {
      newErrors.year = 'Year is required';
    }
    
    if (!isEditing && !mainImage) {
      newErrors.main_image = 'Main image is required';
    }
    
    if (isEditing && removeMainImage && !mainImage) {
      newErrors.main_image = 'Main image is required. Either keep the current image or upload a new one.';
    }
    
    if (!formData.sk_station) {
      newErrors.sk_station = 'Station is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Prepare form data for submission - updated with debugging and explicit method
  const prepareFormData = () => {
    const data = new FormData();
    
    // Explicitly add all form fields to ensure they're included in the request
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('recipients', formData.recipients);
    data.append('date_awarded', formData.date_awarded);
    data.append('year', formData.year.toString()); // Ensure year is a string
    data.append('sk_station', formData.sk_station);
    
    // For debugging
    console.log('Form data being prepared:');
    console.log('Title:', formData.title);
    console.log('Description:', formData.description);
    console.log('Category:', formData.category);
    console.log('Recipients:', formData.recipients);
    console.log('Date Awarded:', formData.date_awarded);
    console.log('Year:', formData.year);
    console.log('Station:', formData.sk_station);
    
    // Add main image if changed
    if (mainImage) {
      data.append('main_image', mainImage);
      console.log('Adding new main image');
    }
    
    // Add flag for removing main image
    if (removeMainImage) {
      data.append('remove_main_image', 'true');
      console.log('Remove main image flag added');
    }
    
    // Add gallery images
    if (galleryImages.length > 0) {
      console.log('Adding gallery images:', galleryImages.length);
      galleryImages.forEach((image, index) => {
        data.append(`gallery_images[]`, image);
      });
    }
    
    // Add gallery captions and subcaptions for new images
    const newImagePreviews = galleryPreviews.filter(item => !item.isExisting);
    if (newImagePreviews.length > 0) {
      console.log('Adding new gallery captions:', newImagePreviews.length);
      newImagePreviews.forEach((preview, index) => {
        data.append(`gallery_captions[${index}]`, preview.caption || '');
        data.append(`gallery_subcaptions[${index}]`, preview.subcaption || '');
      });
    }
    
    // Add existing gallery updates
    const existingPreviews = galleryPreviews.filter(item => item.isExisting);
    if (existingPreviews.length > 0) {
      console.log('Updating existing gallery captions:', existingPreviews.length);
      existingPreviews.forEach((preview, index) => {
        const originalIndex = galleryPreviews.findIndex(item => 
          item.isExisting && item.path === preview.path
        );
        
        if (originalIndex !== -1) {
          data.append(`update_gallery_captions[${originalIndex}]`, preview.caption || '');
          data.append(`update_gallery_subcaptions[${originalIndex}]`, preview.subcaption || '');
        }
      });
    }
    
    // Add removed gallery indices
    if (removedGalleryIndices.length > 0) {
      console.log('Removing gallery images:', removedGalleryIndices);
      data.append('gallery_remove', removedGalleryIndices.join(','));
    }
    
    // For PUT requests in Laravel, we need to add a _method field
    if (isEditing) {
      data.append('_method', 'PUT');
      console.log('Adding _method: PUT for Laravel');
    }
    
    return data;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const formDataToSubmit = prepareFormData();
      onSave(formDataToSubmit);
    }
  };

  if (!show) return null;
  
  // Award categories
  const categories = [
    { id: 'leadership', name: 'Leadership' },
    { id: 'innovation', name: 'Innovation' },
    { id: 'service', name: 'Community Service' },
    { id: 'environment', name: 'Environmental' },
    { id: 'education', name: 'Academic' },
    { id: 'arts', name: 'Arts & Culture' },
    { id: 'sports', name: 'Sports' },
    { id: 'technology', name: 'Technology' }
  ];
  
  return (
    <div className="sk-award-form-overlay">
      <div className="sk-award-form-container">
        <div className="sk-award-form-header">
          <div className="sk-award-form-title">
            <FaTrophy className="sk-award-form-icon" />
            <h2>{isEditing ? 'Edit Award' : 'Add New Award'}</h2>
          </div>
          <button 
            className="sk-award-form-close"
            onClick={onHide}
            type="button"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="sk-award-form">
          <div className="sk-award-form-body">
            <div className="sk-award-form-row">
              <div className="sk-award-form-group">
                <label className="sk-award-form-label">Title*</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`sk-award-form-input ${errors.title ? 'sk-award-form-input-error' : ''}`}
                  placeholder="Enter award title"
                />
                {errors.title && <div className="sk-award-form-error">{errors.title}</div>}
              </div>
              
              <div className="sk-award-form-group">
                <label className="sk-award-form-label">Recipients*</label>
                <input
                  type="text"
                  name="recipients"
                  value={formData.recipients}
                  onChange={handleChange}
                  className={`sk-award-form-input ${errors.recipients ? 'sk-award-form-input-error' : ''}`}
                  placeholder="e.g. SK Volunteers, John Doe"
                />
                {errors.recipients && <div className="sk-award-form-error">{errors.recipients}</div>}
              </div>
            </div>
            
            <div className="sk-award-form-row">
              <div className="sk-award-form-group">
                <label className="sk-award-form-label">Category*</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`sk-award-form-select ${errors.category ? 'sk-award-form-input-error' : ''}`}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {errors.category && <div className="sk-award-form-error">{errors.category}</div>}
              </div>
              
              <div className="sk-award-form-group">
                <label className="sk-award-form-label">Station*</label>
                <select
                  name="sk_station"
                  value={formData.sk_station}
                  onChange={handleChange}
                  className={`sk-award-form-select ${errors.sk_station ? 'sk-award-form-input-error' : ''}`}
                  disabled={!canChangeStation}
                >
                  <option value="Federation">Federation</option>
                  <option value="Dela Paz">Dela Paz</option>
                  <option value="Manggahan">Manggahan</option>
                  <option value="Maybunga">Maybunga</option>
                  <option value="Pinagbuhatan">Pinagbuhatan</option>
                  <option value="Rosario">Rosario</option>
                  <option value="San Miguel">San Miguel</option>
                  <option value="Santa Lucia">Santa Lucia</option>
                  <option value="Santolan">Santolan</option>
                </select>
                {errors.sk_station && <div className="sk-award-form-error">{errors.sk_station}</div>}
                
                {!canChangeStation && (
                  <div className="sk-award-form-help">
                    <FaInfoCircle />
                    <span>Only Federasyon members can change the station</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="sk-award-form-row">
              <div className="sk-award-form-group">
                <label className="sk-award-form-label">Date Awarded*</label>
                <input
                  type="date"
                  name="date_awarded"
                  value={formData.date_awarded}
                  onChange={handleChange}
                  className={`sk-award-form-input ${errors.date_awarded ? 'sk-award-form-input-error' : ''}`}
                />
                {errors.date_awarded && <div className="sk-award-form-error">{errors.date_awarded}</div>}
              </div>
              
              <div className="sk-award-form-group">
                <label className="sk-award-form-label">Year*</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`sk-award-form-input ${errors.year ? 'sk-award-form-input-error' : ''}`}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                {errors.year && <div className="sk-award-form-error">{errors.year}</div>}
              </div>
            </div>
            
            <div className="sk-award-form-group">
              <label className="sk-award-form-label">Description*</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`sk-award-form-textarea ${errors.description ? 'sk-award-form-input-error' : ''}`}
                placeholder="Enter award description"
                rows={4}
              />
              {errors.description && <div className="sk-award-form-error">{errors.description}</div>}
            </div>
            
            <div className="sk-award-form-group">
              <label className="sk-award-form-label">Main Image*</label>
              <div className="sk-award-form-file-container">
                <div className="sk-award-form-file-actions">
                  <label htmlFor="main-image-input" className="sk-award-form-file-upload">
                    <FaPlus /> {isEditing ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className={`sk-award-form-file ${errors.main_image ? 'sk-award-form-input-error' : ''}`}
                    id="main-image-input"
                    style={{ display: 'none' }}
                  />
                  
                  {(mainImagePreview || mainImage) && (
                    <button
                      type="button" 
                      className="sk-award-form-file-remove"
                      onClick={handleRemoveMainImage}
                    >
                      <FaTrash /> Remove Image
                    </button>
                  )}
                </div>
                
                {mainImagePreview && !removeMainImage && (
                  <div className="sk-award-form-image-preview">
                    <img 
                      src={mainImagePreview} 
                      alt="Main image preview" 
                      className="sk-award-form-preview-img"
                    />
                  </div>
                )}
                
                {removeMainImage && isEditing && (
                  <div className="sk-award-form-removed-message">
                    <FaExclamationCircle /> Main image will be removed. Upload a new one or cancel to keep the current image.
                  </div>
                )}
              </div>
              {errors.main_image && <div className="sk-award-form-error">{errors.main_image}</div>}
            </div>
            
            <div className="sk-award-form-gallery-section">
              <div className="sk-award-form-gallery-header">
                <label className="sk-award-form-label">Gallery Images</label>
                <div className="sk-award-form-file-container">
                  <label htmlFor="gallery-image-input" className="sk-award-form-gallery-add-btn">
                    <FaPlus /> Add Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryImageAdd}
                    className="sk-award-form-file"
                    id="gallery-image-input"
                    multiple
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              
              {galleryPreviews.length > 0 ? (
                <div className="sk-award-form-gallery-grid">
                  {galleryPreviews.map((preview, index) => {
                    // Skip removed images
                    if (removedGalleryIndices.includes(index)) return null;
                    
                    return (
                      <div className="sk-award-form-gallery-item" key={index}>
                        <div className="sk-award-form-gallery-preview">
                          <img 
                            src={preview.preview} 
                            alt={`Gallery ${index + 1}`} 
                            className="sk-award-form-gallery-img"
                          />
                          <button
                            type="button"
                            className="sk-award-form-gallery-remove"
                            onClick={() => handleGalleryImageRemove(index)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <div className="sk-award-form-gallery-inputs">
                          <input
                            type="text"
                            placeholder="Caption"
                            value={preview.caption}
                            onChange={(e) => handleGalleryCaptionChange(index, 'caption', e.target.value)}
                            className="sk-award-form-gallery-caption"
                          />
                          <textarea
                            placeholder="Subcaption (optional)"
                            value={preview.subcaption}
                            onChange={(e) => handleGalleryCaptionChange(index, 'subcaption', e.target.value)}
                            className="sk-award-form-gallery-subcaption"
                            rows={2}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sk-award-form-gallery-empty">
                  <p>No gallery images added yet. Click "Add Image" to upload.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="sk-award-form-footer">
            <button 
              type="button" 
              className="sk-award-form-btn sk-award-form-btn-cancel"
              onClick={onHide}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="sk-award-form-btn sk-award-form-btn-save"
            >
              {isEditing ? 'Update Award' : 'Save Award'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AwardForm;