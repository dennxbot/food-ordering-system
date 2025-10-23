
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    address: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        email: user.email || '',
        contactNumber: user.contact_number || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: formData.fullName,
        email: formData.email,
        contact_number: formData.contactNumber,
        address: formData.address
      });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="lg:hidden flex items-center">
            <button 
              onClick={() => navigate('/')} 
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700"></i>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Header */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center sticky top-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="ri-user-line text-3xl text-white"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{user.full_name || 'User'}</h2>
              <p className="text-gray-600 mb-3">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-full shadow-sm">
                  Administrator
                </span>
              )}
              {user.role === 'customer' && (
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-full shadow-sm">
                  Customer
                </span>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <i className="ri-user-settings-line text-orange-600 mr-2"></i>
                  Personal Information
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <i className={`${isEditing ? 'ri-close-line' : 'ri-edit-line'} text-lg mr-1`}></i>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <Input
                  label="Contact Number"
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                />
              </div>

              {isEditing && (
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 rounded-lg font-semibold whitespace-nowrap shadow-lg disabled:opacity-50"
                  >
                    <i className={`${isLoading ? 'ri-loader-4-line animate-spin' : 'ri-save-line'} mr-2`}></i>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-semibold whitespace-nowrap disabled:opacity-50"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <i className="ri-flashlight-line text-orange-600 mr-2"></i>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                      <i className="ri-shopping-bag-line text-lg text-orange-600"></i>
                    </div>
                    <span className="font-medium text-gray-800">My Orders</span>
                  </div>
                  <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-orange-600 transition-colors"></i>
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                        <i className="ri-dashboard-line text-lg text-blue-600"></i>
                      </div>
                      <span className="font-medium text-gray-800">Admin Dashboard</span>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                  </button>
                )}

                <button
                  onClick={() => alert('Change password functionality would be implemented here')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                      <i className="ri-lock-line text-lg text-purple-600"></i>
                    </div>
                    <span className="font-medium text-gray-800">Change Password</span>
                  </div>
                  <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-purple-600 transition-colors"></i>
                </button>

                <button
                  onClick={() => navigate('/menu')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                      <i className="ri-restaurant-line text-lg text-green-600"></i>
                    </div>
                    <span className="font-medium text-gray-800">Browse Menu</span>
                  </div>
                  <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-green-600 transition-colors"></i>
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 rounded-xl font-semibold whitespace-nowrap shadow-lg transition-all"
              >
                <i className="ri-logout-box-line mr-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
