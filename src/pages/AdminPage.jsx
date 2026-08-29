import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import { ArrowLeft } from 'lucide-react';

export default function AdminPage({ courses, onUpdateCourses }) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div>
      {/* Floating Quick Bar to view Student Platform */}
      <div style={{
        background: '#09090b',
        color: '#ffffff',
        padding: '8px 24px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>👑 Administrator Mode Active (Authenticated as <strong>{currentUser?.email}</strong>)</span>
        <Link 
          to="/" 
          style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={12} />
          <span>Switch to Student Platform View</span>
        </Link>
      </div>

      <AdminDashboard
        courses={courses}
        onUpdateCourses={onUpdateCourses}
        onLogout={handleLogout}
      />
    </div>
  );
}
