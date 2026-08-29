import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/StudentDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import { DEFAULT_COURSES } from './data/defaultCourses';

export default function App() {
  const [courses, setCourses] = useState(DEFAULT_COURSES);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('mghub_user_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Fetch live courses from API on load
  const fetchLiveCourses = async () => {
    try {
      const res = await fetch('/api/courses?level=all');
      if (res.ok) {
        const data = await res.json();
        if (data.courses && data.courses.length > 0) {
          setCourses(data.courses);
        }
      }
    } catch (e) {
      // Offline fallback: keep DEFAULT_COURSES
    }
  };

  useEffect(() => {
    fetchLiveCourses();
  }, []);

  // Toggle Bookmark
  const toggleBookmark = (courseCode) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(courseCode)) {
        next.delete(courseCode);
      } else {
        next.add(courseCode);
      }
      localStorage.setItem('mghub_user_bookmarks', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. Public Student Platform Route */}
          <Route
            path="/"
            element={
              <StudentDashboard
                courses={courses}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark}
              />
            }
          />

          {/* 2. Admin Authentication Route */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* 3. Protected Role-Based Admin Dashboard Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage
                  courses={courses}
                  onUpdateCourses={(updated) => setCourses(updated)}
                />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
