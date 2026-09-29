import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut } = useClerk();

  const isLoaded = Boolean(isUserLoaded && isAuthLoaded);

  // Read cached session from previous online login
  const [cachedUser, setCachedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('trekquest_cached_session') || 'null');
    } catch {
      return null;
    }
  });

  const [customProfile, setCustomProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('trekquest_custom_profile') || '{}');
    } catch {
      return {};
    }
  });

  // Whenever user signs in online via Clerk, cache their profile for offline use
  React.useEffect(() => {
    if (clerkUser && isSignedIn) {
      const session = {
        id: clerkUser.id,
        full_name: customProfile.full_name || clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Hiker',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        photo_url: customProfile.photo_url || clerkUser.imageUrl || '',
        cachedAt: Date.now(),
      };
      setCachedUser(session);
      localStorage.setItem('trekquest_cached_session', JSON.stringify(session));
    }
  }, [clerkUser, isSignedIn, customProfile]);

  const updateProfile = async ({ full_name, photo_url }) => {
    const updated = {
      ...customProfile,
      ...(full_name !== undefined ? { full_name } : {}),
      ...(photo_url !== undefined ? { photo_url } : {})
    };
    setCustomProfile(updated);
    localStorage.setItem('trekquest_custom_profile', JSON.stringify(updated));

    // Also update cached session
    if (cachedUser) {
      const updatedCache = {
        ...cachedUser,
        ...(full_name !== undefined ? { full_name } : {}),
        ...(photo_url !== undefined ? { photo_url } : {})
      };
      setCachedUser(updatedCache);
      localStorage.setItem('trekquest_cached_session', JSON.stringify(updatedCache));
    }

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

  // Adapt Clerk user object OR use cached offline session
  const user = useMemo(() => {
    if (clerkUser) {
      return {
        id: clerkUser.id,
        full_name: customProfile.full_name || clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Hiker',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        photo_url: customProfile.photo_url || clerkUser.imageUrl || '',
        raw: clerkUser,
        isOfflineSession: false,
      };
    }
    if (cachedUser) {
      return {
        ...cachedUser,
        full_name: customProfile.full_name || cachedUser.full_name || 'Hiker',
        photo_url: customProfile.photo_url || cachedUser.photo_url || '',
        isOfflineSession: true,
      };
    }
    return null;
  }, [clerkUser, cachedUser, customProfile]);

  const hasCachedSession = Boolean(cachedUser);
  const isAuthenticated = Boolean(isSignedIn || hasCachedSession);
  // If user already logged in before and has a cached session, do not block them with a loading spinner
  const isLoadingAuth = hasCachedSession ? false : !isLoaded;

  const logout = async () => {
    try {
      localStorage.removeItem('trekquest_cached_session');
      localStorage.removeItem('trekquest_custom_profile');
      setCachedUser(null);
      if (signOut) {
        await signOut().catch(() => {});
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isOfflineMode: !isSignedIn && hasCachedSession,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: { id: 'trek-quest' },
        authChecked: true,
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

