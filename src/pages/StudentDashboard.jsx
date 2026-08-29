import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Pillars from '../components/Pillars';
import Calculators from '../components/Calculators';
import CourseGrid from '../components/CourseGrid';
import CourseModal from '../components/CourseModal';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard({ courses, bookmarks, onToggleBookmark }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { isAdmin, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleAdminNavigation = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <div className="app-container">
      {/* If Admin is logged in, show floating Admin Access bar */}
      {isAdmin && (
        <div style={{
          background: '#09090b',
          color: '#ffffff',
          padding: '8px 24px',
          fontSize: '12.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={13} />
            <span>Logged in as Admin: <strong>{currentUser?.email}</strong></span>
          </div>
          <Link
            to="/admin"
            style={{
              color: '#ffffff',
              background: '#27272a',
              padding: '3px 10px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '11.5px'
            }}
          >
            Open Admin Dashboard ↗
          </Link>
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={handleAdminNavigation}
      />

      <main className="main-content">
        <Hero />
        <Pillars />
        <Calculators />
        <CourseGrid
          courses={courses}
          onOpenModal={(c) => setSelectedCourse(c)}
          bookmarks={bookmarks}
        />
      </main>

      <Footer onOpenAdmin={handleAdminNavigation} />

      {/* Course Detail & PDF Download Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onToggleBookmark={onToggleBookmark}
          isBookmarked={bookmarks.has(selectedCourse.code)}
        />
      )}
    </div>
  );
}
