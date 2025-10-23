
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  contact_number: string | null;
  address: string | null;
  role: 'customer' | 'admin' | 'kiosk';
  password: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Invalid email or credentials. Please check your credentials.'
        };
      }

      // Store user in localStorage and state
      localStorage.setItem('currentUser', JSON.stringify(data));
      setUser(data);

      return { success: true, user: data };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    fullName: string;
    contactNumber?: string;
    address?: string;
    role?: 'customer' | 'admin' | 'kiosk';
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Create new user with proper database structure
      const newUser = {
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        contact_number: userData.contactNumber || null,
        address: userData.address || null,
        role: userData.role || 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select('id, email, full_name, contact_number, address, role, created_at')
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create account'
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Failed to create account - no data returned'
        };
      }

      // Create the user object with password for local storage
      const userWithPassword = {
        ...data,
        password: userData.password
      };

      // Auto login after signup
      localStorage.setItem('currentUser', JSON.stringify(userWithPassword));
      setUser(userWithPassword);

      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during signup'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update localStorage and state
      const updatedUser = { ...user, ...data };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // First verify the current password
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .eq('password', currentPassword)
        .single();

      if (verifyError || !verifyData) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update the password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update localStorage with new password
      const updatedUser = { ...user, password: newPassword };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, error: error.message || 'Failed to change password' };
    }
  };

  return {
    user,
    profile: user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isKiosk: user?.role === 'kiosk',
  };
};
