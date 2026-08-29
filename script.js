document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const navIndicator = document.getElementById('navIndicator');
  const navLinks = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.page-section');

  let isManualScrolling = false;
  let scrollTimeout = null;

  /**
   * Updates the position and width of the active pill indicator
   */
  function updateIndicator(targetLink) {
    if (!targetLink || !navIndicator || !navbar) return;

    const navRect = navbar.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();

    const left = linkRect.left - navRect.left;
    const width = linkRect.width;

    navIndicator.style.transform = `translateX(${left}px)`;
    navIndicator.style.width = `${width}px`;

    if (!navIndicator.classList.contains('ready')) {
      navIndicator.classList.add('ready');
    }
  }

  /**
   * Set Active Navigation Link
   */
  function setActiveLink(targetId) {
    navLinks.forEach((link) => {
      const match = link.getAttribute('data-target') === targetId;
      link.classList.toggle('active', match);
      if (match) {
        updateIndicator(link);
      }
    });
  }

  // Smooth scroll click handler for nav links and CTA buttons
  document.querySelectorAll('a[href^="#"], .nav-btn').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('data-target') || link.getAttribute('href')?.replace('#', '');
      if (!targetId) return;

      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        e.preventDefault();
        isManualScrolling = true;
        setActiveLink(targetId);

        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isManualScrolling = false;
        }, 800);
      }
    });
  });

  /**
   * Scrollspy: Track active section based on viewport position
   */
  function onScroll() {
    if (isManualScrolling) return;

    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
      siteHeader.classList.toggle('scrolled', scrollY > 15);
    }
    const offset = 120; // Distance from top to consider section active

    let currentSectionId = sections[0]?.id || 'home';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - offset;
      const sectionHeight = section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.id;
      }
    });

    // Check if at the bottom of the page
    if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 30) {
      currentSectionId = sections[sections.length - 1].id;
    }

    const activeBtn = document.querySelector(`.nav-btn[data-target="${currentSectionId}"]`);
    if (activeBtn && !activeBtn.classList.contains('active')) {
      setActiveLink(currentSectionId);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial indicator positioning
  const initialActive = document.querySelector('.nav-btn.active') || navLinks[0];
  if (initialActive) {
    updateIndicator(initialActive);
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    const currentActive = document.querySelector('.nav-btn.active');
    if (currentActive) {
      updateIndicator(currentActive);
    }
  });

  /* ==========================================================================
     Live Interactive Calculators (CGPA Calculator & Grade Predictor)
     ========================================================================== */
  
  // 1. CGPA Calculator with Backend API Sync
  const currentCgpaInput = document.getElementById('currentCgpa');
  const totalCreditsInput = document.getElementById('totalCredits');
  const newGpaInput = document.getElementById('newGpa');
  const newCreditsInput = document.getElementById('newCredits');
  const cgpaOutput = document.getElementById('cgpaOutput');

  async function calculateCGPA() {
    if (!currentCgpaInput || !totalCreditsInput || !newGpaInput || !newCreditsInput || !cgpaOutput) return;

    const curCgpa = parseFloat(currentCgpaInput.value) || 0;
    const curCredits = parseFloat(totalCreditsInput.value) || 0;
    const nGpa = parseFloat(newGpaInput.value) || 0;
    const nCredits = parseFloat(newCreditsInput.value) || 0;

    const sumCredits = curCredits + nCredits;
    if (sumCredits <= 0) {
      cgpaOutput.textContent = '0.00';
      return;
    }

    const predicted = ((curCgpa * curCredits) + (nGpa * nCredits)) / sumCredits;
    cgpaOutput.textContent = Math.min(10, Math.max(0, predicted)).toFixed(2);

    // Optional background sync with Backend SQLite DB
    try {
      fetch('/api/cgpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_cgpa: curCgpa,
          current_credits: curCredits,
          new_gpa: nGpa,
          new_credits: nCredits
        })
      }).catch(() => {});
    } catch (e) {}
  }

  [currentCgpaInput, totalCreditsInput, newGpaInput, newCreditsInput].forEach((input) => {
    if (input) {
      input.addEventListener('input', calculateCGPA);
    }
  });

  // 2. Grade Predictor with Backend API Sync
  const internalMarksInput = document.getElementById('internalMarks');
  const targetGradeSelect = document.getElementById('targetGrade');
  const gradePredictorOutput = document.getElementById('gradePredictorOutput');

  function calculateGradeRequirement() {
    if (!internalMarksInput || !targetGradeSelect || !gradePredictorOutput) return;

    const internal = parseFloat(internalMarksInput.value) || 0;
    const target = parseFloat(targetGradeSelect.value) || 80;

    const requiredEndTerm = target - internal;

    if (requiredEndTerm <= 0) {
      gradePredictorOutput.textContent = 'Achieved (0 / 50)';
    } else if (requiredEndTerm > 50) {
      gradePredictorOutput.textContent = `Need ${Math.ceil(requiredEndTerm)} (>50 max)`;
    } else {
      gradePredictorOutput.textContent = `${Math.ceil(requiredEndTerm)} / 50`;
    }
  }

  if (internalMarksInput && targetGradeSelect) {
    internalMarksInput.addEventListener('input', calculateGradeRequirement);
    targetGradeSelect.addEventListener('change', calculateGradeRequirement);
  }

  /* ==========================================================================
     Bookmarks Storage & State Manager
     ========================================================================== */
  let userBookmarks = new Set(JSON.parse(localStorage.getItem('mghub_bookmarks') || '[]'));

  function updateBookmarkBadges() {
    const badge = document.getElementById('count-bookmarks');
    if (badge) {
      badge.textContent = userBookmarks.size;
    }
  }

  async function toggleBookmark(courseCode) {
    courseCode = courseCode.toUpperCase().trim();
    if (userBookmarks.has(courseCode)) {
      userBookmarks.delete(courseCode);
    } else {
      userBookmarks.add(courseCode);
    }
    localStorage.setItem('mghub_bookmarks', JSON.stringify(Array.from(userBookmarks)));
    updateBookmarkBadges();

    // Sync with backend SQLite
    try {
      fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_code: courseCode })
      }).catch(() => {});
    } catch (e) {}

    filterCourses();
  }

  updateBookmarkBadges();

  /* ==========================================================================
     Course Details Modal Manager (Clean Academic Overview with Notes & PYQs)
     ========================================================================== */
  const courseModal = document.getElementById('courseModal');
  const modalClose = document.getElementById('modalClose');
  const modalCloseFooterBtn = document.getElementById('modalCloseFooterBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalCourseCode = document.getElementById('modalCourseCode');
  const modalLevelBadge = document.getElementById('modalLevelBadge');
  const modalBookmarkBtn = document.getElementById('modalBookmarkBtn');
  const modalBookmarkIcon = document.getElementById('modalBookmarkIcon');
  const modalBookmarkText = document.getElementById('modalBookmarkText');

  // Study Notes Modal Elements
  const modalNotesStatusBadge = document.getElementById('modalNotesStatusBadge');
  const modalNotesAvailableBox = document.getElementById('modalNotesAvailableBox');
  const modalNotesEmptyBox = document.getElementById('modalNotesEmptyBox');
  const modalNotesFileName = document.getElementById('modalNotesFileName');
  const modalNotesFileSize = document.getElementById('modalNotesFileSize');
  const modalOpenNotesDirectBtn = document.getElementById('modalOpenNotesDirectBtn');
  const modalDownloadNotesDirectBtn = document.getElementById('modalDownloadNotesDirectBtn');

  // PYQ Modal Elements
  const modalPyqCountBadge = document.getElementById('modalPyqCountBadge');
  const modalPyqListStack = document.getElementById('modalPyqListStack');
  const modalPyqEmptyBox = document.getElementById('modalPyqEmptyBox');

  let activeModalCourseCode = '';

  async function openCourseModal(courseCode) {
    if (!courseModal) return;
    activeModalCourseCode = courseCode.toUpperCase().trim();

    // 1. Find course in memory or fallback
    let targetCourse = liveCourses.find(c => c.code.toUpperCase() === activeModalCourseCode);

    // Initial DOM population from memory
    if (targetCourse) {
      populateModalData(targetCourse);
    } else {
      const card = document.querySelector(`.course-card[data-code="${activeModalCourseCode}"]`);
      if (card) {
        const cardLevel = card.getAttribute('data-level') || 'foundation';
        if (modalTitle) modalTitle.textContent = card.querySelector('.course-title')?.textContent || activeModalCourseCode;
        if (modalCourseCode) modalCourseCode.textContent = activeModalCourseCode;
        if (modalLevelBadge) modalLevelBadge.textContent = cardLevel.toUpperCase();
      }
    }

    const isSaved = userBookmarks.has(activeModalCourseCode);
    if (modalBookmarkBtn) {
      modalBookmarkBtn.classList.toggle('active', isSaved);
      if (modalBookmarkText) modalBookmarkText.textContent = isSaved ? 'Saved in Bookmarks' : 'Save to Bookmarks';
    }

    courseModal.classList.add('active');

    // 2. Fetch fresh course details (with notes & pyqs) from API
    try {
      const res = await fetch(`/api/course/${activeModalCourseCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.course) {
          targetCourse = data.course;
          populateModalData(targetCourse);
        }
      }
    } catch (e) {}
  }

  function populateModalData(course) {
    if (!course) return;

    if (modalTitle) modalTitle.textContent = course.title;
    if (modalCourseCode) modalCourseCode.textContent = course.code;
    if (modalLevelBadge) modalLevelBadge.textContent = (course.level || 'foundation').toUpperCase();

    // Check Local Storage PDF override
    let localPdf = '';
    try {
      const localMap = JSON.parse(localStorage.getItem('mghub_local_pdfs') || '{}');
      if (localMap[course.code]) localPdf = localMap[course.code];
    } catch (e) {}

    // A. Populate Study Notes Section
    const notesData = course.notes || {};
    const notesUrl = localPdf || notesData.fileUrl || course.pdf_url || '';
    const hasNotes = Boolean(notesData.available || (notesUrl && notesUrl.trim().length > 0));

    if (hasNotes && notesUrl) {
      if (modalNotesAvailableBox) modalNotesAvailableBox.style.display = 'flex';
      if (modalNotesEmptyBox) modalNotesEmptyBox.style.display = 'none';
      if (modalNotesStatusBadge) {
        modalNotesStatusBadge.textContent = 'Available';
        modalNotesStatusBadge.style.color = '#166534';
        modalNotesStatusBadge.style.background = '#f0fdf4';
        modalNotesStatusBadge.style.borderColor = '#bbf7d0';
      }

      const fileName = notesData.title || notesData.fileName || notesUrl.split('/').pop().replace(/_/g, ' ') || `${course.code}_Notes.pdf`;
      if (modalNotesFileName) modalNotesFileName.textContent = fileName;

      if (modalOpenNotesDirectBtn) {
        modalOpenNotesDirectBtn.href = notesUrl;
        modalOpenNotesDirectBtn.target = '_blank';
        modalOpenNotesDirectBtn.rel = 'noopener noreferrer';
      }
      if (modalDownloadNotesDirectBtn) {
        modalDownloadNotesDirectBtn.href = notesUrl;
        modalDownloadNotesDirectBtn.target = '_blank';
        modalDownloadNotesDirectBtn.rel = 'noopener noreferrer';
        modalDownloadNotesDirectBtn.setAttribute('download', fileName);
      }
    } else {
      if (modalNotesAvailableBox) modalNotesAvailableBox.style.display = 'none';
      if (modalNotesEmptyBox) modalNotesEmptyBox.style.display = 'flex';
      if (modalNotesStatusBadge) {
        modalNotesStatusBadge.textContent = 'Coming Soon';
        modalNotesStatusBadge.style.color = '#71717a';
        modalNotesStatusBadge.style.background = '#f4f4f5';
        modalNotesStatusBadge.style.borderColor = '#e4e4e7';
      }
    }

    // B. Populate Previous Year Questions (PYQs) Section
    const pyqList = Array.isArray(course.pyqs) ? course.pyqs : [];
    if (modalPyqCountBadge) {
      modalPyqCountBadge.textContent = `${pyqList.length} Paper${pyqList.length === 1 ? '' : 's'}`;
    }

    if (pyqList.length > 0) {
      if (modalPyqListStack) {
        modalPyqListStack.style.display = 'flex';
        modalPyqListStack.innerHTML = pyqList.map(pyq => {
          const title = pyq.title || `${course.code} — PYQ ${pyq.year || ''}`;
          const fileUrl = pyq.fileUrl || notesUrl || '#';
          const yearTag = pyq.year ? `Year ${pyq.year}` : 'Question Paper';

          return `
            <div class="pyq-item-card">
              <div class="pyq-info">
                <span class="pyq-bullet">•</span>
                <div style="min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <strong class="pyq-title">${title}</strong>
                    <span class="pyq-year-pill">${yearTag}</span>
                  </div>
                </div>
              </div>
              <div class="resource-actions">
                <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-open-pdf">Open PDF ↗</a>
                <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" download="${pyq.fileName || 'PYQ.pdf'}" class="btn-dl-pdf" title="Download ${title}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              </div>
            </div>
          `;
        }).join('');
      }
      if (modalPyqEmptyBox) modalPyqEmptyBox.style.display = 'none';
    } else {
      if (modalPyqListStack) {
        modalPyqListStack.style.display = 'none';
        modalPyqListStack.innerHTML = '';
      }
      if (modalPyqEmptyBox) modalPyqEmptyBox.style.display = 'flex';
    }
  }

  function closeCourseModal() {
    if (courseModal) courseModal.classList.remove('active');
  }

  if (modalClose) modalClose.addEventListener('click', closeCourseModal);
  if (modalCloseFooterBtn) modalCloseFooterBtn.addEventListener('click', closeCourseModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeCourseModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCourseModal();
  });

  if (modalBookmarkBtn) {
    modalBookmarkBtn.addEventListener('click', () => {
      if (!activeModalCourseCode) return;
      toggleBookmark(activeModalCourseCode);
      const isSaved = userBookmarks.has(activeModalCourseCode);
      modalBookmarkBtn.classList.toggle('active', isSaved);
      if (modalBookmarkText) modalBookmarkText.textContent = isSaved ? 'Saved in Bookmarks' : 'Save to Bookmarks';
    });
  }

  /* ==========================================================================
     Notes Search & Dynamic Backend Course Grid Sync (SQLite + DSA Engine)
     ========================================================================== */
  const searchInput = document.getElementById('notesSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterPills = document.querySelectorAll('.filter-pill');
  const notesGrid = document.getElementById('notesGrid');
  const resultsCountText = document.getElementById('resultsCountText');
  const noResultsState = document.getElementById('noResultsState');
  const initialSearchPrompt = document.getElementById('initialSearchPrompt');
  const resetSearchBtn = document.getElementById('resetSearchBtn');
  const resetTierBtn = document.getElementById('resetTierBtn');
  const tierCardsSelector = document.getElementById('tierCardsSelector');
  const quickTagButtons = document.querySelectorAll('.tag-btn');

  let activeLevelFilter = 'select';
  let liveCourses = [];

  async function loadLiveCoursesFromDatabase() {
    try {
      const res = await fetch('/api/courses?level=all');
      if (res.ok) {
        const data = await res.json();
        if (data.courses && data.courses.length > 0) {
          liveCourses = data.courses;
          renderDynamicCourseCards(liveCourses);
          updateFilterPillCounts(liveCourses);
        }
      }
    } catch (e) {
      bindStaticCardEvents();
    }
  }

  function updateFilterPillCounts(courses) {
    const counts = {
      all: courses.length,
      foundation: 0,
      diploma: 0,
      bs: 0,
      elective: 0,
      bookmarks: userBookmarks.size
    };

    courses.forEach(c => {
      const lvl = (c.level || '').toLowerCase();
      if (counts[lvl] !== undefined) counts[lvl]++;
    });

    Object.keys(counts).forEach(key => {
      const badge = document.getElementById(`count-${key}`);
      if (badge) badge.textContent = counts[key];
    });
  }

  function renderDynamicCourseCards(courses) {
    if (!notesGrid) return;

    // Check Local Storage PDF override map
    let localPdfMap = {};
    try {
      localPdfMap = JSON.parse(localStorage.getItem('mghub_local_pdfs') || '{}');
    } catch (e) {}

    notesGrid.innerHTML = courses.map(c => {
      const notesUrl = localPdfMap[c.code] || c.notes?.fileUrl || c.pdf_url || '';
      const hasNotes = Boolean(c.notes?.available || (notesUrl && notesUrl.trim().length > 0));
      const pyqCount = Array.isArray(c.pyqs) ? c.pyqs.length : 0;
      const hasPyqs = pyqCount > 0;
      const levelLabel = c.level.charAt(0).toUpperCase() + c.level.slice(1);

      return `
        <div class="course-card" data-level="${c.level}" data-code="${c.code}">
          <div class="course-card-top">
            <span class="level-badge badge-${c.level}">${levelLabel}</span>
            <span class="course-code">${c.code}</span>
          </div>
          <h3 class="course-title">${c.title}</h3>
          <div class="course-card-footer">
            <a href="course.html?code=${c.code}" class="btn-note-view" data-code="${c.code}">Open Notes & PYQs</a>
            <a href="${notesUrl || '#'}" class="btn-note-dl ${hasNotes ? 'has-pdf' : ''}" data-code="${c.code}" title="${hasNotes ? 'Open Notes PDF in New Tab' : 'View Course Resources'}" ${hasNotes ? 'target="_blank" rel="noopener noreferrer"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dl-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
          </div>
        </div>
      `;
    }).join('');

    bindDynamicCardEvents();
    filterCourses();
  }

  function bindDynamicCardEvents() {
    const cards = document.querySelectorAll('.course-card');
    cards.forEach(card => {
      const code = card.getAttribute('data-code');
      const viewBtn = card.querySelector('.btn-note-view');
      const dlBtn = card.querySelector('.btn-note-dl');

      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          // Let standard navigation open full separate page
        });
      }

      if (dlBtn) {
        dlBtn.addEventListener('click', (e) => {
          const href = dlBtn.getAttribute('href');
          if (href && href !== '#' && href !== '') {
            e.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = `course.html?code=${code}`;
          }
        });
      }
    });
  }

  function bindStaticCardEvents() {
    let localPdfMap = {};
    try {
      localPdfMap = JSON.parse(localStorage.getItem('mghub_local_pdfs') || '{}');
    } catch (e) {}

    const cards = document.querySelectorAll('.course-card');
    cards.forEach(card => {
      const code = card.querySelector('.course-code')?.textContent?.trim() || '';
      const viewBtn = card.querySelector('.btn-note-view');
      const dlBtn = card.querySelector('.btn-note-dl');

      if (localPdfMap[code] && dlBtn) {
        dlBtn.href = localPdfMap[code];
        dlBtn.target = '_blank';
        dlBtn.rel = 'noopener noreferrer';
        dlBtn.classList.add('has-pdf');
      }

      if (viewBtn) {
        viewBtn.href = `course.html?code=${code}`;
        viewBtn.addEventListener('click', () => {
          window.location.href = `course.html?code=${code}`;
        });
      }

      if (dlBtn) {
        dlBtn.addEventListener('click', (e) => {
          const href = dlBtn.getAttribute('href');
          if (href && href !== '#' && href !== '') {
            e.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = `course.html?code=${code}`;
          }
        });
      }
    });
  }

  function setTier(tierKey) {
    activeLevelFilter = tierKey;
    filterPills.forEach(p => {
      const pLevel = p.getAttribute('data-level');
      p.classList.toggle('active', pLevel === tierKey);
    });
    filterCourses();
  }

  // Bind 4 Category Cards in Notes Hub
  document.querySelectorAll('.tier-select-card').forEach(card => {
    card.addEventListener('click', () => {
      const tier = card.getAttribute('data-select-tier');
      if (tier) {
        setTier(tier);
      }
    });
  });

  if (resetTierBtn) {
    resetTierBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      setTier('select');
    });
  }

  function filterCourses() {
    const cards = document.querySelectorAll('.course-card');
    if (!cards.length) return;

    const query = (searchInput?.value || '').trim().toLowerCase();
    const isSearching = query.length > 0;
    const isTierChosen = activeLevelFilter !== 'select' && activeLevelFilter !== 'all';
    const isBookmarksFilter = activeLevelFilter === 'bookmarks';

    if (clearSearchBtn) {
      clearSearchBtn.style.display = isSearching ? 'block' : 'none';
    }

    // If on default "Select Tier" mode and not searching, show 4 category cards
    if (activeLevelFilter === 'select' && !isSearching) {
      if (tierCardsSelector) tierCardsSelector.style.display = 'grid';
      if (notesGrid) notesGrid.style.display = 'none';
      if (resetTierBtn) resetTierBtn.style.display = 'none';
      if (resultsCountText) resultsCountText.textContent = 'Select an academic tier below to display notes';
      return;
    }

    // Hide tier selector cards and show matching courses grid
    if (tierCardsSelector) tierCardsSelector.style.display = 'none';
    if (notesGrid) notesGrid.style.display = 'grid';
    if (resetTierBtn) resetTierBtn.style.display = 'inline-block';

    let visibleCount = 0;

    cards.forEach((card) => {
      const cardLevel = (card.getAttribute('data-level') || '').toLowerCase();
      const cardTitle = (card.querySelector('.course-title')?.textContent || '').toLowerCase();
      const cardDesc = (card.querySelector('.course-desc')?.textContent || '').toLowerCase();
      const cardCode = (card.querySelector('.course-code')?.textContent || '').toUpperCase().trim();

      let matchesLevel = false;
      if (isBookmarksFilter) {
        matchesLevel = userBookmarks.has(cardCode);
      } else if (activeLevelFilter === 'all' || !isTierChosen) {
        matchesLevel = true;
      } else {
        matchesLevel = cardLevel === activeLevelFilter;
      }

      const matchesSearch = !isSearching || cardTitle.includes(query) || cardDesc.includes(query) || cardCode.toLowerCase().includes(query);

      if (matchesLevel && matchesSearch) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    // Update results text
    if (resultsCountText) {
      if (isSearching) {
        resultsCountText.textContent = `Found ${visibleCount} note${visibleCount === 1 ? '' : 's'} matching "${searchInput.value.trim()}"`;
      } else if (isBookmarksFilter) {
        resultsCountText.textContent = `Showing ${visibleCount} saved course${visibleCount === 1 ? '' : 's'}`;
      } else {
        const tierName = activeLevelFilter.charAt(0).toUpperCase() + activeLevelFilter.slice(1);
        resultsCountText.textContent = `Showing ${visibleCount} ${tierName} courses`;
      }
    }
  }

  // Bind search input
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim().length > 0 && activeLevelFilter === 'select') {
        filterPills.forEach(p => p.classList.remove('active'));
      }
      filterCourses();
    });
  }

  // Bind clear search button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      filterCourses();
    });
  }

  // Bind level filter pills
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const tier = pill.getAttribute('data-level') || 'select';
      setTier(tier);
    });
  });

  // Auto re-sync when window gains focus (e.g. returning from Admin Dashboard tab)
  window.addEventListener('focus', () => {
    loadLiveCoursesFromDatabase();
  });

  // Initialize dynamic data load from backend
  loadLiveCoursesFromDatabase();
});
