import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import CourseCard from './CourseCard';

export default function CourseGrid({ courses, onOpenModal, bookmarks }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Compute tier counts
  const counts = {
    all: courses.length,
    foundation: courses.filter(c => c.level === 'foundation').length,
    diploma: courses.filter(c => c.level === 'diploma').length,
    bs: courses.filter(c => c.level === 'bs').length,
    elective: courses.filter(c => c.level === 'elective').length,
    bookmarks: bookmarks ? bookmarks.size : 0
  };

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    // 1. Level Filter
    let matchesLevel = true;
    if (activeFilter === 'bookmarks') {
      matchesLevel = bookmarks ? bookmarks.has(c.code) : false;
    } else if (activeFilter !== 'all') {
      matchesLevel = c.level.toLowerCase() === activeFilter.toLowerCase();
    }

    // 2. Search Query Filter
    const query = searchQuery.toLowerCase().trim();
    let matchesSearch = true;
    if (query) {
      matchesSearch = 
        c.code.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query);
    }

    return matchesLevel && matchesSearch;
  });

  return (
    <section className="page-section" id="notes">
      <div className="content-wrapper">
        <div className="section-header">
          <div className="pill-tag">Curriculum Repository</div>
          <h2>52 Course Notes & Study Material</h2>
          <p className="subtitle">Instant search, prerequisite validation, and direct PDF downloads across all tiers.</p>
        </div>

        {/* Controls */}
        <div className="notes-controls">
          <div className="search-box-row">
            <Search className="search-icon-svg" />
            <input
              type="text"
              className="notes-search-input"
              placeholder="Search by course code, keyword, or title (e.g. MATH101, Python, Finance)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-pills-container">
            <button
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>All Courses</span>
              <span className="filter-count-badge">{counts.all}</span>
            </button>

            <button
              className={`filter-btn ${activeFilter === 'foundation' ? 'active' : ''}`}
              onClick={() => setActiveFilter('foundation')}
            >
              <span>Foundation</span>
              <span className="filter-count-badge">{counts.foundation}</span>
            </button>

            <button
              className={`filter-btn ${activeFilter === 'diploma' ? 'active' : ''}`}
              onClick={() => setActiveFilter('diploma')}
            >
              <span>Diploma</span>
              <span className="filter-count-badge">{counts.diploma}</span>
            </button>

            <button
              className={`filter-btn ${activeFilter === 'bs' ? 'active' : ''}`}
              onClick={() => setActiveFilter('bs')}
            >
              <span>BS Degree</span>
              <span className="filter-count-badge">{counts.bs}</span>
            </button>

            <button
              className={`filter-btn ${activeFilter === 'elective' ? 'active' : ''}`}
              onClick={() => setActiveFilter('elective')}
            >
              <span>Electives</span>
              <span className="filter-count-badge">{counts.elective}</span>
            </button>

            <button
              className={`filter-btn ${activeFilter === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveFilter('bookmarks')}
            >
              <span>★ Saved</span>
              <span className="filter-count-badge">{counts.bookmarks}</span>
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#71717a' }}>
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        </div>

        {/* Course Cards Grid */}
        {filteredCourses.length > 0 ? (
          <div className="course-grid">
            {filteredCourses.map((c) => (
              <CourseCard key={c.id || c.code} course={c} onOpenModal={onOpenModal} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>No matching courses found</h3>
            <p style={{ fontSize: '13.5px', color: '#71717a', marginBottom: '16px' }}>Try adjusting your search keywords or tier filter.</p>
            <button 
              className="btn-card-view" 
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
