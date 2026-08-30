document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const navIndicator = document.getElementById('navIndicator');
  const navLinks = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.page-section');

  function renderHeaderAuth() {
    const authBox = document.getElementById('headerAuthBox');
    if (!authBox) return;

    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('mghub_user') || 'null');
    } catch (e) {}

    if (user && user.email) {
      const displayName = user.name || user.email.split('@')[0];
      const initial = displayName.charAt(0).toUpperCase();
      const isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'aashishsinghh06@gmail.com';
      const avatarHtml = user.photoURL 
        ? `<img src="${user.photoURL}" alt="${displayName}" class="header-user-avatar" />`
        : `<div class="header-user-avatar">${initial}</div>`;

      authBox.innerHTML = `
        <div class="header-user-profile">
          ${avatarHtml}
          <span>${displayName}</span>
          ${isAdmin ? `<a href="/inmycontrol" style="font-size: 11px; color: #166534; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; text-decoration: none; font-weight: 800;">ADMIN</a>` : ''}
          <button type="button" class="btn-header-logout" id="headerLogoutBtn" title="Sign Out">✕</button>
        </div>
      `;

      document.getElementById('headerLogoutBtn')?.addEventListener('click', async () => {
        if (typeof signOutUser === 'function') {
          await signOutUser();
        } else {
          localStorage.removeItem('mghub_user');
          sessionStorage.removeItem('mghub_admin_auth');
          sessionStorage.removeItem('mghub_admin_email');
        }
        renderHeaderAuth();
      });
    } else {
      authBox.innerHTML = `
        <a href="login.html" class="btn-header-auth" id="headerLoginBtn">
          <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Sign In</span>
        </a>
      `;
    }
  }

  renderHeaderAuth();

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

    const curCgpaStr = currentCgpaInput.value.trim();
    const curCreditsStr = totalCreditsInput.value.trim();
    const nGpaStr = newGpaInput.value.trim();
    const nCreditsStr = newCreditsInput.value.trim();

    if (!curCgpaStr && !curCreditsStr && !nGpaStr && !nCreditsStr) {
      cgpaOutput.textContent = '--';
      return;
    }

    const curCgpa = parseFloat(curCgpaStr) || 0;
    const curCredits = parseFloat(curCreditsStr) || 0;
    const nGpa = parseFloat(nGpaStr) || 0;
    const nCredits = parseFloat(nCreditsStr) || 0;

    const sumCredits = curCredits + nCredits;
    if (sumCredits <= 0) {
      cgpaOutput.textContent = '--';
      return;
    }

    const predicted = ((curCgpa * curCredits) + (nGpa * nCredits)) / sumCredits;
    cgpaOutput.textContent = Math.min(10, Math.max(0, predicted)).toFixed(2);
  }

  [currentCgpaInput, totalCreditsInput, newGpaInput, newCreditsInput].forEach((input) => {
    if (input) {
      input.addEventListener('input', calculateCGPA);
    }
  });

  // 2. Official End-Term Target Forecaster (IIT Madras BS Formula)
  // Formula: T = max(0.6*F + 0.3*max(Qz1, Qz2), 0.45*F + 0.25*Qz1 + 0.3*Qz2)
  const quiz1Input = document.getElementById('quiz1Score');
  const quiz2Input = document.getElementById('quiz2Score');
  const expectedFinalInput = document.getElementById('expectedFinalScore');
  const gradePredictorOutput = document.getElementById('gradePredictorOutput');
  const forecastFormulaHint = document.getElementById('forecastFormulaHint');
  const formulaScore1 = document.getElementById('formulaScore1');
  const formulaScore2 = document.getElementById('formulaScore2');
  const formulaCard1 = document.getElementById('formulaCard1');
  const formulaCard2 = document.getElementById('formulaCard2');
  const formulaTag1 = document.getElementById('formulaTag1');
  const formulaTag2 = document.getElementById('formulaTag2');

  function calculateEndTermForecast() {
    if (!quiz1Input || !quiz2Input || !expectedFinalInput || !gradePredictorOutput) return;

    const q1Str = quiz1Input.value.trim();
    const q2Str = quiz2Input.value.trim();
    const fStr = expectedFinalInput.value.trim();

    // If all inputs are blank, show clean empty placeholder state
    if (!q1Str && !q2Str && !fStr) {
      if (formulaScore1) formulaScore1.textContent = '--';
      if (formulaScore2) formulaScore2.textContent = '--';
      if (formulaCard1) {
        formulaCard1.classList.remove('winner');
        if (formulaTag1) formulaTag1.textContent = '';
      }
      if (formulaCard2) {
        formulaCard2.classList.remove('winner');
        if (formulaTag2) formulaTag2.textContent = '';
      }
      gradePredictorOutput.textContent = '--';
      if (forecastFormulaHint) {
        forecastFormulaHint.textContent = 'Enter Quiz & End-Term scores above to calculate';
      }
      return;
    }

    const q1 = Math.max(0, Math.min(100, parseFloat(q1Str) || 0));
    const q2 = Math.max(0, Math.min(100, parseFloat(q2Str) || 0));
    const f = Math.max(0, Math.min(100, parseFloat(fStr) || 0));

    const maxQuiz = Math.max(q1, q2);

    // Formula 1: 0.6F + 0.3max(Q1, Q2)
    const t1 = (0.6 * f) + (0.3 * maxQuiz);
    // Formula 2: 0.45F + 0.25Q1 + 0.3Q2
    const t2 = (0.45 * f) + (0.25 * q1) + (0.3 * q2);

    const totalScore = Math.max(t1, t2);
    const diff = Math.abs(t1 - t2);

    if (formulaScore1) formulaScore1.textContent = t1.toFixed(2);
    if (formulaScore2) formulaScore2.textContent = t2.toFixed(2);

    if (formulaCard1 && formulaCard2) {
      if (t1 >= t2) {
        formulaCard1.classList.add('winner');
        formulaCard2.classList.remove('winner');
        if (formulaTag1) formulaTag1.textContent = '★ Highest';
        if (formulaTag2) formulaTag2.textContent = '';
      } else {
        formulaCard2.classList.add('winner');
        formulaCard1.classList.remove('winner');
        if (formulaTag2) formulaTag2.textContent = '★ Highest';
        if (formulaTag1) formulaTag1.textContent = '';
      }
    }

    let letterGrade = 'U (Fail)';
    if (totalScore >= 90) letterGrade = 'S Grade';
    else if (totalScore >= 80) letterGrade = 'A Grade';
    else if (totalScore >= 70) letterGrade = 'B Grade';
    else if (totalScore >= 60) letterGrade = 'C Grade';
    else if (totalScore >= 50) letterGrade = 'D Grade';
    else if (totalScore >= 40) letterGrade = 'E Grade (Pass)';

    gradePredictorOutput.textContent = `${totalScore.toFixed(1)} / 100 (${letterGrade})`;

    if (forecastFormulaHint) {
      if (t2 > t1) {
        forecastFormulaHint.textContent = `Applied Formula 2: Boosted by +${diff.toFixed(2)} marks (Both Quizzes Weightage)`;
      } else if (t1 > t2) {
        forecastFormulaHint.textContent = `Applied Formula 1: Boosted by +${diff.toFixed(2)} marks (Best Quiz Weightage)`;
      } else {
        forecastFormulaHint.textContent = `Both formulas yield identical score (${t1.toFixed(2)})`;
      }
    }
  }

  [quiz1Input, quiz2Input, expectedFinalInput].forEach(elem => {
    if (elem) {
      elem.addEventListener('input', calculateEndTermForecast);
      elem.addEventListener('change', calculateEndTermForecast);
    }
  });

  calculateEndTermForecast();

  // 3. Official End-Term Passing Predictor
  const passQuiz1Input = document.getElementById('passQuiz1');
  const passQuiz2Input = document.getElementById('passQuiz2');
  const passTargetScoreSelect = document.getElementById('passTargetScore');
  const passRequiredOutput = document.getElementById('passRequiredOutput');
  const passStrategyHint = document.getElementById('passStrategyHint');

  function calculateEndTermPassingRequirement() {
    if (!passQuiz1Input || !passQuiz2Input || !passTargetScoreSelect || !passRequiredOutput) return;

    const q1Str = passQuiz1Input.value.trim();
    const q2Str = passQuiz2Input.value.trim();

    if (!q1Str && !q2Str) {
      passRequiredOutput.textContent = '--';
      passRequiredOutput.style.color = '#09090b';
      if (passStrategyHint) {
        passStrategyHint.textContent = 'Enter Quiz 1 & Quiz 2 scores to calculate passing requirement';
      }
      return;
    }

    const q1 = Math.max(0, Math.min(100, parseFloat(q1Str) || 0));
    const q2 = Math.max(0, Math.min(100, parseFloat(q2Str) || 0));
    const target = parseFloat(passTargetScoreSelect.value) || 40;
    const maxQuiz = Math.max(q1, q2);

    // Option 1: 0.6F + 0.3max(Q1,Q2) >= target => F1 >= (target - 0.3*max(Q1,Q2)) / 0.6
    // Option 2: 0.45F + 0.25Q1 + 0.3Q2 >= target => F2 >= (target - (0.25Q1 + 0.3Q2)) / 0.45
    const f1 = (target - (0.3 * maxQuiz)) / 0.6;
    const f2 = (target - (0.25 * q1 + 0.3 * q2)) / 0.45;
    const minRequiredF = Math.min(f1, f2);
    const bestOptionName = f2 < f1 ? 'Both Quizzes Rule (45% F + 25% Q1 + 30% Q2)' : 'Best Quiz Rule (60% F + 30% Best Quiz)';

    if (minRequiredF <= 0) {
      passRequiredOutput.textContent = '0.0 / 100 (Pass Guaranteed! 🎉)';
      passRequiredOutput.style.color = '#166534';
      if (passStrategyHint) {
        passStrategyHint.textContent = `Quiz marks alone guarantee securing T ≥ ${target}!`;
      }
    } else if (minRequiredF > 100) {
      passRequiredOutput.textContent = `Need ${minRequiredF.toFixed(1)} (>100 max)`;
      passRequiredOutput.style.color = '#ef4444';
      if (passStrategyHint) {
        passStrategyHint.textContent = `Target score of ${target} is not mathematically possible with current quiz scores.`;
      }
    } else {
      passRequiredOutput.textContent = `${minRequiredF.toFixed(1)} / 100`;
      passRequiredOutput.style.color = '#09090b';
      if (passStrategyHint) {
        passStrategyHint.textContent = `Min required via ${bestOptionName}`;
      }
    }
  }

  [passQuiz1Input, passQuiz2Input, passTargetScoreSelect].forEach(elem => {
    if (elem) {
      elem.addEventListener('input', calculateEndTermPassingRequirement);
      elem.addEventListener('change', calculateEndTermPassingRequirement);
    }
  });

  calculateEndTermPassingRequirement();

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

    // 2. Fetch fresh course details (with notes & pyqs) from Firestore, API, or LocalStorage
    if (typeof fetchCoursesFromFirestore === 'function') {
      try {
        const cloudCourses = await fetchCoursesFromFirestore();
        if (Array.isArray(cloudCourses) && cloudCourses.length > 0) {
          const match = cloudCourses.find(c => (c.code || '').toUpperCase() === activeModalCourseCode);
          if (match) {
            targetCourse = match;
            populateModalData(targetCourse);
            return;
          }
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(`/api/course/${activeModalCourseCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.course) {
          targetCourse = data.course;
          populateModalData(targetCourse);
          return;
        }
      }
    } catch (e) {}

    try {
      const saved = JSON.parse(localStorage.getItem('mghub_courses') || '[]');
      const localMatch = saved.find(c => (c.code || '').toUpperCase() === activeModalCourseCode);
      if (localMatch) {
        targetCourse = localMatch;
        populateModalData(targetCourse);
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

  let activeLevelFilter = 'foundation';
  let liveCourses = [];

  async function loadLiveCoursesFromDatabase() {
    // 1. Try Firebase Cloud Firestore (Global Realtime Database)
    if (typeof fetchCoursesFromFirestore === 'function') {
      try {
        const cloudCourses = await fetchCoursesFromFirestore();
        if (Array.isArray(cloudCourses) && cloudCourses.length > 0) {
          liveCourses = cloudCourses;
          try {
            localStorage.setItem('mghub_courses', JSON.stringify(liveCourses));
          } catch(e){}
          renderDynamicCourseCards(liveCourses);
          updateFilterPillCounts(liveCourses);
          return;
        }
      } catch (e) {}
    }

    // 2. Try Backend API
    try {
      const res = await fetch('/api/courses?level=all');
      if (res.ok) {
        const data = await res.json();
        if (data.courses && data.courses.length > 0) {
          liveCourses = data.courses;
          renderDynamicCourseCards(liveCourses);
          updateFilterPillCounts(liveCourses);
          return;
        }
      }
    } catch (e) {}

    // 3. Try LocalStorage (Netlify / Offline Admin Updates)
    try {
      const saved = JSON.parse(localStorage.getItem('mghub_courses') || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        liveCourses = saved;
        renderDynamicCourseCards(liveCourses);
        updateFilterPillCounts(liveCourses);
        return;
      }
    } catch (e) {}

    // 4. Fallback for Netlify / Static Hosting (Fetch data/courses.json)
    try {
      const res = await fetch('data/courses.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          liveCourses = data;
          renderDynamicCourseCards(liveCourses);
          updateFilterPillCounts(liveCourses);
          return;
        }
      }
    } catch (e) {}

    bindStaticCardEvents();
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
    if (searchInput) searchInput.value = '';
    filterCourses();
  }

  function filterCourses() {
    const cards = document.querySelectorAll('.course-card');
    if (!cards.length) return;

    const query = (searchInput?.value || '').trim().toLowerCase();
    const isSearching = query.length > 0;
    const isBookmarksFilter = activeLevelFilter === 'bookmarks';

    if (clearSearchBtn) {
      clearSearchBtn.style.display = isSearching ? 'block' : 'none';
    }

    if (notesGrid) notesGrid.style.display = 'grid';

    let visibleCount = 0;

    cards.forEach((card) => {
      const cardLevel = (card.getAttribute('data-level') || '').toLowerCase();
      const cardTitle = (card.querySelector('.course-title')?.textContent || '').toLowerCase();
      const cardDesc = (card.querySelector('.course-desc')?.textContent || '').toLowerCase();
      const cardCode = (card.querySelector('.course-code')?.textContent || '').toUpperCase().trim();

      let matchesLevel = false;
      if (isSearching) {
        matchesLevel = true;
      } else if (isBookmarksFilter) {
        matchesLevel = userBookmarks.has(cardCode);
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
        const tierName = activeLevelFilter === 'bs' ? 'BS Degree' : (activeLevelFilter.charAt(0).toUpperCase() + activeLevelFilter.slice(1));
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
