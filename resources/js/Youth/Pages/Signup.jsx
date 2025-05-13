import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import background from '../../assets/home-banner.png';
import '../css/AuthStyles.css'; 
import { FaUser, FaIdCard, FaMapMarkerAlt, FaEnvelope, FaExclamationTriangle, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import AuthLayout from '../Components/AuthLayout';
import { AuthContext } from '../../Contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { user, register, pendingVerification } = useContext(AuthContext);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
    
    // Redirect to verification page if there's a pending verification
    if (pendingVerification.waiting && pendingVerification.type === 'youth') {
      navigate('/verify-email', { state: { email: pendingVerification.email } });
    }
  }, [user, pendingVerification, navigate]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    dob: '',
    age: '',
    email: '',
    address: '',
    phone_number: '',
    baranggay: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    dob: '',
    age: '',
    email: '',
    address: '',
    phone_number: '',
    baranggay: '',
    password: '',
    confirmPassword: '',
    agreeTerms: ''
  });
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasLower: false,
    hasUpper: false,
    hasSpecial: false,
    hasNumber: false
  });
  
  // Track if password field has been interacted with
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [shouldShowRequirements, setShouldShowRequirements] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessages, setAlertMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Barangay options from the database schema
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
  
  // Gender options from the database schema
  const genderOptions = [
    'male',
    'female',
  ];
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };
  
  // Check password requirements
  useEffect(() => {
    const { password } = formData;
    
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
    
    // Only show requirements if there's actual content in the password field
    setShouldShowRequirements(password.length > 0 || passwordFocused);
  }, [formData.password, passwordFocused]);
  
  // Handle DOB change and automatically calculate age
  useEffect(() => {
    if (formData.dob) {
      const calculatedAge = calculateAge(formData.dob);
      setFormData(prev => ({
        ...prev,
        age: calculatedAge
      }));
    }
  }, [formData.dob]);
  
  // Check if the form is valid
  useEffect(() => {
    // Check if all required fields are filled and all error messages are empty
    const requiredFields = [
      'first_name', 'last_name', 'gender', 'dob', 'age',
      'email', 'address', 'phone_number', 'baranggay', 'password', 'confirmPassword'
    ];
    
    const allFieldsFilled = requiredFields.every(field => formData[field].toString().trim() !== '');
    const allErrorsFree = Object.values(errors).every(error => error === '');
    const termsAgreed = formData.agreeTerms;
    const passwordValid = Object.values(passwordRequirements).every(req => req);
    
    setIsFormValid(allFieldsFilled && allErrorsFree && termsAgreed && passwordValid);
  }, [formData, errors, passwordRequirements]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Validate on change
    validateField(name, newValue);
  };
  
  const validateField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'first_name':
      case 'last_name':
        if (value.trim() === '') {
          errorMessage = `${name === 'first_name' ? 'First name' : 'Last name'} is required`;
        }
        break;
      case 'gender':
        if (value === '') {
          errorMessage = 'Gender selection is required';
        }
        break;
      case 'dob':
        if (value === '') {
          errorMessage = 'Date of birth is required';
        }
        break;
      case 'age':
        if (value === '') {
          errorMessage = 'Age is required';
        }
        break;
      case 'phone_number':
        if (value.trim() === '') {
          errorMessage = 'Phone number is required';
        } else if (!/^[0-9+\-\s]+$/.test(value)) {
          errorMessage = 'Phone number should contain valid characters';
        }
        break;
      case 'address':
        if (value.trim() === '') {
          errorMessage = 'Address is required';
        }
        break;
      case 'baranggay':
        if (value.trim() === '') {
          errorMessage = 'Barangay is required';
        }
        break;
      case 'email':
        if (value.trim() === '') {
          errorMessage = 'Email is required';
        } else if (!validateEmail(value)) {
          errorMessage = 'E-mail is invalid!';
        }
        break;
      case 'password':
        if (value.trim() === '') {
          errorMessage = 'Password is required';
        }
        // Password validation is handled by requirements display
        break;
      case 'confirmPassword':
        if (value.trim() === '') {
          errorMessage = 'Please confirm your password';
        } else if (value !== formData.password) {
          errorMessage = 'Passwords do not match!';
        }
        break;
      case 'agreeTerms':
        if (!value) {
          errorMessage = 'You must agree to the Terms of Service and Privacy Policy';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if the form is valid
    if (!isFormValid) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare data for submission
      const submitData = {...formData};
      
      // Add password_confirmation field for Laravel validation
      submitData.password_confirmation = submitData.confirmPassword;
      
      // Remove fields not needed for the API
      delete submitData.confirmPassword;
      delete submitData.agreeTerms;
      
      // Use the context's register function
      const { success, errors, needsVerification } = await register(submitData);
      
      // Handle successful registration
      if (success) {
        if (needsVerification) {
          // Redirect to the verification page
          navigate('/verify-email', { state: { email: submitData.email } });
        } else {
          // Redirect to login page
          navigate('/login');
        }
      } else {
        // Handle registration error
        setShowAlert(true);
        
        if (errors) {
          const errorMessages = [];
          
          // Collect all error messages
          Object.keys(errors).forEach(field => {
            errorMessages.push(errors[field][0]);
          });
          
          setAlertMessages(errorMessages);
        } else {
          setAlertMessages(['Registration failed. Please try again.']);
        }
      }
    } catch (error) {
      setShowAlert(true);
      setAlertMessages(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  }; 
  
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  // Handle password field focus
  const handlePasswordFocus = () => {
    setPasswordFocused(true);
  };

  // Handle password field blur
  const handlePasswordBlur = (e) => {
    setPasswordFocused(false);
    validateField('password', e.target.value);
    
    // If the password field is empty when the user leaves, hide requirements
    if (e.target.value.trim() === '') {
      setShouldShowRequirements(false);
    }
  };

  // If already logged in, don't render the form (will redirect via useEffect)
  if (user) {
    return <div className="youth-auth-loading">Redirecting...</div>;
  }

  return (
    <AuthLayout>
      <div className="youth-auth-container">
        <div className="youth-auth-background">
          <img src={background} alt="Background" className="youth-auth-bg-image" />
          <div className="youth-auth-bg-overlay"></div>
        </div>
        
        <div className="youth-auth-card youth-auth-signup-card">
          <div className="youth-auth-header">
            <div className="youth-auth-logo">
              <div className="youth-auth-logo-circle">
                <FaUser />
              </div>
            </div>
            <h1 className="youth-auth-title">Create an Account</h1>
            <p className="youth-auth-subtitle">Join the community</p>
          </div>
          
          {showAlert && (
            <div className="youth-auth-alert youth-auth-alert-danger">
              <div className="youth-auth-alert-icon">
                <FaExclamationTriangle />
              </div>
              <div className="youth-auth-alert-content">
                <strong>The following errors occurred:</strong>
                <ul>
                  {alertMessages.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <form className="youth-auth-form" onSubmit={handleSubmit}>
            {/* Form sections */}
            <div className="youth-auth-form-section">
              <div className="youth-auth-section-title">
                <FaIdCard />
                <span>Personal Information</span>
              </div>
              
              {/* Name fields */}
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="first_name" className="youth-auth-form-label">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className={`youth-auth-form-input ${errors.first_name ? 'error' : ''}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    onBlur={(e) => validateField('first_name', e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  {errors.first_name && <span className="youth-auth-input-error">{errors.first_name}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="middle_name" className="youth-auth-form-label">Middle Name (Optional)</label>
                  <input
                    type="text"
                    id="middle_name"
                    name="middle_name"
                    className={`youth-auth-form-input ${errors.middle_name ? 'error' : ''}`}
                    value={formData.middle_name}
                    onChange={handleChange}
                    onBlur={(e) => validateField('middle_name', e.target.value)}
                  />
                  {errors.middle_name && <span className="youth-auth-input-error">{errors.middle_name}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="last_name" className="youth-auth-form-label">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className={`youth-auth-form-input ${errors.last_name ? 'error' : ''}`}
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={(e) => validateField('last_name', e.target.value)}
                    required
                  />
                  {errors.last_name && <span className="youth-auth-input-error">{errors.last_name}</span>}
                </div>
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="gender" className="youth-auth-form-label">Sex Assigned At Birth</label>
                  <select
                    id="gender"
                    name="gender"
                    className={`youth-auth-form-input ${errors.gender ? 'error' : ''}`}
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={(e) => validateField('gender', e.target.value)}
                    required
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.gender && <span className="youth-auth-input-error">{errors.gender}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="dob" className="youth-auth-form-label">Date of Birth</label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    className={`youth-auth-form-input ${errors.dob ? 'error' : ''}`}
                    value={formData.dob}
                    onChange={handleChange}
                    onBlur={(e) => validateField('dob', e.target.value)}
                    required
                  />
                  {errors.dob && <span className="youth-auth-input-error">{errors.dob}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="age" className="youth-auth-form-label">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    className={`youth-auth-form-input ${errors.age ? 'error' : ''}`}
                    value={formData.age}
                    readOnly
                    required
                  />
                  {errors.age && <span className="youth-auth-input-error">{errors.age}</span>}
                </div>
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="phone_number" className="youth-auth-form-label">Phone Number</label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    className={`youth-auth-form-input ${errors.phone_number ? 'error' : ''}`}
                    value={formData.phone_number}
                    onChange={handleChange}
                    onBlur={(e) => validateField('phone_number', e.target.value)}
                    required
                  />
                  {errors.phone_number && <span className="youth-auth-input-error">{errors.phone_number}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="email" className="youth-auth-form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`youth-auth-form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={(e) => validateField('email', e.target.value)}
                    required
                  />
                  {errors.email && <span className="youth-auth-input-error">{errors.email}</span>}
                </div>
              </div>
            </div>
            
            <div className="youth-auth-form-section">
              <div className="youth-auth-section-title">
                <FaMapMarkerAlt />
                <span>Address Information</span>
              </div>
              
              <div className="youth-auth-form-group">
                <label htmlFor="address" className="youth-auth-form-label">Complete Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className={`youth-auth-form-input ${errors.address ? 'error' : ''}`}
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={(e) => validateField('address', e.target.value)}
                  required
                />
                {errors.address && <span className="youth-auth-input-error">{errors.address}</span>}
              </div>
              
              <div className="youth-auth-form-group">
                <label htmlFor="baranggay" className="youth-auth-form-label">Barangay</label>
                <select
                  id="baranggay"
                  name="baranggay"
                  className={`youth-auth-form-input ${errors.baranggay ? 'error' : ''}`}
                  value={formData.baranggay}
                  onChange={handleChange}
                  onBlur={(e) => validateField('baranggay', e.target.value)}
                  required
                >
                  <option value="">Select barangay</option>
                  {barangayOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.baranggay && <span className="youth-auth-input-error">{errors.baranggay}</span>}
              </div>
            </div>
            
            <div className="youth-auth-form-section">
              <div className="youth-auth-section-title">
                <FaEnvelope />
                <span>Account Security</span>
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="password" className="youth-auth-form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className={`youth-auth-form-input ${errors.password ? 'error' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={handlePasswordFocus}
                      onBlur={handlePasswordBlur}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('password')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <span className="youth-auth-input-error">{errors.password}</span>}
                  
                  {/* Only show password requirements when appropriate */}
                  {shouldShowRequirements && (
                    <div className="youth-auth-password-requirements">
                      <div className={`youth-auth-password-requirement ${passwordRequirements.minLength ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.minLength ? <FaCheck /> : <FaTimes />}
                        <span>Use at least 8 characters</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasLower ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasLower ? <FaCheck /> : <FaTimes />}
                        <span>Use a lowercase letter</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasUpper ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasUpper ? <FaCheck /> : <FaTimes />}
                        <span>Use an uppercase letter</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasSpecial ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasSpecial ? <FaCheck /> : <FaTimes />}
                        <span>Use at least 1 special character (!@#$...)</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasNumber ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasNumber ? <FaCheck /> : <FaTimes />}
                        <span>Use at least 1 number</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="confirmPassword" className="youth-auth-form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`youth-auth-form-input ${errors.confirmPassword ? 'error' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={(e) => validateField('confirmPassword', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="youth-auth-input-error">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="youth-auth-form-options">
              <label className="youth-auth-form-check">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the <NavLink to="/terms" className="youth-auth-form-link">Terms of Service</NavLink> and <NavLink to="/privacy" className="youth-auth-form-link">Privacy Policy</NavLink></span>
              </label>
              {errors.agreeTerms && <span className="youth-auth-input-error">{errors.agreeTerms}</span>}
            </div>
            
            <button 
              type="submit" 
              className="youth-auth-button"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="youth-auth-footer">
            <p>Already have an account? <NavLink to="/login">Sign In</NavLink></p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;