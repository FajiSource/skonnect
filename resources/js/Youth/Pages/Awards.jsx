import React, { useState, useEffect } from "react";
import axios from "axios";
import '../css/Awards.css';
import YouthLayout from '../Components/YouthLayout';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTrophy, FaStar, FaImages, FaSearch, FaFilter, FaTimes, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const Awards = () => {
  // State for awards filtering and display
  const [isLoading, setIsLoading] = useState(true);
  const [allAwards, setAllAwards] = useState([]);
  const [filteredAwards, setFilteredAwards] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAward, setSelectedAward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [years, setYears] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Define categories mapping (for display purposes)
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

  // Fetch awards from API
  useEffect(() => {
    fetchAwards();
  }, []);
  
  const fetchAwards = async () => {
    setIsLoading(true);
    try {
      // Fetch awards from the new API endpoint
      const response = await axios.get('/api/public/awards');
      
      if (response.data.success) {
        const awards = response.data.awards;
        setAllAwards(awards);
        setFilteredAwards(awards);
        
        // Extract unique years for filtering
        const uniqueYears = [...new Set(awards.map(award => award.year))].sort((a, b) => b - a);
        setYears(uniqueYears);
      } else {
        setError('Failed to fetch awards data');
      }
    } catch (error) {
      console.error('Error fetching awards:', error);
      setError('An error occurred while fetching awards data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter awards based on selected year and category
  useEffect(() => {
    let filtered = [...allAwards];
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(award => award.year === parseInt(selectedYear));
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(award => award.category === selectedCategory);
    }
    
    setFilteredAwards(filtered);
  }, [selectedYear, selectedCategory, allAwards]);

  // Handle year selection
  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Open award detail modal
  const openAwardModal = (award) => {
    setSelectedAward(award);
    setIsModalOpen(true);
    setCurrentImageIndex(0); // Reset to first image (main image)
    document.body.classList.add('youth-awd-modal-open');
  };

  // Close award detail modal
  const closeAwardModal = () => {
    setIsModalOpen(false);
    document.body.classList.remove('youth-awd-modal-open');
  };

  // Get category name from category ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Other';
  };
  
  // Handle gallery navigation
  const goToPrevImage = (e) => {
    e.stopPropagation();
    if (!selectedAward) return;
    
    const galleryImages = selectedAward.gallery && Array.isArray(selectedAward.gallery) ? 
      [{ path: selectedAward.main_image, caption: selectedAward.title, isMain: true }, ...selectedAward.gallery] :
      [{ path: selectedAward.main_image, caption: selectedAward.title, isMain: true }];
    
    setCurrentImageIndex(prev => 
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };
  
  const goToNextImage = (e) => {
    e.stopPropagation();
    if (!selectedAward) return;
    
    const galleryImages = selectedAward.gallery && Array.isArray(selectedAward.gallery) ? 
      [{ path: selectedAward.main_image, caption: selectedAward.title, isMain: true }, ...selectedAward.gallery] :
      [{ path: selectedAward.main_image, caption: selectedAward.title, isMain: true }];
    
    setCurrentImageIndex(prev => 
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };
  
  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <YouthLayout>
      <section className="youth-awd-banner">
        <div className="youth-awd-banner-content">
          <h1 className="youth-awd-banner-title">Awards & Recognition</h1>
          <p className="youth-awd-banner-subtitle">Celebrating excellence and achievements in youth leadership</p>
        </div>
      </section>
      
      <div className="youth-awd-content-wrapper">
        <div className="youth-awd-excellence-header">
          <div className="youth-awd-excellence-title-wrapper">
            <div className="youth-awd-excellence-line"></div>
            <h2 className="youth-awd-excellence-title">RECOGNIZING EXCELLENCE</h2>
            <div className="youth-awd-excellence-line"></div>
          </div>
          <p className="youth-awd-excellence-description">
            The Sangguniang Kabataan Federation of Pasig City honors outstanding youth leaders, organizations, and initiatives through 
            these prestigious awards. These recognitions celebrate the exceptional contributions of young Pasigueños to community 
            development and nation-building.
          </p>
        </div>
        
        {/* Compact Filter Section */}
        <div className="youth-awd-compact-filters">
          <div className="youth-awd-filters-row">
            <div className="youth-awd-filter-group">
              <label className="youth-awd-filter-label">Year:</label>
              <div className="youth-awd-filter-buttons">
                <button 
                  className={`youth-awd-filter-chip ${selectedYear === 'all' ? 'active' : ''}`} 
                  onClick={() => handleYearChange('all')}
                >
                  All
                </button>
                {years.map(year => (
                  <button 
                    key={year} 
                    className={`youth-awd-filter-chip ${selectedYear === year.toString() ? 'active' : ''}`}
                    onClick={() => handleYearChange(year.toString())}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="youth-awd-filter-divider"></div>
            
            <div className="youth-awd-filter-group">
              <label className="youth-awd-filter-label">Category:</label>
              <div className="youth-awd-filter-buttons">
                <button 
                  className={`youth-awd-filter-chip ${selectedCategory === 'all' ? 'active' : ''}`} 
                  onClick={() => handleCategoryChange('all')}
                >
                  All
                </button>
                {categories.map(category => (
                  <button 
                    key={category.id} 
                    className={`youth-awd-filter-chip ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="youth-awd-loading">
            <div className="youth-awd-spinner"></div>
            <p className="youth-awd-loading-text">Loading awards...</p>
          </div>
        ) : error ? (
          <div className="youth-awd-error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p className="youth-awd-error-text">{error}</p>
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className="youth-awd-no-results">
            <div className="youth-awd-no-results-icon">🏆</div>
            <h3 className="youth-awd-no-results-title">No awards found</h3>
            <p className="youth-awd-no-results-text">Try changing your filter criteria or check back later for updated awards.</p>
          </div>
        ) : (
          <div className="youth-awd-awards-grid">
            {filteredAwards.map((award) => (
              <div className="youth-awd-award-card" key={award.id}>
                <div className="youth-awd-award-image-container">
                  <img 
                    src={`/storage/${award.main_image}`} 
                    alt={award.title} 
                    className="youth-awd-award-image" 
                  />
                  <div className="youth-awd-award-year-badge">{award.year}</div>
                  <div className="youth-awd-award-overlay">
                    <button 
                      className="youth-awd-award-view-button"
                      onClick={() => openAwardModal(award)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="youth-awd-award-content">
                  <div className="youth-awd-award-category">
                    {getCategoryName(award.category)}
                  </div>
                  <h3 className="youth-awd-award-title">{award.title}</h3>
                  <p className="youth-awd-award-description">{award.description.substring(0, 120)}...</p>
                  <div className="youth-awd-award-details">
                    <div className="youth-awd-award-recipients">
                      <FaUsers className="youth-awd-award-icon" /> <strong>Recipients:</strong> {award.recipients}
                    </div>
                    <div className="youth-awd-award-date">
                      <FaCalendarAlt className="youth-awd-award-icon" /> <strong>Date Awarded:</strong> {formatDate(award.date_awarded)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="youth-awd-nominate-section">
          <div className="youth-awd-nominate-content">
            <FaTrophy className="youth-awd-nominate-icon" />
            <h2 className="youth-awd-nominate-title">Know Someone Deserving?</h2>
            <p className="youth-awd-nominate-text">
              If you know a youth leader or organization that deserves recognition, 
              consider nominating them for our upcoming awards.
            </p>
            <a href="#" className="youth-awd-nominate-button">
              Nominate Today <FaChevronRight className="youth-awd-btn-icon" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Award Detail Modal - Improved with image navigation */}
      {isModalOpen && selectedAward && (
        <div className="youth-awd-modal-overlay" onClick={closeAwardModal}>
          <div className="youth-awd-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="youth-awd-modal-close" onClick={closeAwardModal}>×</button>
            
            <div className="youth-awd-modal-header">
              <div className="youth-awd-modal-badge">{selectedAward.year}</div>
              <h2 className="youth-awd-modal-title">{selectedAward.title}</h2>
              <div className="youth-awd-modal-category">
                {getCategoryName(selectedAward.category)}
              </div>
            </div>
            
            <div className="youth-awd-modal-content-wrapper">
              {/* Left side - Image Gallery */}
              <div className="youth-awd-modal-left">
                <div className="youth-awd-modal-main-image">
                  {(() => {
                    const galleryImages = selectedAward.gallery && Array.isArray(selectedAward.gallery) ? 
                      [{ path: selectedAward.main_image, caption: selectedAward.title, isMain: true }, ...selectedAward.gallery] : 
                      [{ path: selectedAward.main_image, caption: selectedAward.title, isMain: true }];
                    
                    const currentImage = galleryImages[currentImageIndex];
                    
                    return (
                      <>
                        {galleryImages.length > 1 && (
                          <button 
                            className="youth-awd-modal-nav youth-awd-modal-nav-prev" 
                            onClick={goToPrevImage}
                          >
                            <FaChevronLeft />
                          </button>
                        )}
                        
                        <img 
                          src={`/storage/${currentImage.path}`} 
                          alt={currentImage.caption || selectedAward.title} 
                          className="youth-awd-modal-main-img"
                        />
                        
                        {galleryImages.length > 1 && (
                          <button 
                            className="youth-awd-modal-nav youth-awd-modal-nav-next" 
                            onClick={goToNextImage}
                          >
                            <FaChevronRight />
                          </button>
                        )}
                        
                        {/* Caption overlay - only show for non-main images */}
                        {(currentImage.caption || currentImage.subcaption) && !currentImage.isMain && (
                          <div className="youth-awd-modal-caption-overlay">
                            {currentImage.caption && (
                              <h4 className="youth-awd-modal-caption-title">
                                {currentImage.caption}
                              </h4>
                            )}
                            {currentImage.subcaption && (
                              <p className="youth-awd-modal-caption-text">
                                {currentImage.subcaption}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {/* Thumbnails for gallery navigation */}
                {selectedAward.gallery && Array.isArray(selectedAward.gallery) && selectedAward.gallery.length > 0 && (
                  <div className="youth-awd-modal-thumbnails">
                    {/* Main image thumbnail */}
                    <div 
                      className={`youth-awd-modal-thumbnail ${currentImageIndex === 0 ? 'active' : ''}`}
                      onClick={() => selectImage(0)}
                    >
                      <img 
                        src={`/storage/${selectedAward.main_image}`} 
                        alt={selectedAward.title} 
                        className="youth-awd-modal-thumb-img"
                      />
                    </div>
                    
                    {/* Gallery thumbnails */}
                    {selectedAward.gallery.map((img, idx) => (
                      <div 
                        className={`youth-awd-modal-thumbnail ${idx + 1 === currentImageIndex ? 'active' : ''}`} 
                        key={idx}
                        onClick={() => selectImage(idx + 1)}
                      >
                        <img 
                          src={`/storage/${img.path}`} 
                          alt={img.caption || `Gallery ${idx + 1}`} 
                          className="youth-awd-modal-thumb-img"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right side - Award Details */}
              <div className="youth-awd-modal-right">
                <div className="youth-awd-modal-info">
                  <div className="youth-awd-modal-recipients">
                    <h3 className="youth-awd-modal-subheading">
                      <FaUsers className="youth-awd-modal-icon" /> Recipients
                    </h3>
                    <p className="youth-awd-modal-text">{selectedAward.recipients}</p>
                  </div>
                  <div className="youth-awd-modal-date">
                    <h3 className="youth-awd-modal-subheading">
                      <FaCalendarAlt className="youth-awd-modal-icon" /> Date Awarded
                    </h3>
                    <p className="youth-awd-modal-text">{formatDate(selectedAward.date_awarded)}</p>
                  </div>
                </div>
                
                <div className="youth-awd-modal-description">
                  <h3 className="youth-awd-modal-subheading">
                    <FaStar className="youth-awd-modal-icon" /> About this Award
                  </h3>
                  <p className="youth-awd-modal-text">{selectedAward.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </YouthLayout>
  );
};

export default Awards;