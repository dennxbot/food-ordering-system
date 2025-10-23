import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/base/Button';
import Input from '../../../components/base/Input';
import AdminSidebar from '../../../components/feature/AdminSidebar';

interface ProfileData {
  full_name: string;
  email: string;
  contact_number: string;
  address: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, isAdmin, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    contact_number: '',
    address: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileErrors, setProfileErrors] = useState<Partial<ProfileData>>({});
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordData>>({});

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // If not authenticated or not admin, redirect to login
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    // Populate profile data from user
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        contact_number: user.contact_number || '',
        address: user.address || ''
      });
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate, user]);

  // Validation functions
  const validateProfile = (data: ProfileData): Partial<ProfileData> => {
    const errors: Partial<ProfileData> = {};
    
    if (!data.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    return errors;
  };

  const validatePassword = (data: PasswordData): Partial<PasswordData> => {
    const errors: Partial<PasswordData> = {};
    
    if (!data.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!data.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (data.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  // Handle profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateProfile(profileData);
    setProfileErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validatePassword(passwordData);
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change password. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (message) setMessage(null);
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (message) setMessage(null);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600">Manage your account information and security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-2xl ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="flex items-center gap-3">
                  <i className={`${
                    message.type === 'success' ? 'ri-check-circle-line' : 'ri-error-warning-line'
                  }`}></i>
                  <p>{message.text}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'profile'
                        ? 'border-orange-500 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <i className="ri-user-line mr-2"></i>
                    Profile Information
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'password'
                        ? 'border-orange-500 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <i className="ri-lock-line mr-2"></i>
                    Change Password
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter your full name"
                          value={profileData.full_name}
                          onChange={(e) => handleProfileChange('full_name', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-colors ${
                            profileErrors.full_name
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-orange-400'
                          }`}
                          required
                        />
                        {profileErrors.full_name && (
                          <p className="mt-2 text-sm text-red-600">{profileErrors.full_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={profileData.email}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-colors ${
                            profileErrors.email
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-orange-400'
                          }`}
                          required
                        />
                        {profileErrors.email && (
                          <p className="mt-2 text-sm text-red-600">{profileErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contact Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          value={profileData.contact_number}
                          onChange={(e) => handleProfileChange('contact_number', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-orange-400 rounded-xl transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Address
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter your address"
                          value={profileData.address}
                          onChange={(e) => handleProfileChange('address', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-orange-400 rounded-xl transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Updating...
                          </div>
                        ) : (
                          <>
                            <i className="ri-save-line mr-2"></i>
                            Update Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="max-w-md">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter your current password"
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-colors ${
                            passwordErrors.currentPassword
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-orange-400'
                          }`}
                          required
                        />
                        {passwordErrors.currentPassword && (
                          <p className="mt-2 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          New Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter your new password"
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-colors ${
                            passwordErrors.newPassword
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-orange-400'
                          }`}
                          required
                        />
                        {passwordErrors.newPassword && (
                          <p className="mt-2 text-sm text-red-600">{passwordErrors.newPassword}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-colors ${
                            passwordErrors.confirmPassword
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-orange-400'
                          }`}
                          required
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="mt-2 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Changing...
                          </div>
                        ) : (
                          <>
                            <i className="ri-lock-line mr-2"></i>
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;