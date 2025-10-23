
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    contactNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Refs for focus management
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Auto-focus first field on mount
  useEffect(() => {
    fullNameRef.current?.focus();
  }, []);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const getPasswordStrengthText = (score: number) => {
    if (score === 0) return { text: '', color: '' };
    if (score <= 2) return { text: 'Weak', color: 'text-red-500' };
    if (score <= 3) return { text: 'Fair', color: 'text-yellow-500' };
    if (score <= 4) return { text: 'Good', color: 'text-blue-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  // Real-time validation functions
  const validateFullName = (name: string) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return 'Name can only contain letters and spaces';
    return '';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateContactNumber = (contact: string) => {
    if (!contact) return ''; // Optional field
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(contact)) return 'Please enter a valid phone number';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  // Handle field validation on blur
  const handleFullNameBlur = () => {
    const error = validateFullName(fullName);
    setFieldErrors(prev => ({ ...prev, fullName: error }));
  };

  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setFieldErrors(prev => ({ ...prev, email: error }));
  };

  const handleContactBlur = () => {
    const error = validateContactNumber(contactNumber);
    setFieldErrors(prev => ({ ...prev, contactNumber: error }));
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setFieldErrors(prev => ({ ...prev, password: error }));
  };

  const handleConfirmPasswordBlur = () => {
    const error = validateConfirmPassword(confirmPassword, password);
    setFieldErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  // Handle input changes with error clearing
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    if (fieldErrors.fullName) {
      setFieldErrors(prev => ({ ...prev, fullName: '' }));
    }
    if (error) setError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
    if (error) setError('');
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactNumber(e.target.value);
    if (fieldErrors.contactNumber) {
      setFieldErrors(prev => ({ ...prev, contactNumber: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
    // Also revalidate confirm password if it exists
    if (confirmPassword && fieldErrors.confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, e.target.value);
      setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  // Handle Enter key navigation
  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const fullNameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const contactError = validateContactNumber(contactNumber);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);

    const errors = {
      fullName: fullNameError,
      email: emailError,
      contactNumber: contactError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    };

    setFieldErrors(errors);

    // Check if any errors exist
    if (Object.values(errors).some(error => error !== '')) {
      setError('Please fix the errors above before continuing');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signup({
        email,
        password,
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim() || undefined,
        role: 'customer'
      });

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(239, 68, 68, 0.1)), url('https://readdy.ai/api/search-image?query=modern%20restaurant%20interior%20with%20warm%20lighting%2C%20elegant%20dining%20atmosphere%2C%20blurred%20background%2C%20cozy%20ambiance%2C%20food%20service%20environment&width=1200&height=800&seq=signupbg&orientation=landscape')`
      }}
    >
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-white border border-orange-200 hover:border-orange-300 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
          aria-label="Go back to home"
        >
          <i className="ri-arrow-left-line text-xl text-orange-600 group-hover:text-orange-700" />
        </button>

        {/* Signup Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-user-add-line text-2xl text-orange-500" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join us and start ordering delicious food</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentStep >= 1 ? 'bg-orange-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-1 rounded transition-all duration-300 ${
                currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-1 rounded transition-all duration-300 ${
                currentStep >= 3 ? 'bg-orange-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentStep >= 3 ? 'bg-orange-500' : 'bg-gray-200'
              }`}></div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-500">
              Step {Math.min(currentStep, 3)} of 3
            </div>
          </div>

          {/* Global Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl animate-shake" role="alert">
              <div className="flex items-center gap-3">
                <i className="ri-error-warning-line text-red-500"></i>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Personal Information */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <Input
                  ref={fullNameRef}
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={handleFullNameChange}
                  onBlur={handleFullNameBlur}
                  onKeyDown={(e) => handleKeyDown(e, emailRef)}
                  onFocus={() => setCurrentStep(1)}
                  icon="ri-user-line"
                  className={`w-full pl-12 pr-4 py-4 text-base bg-white/70 backdrop-blur-sm border-2 rounded-2xl shadow-sm transition-all duration-200 ${
                    fieldErrors.fullName 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                  }`}
                  aria-invalid={!!fieldErrors.fullName}
                  aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                  required
                />
                {fieldErrors.fullName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <i className="ri-error-warning-line text-red-500"></i>
                  </div>
                )}
              </div>
              {fieldErrors.fullName && (
                <p id="fullName-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <i className="ri-information-line"></i>
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  onKeyDown={(e) => handleKeyDown(e, contactRef)}
                  onFocus={() => setCurrentStep(1)}
                  icon="ri-mail-line"
                  className={`w-full pl-12 pr-4 py-4 text-base bg-white/70 backdrop-blur-sm border-2 rounded-2xl shadow-sm transition-all duration-200 ${
                    fieldErrors.email 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                  }`}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  required
                />
                {fieldErrors.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <i className="ri-error-warning-line text-red-500"></i>
                  </div>
                )}
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <i className="ri-information-line"></i>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Input
                  ref={contactRef}
                  id="contactNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={contactNumber}
                  onChange={handleContactChange}
                  onBlur={handleContactBlur}
                  onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                  onFocus={() => setCurrentStep(2)}
                  icon="ri-phone-line"
                  className={`w-full pl-12 pr-4 py-4 text-base bg-white/70 backdrop-blur-sm border-2 rounded-2xl shadow-sm transition-all duration-200 ${
                    fieldErrors.contactNumber 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                  }`}
                  aria-invalid={!!fieldErrors.contactNumber}
                  aria-describedby={fieldErrors.contactNumber ? 'contact-error' : undefined}
                />
                {fieldErrors.contactNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <i className="ri-error-warning-line text-red-500"></i>
                  </div>
                )}
              </div>
              {fieldErrors.contactNumber && (
                <p id="contact-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <i className="ri-information-line"></i>
                  {fieldErrors.contactNumber}
                </p>
              )}
            </div>

            {/* Password Section */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  onKeyDown={(e) => handleKeyDown(e, confirmPasswordRef)}
                  onFocus={() => setCurrentStep(2)}
                  icon="ri-lock-line"
                  className={`w-full pl-12 pr-12 py-4 text-base bg-white/70 backdrop-blur-sm border-2 rounded-2xl shadow-sm transition-all duration-200 ${
                    fieldErrors.password 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                  }`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-strength'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength <= 2 ? 'bg-red-500' :
                          passwordStrength <= 3 ? 'bg-yellow-500' :
                          passwordStrength <= 4 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${strengthInfo.color}`}>
                      {strengthInfo.text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Password strength: Include uppercase, lowercase, numbers, and symbols
                  </div>
                </div>
              )}
              
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <i className="ri-information-line"></i>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  onFocus={() => setCurrentStep(3)}
                  icon="ri-lock-line"
                  className={`w-full pl-12 pr-12 py-4 text-base bg-white/70 backdrop-blur-sm border-2 rounded-2xl shadow-sm transition-all duration-200 ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : confirmPassword && confirmPassword === password
                      ? 'border-green-300 focus:border-green-400 focus:ring-green-200'
                      : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                  }`}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
                {confirmPassword && confirmPassword === password && !fieldErrors.confirmPassword && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <i className="ri-check-line text-green-500"></i>
                  </div>
                )}
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <i className="ri-information-line"></i>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <label className="flex items-start cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                  agreedToTerms 
                    ? 'bg-orange-500 border-orange-500' 
                    : 'border-gray-300 hover:border-orange-400'
                }`}>
                  {agreedToTerms && <i className="ri-check-line text-white text-sm"></i>}
                </div>
              </label>
              <div className="text-sm text-gray-600 leading-relaxed">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-orange-600 hover:text-orange-700 underline"
                  onClick={() => alert('Terms of Service coming soon!')}
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-orange-600 hover:text-orange-700 underline"
                  onClick={() => alert('Privacy Policy coming soon!')}
                >
                  Privacy Policy
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !agreedToTerms || Object.values(fieldErrors).some(error => error !== '')}
              className="w-full py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating Account...
                </div>
              ) : (
                <>
                  <i className="ri-user-add-line mr-3" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500 bg-white">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Already have an account?</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-6 text-base font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 rounded-2xl transition-all duration-300 cursor-pointer"
            >
              <i className="ri-login-box-line mr-2" />
              Sign In Instead
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Join thousands of food lovers who trust us for their meals
          </p>
        </div>
      </div>
    </div>
  );
}
