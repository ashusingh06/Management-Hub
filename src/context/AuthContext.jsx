import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('mghub_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const loginAdmin = async (email, password) => {
    setLoading(true);
    const sanitizedEmail = email.trim().toLowerCase();

    if (sanitizedEmail !== 'aashishsinghh06@gmail.com') {
      setLoading(false);
      return { success: false, message: 'Access Denied: Only aashishsinghh06@gmail.com is authorized as Administrator.' };
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sanitizedEmail, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userObj = {
          email: sanitizedEmail,
          role: 'admin',
          token: data.token || 'mghub_admin_jwt_2026',
          loggedInAt: new Date().toISOString()
        };
        setCurrentUser(userObj);
        localStorage.setItem('mghub_auth_user', JSON.stringify(userObj));
        setLoading(false);
        return { success: true, user: userObj };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'Invalid administrator passcode' };
      }
    } catch (err) {
      // Offline fallback: allow default passcode
      if (password === 'admin2026' || password === 'admin' || password === 'aashish2026') {
        const userObj = {
          email: sanitizedEmail,
          role: 'admin',
          token: 'mghub_admin_jwt_2026',
          loggedInAt: new Date().toISOString()
        };
        setCurrentUser(userObj);
        localStorage.setItem('mghub_auth_user', JSON.stringify(userObj));
        setLoading(false);
        return { success: true, user: userObj };
      }

      setLoading(false);
      return { success: false, message: 'Authentication failed. Please check your passcode.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mghub_auth_user');
    sessionStorage.removeItem('mghub_admin_auth');
  };

  const isAdmin = Boolean(currentUser && currentUser.role === 'admin' && currentUser.email === 'aashishsinghh06@gmail.com');

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loginAdmin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
