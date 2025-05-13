import React, { useState, useEffect } from 'react';
import { FaUserTie, FaTimes, FaInfoCircle, FaNetworkWired } from 'react-icons/fa';
import axios from 'axios';
import '../css/DirectoryForm.css';

const DirectoryForm = ({ show, onHide, onSave, initialData, skUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    location: '',
    category: 'executive',
    sk_station: skUser.sk_station,
    position_order: 999,
    reports_to: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Add state for active tab
  const [activeTab, setActiveTab] = useState('basic');
  
  // State for available positions
  const [availablePositions, setAvailablePositions] = useState([]);
  
  // State for supervisors
  const [supervisors, setSupervisors] = useState([]);
  
  // Determine if user can change the sk_station based on role
  const canChangeStation = skUser.sk_role === 'Federasyon';
  
  // Fill form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        role: initialData.role || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        location: initialData.location || '',
        category: initialData.category || 'executive',
        sk_station: initialData.sk_station || skUser.sk_station,
        position_order: initialData.position_order || 999,
        reports_to: initialData.reports_to || ''
      });
    } else {
      // Reset form when adding new
      setFormData({
        name: '',
        role: '',
        email: '',
        phone: '',
        location: '',
        category: 'executive',
        sk_station: skUser.sk_station,
        position_order: 999,
        reports_to: ''
      });
    }
    
    setErrors({});
    
    // Load potential supervisors
    loadSupervisors();
    
    // Load available positions for the station
    loadAvailablePositions();
  }, [initialData, show, skUser.sk_station]);
  
  // Load supervisors based on station
  const loadSupervisors = async () => {
    try {
      const response = await axios.get('/api/directories');
      
      // Filter to relevant station or Federasyon
      const relevantSupervisors = response.data.filter(dir => 
        (dir.sk_station === formData.sk_station || dir.sk_station === 'Federation') && 
        dir.status === 'published' &&
        (!initialData || dir.id !== initialData.id) // Can't report to themselves
      );
      
      setSupervisors(relevantSupervisors);
    } catch (error) {
      console.error('Failed to load supervisors:', error);
    }
  };
  
  // Load available positions for the selected station
  const loadAvailablePositions = async () => {
    try {
      const response = await axios.get('/api/directories');
      
      // Filter by station and status
      const stationEntries = response.data.filter(dir => 
        dir.sk_station === formData.sk_station && 
        dir.status === 'published'
      );
      
      // Get existing position orders
      const existingPositions = new Set(stationEntries.map(dir => dir.position_order));
      
      // Generate list of available positions (1-20)
      const positions = [];
      for (let i = 1; i <= 20; i++) {
        // If editing, always include the current position
        if (initialData && initialData.position_order === i) {
          positions.push(i);
        } 
        // Include positions not yet taken
        else if (!existingPositions.has(i)) {
          positions.push(i);
        }
      }
      
      // Always include high numbers for lower-level positions
      for (let i = 21; i <= 25; i++) {
        positions.push(i);
      }
      
      setAvailablePositions(positions);
    } catch (error) {
      console.error('Failed to load available positions:', error);
      // Fallback to basic positions
      setAvailablePositions([1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 99, 999]);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If station changes, reload supervisors and available positions
    if (name === 'sk_station') {
      setTimeout(() => {
        loadSupervisors();
        loadAvailablePositions();
      }, 100);
    }
    
    // Clear validation error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle tab switching
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.role.trim()) {
      newErrors.role = 'Role/Position is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.sk_station) {
      newErrors.sk_station = 'Station is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (!show) return null;
  
  return (
    <div className="sk-dir-form-overlay">
      <div className="sk-dir-form-container">
        <div className="sk-dir-form-header">
          <div className="sk-dir-form-title">
            <FaUserTie className="sk-dir-form-icon" />
            <h2>{initialData ? 'Edit Directory Entry' : 'Add New Directory Entry'}</h2>
          </div>
          <button 
            className="sk-dir-form-close"
            onClick={onHide}
            type="button"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="sk-dir-form">
          <div className="sk-dir-form-body">
            <div className="sk-dir-form-tabs">
              <div className="sk-dir-form-tab-header">
                <button 
                  type="button" 
                  className={`sk-dir-form-tab ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => handleTabSwitch('basic')}
                >
                  Basic Information
                </button>
                <button 
                  type="button" 
                  className={`sk-dir-form-tab ${activeTab === 'org' ? 'active' : ''}`}
                  onClick={() => handleTabSwitch('org')}
                >
                  <FaNetworkWired /> Organization Chart
                </button>
              </div>
              
              <div className="sk-dir-form-tab-content">
                {/* Basic Information Tab */}
                <div className={`sk-dir-form-tab-pane ${activeTab === 'basic' ? 'active' : ''}`}>
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.name ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="Enter full name"
                      />
                      {errors.name && <div className="sk-dir-form-error">{errors.name}</div>}
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Role/Position*</label>
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.role ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="e.g. SK Chairman, Committee Head"
                      />
                      {errors.role && <div className="sk-dir-form-error">{errors.role}</div>}
                    </div>
                  </div>
                  
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.email ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="Enter email address"
                      />
                      {errors.email && <div className="sk-dir-form-error">{errors.email}</div>}
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="sk-dir-form-input"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="sk-dir-form-group">
                    <label className="sk-dir-form-label">Office Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="sk-dir-form-input"
                      placeholder="e.g. 3rd floor, City Hall"
                    />
                  </div>
                  
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Category*</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`sk-dir-form-select ${errors.category ? 'sk-dir-form-input-error' : ''}`}
                      >
                        <option value="executive">Executive Committee</option>
                        <option value="committee">Committees</option>
                        <option value="barangay">Barangay SK Chairpersons</option>
                        <option value="partner">Partner Agencies</option>
                      </select>
                      {errors.category && <div className="sk-dir-form-error">{errors.category}</div>}
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Station*</label>
                      <select
                        name="sk_station"
                        value={formData.sk_station}
                        onChange={handleChange}
                        className={`sk-dir-form-select ${errors.sk_station ? 'sk-dir-form-input-error' : ''}`}
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
                      {errors.sk_station && <div className="sk-dir-form-error">{errors.sk_station}</div>}
                      
                      {!canChangeStation && (
                        <div className="sk-dir-form-help">
                          <FaInfoCircle />
                          <span>Only Federasyon members can change the station</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Organization Chart Tab */}
                <div className={`sk-dir-form-tab-pane ${activeTab === 'org' ? 'active' : ''}`}>
                  <div className="sk-dir-form-organization-info">
                    <h3 className="sk-dir-form-section-title">
                      Organization Chart Information
                    </h3>
                    <p className="sk-dir-form-section-desc">
                      Set the position and reporting relationships for the organization chart.
                    </p>
                  </div>
                  
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Position Order</label>
                      <select
                        name="position_order"
                        value={formData.position_order}
                        onChange={handleChange}
                        className="sk-dir-form-select"
                      >
                        {availablePositions.map(pos => (
                          <option key={pos} value={pos}>
                            {pos === 1 ? '1 - Top Level (Chairman)' :
                             pos <= 5 ? `${pos} - Executive Level` :
                             pos <= 10 ? `${pos} - Management Level` :
                             pos <= 20 ? `${pos} - Officer Level` :
                             `${pos} - Staff Level`}
                          </option>
                        ))}
                        <option value="999">999 - No specific position</option>
                      </select>
                      <div className="sk-dir-form-help">
                        <FaInfoCircle />
                        <span>Lower numbers appear higher in org chart. Position 1 is typically for the Chairman.</span>
                      </div>
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label className="sk-dir-form-label">Reports To</label>
                      <select
                        name="reports_to"
                        value={formData.reports_to}
                        onChange={handleChange}
                        className="sk-dir-form-select"
                      >
                        <option value="">No Direct Supervisor</option>
                        {supervisors.map(supervisor => (
                          <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.name} ({supervisor.role})
                            {supervisor.sk_station !== formData.sk_station && ` - ${supervisor.sk_station}`}
                          </option>
                        ))}
                      </select>
                      <div className="sk-dir-form-help">
                        <FaInfoCircle />
                        <span>Define who this position reports to in the organization chart</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sk-dir-form-footer">
            <button 
              type="button" 
              className="sk-dir-form-btn sk-dir-form-btn-cancel"
              onClick={onHide}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="sk-dir-form-btn sk-dir-form-btn-save"
            >
              {initialData ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectoryForm;