
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  role: 'customer' | 'admin' | 'kiosk';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from Supabase session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user profile from users table
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userProfile) {
            setUser(userProfile);
            localStorage.setItem('currentUser', JSON.stringify(userProfile));
          }
        } else {
          // Check if user is logged in from localStorage (fallback)
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
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        localStorage.removeItem('currentUser');
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile when signed in
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userProfile) {
          setUser(userProfile);
          localStorage.setItem('currentUser', JSON.stringify(userProfile));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Use Supabase Auth for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Supabase auth error:', authError);
        return {
          success: false,
          error: authError?.message || 'Invalid email or credentials. Please check your credentials.'
        };
      }

      // Get user profile from users table
      let { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userProfile) {
        // If user doesn't exist in users table, create a basic profile
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            full_name: authData.user.user_metadata?.full_name || 'User',
            role: 'customer'
          })
          .select()
          .single();

        if (createError || !newProfile) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Failed to create user profile. Please contact support.'
          };
        }

        userProfile = newProfile;
      }

      // Check if kiosk user is trying to login from unauthorized URL
      if (userProfile.role === 'kiosk') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/kiosk-login') {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Kiosk accounts can only be accessed from the kiosk login page. Please use the designated kiosk terminal.'
          };
        }
      }

      // Store user in localStorage and state
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      setUser(userProfile);

      return { success: true, user: userProfile };
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
      
      // First, create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
          }
        }
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Failed to create account'
        };
      }

      // Then create user profile in users table
      const newUserProfile = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.contactNumber || null,
        address: userData.address || null,
        role: userData.role || 'customer'
      };

      const { data, error } = await supabase
        .from('users')
        .insert(newUserProfile)
        .select('id, email, full_name, phone, address, role, is_active, created_at, updated_at')
        .single();

      if (error) {
        console.error('Database error:', error);
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.signOut();
        return {
          success: false,
          error: error.message || 'Failed to create user profile'
        };
      }

      if (!data) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Failed to create account - no data returned'
        };
      }

      // Set user data
      localStorage.setItem('currentUser', JSON.stringify(data));
      setUser(data);

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
    await supabase.auth.signOut();
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
      // Use Supabase Auth to update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

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
