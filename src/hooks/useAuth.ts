
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

// Clean up any corrupted localStorage data on module load
if (typeof window !== 'undefined') {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      JSON.parse(storedUser); // Test if it's valid JSON
    }
  } catch (error) {
    console.warn('🧹 Cleaning corrupted localStorage data');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberEmail');
  }
}

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('🚀 useAuth useEffect triggered');
    
    let isMounted = true; // Prevent state updates on unmounted component
    
    // Simple initialization
    const initializeAuth = async () => {
      try {
        // Check localStorage first, but verify with Supabase session
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.id && parsedUser.email && parsedUser.role) {
              console.log('✅ Found stored user:', parsedUser.role);
              
              // Verify the session is still valid in Supabase
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user?.id === parsedUser.id && isMounted) {
                console.log('✅ Session verified, using cached user');
                setUser(parsedUser);
                setIsLoading(false);
                setIsInitialized(true);
                return;
              } else {
                console.warn('⚠️ Stored user session expired, clearing cache');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('rememberEmail');
                // Don't return, continue to check Supabase
              }
            }
          } catch (error) {
            console.warn('🧹 Cleaning corrupted user data');
            localStorage.removeItem('currentUser');
          }
        }

        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userProfile && isMounted) {
            console.log('✅ Found user profile:', userProfile.role);
            setUser(userProfile);
            localStorage.setItem('currentUser', JSON.stringify(userProfile));
            setIsLoading(false);
            setIsInitialized(true);
            return;
          }
        }

        // No user found
        if (isMounted) {
          console.log('❌ No user found, initializing as guest');
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return; // Prevent updates on unmounted component
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        localStorage.removeItem('currentUser');
        setIsLoading(false); // Reset loading state on sign out
        setIsInitialized(true); // Ensure auth is initialized
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userProfile && isMounted) {
          setUser(userProfile);
          localStorage.setItem('currentUser', JSON.stringify(userProfile));
          setIsLoading(false); // Reset loading state on sign in
          setIsInitialized(true); // Ensure auth is initialized
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Use Supabase Auth for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Invalid email or password. Please check your credentials.'
        };
      }

      // Get user profile from users table
      let { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userProfile) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'User profile not found. Please contact support.'
        };
      }

      // Check if kiosk user is trying to login from unauthorized URL
      if (userProfile.role === 'kiosk') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/kiosk-login') {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Kiosk accounts can only be accessed from the kiosk login page.'
          };
        }
      }

      // Store user in localStorage and state
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
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
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberEmail');
      setUser(null);
      setIsLoading(false); // Reset loading state
      setIsInitialized(true); // Ensure auth is initialized
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, reset the state
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberEmail');
    }
  };

  // Emergency reset function to clear all auth data
  const resetAuth = (): void => {
    console.warn('🚨 Emergency auth reset triggered');
    setUser(null);
    setIsLoading(false);
    setIsInitialized(true);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberEmail');
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
    isLoading: isLoading || !isInitialized,
    login,
    signup,
    logout,
    resetAuth,
    updateProfile,
    changePassword,
    isAuthenticated: !!user && isInitialized,
    isAdmin: user?.role === 'admin',
    isKiosk: user?.role === 'kiosk',
    isInitialized,
  };
};
