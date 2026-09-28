import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut } = useClerk();

  const isLoaded = Boolean(isUserLoaded && isAuthLoaded);

  const [customProfile, setCustomProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('trekquest_custom_profile') || '{}');
    } catch {
      return {};
    }
  });

  const updateProfile = async ({ full_name, photo_url }) => {
    const updated = {
      ...customProfile,
      ...(full_name !== undefined ? { full_name } : {}),
      ...(photo_url !== undefined ? { photo_url } : {})
    };
    setCustomProfile(updated);
    localStorage.setItem('trekquest_custom_profile', JSON.stringify(updated));

    if (clerkUser && full_name) {
      try {
        const parts = full_name.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        if (clerkUser.update) {
          await clerkUser.update({ firstName, lastName });
        }
      } catch (e) {
        console.warn('Clerk user update notice:', e);
      }
    }
  };

  // Adapt Clerk user object to the app's standard structure
  const user = useMemo(() => {
    if (!clerkUser) return null;
    return {
      id: clerkUser.id,
      full_name: customProfile.full_name || clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Hiker',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      photo_url: customProfile.photo_url || clerkUser.imageUrl || '',
      raw: clerkUser,
    };
  }, [clerkUser, customProfile]);

  const logout = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(isSignedIn),
        isLoadingAuth: !isLoaded,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: { id: 'trek-quest' },
        authChecked: isLoaded,
        logout,
        navigateToLogin,
        updateProfile,
        checkUserAuth: async () => {},
        checkAppState: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

