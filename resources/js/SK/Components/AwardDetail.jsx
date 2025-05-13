import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaUsers, FaTrophy, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../css/AwardDetail.css';

const AwardDetail = ({ award, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!award) return null;
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get category name
  const getCategoryName = (category) => {
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
  
  // Prepare gallery images
  const galleryImages = award.gallery && Array.isArray(award.gallery) ? 
    [{ path: award.main_image, caption: award.title, isMain: true }, ...award.gallery] :
    [{ path: award.main_image, caption: award.title, isMain: true }];
  
  // Handle navigation
  const goToPrevious = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  // Select specific image
  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };
  
  const currentImage = galleryImages[currentImageIndex];
  
  return (
    <div className="sk-award-detail-overlay" onClick={onClose}>
      <div className="sk-award-detail-container" onClick={e => e.stopPropagation()}>
        <button className="sk-award-detail-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="sk-award-detail-header">
          <div className="sk-award-detail-badge">{award.year}</div>
          <h2 className="sk-award-detail-title">{award.title}</h2>
          <div className="sk-award-detail-category">
            {getCategoryName(award.category)}
          </div>
        </div>
        
        <div className="sk-award-detail-content">
          {/* Left side - Image gallery */}
          <div className="sk-award-detail-left">
            <div className="sk-award-detail-main-image">
              {galleryImages.length > 1 && (
                <button className="sk-award-detail-nav sk-award-detail-nav-prev" onClick={goToPrevious}>
                  <FaChevronLeft />
                </button>
              )}
              
              <img 
                src={`/storage/${currentImage.path}`} 
                alt={currentImage.caption || award.title} 
                className="sk-award-detail-main-img"
              />
              
              {galleryImages.length > 1 && (
                <button className="sk-award-detail-nav sk-award-detail-nav-next" onClick={goToNext}>
                  <FaChevronRight />
                </button>
              )}
              
              {/* Caption overlay on image */}
              {(currentImage.caption || currentImage.subcaption) && !currentImage.isMain && (
                <div className="sk-award-detail-caption">
                  {currentImage.caption && <h4>{currentImage.caption}</h4>}
                  {currentImage.subcaption && <p>{currentImage.subcaption}</p>}
                </div>
              )}
            </div>
            
            {galleryImages.length > 1 && (
              <div className="sk-award-detail-thumbnails">
                {galleryImages.map((img, idx) => (
                  <div 
                    className={`sk-award-detail-thumbnail ${idx === currentImageIndex ? 'active' : ''}`} 
                    key={idx}
                    onClick={() => selectImage(idx)}
                    title={img.caption || ''}
                  >
                    <img 
                      src={`/storage/${img.path}`} 
                      alt={img.caption || `Gallery ${idx + 1}`} 
                      className="sk-award-detail-thumb-img"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right side - Award details */}
          <div className="sk-award-detail-right">
            <div className="sk-award-detail-info">
              <div className="sk-award-detail-recipients">
                <h3 className="sk-award-detail-subheading">
                  <FaUsers className="sk-award-detail-icon" /> Recipients
                </h3>
                <p className="sk-award-detail-text">{award.recipients}</p>
              </div>
              
              <div className="sk-award-detail-date">
                <h3 className="sk-award-detail-subheading">
                  <FaCalendarAlt className="sk-award-detail-icon" /> Date Awarded
                </h3>
                <p className="sk-award-detail-text">{formatDate(award.date_awarded)}</p>
              </div>
              
              <div className="sk-award-detail-year">
                <h3 className="sk-award-detail-subheading">
                  <FaTrophy className="sk-award-detail-icon" /> Year
                </h3>
                <p className="sk-award-detail-text">{award.year}</p>
              </div>
            </div>
            
            <div className="sk-award-detail-description">
              <h3 className="sk-award-detail-subheading">
                <FaStar className="sk-award-detail-icon" /> About this Award
              </h3>
              <p className="sk-award-detail-text">{award.description}</p>
            </div>
            
            <div className="sk-award-detail-meta">
              <div className="sk-award-detail-meta-item">
                <strong>Station:</strong> {award.sk_station}
              </div>
              <div className="sk-award-detail-meta-item">
                <strong>Status:</strong> {award.status.charAt(0).toUpperCase() + award.status.slice(1)}
              </div>
              <div className="sk-award-detail-meta-item">
                <strong>Created By:</strong> {award.creator ? 
                  `${award.creator.first_name} ${award.creator.last_name} ${award.creator.sk_role === 'Federasyon' ? 
                    '(Federasyon)' : 
                    `(${award.creator.sk_role} - ${award.creator.sk_station})`}` : 
                  'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwardDetail;