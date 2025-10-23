
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});
  const [rememberMe, setRememberMe] = useState(false);
  
  // Refs for focus management
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus email field on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);
  
  // Real-time validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };
  
  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };
  
  // Handle field validation on blur
  const handleEmailBlur = () => {
    const emailError = validateEmail(email);
    setFieldErrors(prev => ({ ...prev, email: emailError }));
  };
  
  const handlePasswordBlur = () => {
    const passwordError = validatePassword(password);
    setFieldErrors(prev => ({ ...prev, password: passwordError }));
  };
  
  // Clear field errors on input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
    if (error) setError('');
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
    if (error) setError('');
  };
  
  // Handle Enter key navigation
  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      return;
    }
  
    setIsLoading(true);
    setError('');
    setFieldErrors({});
  
    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
  
        // Redirect based on user role
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else if (result.user.role === 'kiosk') {
          navigate('/kiosk');
        } else {
          navigate('/');
        }
      } else {
        setError(result.error || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);
  

  
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(239, 68, 68, 0.1)), url('https://readdy.ai/api/search-image?query=modern%20restaurant%20interior%20with%20warm%20lighting%2C%20elegant%20dining%20atmosphere%2C%20blurred%20background%2C%20cozy%20ambiance%2C%20food%20service%20environment&width=1200&height=800&seq=loginbg&orientation=landscape')`
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

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-user-line text-2xl text-orange-500" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">Sign in to your account to continue ordering</p>
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                  onKeyDown={handleEmailKeyDown}
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
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  icon="ri-lock-line"
                  className={`w-full pl-12 pr-12 py-4 text-base bg-white/70 backdrop-blur-sm border-2 rounded-2xl shadow-sm transition-all duration-200 ${
                    fieldErrors.password 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                  }`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
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
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <i className="ri-information-line"></i>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  rememberMe 
                    ? 'bg-orange-500 border-orange-500' 
                    : 'border-gray-300 hover:border-orange-400'
                }`}>
                  {rememberMe && <i className="ri-check-line text-white text-sm"></i>}
                </div>
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-orange-600 hover:text-orange-700 transition-colors duration-200"
                onClick={() => alert('Forgot password functionality coming soon!')}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!fieldErrors.email || !!fieldErrors.password}
              className="w-full py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <i className="ri-login-box-line mr-3" />
                  Sign In
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

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Don't have an account?</p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center w-full py-3 px-6 text-base font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 rounded-2xl transition-all duration-300 cursor-pointer group"
            >
              <i className="ri-user-add-line mr-2 group-hover:scale-110 transition-transform duration-200" />
              Create New Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
