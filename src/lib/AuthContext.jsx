import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/react';

const AuthContext = createContext(null);

export const ROLE_CONFIG = {
  hiker: {
    role: 'hiker',
    roleTitle: 'Trail Hiker',
    badge: '🏔️ Hiker',
    color: 'emerald',
    description: 'Personal summit tracking, offline navigation, and safe return alerts.',
  },
  guide: {
    role: 'guide',
    roleTitle: 'Certified Mountain Guide',
    badge: '🧭 Certified Guide',
    color: 'amber',
    description: 'Expedition leader, waypoint routing, and safety navigation protocol.',
  },
  admin: {
    role: 'admin',
    roleTitle: 'Park Administrator',
    badge: '🛡️ Park Admin',
    color: 'purple',
    description: 'Trail authority, high-risk safety broadcast, and ranger coordination.',
  },
};

const DEFAULT_ACCOUNTS = [
  {
    id: 'usr_hiker_01',
    email: 'hiker@trekquest.app',
    password: 'hiker_password',
    full_name: 'Alex Rivera',
    role: 'hiker',
    roleTitle: 'Trail Hiker',
    badge: '🏔️ Hiker',
    photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_guide_02',
    email: 'trail.master@trekquest.ph',
    password: 'trail_master_hiker',
    full_name: 'Cap. Marco Valenzuela',
    role: 'guide',
    roleTitle: 'Certified Mountain Guide',
    badge: '🧭 Certified Guide',
    photo_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_admin_03',
    email: 'admin@trekquest.ph',
    password: 'admin_password',
    full_name: 'Chief Ranger Teresa Gomez',
    role: 'admin',
    roleTitle: 'Park Administrator',
    badge: '🛡️ Park Admin',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const getRegisteredAccounts = () => {
  try {
    const raw = localStorage.getItem('trekquest_registered_accounts');
    if (!raw) {
      localStorage.setItem('trekquest_registered_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
      return [...DEFAULT_ACCOUNTS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('trekquest_registered_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
      return [...DEFAULT_ACCOUNTS];
    }
    return parsed;
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
};

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut } = useClerk();

  const isLoaded = Boolean(isUserLoaded && isAuthLoaded);

  // Read cached session from previous login
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
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const accounts = getRegisteredAccounts();
      const existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      const role = existing?.role || 'hiker';
      const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.hiker;

      const session = {
        id: clerkUser.id,
        full_name: customProfile.full_name || clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Hiker',
        email,
        role,
        roleTitle: roleCfg.roleTitle,
        badge: roleCfg.badge,
        photo_url: customProfile.photo_url || clerkUser.imageUrl || '',
        cachedAt: Date.now(),
      };
      setCachedUser(session);
      localStorage.setItem('trekquest_cached_session', JSON.stringify(session));
      localStorage.setItem('trekquest_current_user_email', email.toLowerCase());
    }
  }, [clerkUser, isSignedIn, customProfile]);

  const updateProfile = async ({ full_name, photo_url, role }) => {
    const updated = {
      ...customProfile,
      ...(full_name !== undefined ? { full_name } : {}),
      ...(photo_url !== undefined ? { photo_url } : {}),
      ...(role !== undefined ? { role } : {}),
    };
    setCustomProfile(updated);
    localStorage.setItem('trekquest_custom_profile', JSON.stringify(updated));

    // Also update registered accounts registry
    if (cachedUser?.email) {
      const accounts = getRegisteredAccounts();
      const idx = accounts.findIndex((a) => a.email.toLowerCase() === cachedUser.email.toLowerCase());
      if (idx !== -1) {
        if (full_name) accounts[idx].full_name = full_name;
        if (photo_url) accounts[idx].photo_url = photo_url;
        if (role) {
          accounts[idx].role = role;
          accounts[idx].roleTitle = ROLE_CONFIG[role]?.roleTitle || accounts[idx].roleTitle;
          accounts[idx].badge = ROLE_CONFIG[role]?.badge || accounts[idx].badge;
        }
        localStorage.setItem('trekquest_registered_accounts', JSON.stringify(accounts));
      }
    }

    // Also update cached session
    if (cachedUser) {
      const currentRole = role || cachedUser.role || 'hiker';
      const roleCfg = ROLE_CONFIG[currentRole] || ROLE_CONFIG.hiker;
      const updatedCache = {
        ...cachedUser,
        ...(full_name !== undefined ? { full_name } : {}),
        ...(photo_url !== undefined ? { photo_url } : {}),
        role: currentRole,
        roleTitle: roleCfg.roleTitle,
        badge: roleCfg.badge,
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
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const role = cachedUser?.role || 'hiker';
      const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.hiker;
      return {
        id: clerkUser.id,
        full_name: customProfile.full_name || clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Hiker',
        email,
        role,
        roleTitle: roleCfg.roleTitle,
        badge: roleCfg.badge,
        photo_url: customProfile.photo_url || clerkUser.imageUrl || '',
        raw: clerkUser,
        isOfflineSession: false,
      };
    }
    if (cachedUser) {
      const role = cachedUser.role || 'hiker';
      const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.hiker;
      return {
        ...cachedUser,
        full_name: customProfile.full_name || cachedUser.full_name || 'Hiker',
        photo_url: customProfile.photo_url || cachedUser.photo_url || '',
        role,
        roleTitle: cachedUser.roleTitle || roleCfg.roleTitle,
        badge: cachedUser.badge || roleCfg.badge,
        isOfflineSession: true,
      };
    }
    return null;
  }, [clerkUser, cachedUser, customProfile]);

  const hasCachedSession = Boolean(cachedUser);
  const isAuthenticated = Boolean(isSignedIn || hasCachedSession);
  const isLoadingAuth = hasCachedSession ? false : !isLoaded;

  const logout = async () => {
    try {
      localStorage.removeItem('trekquest_cached_session');
      localStorage.removeItem('trekquest_custom_profile');
      localStorage.removeItem('trekquest_current_user_email');
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

  /**
   * Strict Account Registration:
   * Enforces that an email (e.g. Gmail) can only be registered ONCE.
   */
  const registerWithCredentials = async ({ email, password, name, role = 'hiker' }) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please provide a valid email address.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const accounts = getRegisteredAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`The email "${cleanEmail}" is already registered. Each account can only use an email once. Please log in instead.`);
    }

    const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.hiker;
    const newAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      password,
      full_name: (name || '').trim() || cleanEmail.split('@')[0],
      role,
      roleTitle: roleCfg.roleTitle,
      badge: roleCfg.badge,
      photo_url: '',
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    localStorage.setItem('trekquest_registered_accounts', JSON.stringify(accounts));
    localStorage.setItem('trekquest_current_user_email', cleanEmail);

    const session = {
      id: newAccount.id,
      full_name: newAccount.full_name,
      email: newAccount.email,
      role: newAccount.role,
      roleTitle: newAccount.roleTitle,
      badge: newAccount.badge,
      photo_url: newAccount.photo_url,
      cachedAt: Date.now(),
    };

    setCachedUser(session);
    localStorage.setItem('trekquest_cached_session', JSON.stringify(session));
    return session;
  };

  /**
   * Account Sign In:
   * Validates email exists in registry and password matches.
   */
  const signInWithCredentials = async ({ email, password }) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const accounts = getRegisteredAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      throw new Error(`No account found for "${cleanEmail}". Please check your email or click Sign Up to create an account.`);
    }

    if (account.password && account.password !== password) {
      throw new Error('Incorrect password. Please verify your password and try again.');
    }

    localStorage.setItem('trekquest_current_user_email', cleanEmail);

    const role = account.role || 'hiker';
    const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.hiker;

    const session = {
      id: account.id,
      full_name: account.full_name,
      email: account.email,
      role,
      roleTitle: account.roleTitle || roleCfg.roleTitle,
      badge: account.badge || roleCfg.badge,
      photo_url: account.photo_url || '',
      cachedAt: Date.now(),
    };

    setCachedUser(session);
    localStorage.setItem('trekquest_cached_session', JSON.stringify(session));
    return session;
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
        registerWithCredentials,
        signInWithCredentials,
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
