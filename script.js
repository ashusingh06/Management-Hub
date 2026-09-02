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
   * Updates the position, width, and height of the active pill indicator with pixel perfection
   */
  function updateIndicator(targetLink) {
    if (!targetLink || !navIndicator || !navbar) return;

    const navRect = navbar.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();

    const left = linkRect.left - navRect.left;
    const top = linkRect.top - navRect.top;
    const width = linkRect.width;
    const height = linkRect.height;

    navIndicator.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    navIndicator.style.width = `${width}px`;
    navIndicator.style.height = `${height}px`;

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
  function refreshActiveNavIndicator() {
    const currentActive = document.querySelector('.nav-btn.active') || navLinks[0];
    if (currentActive) {
      updateIndicator(currentActive);
    }
  }

  refreshActiveNavIndicator();
  requestAnimationFrame(refreshActiveNavIndicator);
  setTimeout(refreshActiveNavIndicator, 100);

  // Handle window resizing & orientation change
  window.addEventListener('resize', refreshActiveNavIndicator);
  window.addEventListener('orientationchange', () => setTimeout(refreshActiveNavIndicator, 150));

  /* ==========================================================================
     Live Interactive Calculators (CGPA Calculator & Grade Predictor)
     ========================================================================== */
  
  // 1. Dynamic Subject-Based CGPA Calculator
  // Formula: CGPA = Total Grade Points of All Subjects ÷ Total Number of Subjects
  const cgpaSubjectsContainer = document.getElementById('cgpaSubjectsContainer');
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const resetSubjectsBtn = document.getElementById('resetSubjectsBtn');
  const cgpaTotalPointsEl = document.getElementById('cgpaTotalPoints');
  const cgpaTotalSubjectsEl = document.getElementById('cgpaTotalSubjects');
  const cgpaOutput = document.getElementById('cgpaOutput');

  let subjectCounter = 0;

  function createSubjectRow(name = '', gradePoint = '') {
    subjectCounter++;
    const row = document.createElement('div');
    row.className = 'cgpa-subject-row';
    row.dataset.id = subjectCounter;
    const defaultPlaceholder = `Subject ${subjectCounter}`;
    const initialName = name || defaultPlaceholder;

    row.innerHTML = `
      <div class="subject-name-col">
        <input type="text" class="subject-name-input" placeholder="${defaultPlaceholder}" value="${initialName}">
      </div>
      <div class="subject-gp-col">
        <input type="number" class="subject-gp-input" step="0.1" min="0" max="10" placeholder="Grade Point (0-10)" value="${gradePoint}">
      </div>
      <button type="button" class="btn-remove-subject" title="Remove Subject" aria-label="Remove Subject">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    const gpInput = row.querySelector('.subject-gp-input');
    const nameInput = row.querySelector('.subject-name-input');
    const removeBtn = row.querySelector('.btn-remove-subject');

    gpInput.addEventListener('input', calculateCGPA);
    nameInput.addEventListener('input', calculateCGPA);

    removeBtn.addEventListener('click', () => {
      row.remove();
      calculateCGPA();
    });

    return row;
  }

  function initDefaultSubjects() {
    if (!cgpaSubjectsContainer) return;
    cgpaSubjectsContainer.innerHTML = '';
    subjectCounter = 0;
    // Start with 3 default subject rows (empty grade points)
    for (let i = 1; i <= 3; i++) {
      cgpaSubjectsContainer.appendChild(createSubjectRow(`Subject ${i}`, ''));
    }
    calculateCGPA();
  }

  function calculateCGPA() {
    if (!cgpaSubjectsContainer) return;
    const gpInputs = cgpaSubjectsContainer.querySelectorAll('.subject-gp-input');

    let totalGradePoints = 0;
    let validSubjectsCount = 0;

    gpInputs.forEach(input => {
      const valStr = input.value.trim();
      if (valStr !== '') {
        const val = parseFloat(valStr);
        if (!isNaN(val) && val >= 0) {
          const gradePoint = Math.min(10, Math.max(0, val));
          totalGradePoints += gradePoint;
          validSubjectsCount++;
        }
      }
    });

    if (cgpaTotalPointsEl) {
      cgpaTotalPointsEl.textContent = totalGradePoints.toFixed(2);
    }
    if (cgpaTotalSubjectsEl) {
      cgpaTotalSubjectsEl.textContent = validSubjectsCount.toString();
    }

    if (cgpaOutput) {
      if (validSubjectsCount === 0) {
        cgpaOutput.textContent = '--';
      } else {
        const cgpa = totalGradePoints / validSubjectsCount;
        cgpaOutput.textContent = cgpa.toFixed(2);
      }
    }
  }

  if (addSubjectBtn && cgpaSubjectsContainer) {
    addSubjectBtn.addEventListener('click', () => {
      const newRow = createSubjectRow('', '');
      cgpaSubjectsContainer.appendChild(newRow);
      const newGpInput = newRow.querySelector('.subject-gp-input');
      if (newGpInput) newGpInput.focus();
      calculateCGPA();
    });
  }

  if (resetSubjectsBtn) {
    resetSubjectsBtn.addEventListener('click', () => {
      initDefaultSubjects();
    });
  }

  if (cgpaSubjectsContainer) {
    initDefaultSubjects();
  }

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
    let notesUrl = '';
    if (course.notes && course.notes.available !== false && course.notes.fileUrl && course.notes.fileUrl.trim().length > 0) {
      notesUrl = course.notes.fileUrl;
    } else if (course.pdf_url && course.pdf_url.trim().length > 0) {
      notesUrl = course.pdf_url;
    } else if (localPdf && localPdf.trim().length > 0 && course.notes?.available !== false) {
      notesUrl = localPdf;
    }
    const hasNotes = Boolean(notesUrl && notesUrl.trim().length > 0);

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
        modalOpenNotesDirectBtn.onclick = (e) => {
          e.preventDefault();
          if (typeof openPdfSecurely === 'function') openPdfSecurely(notesUrl, fileName);
          else window.open(notesUrl, '_blank');
        };
      }
      if (modalDownloadNotesDirectBtn) {
        modalDownloadNotesDirectBtn.href = notesUrl;
        modalDownloadNotesDirectBtn.onclick = (e) => {
          e.preventDefault();
          if (typeof downloadPdfSecurely === 'function') downloadPdfSecurely(notesUrl, fileName);
          else window.open(notesUrl, '_blank');
        };
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
          const safeTitle = (pyq.fileName || 'PYQ.pdf').replace(/'/g, "\\'");

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
                <button type="button" onclick="if(typeof openPdfSecurely==='function'){openPdfSecurely('${fileUrl}', '${safeTitle}');}else{window.open('${fileUrl}', '_blank');}" class="btn-open-pdf" style="cursor:pointer; background:none; border:1px solid #e4e4e7; font-family:inherit;">Open PDF ↗</button>
                <button type="button" onclick="if(typeof downloadPdfSecurely==='function'){downloadPdfSecurely('${fileUrl}', '${safeTitle}');}else{window.open('${fileUrl}', '_blank');}" class="btn-dl-pdf" title="Download ${title}" style="cursor:pointer; background:none; border:1px solid #e4e4e7;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
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

  const MASTER_COURSES_CATALOG = [
    { id: 1, code: "BSMA1001", level: "foundation", title: "Mathematics for Data Science I", credits: 4, prerequisites: [], description: "Linear algebra, matrix operations, calculus fundamentals, vector spaces, and mathematical foundations for analytics.", pdf_url: "" },
    { id: 2, code: "BSMA1002", level: "foundation", title: "Statistics for Data Science I", credits: 4, prerequisites: [], description: "Probability theory, random variables, discrete and continuous distributions, hypothesis testing, and exploratory data analysis.", pdf_url: "" },
    { id: 3, code: "BSCS1001", level: "foundation", title: "Computational Thinking", credits: 4, prerequisites: [], description: "Algorithm design, problem decomposition, logic formulation, pseudocode, iteration, and structured problem solving.", pdf_url: "" },
    { id: 4, code: "BSHS1001", level: "foundation", title: "English I", credits: 4, prerequisites: [], description: "Professional communication, academic writing, presentation techniques, grammar, and executive business discourse.", pdf_url: "" },
    { id: 5, code: "BSMS1201", level: "foundation", title: "Principles of Economics", credits: 4, prerequisites: [], description: "Microeconomic foundations, market equilibrium, supply-demand dynamics, price elasticity, and consumer theory.", pdf_url: "" },
    { id: 6, code: "BSMS1202", level: "foundation", title: "Financial Accounting", credits: 4, prerequisites: [], description: "Balance sheets, ledger entries, income statements, cash flow statements, and corporate financial recordkeeping.", pdf_url: "" },
    { id: 7, code: "BSMS1203", level: "foundation", title: "Business Statistics", credits: 4, prerequisites: ["BSMA1002"], description: "Regression models, time-series forecasting, variance analysis (ANOVA), and statistical decision-making frameworks.", pdf_url: "" },
    { id: 8, code: "BSMS1204", level: "foundation", title: "Management Thought and Practice", credits: 4, prerequisites: [], description: "Classical & contemporary management theories, leadership frameworks, organizational design, and business strategy.", pdf_url: "" },
    { id: 9, code: "BSMS2201", level: "diploma", title: "Python for Data Analytics", credits: 4, prerequisites: ["BSCS1001"], description: "Pandas, NumPy, Matplotlib, Seaborn, exploratory data analysis, web scraping, and data transformation pipelines.", pdf_url: "" },
    { id: 10, code: "BSMS2202", level: "diploma", title: "Data Management", credits: 4, prerequisites: ["BSCS1001"], description: "Relational schema design, SQL querying, indexing, ACID transactions, database normalization, and data modeling.", pdf_url: "" },
    { id: 11, code: "BSMS2203", level: "diploma", title: "Analysis of Economic Data", credits: 4, prerequisites: ["BSMS1201", "BSMA1002"], description: "Econometric techniques, empirical model evaluation, OLS regression, hypothesis testing on macroeconomic datasets.", pdf_url: "" },
    { id: 12, code: "BSMS3201", level: "diploma", title: "Marketing Analytics", credits: 4, prerequisites: ["BSMS1203", "BSMS1204"], description: "Customer segmentation, Customer Lifetime Value (CLV), churn prediction, pricing optimization, and marketing mix modeling.", pdf_url: "" },
    { id: 13, code: "BSMS3202", level: "diploma", title: "HR Analytics", credits: 4, prerequisites: ["BSMA1002", "BSMS1204"], description: "Workforce metrics, employee retention modeling, talent acquisition funnels, and organizational performance data.", pdf_url: "" },
    { id: 14, code: "BSMS3203", level: "diploma", title: "Financial Analytics", credits: 4, prerequisites: ["BSMS1202", "BSMA1002"], description: "Asset pricing models (CAPM), portfolio risk metrics, Value at Risk (VaR), and quantitative financial time-series.", pdf_url: "" },
    { id: 15, code: "BSMS2204", level: "diploma", title: "Operations Management", credits: 4, prerequisites: ["BSMA1001", "BSMS1204"], description: "Process optimization, queueing systems, inventory control (EOQ), capacity planning, and Lean Six Sigma principles.", pdf_url: "" },
    { id: 16, code: "BSMS3204", level: "diploma", title: "Supply Chain Analytics", credits: 4, prerequisites: ["BSMS2204", "BSMS1203"], description: "Network design, logistics tracking, demand forecasting, multi-echelon inventory optimization, and bullwhip effect reduction.", pdf_url: "" },
    { id: 17, code: "BSMS3901", level: "diploma", title: "Business Management Project", credits: 4, prerequisites: ["BSMS1204", "BSMS1202"], description: "Applied strategic research, business model evaluation, competitive landscape mapping, and executive execution planning.", pdf_url: "" },
    { id: 18, code: "BSMS3902", level: "diploma", title: "Business Analytics Project", credits: 4, prerequisites: ["BSMS2201", "BSMS2202", "BSMS1203"], description: "End-to-end data pipeline construction, statistical model deployment, interactive dashboards, and actionable insight delivery.", pdf_url: "" },
    { id: 19, code: "BSMS2205", level: "diploma", title: "Corporate Finance", credits: 4, prerequisites: ["BSMS1202"], description: "Capital budgeting (NPV/IRR), Weighted Average Cost of Capital (WACC), dividend decisions, and optimal capital structure.", pdf_url: "" },
    { id: 20, code: "BSMS2206", level: "diploma", title: "Organizational Behaviour", credits: 4, prerequisites: ["BSMS1204"], description: "Team dynamics, workplace psychology, organizational culture, leadership influence, and cross-functional conflict resolution.", pdf_url: "" },
    { id: 21, code: "BSMS3205", level: "diploma", title: "Money Banking and Financial Markets", credits: 4, prerequisites: ["BSMS1201", "BSMS1202"], description: "Monetary policy transmission mechanisms, commercial banking systems, bond markets, interest rates, and central banking.", pdf_url: "" },
    { id: 22, code: "BSMS2207", level: "diploma", title: "Marketing Management", credits: 4, prerequisites: ["BSMS1204"], description: "Brand positioning, market research methodologies, omnichannel distribution strategy, and consumer touchpoint optimization.", pdf_url: "" },
    { id: 23, code: "BSMS2208", level: "diploma", title: "Macroeconomics", credits: 4, prerequisites: ["BSMS1201"], description: "National income accounting (GDP), fiscal policy, inflation, unemployment, IS-LM frameworks, and international trade balance.", pdf_url: "" },
    { id: 24, code: "BSMS3206", level: "diploma", title: "Managerial Economics", credits: 4, prerequisites: ["BSMS1201", "BSMA1001"], description: "Pricing strategy, oligopoly and game-theoretic market structures, cost analysis, and corporate decision theory.", pdf_url: "" },
    { id: 25, code: "BSGN3001", level: "bs", title: "Strategies for Professional Growth", credits: 4, prerequisites: ["BSHS1001", "BSMS1204"], description: "Executive communication, career roadmap building, industry networking, personal branding, and professional leadership ethics.", pdf_url: "" },
    { id: 26, code: "BSMS3207", level: "bs", title: "GenAI for Business", credits: 4, prerequisites: ["BSMS2201", "BSCS1001"], description: "LLM adoption frameworks, prompt engineering architectures, generative AI agent workflows, and measuring enterprise business ROI.", pdf_url: "" },
    { id: 27, code: "BSMS3208", level: "bs", title: "Digital Business", credits: 4, prerequisites: ["BSMS1204", "BSMS2207"], description: "Platform business models, multi-sided market strategies, e-commerce architectures, network effects, and digital product scaling.", pdf_url: "" },
    { id: 28, code: "BSMS3209", level: "bs", title: "Logistics and Supply Chain Management", credits: 4, prerequisites: ["BSMS3204"], description: "Multi-modal freight logistics, automated warehousing systems, port operations, and global supply resilience strategies.", pdf_url: "" },
    { id: 29, code: "BSMS4201", level: "bs", title: "Applied Time Series Analysis", credits: 4, prerequisites: ["BSMS1203", "BSMS2201"], description: "ARIMA, SARIMA, GARCH volatility models, exponential smoothing, cointegration, stationarity, and financial forecasting.", pdf_url: "" },
    { id: 30, code: "BSMS4202", level: "bs", title: "Market Intelligence", credits: 4, prerequisites: ["BSMS3201", "BSMS2201"], description: "Competitive intelligence frameworks, consumer trend scraping, sentiment tracking, NLP on market feeds, and actionable insight generation.", pdf_url: "" }
  ];

  function mergeWithMasterCatalog(loadedCourses) {
    const map = new Map();
    MASTER_COURSES_CATALOG.forEach(c => map.set(c.code.toUpperCase(), { ...c }));
    if (Array.isArray(loadedCourses)) {
      loadedCourses.forEach(c => {
        if (!c || !c.code) return;
        const code = c.code.toUpperCase();
        if (map.has(code)) {
          const base = map.get(code);
          map.set(code, {
            ...base,
            ...c,
            title: c.title || base.title,
            level: c.level || base.level,
            pdf_url: c.pdf_url !== undefined ? c.pdf_url : '',
            notes: c.notes !== undefined ? c.notes : { available: false, fileName: '', fileUrl: '' },
            pyqs: Array.isArray(c.pyqs) ? c.pyqs : []
          });
        } else {
          map.set(code, c);
        }
      });
    }
    return Array.from(map.values());
  }

  async function loadLiveCoursesFromDatabase() {
    // 1. Try Firebase Cloud Firestore (Global Realtime Database)
    if (typeof fetchCoursesFromFirestore === 'function') {
      try {
        const cloudCourses = await fetchCoursesFromFirestore();
        if (Array.isArray(cloudCourses) && cloudCourses.length > 0) {
          liveCourses = mergeWithMasterCatalog(cloudCourses);
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
          liveCourses = mergeWithMasterCatalog(data.courses);
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
        liveCourses = mergeWithMasterCatalog(saved);
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
          liveCourses = mergeWithMasterCatalog(data);
          renderDynamicCourseCards(liveCourses);
          updateFilterPillCounts(liveCourses);
          return;
        }
      }
    } catch (e) {}

    liveCourses = Array.from(MASTER_COURSES_CATALOG);
    renderDynamicCourseCards(liveCourses);
    updateFilterPillCounts(liveCourses);
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
      let notesUrl = '';
      if (c.notes && c.notes.available !== false && c.notes.fileUrl && c.notes.fileUrl.trim().length > 0) {
        notesUrl = c.notes.fileUrl;
      } else if (c.pdf_url && c.pdf_url.trim().length > 0) {
        notesUrl = c.pdf_url;
      } else if (localPdfMap[c.code] && localPdfMap[c.code].trim().length > 0 && c.notes?.available !== false) {
        notesUrl = localPdfMap[c.code];
      }
      const hasNotes = Boolean(notesUrl && notesUrl.trim().length > 0);
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
            if (typeof openPdfSecurely === 'function') openPdfSecurely(href, `${code}_Notes.pdf`);
            else window.open(href, '_blank');
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
            if (typeof openPdfSecurely === 'function') openPdfSecurely(href, `${code}_Notes.pdf`);
            else window.open(href, '_blank');
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

  // =========================================================================
  // Live Official Ecosystem Portals Rendering & Firestore Sync
  // =========================================================================
  const DEFAULT_PORTAL_LINKS = [
    { id: 'iitm-portal', title: 'Official Degree Website', subtitle: 'study.iitm.ac.in/mg', url: 'https://study.iitm.ac.in/mg/index.html' },
    { id: 'iitm-discourse', title: 'IITM Discourse Forum', subtitle: 'discourse.onlinedegree.iitm.ac.in', url: 'https://discourse.onlinedegree.iitm.ac.in' },
    { id: 'iitm-handbook', title: 'MG Student Handbook', subtitle: 'Official Program Handbook', url: 'https://docs.google.com/document/u/1/d/e/2PACX-1vTnw4G6smKsm_EJqeksqBE2qX9tFcn2PYkC2b4QH_TTInjUCQg5-jZjW-paQ4L3g6CLdTKj_zyyDs31/pub' },
    { id: 'iitm-looker', title: 'Looker Studio Dashboard', subtitle: 'Student Grade Insights', url: 'https://lookerstudio.google.com/u/0/reporting/d02dac13-665b-49cc-8d51-0451268a6a3e/page/5sgkE' },
    { id: 'iitm-scorechecker', title: 'Score Checker App', subtitle: 'Official Criteria Engine', url: 'https://score-checker-379619009600.asia-south1.run.app/' }
  ];

  async function loadAndRenderLivePortalLinks() {
    let portalLinks = DEFAULT_PORTAL_LINKS;

    // 1. Try local storage cache first
    try {
      const cached = localStorage.getItem('mghub_portal_links');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          portalLinks = parsed;
          renderPortalsDOM(portalLinks);
        }
      }
    } catch (e) {}

    // 2. Fetch latest live from Cloud Firestore
    if (typeof fetchPortalLinksFromFirestore === 'function') {
      try {
        const cloudLinks = await fetchPortalLinksFromFirestore();
        if (Array.isArray(cloudLinks) && cloudLinks.length > 0) {
          portalLinks = cloudLinks;
          try { localStorage.setItem('mghub_portal_links', JSON.stringify(portalLinks)); } catch(e){}
          renderPortalsDOM(portalLinks);
        }
      } catch (e) {}
    }
  }

  function renderPortalsDOM(links) {
    const grid = document.querySelector('#links .links-grid');
    if (grid && Array.isArray(links) && links.length > 0) {
      grid.innerHTML = links.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="portal-link-item">
          <div>
            <strong>${l.title}</strong>
            <span>${l.subtitle || l.url.replace(/^https?:\/\//, '')}</span>
          </div>
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
        </a>
      `).join('');
    }
  }

  // =========================================================================
  // Live Contributors Rendering & Firestore Sync
  // =========================================================================
  const DEFAULT_CONTRIBUTORS = [];

  function getInitials(name) {
    if (!name) return 'MG';
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }

  async function loadAndRenderContributors() {
    let contributors = [];

    try {
      const cached = localStorage.getItem('mghub_contributors');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          contributors = parsed;
          renderContributorsDOM(contributors);
        }
      }
    } catch (e) {}

    if (typeof fetchContributorsFromFirestore === 'function') {
      try {
        const cloudContributors = await fetchContributorsFromFirestore();
        if (Array.isArray(cloudContributors)) {
          contributors = cloudContributors;
          try { localStorage.setItem('mghub_contributors', JSON.stringify(contributors)); } catch(e){}
          renderContributorsDOM(contributors);
          return;
        }
      } catch (e) {}
    }

    renderContributorsDOM(contributors);
  }

  function renderContributorsDOM(contributors) {
    const grid = document.getElementById('contributorsGrid');
    if (!grid) return;
    if (!Array.isArray(contributors) || contributors.length === 0) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = contributors.map(c => {
      const avatarHtml = c.avatar && c.avatar.trim()
        ? `<img src="${c.avatar}" alt="${c.name}" class="contributor-avatar-img" />`
        : `<span>${getInitials(c.name)}</span>`;

      const socialButtons = [];
      if (c.github) {
        socialButtons.push(`
          <a href="${c.github}" target="_blank" rel="noopener noreferrer" class="contributor-social-btn" title="GitHub Profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </a>
        `);
      }
      if (c.linkedin) {
        socialButtons.push(`
          <a href="${c.linkedin}" target="_blank" rel="noopener noreferrer" class="contributor-social-btn" title="LinkedIn Profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        `);
      }
      if (c.email) {
        socialButtons.push(`
          <a href="mailto:${c.email}" class="contributor-social-btn" title="Send Email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
        `);
      }

      return `
        <div class="contributor-card">
          <div class="contributor-avatar-wrap">
            ${avatarHtml}
          </div>
          <h3 class="contributor-name">${c.name}</h3>
          <span class="contributor-role-pill">⭐ ${c.role}</span>
          <p class="contributor-branch">${c.branch || 'IIT Madras BS Degree'}</p>
          ${socialButtons.length > 0 ? `<div class="contributor-social-row">${socialButtons.join('')}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // Auto re-sync when window gains focus (e.g. returning from Admin Dashboard tab)
  window.addEventListener('focus', () => {
    loadLiveCoursesFromDatabase();
    loadAndRenderLivePortalLinks();
    loadAndRenderContributors();
  });

  // Initialize dynamic data load from Cloud Firestore
  loadLiveCoursesFromDatabase();
  loadAndRenderLivePortalLinks();
  loadAndRenderContributors();

  // Realtime Cloud Firestore Subscriptions (Instant push to Mobile & Web within 100ms)
  if (typeof listenToCoursesFromFirestore === 'function') {
    listenToCoursesFromFirestore((cloudCourses) => {
      liveCourses = mergeWithMasterCatalog(cloudCourses);
      renderDynamicCourseCards(liveCourses);
      updateFilterPillCounts(liveCourses);
    });
  }

  if (typeof listenToPortalLinksFromFirestore === 'function') {
    listenToPortalLinksFromFirestore((cloudLinks) => {
      renderPortalsDOM(cloudLinks);
    });
  }

  if (typeof listenToContributorsFromFirestore === 'function') {
    listenToContributorsFromFirestore((cloudContributors) => {
      renderContributorsDOM(cloudContributors);
    });
  }
});
