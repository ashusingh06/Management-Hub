import React from 'react';
import { Download, FileText } from 'lucide-react';

export default function CourseCard({ course, onOpenModal }) {
  const hasPdf = Boolean(course.pdf_url && course.pdf_url.trim().length > 0);
  const levelLabel = course.level.charAt(0).toUpperCase() + course.level.slice(1);

  const handleDownloadClick = (e) => {
    if (hasPdf) {
      // Allow natural link opening in new tab
    } else {
      e.preventDefault();
      onOpenModal(course);
    }
  };

  return (
    <div className="course-card">
      <div className="card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`level-badge badge-${course.level}`}>{levelLabel}</span>
          {hasPdf && (
            <span className="pdf-indicator" title="Curriculum Study Notes PDF Attached">
              <FileText size={11} />
              <span>PDF</span>
            </span>
          )}
        </div>
        <span className="card-code">{course.code}</span>
      </div>

      <h3 className="card-title">{course.title}</h3>
      <p className="card-desc">{course.description}</p>

      <div className="card-footer">
        <button className="btn-card-view" onClick={() => onOpenModal(course)}>
          View Details
        </button>

        <a
          href={hasPdf ? course.pdf_url : '#'}
          target={hasPdf ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className={`btn-card-dl ${hasPdf ? 'has-pdf' : ''}`}
          title={hasPdf ? 'Open / Download Attached PDF Notes' : 'View Course Details'}
          onClick={handleDownloadClick}
        >
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}
