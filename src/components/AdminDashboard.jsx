import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  FileText, 
  Upload, 
  Trash2, 
  Edit3, 
  Search, 
  ExternalLink, 
  CheckCircle, 
  RefreshCw,
  LogOut,
  DownloadCloud
} from 'lucide-react';

export default function AdminDashboard({ courses, onUpdateCourses, onLogout }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [courseSearch, setCourseSearch] = useState('');
  const [pdfSearch, setPdfSearch] = useState('');
  const [analytics, setAnalytics] = useState({ metrics: {}, search_logs: [] });
  
  // PDF Upload Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [targetCourse, setTargetCourse] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Course Edit/Create Modal State
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formCode, setFormCode] = useState('');
  const [formLevel, setFormLevel] = useState('foundation');
  const [formTitle, setFormTitle] = useState('');
  const [formCredits, setFormCredits] = useState(4);
  const [formPrereqs, setFormPrereqs] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAnalytics();
  }, [courses]);

  // Open PDF Modal
  const openPdfModal = (course) => {
    setTargetCourse(course);
    setPdfUrl(course.pdf_url && !course.pdf_url.startsWith('/uploads/') ? course.pdf_url : '');
    setPdfFile(null);
    setPdfModalOpen(true);
  };

  // Handle PDF Upload / Attach
  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!targetCourse) return;
    if (!pdfFile && !pdfUrl) {
      alert('Please select a local PDF file or enter an external document URL.');
      return;
    }

    setIsUploading(true);

    try {
      if (pdfFile) {
        const formData = new FormData();
        formData.append('course_code', targetCourse.code);
        formData.append('pdf_file', pdfFile);
        if (pdfUrl) formData.append('pdf_url', pdfUrl);

        const res = await fetch('/api/admin/courses/upload-pdf', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          // Update in local state
          const updated = courses.map(c => c.code === targetCourse.code ? { ...c, pdf_url: data.pdf_url } : c);
          onUpdateCourses(updated);
          alert(`✓ PDF uploaded successfully for ${targetCourse.code}!`);
        }
      } else if (pdfUrl) {
        const res = await fetch('/api/admin/courses/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_code: targetCourse.code, pdf_url: pdfUrl })
        });

        if (res.ok) {
          const updated = courses.map(c => c.code === targetCourse.code ? { ...c, pdf_url: pdfUrl } : c);
          onUpdateCourses(updated);
          alert(`✓ PDF URL saved for ${targetCourse.code}!`);
        }
      }
    } catch (err) {
      // Local fallback for offline mode
      const simulatedUrl = pdfFile ? URL.createObjectURL(pdfFile) : pdfUrl;
      const updated = courses.map(c => c.code === targetCourse.code ? { ...c, pdf_url: simulatedUrl } : c);
      onUpdateCourses(updated);
      alert(`✓ PDF saved locally for ${targetCourse.code}!`);
    }

    setIsUploading(false);
    setPdfModalOpen(false);
  };

  // Remove PDF
  const handleRemovePdf = async (courseCode) => {
    if (!confirm(`Remove PDF attachment from ${courseCode}?`)) return;

    try {
      await fetch(`/api/admin/courses/remove-pdf/${courseCode}`, { method: 'POST' });
    } catch (e) {}

    const updated = courses.map(c => c.code === courseCode ? { ...c, pdf_url: '' } : c);
    onUpdateCourses(updated);
    if (targetCourse && targetCourse.code === courseCode) {
      setPdfModalOpen(false);
    }
  };

  // Open Course Edit/Create Modal
  const openCreateModal = () => {
    setEditingCourse(null);
    setFormCode('');
    setFormLevel('foundation');
    setFormTitle('');
    setFormCredits(4);
    setFormPrereqs('');
    setFormDesc('');
    setCourseModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormCode(course.code);
    setFormLevel(course.level);
    setFormTitle(course.title);
    setFormCredits(course.credits || 4);
    setFormPrereqs(Array.isArray(course.prerequisites) ? course.prerequisites.join(', ') : '');
    setFormDesc(course.description || '');
    setCourseModalOpen(true);
  };

  // Handle Save Course
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    const prereqArray = formPrereqs.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    if (editingCourse) {
      // Update
      const updatedCourse = {
        ...editingCourse,
        code: formCode.toUpperCase().trim(),
        level: formLevel,
        title: formTitle.trim(),
        credits: parseInt(formCredits) || 4,
        prerequisites: prereqArray,
        description: formDesc.trim()
      };

      try {
        await fetch(`/api/admin/courses/update/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCourse)
        });
      } catch (e) {}

      const updatedList = courses.map(c => c.id === editingCourse.id ? updatedCourse : c);
      onUpdateCourses(updatedList);
    } else {
      // Create
      const newCourse = {
        id: Date.now(),
        code: formCode.toUpperCase().trim(),
        level: formLevel,
        title: formTitle.trim(),
        credits: parseInt(formCredits) || 4,
        prerequisites: prereqArray,
        description: formDesc.trim(),
        pdf_url: ''
      };

      try {
        await fetch('/api/admin/courses/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCourse)
        });
      } catch (e) {}

      onUpdateCourses([newCourse, ...courses]);
    }

    setCourseModalOpen(false);
  };

  // Delete Course
  const handleDeleteCourse = async (course) => {
    if (!confirm(`Permanently delete ${course.code} - ${course.title}?`)) return;

    try {
      await fetch(`/api/admin/courses/delete/${course.id}`, { method: 'DELETE' });
    } catch (e) {}

    const updated = courses.filter(c => c.id !== course.id);
    onUpdateCourses(updated);
  };

  // Reset to default 52 courses
  const handleResetDefault = async () => {
    if (!confirm('Reset curriculum to default 52 courses?')) return;
    try {
      const res = await fetch('/api/admin/reset-courses', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onUpdateCourses(data.courses);
        alert('Curriculum reset to standard 52 courses.');
      }
    } catch (e) {}
  };

  // Filter tables
  const filteredCourses = courses.filter(c => {
    const q = courseSearch.toLowerCase().trim();
    if (!q) return true;
    return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.level.toLowerCase().includes(q);
  });

  const filteredPdfCourses = courses.filter(c => {
    const q = pdfSearch.toLowerCase().trim();
    if (!q) return true;
    return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  const pdfAttachedCount = courses.filter(c => c.pdf_url && c.pdf_url.trim().length > 0).length;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafc', paddingBottom: '60px' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e4e4e7',
        padding: '16px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={20} />
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>[Management Hub] Admin Portal</h2>
          <span style={{ fontSize: '11.5px', background: '#f4f4f5', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
            Master Control
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#09090b', background: '#fafafc', border: '1px solid #e4e4e7', padding: '6px 14px', borderRadius: '9999px' }}>
            👑 aashishsinghh06@gmail.com
          </span>

          <button 
            onClick={onLogout}
            style={{
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ef4444',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '6px 14px',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={13} />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', borderBottom: '1px solid #e4e4e7', paddingBottom: '12px' }}>
          <button 
            className={`filter-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Course Catalog ({courses.length})
          </button>

          <button 
            className={`filter-btn ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdf')}
          >
            📄 PDF Notes Manager ({pdfAttachedCount}/{courses.length})
          </button>

          <button 
            className={`filter-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Search Trends & Logs
          </button>

          <button 
            className={`filter-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            System Maintenance
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: '6px' }}>Total Courses</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{courses.length}</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: '6px' }}>PDF Notes Attached</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>{pdfAttachedCount}</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: '6px' }}>Logged Searches</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{analytics.metrics.total_search_queries || 0}</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: '6px' }}>Missing Notes</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{courses.length - pdfAttachedCount}</div>
          </div>
        </div>

        {/* Tab 1: Course Catalog */}
        {activeTab === 'courses' && (
          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <input
                type="text"
                className="notes-search-input"
                style={{ width: '320px', padding: '10px 16px', fontSize: '13.5px' }}
                placeholder="Filter by code, title, tier..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
              />

              <button 
                className="btn-hero-primary"
                style={{ padding: '9px 18px', fontSize: '13.5px' }}
                onClick={openCreateModal}
              >
                <Plus size={15} />
                <span>Add New Course</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#fafafc', borderBottom: '1px solid #e4e4e7', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Code</th>
                    <th style={{ padding: '12px 16px' }}>Level</th>
                    <th style={{ padding: '12px 16px' }}>Title</th>
                    <th style={{ padding: '12px 16px' }}>Credits</th>
                    <th style={{ padding: '12px 16px' }}>PDF Status</th>
                    <th style={{ padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(c => {
                    const hasPdf = Boolean(c.pdf_url && c.pdf_url.trim().length > 0);
                    return (
                      <tr key={c.id || c.code} style={{ borderBottom: '1px solid #f4f4f5' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.code}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`level-badge badge-${c.level}`}>{c.level}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.title}</td>
                        <td style={{ padding: '14px 16px' }}>{c.credits || 4}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {hasPdf ? (
                            <a 
                              href={c.pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="pdf-indicator"
                              style={{ textDecoration: 'none' }}
                            >
                              <span>📄 Linked ↗</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#a1a1aa', background: '#f4f4f5', padding: '2px 8px', borderRadius: '4px' }}>
                              No PDF
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => openPdfModal(c)}
                              style={{ background: '#ffffff', border: '1px solid #09090b', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {hasPdf ? 'Edit PDF' : 'Add PDF'}
                            </button>
                            <button 
                              onClick={() => openEditModal(c)}
                              style={{ background: '#f4f4f5', border: '1px solid #e4e4e7', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteCourse(c)}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: PDF Notes Manager */}
        {activeTab === 'pdf' && (
          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Curriculum Notes & Study Material Uploader</h3>
                <p style={{ fontSize: '13px', color: '#71717a' }}>Attach local PDF files or external Google Drive document links to any course.</p>
              </div>

              <input
                type="text"
                className="notes-search-input"
                style={{ width: '300px', padding: '9px 14px', fontSize: '13px' }}
                placeholder="Filter courses..."
                value={pdfSearch}
                onChange={(e) => setPdfSearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#fafafc', borderBottom: '1px solid #e4e4e7', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Code</th>
                    <th style={{ padding: '12px 16px' }}>Course Title</th>
                    <th style={{ padding: '12px 16px' }}>Current Attached Material</th>
                    <th style={{ padding: '12px 16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPdfCourses.map(c => {
                    const hasPdf = Boolean(c.pdf_url && c.pdf_url.trim().length > 0);
                    return (
                      <tr key={c.id || c.code} style={{ borderBottom: '1px solid #f4f4f5' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.code}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.title}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {hasPdf ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="pdf-indicator">✓ Active PDF Attached</span>
                              <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontSize: '12px', textDecoration: 'underline' }}>
                                View File ↗
                              </a>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Missing Notes File</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button 
                            onClick={() => openPdfModal(c)}
                            style={{
                              background: '#09090b',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Upload size={12} />
                            <span>{hasPdf ? 'Replace / Manage PDF' : 'Upload PDF'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Search Analytics */}
        {activeTab === 'analytics' && (
          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Student Search Queries & Trends</h3>
              <button 
                onClick={fetchAnalytics}
                style={{ background: '#f4f4f5', border: '1px solid #e4e4e7', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#fafafc', borderBottom: '1px solid #e4e4e7', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Query Term</th>
                  <th style={{ padding: '12px 16px' }}>Results Count</th>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {analytics.search_logs && analytics.search_logs.length > 0 ? (
                  analytics.search_logs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f4f4f5' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.query}</td>
                      <td style={{ padding: '12px 16px' }}>{log.results_count} results</td>
                      <td style={{ padding: '12px 16px', color: '#71717a' }}>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#a1a1aa' }}>
                      No search logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: System Maintenance */}
        {activeTab === 'maintenance' && (
          <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '16px', padding: '24px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>Database Maintenance</h3>
            <p style={{ fontSize: '13.5px', color: '#71717a', marginBottom: '24px' }}>Restore baseline data or download backups.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#fafafc', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '18px' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Re-Seed 52 Default IITM Courses</strong>
                <span style={{ fontSize: '12.5px', color: '#71717a', display: 'block', marginBottom: '12px' }}>
                  Reset catalog back to the official IIT Madras BS Management and Data Science curriculum.
                </span>
                <button 
                  onClick={handleResetDefault}
                  style={{ background: '#09090b', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Restore 52 Courses
                </button>
              </div>

              <div style={{ background: '#fafafc', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '18px' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Download Catalog JSON Backup</strong>
                <span style={{ fontSize: '12.5px', color: '#71717a', display: 'block', marginBottom: '12px' }}>
                  Export all course descriptions, credits, prerequisites, and PDF links as a single JSON file.
                </span>
                <button 
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(courses, null, 2));
                    const a = document.createElement('a');
                    a.href = dataStr;
                    a.download = "management_hub_courses_backup.json";
                    a.click();
                  }}
                  style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Download JSON Backup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF Upload Modal */}
      {pdfModalOpen && targetCourse && (
        <div className="modal-overlay" onClick={() => setPdfModalOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Manage PDF for {targetCourse.code}</h3>
              <button className="btn-close-modal" onClick={() => setPdfModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handlePdfSubmit}>
              <div className="form-group-calc">
                <label>Target Course</label>
                <input 
                  type="text" 
                  value={`${targetCourse.code} - ${targetCourse.title}`} 
                  readOnly 
                  style={{ background: '#f4f4f5', fontWeight: 700 }} 
                />
              </div>

              {/* Local File */}
              <div className="form-group-calc">
                <label>Option A: Choose PDF File (.pdf)</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  style={{ padding: '8px' }}
                />
                {pdfFile && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Selected: {pdfFile.name}</span>}
              </div>

              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#a1a1aa', margin: '10px 0' }}>— OR —</div>

              {/* Online URL */}
              <div className="form-group-calc">
                <label>Option B: Google Drive / Web PDF Link</label>
                <input 
                  type="url" 
                  placeholder="https://drive.google.com/... or https://domain.com/notes.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                />
              </div>

              {targetCourse.pdf_url && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#166534' }}>Current PDF Attached</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemovePdf(targetCourse.code)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Remove PDF ✕
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-hero-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading & Attaching...' : 'Save PDF to Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Course Edit/Create Modal */}
      {courseModalOpen && (
        <div className="modal-overlay" onClick={() => setCourseModalOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                {editingCourse ? `Edit Course (${editingCourse.code})` : 'Add New Course'}
              </h3>
              <button className="btn-close-modal" onClick={() => setCourseModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCourseSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-calc">
                  <label>Course Code</label>
                  <input 
                    type="text" 
                    value={formCode} 
                    onChange={(e) => setFormCode(e.target.value)} 
                    placeholder="e.g. CS102"
                    required 
                    readOnly={Boolean(editingCourse)}
                  />
                </div>

                <div className="form-group-calc">
                  <label>Level / Tier</label>
                  <select value={formLevel} onChange={(e) => setFormLevel(e.target.value)}>
                    <option value="foundation">Foundation</option>
                    <option value="diploma">Diploma</option>
                    <option value="bs">BS</option>
                    <option value="elective">Elective</option>
                  </select>
                </div>
              </div>

              <div className="form-group-calc">
                <label>Course Title</label>
                <input 
                  type="text" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  placeholder="e.g. Machine Learning Systems"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-calc">
                  <label>Credits</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="8" 
                    value={formCredits} 
                    onChange={(e) => setFormCredits(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group-calc">
                  <label>Prerequisites (Comma separated)</label>
                  <input 
                    type="text" 
                    value={formPrereqs} 
                    onChange={(e) => setFormPrereqs(e.target.value)} 
                    placeholder="e.g. CS101, MATH101"
                  />
                </div>
              </div>

              <div className="form-group-calc">
                <label>Description</label>
                <textarea 
                  rows="3" 
                  value={formDesc} 
                  onChange={(e) => setFormDesc(e.target.value)} 
                  placeholder="Course overview and syllabus concepts..."
                  style={{ width: '100%', padding: '10px 14px', fontFamily: 'inherit', borderRadius: '10px', border: '1px solid #e4e4e7' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-hero-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
