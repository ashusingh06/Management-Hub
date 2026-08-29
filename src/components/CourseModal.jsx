import React, { useEffect, useState } from 'react';
import { X, Star, Download, ExternalLink, FileText, CheckCircle } from 'lucide-react';

export default function CourseModal({ course, onClose, onToggleBookmark, isBookmarked }) {
  const [prereqChain, setPrereqChain] = useState([]);
  const [livePdfUrl, setLivePdfUrl] = useState(course?.pdf_url || '');

  useEffect(() => {
    if (!course) return;
    setLivePdfUrl(course.pdf_url || '');

    // Fetch prerequisite chain and latest details
    fetch(`/api/course/${course.code}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.prerequisite_chain) setPrereqChain(data.prerequisite_chain);
          if (data.course && data.course.pdf_url) setLivePdfUrl(data.course.pdf_url);
        }
      })
      .catch(() => {});
  }, [course]);

  if (!course) return null;

  const hasPdf = Boolean(livePdfUrl && livePdfUrl.trim().length > 0);
  const levelLabel = course.level.charAt(0).toUpperCase() + course.level.slice(1);
  const prereqText = course.prerequisites && course.prerequisites.length > 0
    ? course.prerequisites.join(', ')
    : 'None';

  const handleDownload = () => {
    if (hasPdf) {
      window.open(livePdfUrl, '_blank');
    } else {
      alert(`Study notes PDF for ${course.code} will be uploaded soon by the admin.`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`level-badge badge-${course.level}`}>{levelLabel}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>
              {course.code}
            </span>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        <h2 className="modal-course-title">{course.title}</h2>
        <p className="modal-course-desc">{course.description}</p>

        {/* Metadata Grid */}
        <div className="modal-stats-grid">
          <div className="modal-stat-item">
            <span className="modal-stat-label">Credits</span>
            <span className="modal-stat-val">{course.credits || 4} Credits</span>
          </div>
          <div className="modal-stat-item">
            <span className="modal-stat-label">Prerequisites</span>
            <span className="modal-stat-val">{prereqText}</span>
          </div>
          <div className="modal-stat-item">
            <span className="modal-stat-label">Curriculum Tier</span>
            <span className="modal-stat-val">{levelLabel}</span>
          </div>
        </div>

        {/* Dedicated PDF Notes Access Section */}
        <div className={`modal-pdf-banner ${hasPdf ? 'available' : 'empty'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {hasPdf ? (
              <FileText size={28} color="#16a34a" />
            ) : (
              <FileText size={28} color="#a1a1aa" />
            )}
            <div>
              <strong style={{ fontSize: '13.5px', display: 'block', color: hasPdf ? '#166534' : '#52525b' }}>
                {hasPdf ? 'Official Course Notes PDF Attached' : 'No PDF Notes Attached Yet'}
              </strong>
              <span style={{ fontSize: '12px', color: hasPdf ? '#15803d' : '#71717a' }}>
                {hasPdf ? 'Click button to open and view the document' : 'Notes will be uploaded by the instructor/admin.'}
              </span>
            </div>
          </div>

          {hasPdf && (
            <a 
              href={livePdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-pdf-open"
            >
              <span>Open PDF</span>
              <ExternalLink size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </a>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer-actions">
          <button 
            className={`btn-modal-bookmark ${isBookmarked ? 'saved' : ''}`}
            onClick={() => onToggleBookmark(course.code)}
          >
            <Star size={15} fill={isBookmarked ? '#ffffff' : 'none'} />
            <span>{isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Course'}</span>
          </button>

          <button className="btn-modal-download-cta" onClick={handleDownload}>
            <Download size={15} />
            <span>Download Notes PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
