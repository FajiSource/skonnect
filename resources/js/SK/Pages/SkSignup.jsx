import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../css/SkStyles.css'; // Using our centralized CSS
import bgImage from '../images/background.png';
import skLogo from '../images/profile.png';
import { AuthContext } from '../../Contexts/AuthContext';
import SkLayout from '../Components/SkLayout';

const SkSignup = () => {
  const { skUser, skRegister, pendingVerification } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (skUser) {
      navigate('/sk-welcome');
    }
    
    // Redirect to verification page if there's a pending verification
    if (pendingVerification.waiting && pendingVerification.type === 'sk') {
      navigate('/sk-verify-email', { state: { email: pendingVerification.email } });
    }
  }, [skUser, pendingVerification, navigate]);
  
  // Initialize form data with fields matching the skaccounts table schema
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male',
    birthdate: '', // Will be saved as dob in backend
    age: '',
    email: '',
    phone_number: '',
    address: '',
    sk_station: 'Dela Paz', // Renamed from baranggay to match migration
    sk_role: 'member', // Default role
    password: '',
    password_confirmation: '', // Required for Laravel validation
    valid_id: null
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Barangay options from the migration
  const barangayOptions = [
    'Dela Paz',
    'Manggahan',
    'Maybunga',
    'Pinagbuhatan',
    'Rosario',
    'San Miguel',
    'Santa Lucia',
    'Santolan'
  ];

  // SK role options from the migration
  const roleOptions = [
    'Federasyon', 
    'Chairman', 
    'Kagawad'
  ];

  // Calculate age when birthdate changes
  useEffect(() => {
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate);
      const currentAge = new Date().getFullYear() - birthDate.getFullYear();
      setFormData(prev => ({ ...prev, age: currentAge }));
    }
  }, [formData.birthdate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Create form data for file upload
      const submitData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'valid_id' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== 'valid_id') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Ensure password_confirmation is explicitly appended
      submitData.append('password_confirmation', formData.password_confirmation);
      
      // Add verification_status (as per migration default)
      submitData.append('verification_status', 'not_verified');
      
      // Use skRegister function from AuthContext
      const { success, errors, needsVerification } = await skRegister(submitData);
      
      if (success) {
        if (needsVerification) {
          // Navigate to verification page
          navigate('/sk-verify-email', { state: { email: formData.email } });
        } else {
          // Navigate to login on successful registration
          navigate('/sk-login');
        }
      } else {
        // Show error messages
        if (errors) {
          const errorMessages = [];
          for (const field in errors) {
            if (Array.isArray(errors[field])) {
              errorMessages.push(errors[field][0]);
            } else {
              errorMessages.push(`${field}: ${errors[field]}`);
            }
          }
          setError(errorMessages.join(', '));
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again later.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If already logged in, don't render the form (will redirect via useEffect)
  if (skUser) {
    return <div className="sk-cmn-sklcss-loading">Redirecting...</div>;
  }

  return (
    <div className="sk-cmn-sklcss-container">      
      <div className="sk-cmn-sklcss-content">
        <img src={bgImage} alt="Background" className="sk-cmn-sklcss-background" />
        
        <div className="sk-cmn-sklcss-card sk-cmn-sklcss-card-wide">
          <div className="sk-cmn-sklcss-card-header">
            <img src={skLogo} alt="SK Logo" className="sk-cmn-sklcss-profile-icon" />
            <h2>Sangguniang Kabataan Registration</h2>
          </div>
          
          <div className="sk-cmn-sklcss-card-body">
            <form className="sk-cmn-sklcss-form" onSubmit={handleSubmit}>
              {/* Name Fields */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    className="sk-cmn-sklcss-input"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="middle_name"
                    placeholder="Middle Name"
                    className="sk-cmn-sklcss-input"
                    value={formData.middle_name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    className="sk-cmn-sklcss-input"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Address, Gender */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    className="sk-cmn-sklcss-input"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <select
                    name="gender"
                    className="sk-cmn-sklcss-select"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <select
                    name="sk_role"
                    className="sk-cmn-sklcss-select"
                    value={formData.sk_role}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Birthdate, Phone */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="date"
                    name="birthdate"
                    className="sk-cmn-sklcss-input"
                    value={formData.birthdate}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="Phone Number"
                    className="sk-cmn-sklcss-input"
                    value={formData.phone_number}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    className="sk-cmn-sklcss-input"
                    value={formData.age}
                    readOnly
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Email, Password, Confirm Password */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="sk-cmn-sklcss-input"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="sk-cmn-sklcss-input"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="password"
                    name="password_confirmation"
                    placeholder="Confirm Password"
                    className="sk-cmn-sklcss-input"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Barangay and Valid ID */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <select
                    name="sk_station"
                    className="sk-cmn-sklcss-select"
                    value={formData.sk_station}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    {barangayOptions.map(barangay => (
                      <option key={barangay} value={barangay}>{barangay}</option>
                    ))}
                  </select>
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="file"
                    name="valid_id"
                    className="sk-cmn-sklcss-input sk-cmn-sklcss-file-input"
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <small>Upload a valid ID (e.g., Student ID, National ID)</small>
                </div>
              </div>

              {/* Error and Submit Button */}
              {error && <p className="sk-cmn-sklcss-error">{error}</p>}
              
              <button 
                type="submit" 
                className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary sk-cmn-sklcss-button-full"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="sk-cmn-sklcss-text-center sk-cmn-sklcss-mt-3">
              Have an account already?
              <NavLink to="/sk-login" className="sk-cmn-sklcss-link"> Login here</NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkSignup;