import React, { useState } from 'react';
import { Shield, X, Lock } from 'lucide-react';

export default function AdminModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('aashishsinghh06@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (email.trim().toLowerCase() !== 'aashishsinghh06@gmail.com') {
      setError('Access restricted to aashishsinghh06@gmail.com');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        sessionStorage.setItem('mghub_admin_auth', 'true');
        onLoginSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Invalid passcode');
      }
    } catch (err) {
      // Offline fallback: verify default passcode
      if (password === 'admin2026' || password === 'admin' || password === 'aashish2026') {
        sessionStorage.setItem('mghub_admin_auth', 'true');
        onLoginSuccess();
        onClose();
      } else {
        setError('Invalid admin passcode (Default: admin2026)');
      }
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="pill-tag" style={{ margin: 0 }}>
            <Shield size={12} />
            <span>Admin Authentication</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '14px 0 6px 0' }}>Administrator Access</h3>
        <p style={{ fontSize: '13.5px', color: '#71717a', marginBottom: '20px' }}>
          Authorized portal for <strong>aashishsinghh06@gmail.com</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group-calc">
            <label>Admin Email</label>
            <input 
              type="email" 
              value={email} 
              readOnly 
              style={{ background: '#f4f4f5', fontWeight: 600 }} 
            />
          </div>

          <div className="form-group-calc">
            <label>Admin Passcode</label>
            <input 
              type="password" 
              placeholder="Enter passcode (e.g. admin2026)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '14px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-hero-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            <Lock size={15} />
            <span>{loading ? 'Authenticating...' : 'Enter Admin Dashboard'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
