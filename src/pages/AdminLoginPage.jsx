import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('aashishsinghh06@gmail.com');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { loginAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const res = await loginAdmin(email, password);
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.08)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="pill-tag" style={{ background: '#09090b', color: '#ffffff', border: '1px solid #09090b', marginBottom: '14px' }}>
            <Shield size={12} />
            <span>Role-Based Access Control</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Administrator Login
          </h2>

          <p style={{ fontSize: '13.5px', color: '#71717a', lineHeight: 1.5 }}>
            Access to curriculum management, PDF uploads, and system diagnostics is strictly restricted to <strong>aashishsinghh06@gmail.com</strong>.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group-calc">
            <label>Admin Account Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aashishsinghh06@gmail.com"
              required
            />
          </div>

          <div className="form-group-calc">
            <label>Admin Passcode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passcode (e.g. admin2026)"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-hero-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '10px' }}
            disabled={loading}
          >
            <Lock size={15} />
            <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f4f4f5' }}>
          <Link
            to="/"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#71717a',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Student Main Platform</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
