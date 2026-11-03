/**
 * ==============================================================================
 * [Management Hub] - Quiz Practice & Exam Simulator Engine (quiz.js)
 * Clean QuizPractice.space Architecture:
 * - Milestone Selection (Quiz 1 / Quiz 2 / End-Term / All)
 * - 2-Column TCS iON Style Exam Mode & Instant Learning Mode
 * - Timer with Pause & Reset
 * - Question Menu with Vibrant Green Answered Indicators
 * - Formula Notation & Data Tables
 * - Management Hub Pro Pass Simulator Access Gating
 * - Permanent Clean Management Hub Aesthetic
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let availableCourses = [];
  let currentQuestions = [];
  let currentIndex = 0;
  let userResponses = {}; // { [qId]: optionIdx (MCQ) | [indices] (MSQ) | string/number (NAT) }
  let questionStatus = {}; // { [qId]: 'not-visited' | 'not-answered' | 'answered' | 'review' | 'ans-review' }
  
  let quizConfig = {
    courseCode: 'BSMS1201',
    phase: 'quiz1', // 'quiz1' | 'quiz2' | 'endterm' | 'all'
    mode: 'exam', // 'exam' | 'practice'  
    typeFilter: 'all',
    questionCount: 15,
    durationMinutes: 30
  };

  let timerInterval = null;
  let timeRemainingSeconds = 0;
  let isTimerPaused = false;
  let initialDurationSeconds = 0;

  // Management Hub Pro & Razorpay State
  let isUserPro = false;
  let selectedProPlan = 'term_pass';
  let paymentPlansConfig = null;

  // DOM Elements - Screens
  const screenSetup = document.getElementById('screenSetup');
  const screenExam = document.getElementById('screenExam');
  const screenResult = document.getElementById('screenResult');

  // DOM Elements - Header & Exit
  const btnHeaderExit = document.getElementById('btnHeaderExit');

  // DOM Elements - Landing & Setup
  const milestonePills = document.querySelectorAll('.milestone-pill-btn');
  const courseCards = document.querySelectorAll('.mh-course-card');
  const selectedPhaseHeading = document.getElementById('selectedPhaseHeading');
  const courseSelect = document.getElementById('courseSelect');
  const yearSelect = document.getElementById('yearSelect');
  const countSelect = document.getElementById('countSelect');
  const typeFilterSelect = document.getElementById('typeFilterSelect');
  const modeBtnExam = document.getElementById('modeBtnExam');
  const modeBtnPractice = document.getElementById('modeBtnPractice');
  const availableQHint = document.getElementById('availableQHint');
  const launchPaperTitle = document.getElementById('launchPaperTitle');
  const btnStartQuiz = document.getElementById('btnStartQuiz');
  const btnStartQuizText = document.getElementById('btnStartQuizText');
  const btnPreviewQuiz = document.getElementById('btnPreviewQuiz');
  const examPreviewBanner = document.getElementById('examPreviewBanner');
  const btnPreviewBannerUpgrade = document.getElementById('btnPreviewBannerUpgrade');

  // DOM Elements - Exam Sidebar (Image 1)
  const metaExam = document.getElementById('metaExam');
  const metaSubject = document.getElementById('metaSubject');
  const metaMarks = document.getElementById('metaMarks');
  const metaQp = document.getElementById('metaQp');
  const sideModeExam = document.getElementById('sideModeExam');
  const sideModeLearning = document.getElementById('sideModeLearning');
  const btnSideSummary = document.getElementById('btnSideSummary');
  const btnSideDownload = document.getElementById('btnSideDownload');
  const paletteGrid = document.getElementById('paletteGrid');
  const timerDisplay = document.getElementById('timerDisplay');
  const btnTimerPause = document.getElementById('btnTimerPause');
  const btnTimerReset = document.getElementById('btnTimerReset');
  const btnSubmitExam = document.getElementById('btnSubmitExam');

  // DOM Elements - Question Pane (Image 1)
  const qDisplayNumId = document.getElementById('qDisplayNumId');
  const qMarksBadge = document.getElementById('qMarksBadge');
  const qTypeBadge = document.getElementById('qTypeBadge');
  const questionTextEl = document.getElementById('questionText');
  const answerContainer = document.getElementById('answerContainer');
  const practiceFeedbackBox = document.getElementById('practiceFeedbackBox');
  const btnClearResp = document.getElementById('btnClearResp');
  const btnMarkReview = document.getElementById('btnMarkReview');
  const btnCheckAnswer = document.getElementById('btnCheckAnswer');
  const btnReportFormat = document.getElementById('btnReportFormat');
  const btnSnapshot = document.getElementById('btnSnapshot');
  const btnPrev = document.getElementById('btnPrev');
  const btnSaveNext = document.getElementById('btnSaveNext');

  // ==============================================================================
  // Professional Toast & Confirmation Dialog Engine
  // ==============================================================================
  const appToastContainer = document.getElementById('appToastContainer');
  const customConfirmModal = document.getElementById('customConfirmModal');
  const customConfirmTitle = document.getElementById('customConfirmTitle');
  const customConfirmMessage = document.getElementById('customConfirmMessage');
  const customConfirmIcon = document.getElementById('customConfirmIcon');
  const customConfirmIconWrap = document.getElementById('customConfirmIconWrap');
  const btnCustomConfirmCancel = document.getElementById('btnCustomConfirmCancel');
  const btnCustomConfirmAction = document.getElementById('btnCustomConfirmAction');

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  function showToast(message, type = 'info', title = null, duration = 3800) {
    if (!appToastContainer) return;
    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;

    let iconText = 'ℹ️';
    if (type === 'success') iconText = '✓';
    else if (type === 'error') iconText = '✕';
    else if (type === 'warning') iconText = '⚠️';

    let defaultTitle = 'Notification';
    if (type === 'success') defaultTitle = 'Success';
    else if (type === 'error') defaultTitle = 'Notice';
    else if (type === 'warning') defaultTitle = 'Attention';

    toast.innerHTML = `
      <div class="app-toast-icon">${iconText}</div>
      <div class="app-toast-body">
        <div class="app-toast-title">${escapeHtml(title || defaultTitle)}</div>
        <div class="app-toast-msg">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
      </div>
      <button type="button" class="app-toast-close" title="Dismiss">✕</button>
    `;

    toast.querySelector('.app-toast-close').addEventListener('click', () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    });

    appToastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  function showConfirmDialog({ title = 'Please Confirm', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) {
    return new Promise((resolve) => {
      if (!customConfirmModal) {
        resolve(window.confirm(message));
        return;
      }

      customConfirmTitle.textContent = title;
      customConfirmMessage.textContent = message;
      btnCustomConfirmAction.textContent = confirmText;
      btnCustomConfirmCancel.textContent = cancelText;

      customConfirmIconWrap.className = `custom-modal-icon-wrap ${type}`;
      if (type === 'danger') {
        customConfirmIcon.textContent = '🗑️';
        btnCustomConfirmAction.className = 'btn-custom-modal-action danger';
        btnCustomConfirmAction.style.background = '';
        btnCustomConfirmAction.style.borderColor = '';
      } else if (type === 'success') {
        customConfirmIcon.textContent = '🎯';
        btnCustomConfirmAction.className = 'btn-custom-modal-action';
        btnCustomConfirmAction.style.background = '#10b981';
        btnCustomConfirmAction.style.borderColor = '#10b981';
      } else if (type === 'info') {
        customConfirmIcon.textContent = 'ℹ️';
        btnCustomConfirmAction.className = 'btn-custom-modal-action';
        btnCustomConfirmAction.style.background = '#2563eb';
        btnCustomConfirmAction.style.borderColor = '#2563eb';
      } else {
        customConfirmIcon.textContent = '⚠️';
        btnCustomConfirmAction.className = 'btn-custom-modal-action';
        btnCustomConfirmAction.style.background = '#7c3aed';
        btnCustomConfirmAction.style.borderColor = '#7c3aed';
      }

      customConfirmModal.style.display = 'flex';

      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        customConfirmModal.style.display = 'none';
        btnCustomConfirmAction.removeEventListener('click', handleConfirm);
        btnCustomConfirmCancel.removeEventListener('click', handleCancel);
      };

      btnCustomConfirmAction.addEventListener('click', handleConfirm);
      btnCustomConfirmCancel.addEventListener('click', handleCancel);
    });
  }

  // ==============================================================================
  // 1. Initialization
  // ==============================================================================
  async function init() {
    // Permanent clean light aesthetic matching Management Hub main theme
    document.body.classList.remove('dark-theme');
    try {
      localStorage.removeItem('mh_quiz_theme');
    } catch (e) {}

    setupEventListeners();
    await loadCoursesAndStats();
    loadUserProgressDashboard();
    initProStatus();
  }

  // Course Dataset Loader
  async function loadCoursesAndStats() {
    try {
      const res = await fetch('/api/quiz/courses');
      if (res.ok) {
        const data = await res.json();
        if (data.courses && data.courses.length > 0) {
          availableCourses = data.courses;
          populateCourseDropdown(availableCourses);
          updateSetupHints();
          return;
        }
      }
    } catch (e) {
      console.warn('API courses fetch failed, attempting local fallback:', e);
    }

    // Static fallback
    try {
      const qRes = await fetch('data/questions.json');
      if (qRes.ok) {
        const qList = await qRes.json();
        const map = {};
        qList.forEach(q => {
          const code = q.courseCode;
          if (!map[code]) {
            map[code] = { code, title: q.courseTitle || code, totalQuestions: 0, quiz1Questions: 0, quiz2Questions: 0, endtermQuestions: 0 };
          }
          map[code].totalQuestions++;
          if (q.week <= 4) map[code].quiz1Questions++;
          if (q.week <= 8) map[code].quiz2Questions++;
          if (q.week <= 12) map[code].endtermQuestions++;
        });
        availableCourses = Object.values(map);
        populateCourseDropdown(availableCourses);
        updateSetupHints();
      }
    } catch (err) {
      console.error('Fallback course loading error:', err);
    }
  }

  function populateCourseDropdown(courses) {
    if (!courseSelect) return;
    courseSelect.innerHTML = courses.map(c => `
      <option value="${c.code}">${c.code} — ${c.title}</option>
    `).join('');

    // Pre-selection via URL Query Params
    const urlParams = new URLSearchParams(window.location.search);
    const preCourse = urlParams.get('course');
    const prePhase = urlParams.get('phase');

    if (preCourse && courses.some(c => c.code.toUpperCase() === preCourse.toUpperCase())) {
      courseSelect.value = preCourse.toUpperCase();
      quizConfig.courseCode = preCourse.toUpperCase();
    } else if (courses.length > 0) {
      quizConfig.courseCode = courses[0].code;
    }
    document.querySelectorAll('.mh-course-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-course') === quizConfig.courseCode);
    });

    if (prePhase && ['quiz1', 'quiz2', 'endterm', 'all'].includes(prePhase.toLowerCase())) {
      setPhase(prePhase.toLowerCase());
    } else {
      setPhase('quiz1');
    }
  }

  function setPhase(phaseName) {
    quizConfig.phase = phaseName;
    
    // Update active pill button
    milestonePills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-phase') === phaseName);
    });

    // Update section heading (Image 3)
    if (selectedPhaseHeading) {
      if (phaseName === 'quiz1') selectedPhaseHeading.textContent = 'QUIZ 1 - QUESTION PAPERS';
      else if (phaseName === 'quiz2') selectedPhaseHeading.textContent = 'QUIZ 2 - QUESTION PAPERS';
      else if (phaseName === 'endterm') selectedPhaseHeading.textContent = 'END TERM - QUESTION PAPERS';
      else selectedPhaseHeading.textContent = 'COMPREHENSIVE - QUESTION PAPERS';
    }

    updateSetupHints();
  }

  function updateSetupHints() {
    const selectedCourse = availableCourses.find(c => c.code === quizConfig.courseCode);
    if (!selectedCourse) return;

    let count = selectedCourse.totalQuestions;
    if (quizConfig.phase === 'quiz1') count = selectedCourse.quiz1Questions;
    else if (quizConfig.phase === 'quiz2') count = selectedCourse.quiz2Questions;
    else if (quizConfig.phase === 'endterm') count = selectedCourse.endtermQuestions;

    const phaseLabel = quizConfig.phase.toUpperCase();
    if (launchPaperTitle) {
      launchPaperTitle.textContent = `${selectedCourse.code} — ${selectedCourse.title} • ${phaseLabel} Paper`;
    }

    if (availableQHint) {
      availableQHint.textContent = `${count} verified questions available for ${phaseLabel} • ${quizConfig.durationMinutes || 30} Mins Duration`;
    }

    quizConfig.durationMinutes = Math.max(10, Math.round(quizConfig.questionCount * 1.5));
  }


  // ==============================================================================
  // Management Hub Pro & Razorpay Integration
  // ==============================================================================
  const btnHeaderPro = document.getElementById('btnHeaderPro');
  const proBadgeActive = document.getElementById('proBadgeActive');
  const proUpgradeModal = document.getElementById('proUpgradeModal');
  const btnCloseProModal = document.getElementById('btnCloseProModal');
  const planBoxTerm = document.getElementById('planBoxTerm');
  const planBoxAnnual = document.getElementById('planBoxAnnual');
  const btnProceedCheckout = document.getElementById('btnProceedCheckout');
  const checkoutBtnText = document.getElementById('checkoutBtnText');

  async function initProStatus() {
    try {
      const res = await fetch('/api/payment/status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.isPro) {
          isUserPro = true;
          applyProUi();
        }
      }
    } catch (e) {
      console.warn('Pro status check error:', e);
    }

    try {
      const cfgRes = await fetch('/api/payment/config');
      if (cfgRes.ok) {
        paymentPlansConfig = await cfgRes.json();
      }
    } catch (e) {}
  }

  function applyProUi() {
    if (btnHeaderPro) btnHeaderPro.style.display = 'none';
    if (proBadgeActive) proBadgeActive.style.display = 'inline-flex';
    document.querySelectorAll('.pill-pro-tag').forEach(tag => {
      tag.innerHTML = '✓ PRO UNLOCKED';
      tag.style.background = '#10b981';
      tag.style.color = '#fff';
    });
    if (btnStartQuizText) {
      btnStartQuizText.textContent = 'Start Exam Simulation ↗';
    }
    if (btnPreviewQuiz) {
      btnPreviewQuiz.style.display = 'none';
    }
    if (examPreviewBanner) {
      examPreviewBanner.style.display = 'none';
    }
  }

  function openProModal(plan = 'term_pass') {
    selectedProPlan = plan;
    selectPlanBox(plan);
    if (proUpgradeModal) proUpgradeModal.style.display = 'flex';
  }

  function closeProModal() {
    if (proUpgradeModal) proUpgradeModal.style.display = 'none';
  }

  function selectPlanBox(plan) {
    selectedProPlan = plan;
    if (plan === 'term_pass') {
      planBoxTerm?.classList.add('active');
      planBoxAnnual?.classList.remove('active');
      if (checkoutBtnText) checkoutBtnText.textContent = 'Pay ₹149 via Razorpay (UPI / Cards)';
    } else {
      planBoxAnnual?.classList.add('active');
      planBoxTerm?.classList.remove('active');
      if (checkoutBtnText) checkoutBtnText.textContent = 'Pay ₹299 via Razorpay (UPI / Cards)';
    }
  }

  async function initiateRazorpayCheckout(planId = selectedProPlan) {
    if (!btnProceedCheckout) return;

    btnProceedCheckout.disabled = true;
    if (checkoutBtnText) checkoutBtnText.textContent = 'Contacting Razorpay Gateway...';

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Failed to initiate checkout', 'error');
        btnProceedCheckout.disabled = false;
        selectPlanBox(selectedProPlan);
        return;
      }

      if (data.isDemoMode || !window.Razorpay) {
        // Sandbox Simulation Mode (works right now before live keys are added to .env)
        const confirmed = await showConfirmDialog({
          title: 'Sandbox Payment Simulation',
          message: `Simulate instant test payment for ${data.plan.name} (₹${data.plan.price})? In production, the official Razorpay UPI/Cards popup will process the payment.`,
          confirmText: 'Simulate Payment ✓',
          cancelText: 'Cancel',
          type: 'success'
        });

        if (!confirmed) {
          btnProceedCheckout.disabled = false;
          selectPlanBox(selectedProPlan);
          return;
        }

        await completePaymentVerification({
          razorpay_order_id: data.order.id,
          razorpay_payment_id: 'pay_demo_' + Date.now(),
          razorpay_signature: 'demo_signature',
          planId
        });
      } else {
        // Live Razorpay Modal Popup
        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "Management Hub",
          description: data.plan.name,
          order_id: data.order.id,
          handler: async function (response) {
            await completePaymentVerification({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId
            });
          },
          prefill: {
            name: "IITM BS Student",
            email: "student@study.iitm.ac.in"
          },
          theme: {
            color: "#4f46e5"
          },
          modal: {
            ondismiss: function() {
              btnProceedCheckout.disabled = false;
              selectPlanBox(selectedProPlan);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          showToast('Payment Failed: ' + (resp.error?.description || 'Transaction cancelled'), 'error');
          btnProceedCheckout.disabled = false;
          selectPlanBox(selectedProPlan);
        });
        rzp.open();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('Payment gateway connection error', 'error');
      btnProceedCheckout.disabled = false;
      selectPlanBox(selectedProPlan);
    }
  }

  async function completePaymentVerification(payload) {
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        isUserPro = true;
        closeProModal();
        applyProUi();
        showToast(data.message || '🎉 Upgraded to Pro Pass! All exam papers unlocked.', 'success');
      } else {
        showToast(data.error || 'Payment signature verification failed', 'error');
      }
    } catch (e) {
      showToast('Error validating transaction with server', 'error');
    } finally {
      if (btnProceedCheckout) btnProceedCheckout.disabled = false;
      selectPlanBox(selectedProPlan);
    }
  }

  function setupProListeners() {
    btnHeaderPro?.addEventListener('click', () => openProModal('term_pass'));
    btnCloseProModal?.addEventListener('click', closeProModal);

    planBoxTerm?.addEventListener('click', () => selectPlanBox('term_pass'));
    planBoxAnnual?.addEventListener('click', () => selectPlanBox('annual_pass'));

    btnProceedCheckout?.addEventListener('click', () => {
      initiateRazorpayCheckout(selectedProPlan);
    });

    // Close on backdrop click
    proUpgradeModal?.addEventListener('click', (e) => {
      if (e.target === proUpgradeModal) closeProModal();
    });
  }

  // ==============================================================================
  // 2. Setup Screen Event Listeners
  // ==============================================================================
  function setupEventListeners() {
    // Milestone Pill Buttons (Image 2)
    milestonePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const phase = pill.getAttribute('data-phase');
        setPhase(phase);
        document.getElementById('selectionSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Curated Course Cards
    courseCards.forEach(card => {
      card.addEventListener('click', () => {
        const code = card.getAttribute('data-course');
        courseCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (courseSelect) {
          courseSelect.value = code;
          quizConfig.courseCode = code;
          updateSetupHints();
          document.getElementById('selectionSection')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Course select dropdown
    courseSelect?.addEventListener('change', (e) => {
      quizConfig.courseCode = e.target.value;
      updateSetupHints();
      document.querySelectorAll('.mh-course-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-course') === quizConfig.courseCode);
      });
    });

    // Count select
    countSelect?.addEventListener('change', (e) => {
      quizConfig.questionCount = parseInt(e.target.value) || 15;
      updateSetupHints();
    });

    // Type filter select
    typeFilterSelect?.addEventListener('change', (e) => {
      quizConfig.typeFilter = e.target.value;
    });

    // Mode Toggle in Setup
    modeBtnExam?.addEventListener('click', () => {
      modeBtnExam.classList.add('active');
      modeBtnPractice?.classList.remove('active');
      quizConfig.mode = 'exam';
      syncSideMode();
    });

    modeBtnPractice?.addEventListener('click', () => {
      modeBtnPractice.classList.add('active');
      modeBtnExam?.classList.remove('active');
      quizConfig.mode = 'practice';
      syncSideMode();
    });

    // Mode Toggle in Sidebar (Image 1)
    sideModeExam?.addEventListener('click', () => {
      quizConfig.mode = 'exam';
      syncSideMode();
    });

    sideModeLearning?.addEventListener('click', () => {
      quizConfig.mode = 'practice';
      syncSideMode();
    });

    // Launch Quiz & Pro Gating
    btnStartQuiz?.addEventListener('click', () => startQuiz(false));
    btnPreviewQuiz?.addEventListener('click', () => startQuiz(true));
    btnPreviewBannerUpgrade?.addEventListener('click', () => openProModal('term_pass'));

    // Sidebar Action Buttons (Image 1)
    btnSideSummary?.addEventListener('click', () => {
      showToast(
        `Course: ${quizConfig.courseCode}\nPhase: ${quizConfig.phase.toUpperCase()}\nQuestions: ${currentQuestions.length}\nAttempted: ${getAnsweredCount()}\nMode: ${quizConfig.mode === 'exam' ? 'Timed Exam Mode' : 'Learning Mode'}`,
        'info',
        'Paper Summary'
      );
    });

    btnSideDownload?.addEventListener('click', () => {
      showToast(
        `Generating printable question paper worksheet for ${quizConfig.courseCode} with complete answer key...`,
        'success',
        'PDF Generator'
      );
    });

    // Timer Icon Buttons (Pause & Reset)
    btnTimerPause?.addEventListener('click', toggleTimerPause);
    btnTimerReset?.addEventListener('click', resetTimer);

    // Exam Submission
    btnSubmitExam?.addEventListener('click', confirmSubmitQuiz);

    // Header Back / Exit
    btnHeaderExit?.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog({
        title: 'Exit Exam Simulation?',
        message: 'Are you sure you want to exit the exam session? Your current responses for this attempt will be discarded.',
        confirmText: 'Exit to Gateway',
        cancelText: 'Stay in Exam',
        type: 'danger'
      });
      if (confirmed) {
        exitToSetup();
      }
    });

    // Action Buttons in Question Pane
    btnClearResp?.addEventListener('click', clearCurrentResponse);
    btnMarkReview?.addEventListener('click', markCurrentForReview);
    btnCheckAnswer?.addEventListener('click', checkAnswerInstant);
    btnPrev?.addEventListener('click', goToPreviousQuestion);
    btnSaveNext?.addEventListener('click', saveAndNext);

    // Question Tools (Image 1)
    btnReportFormat?.addEventListener('click', () => {
      showToast('Question formatting and notation have been flagged for curriculum review. Thank you!', 'success', 'Report Submitted');
    });

    btnSnapshot?.addEventListener('click', () => {
      showToast('Question snapshot saved. You can share this problem in the Management Hub community.', 'info', 'Snapshot Saved');
    });

    // Student Progress Dashboard Controls
    document.getElementById('btnToggleHistory')?.addEventListener('click', () => {
      const container = document.getElementById('historyCollapseContainer');
      const toggleText = document.getElementById('historyToggleText');
      if (!container) return;
      const isHidden = container.style.display === 'none';
      container.style.display = isHidden ? 'block' : 'none';
      let count = 0;
      try {
        count = JSON.parse(localStorage.getItem('mh_quiz_attempts_history') || '[]').length;
      } catch (e) {}
      if (toggleText) {
        toggleText.textContent = isHidden ? `Hide Recent History (${count}) ▴` : `View Recent History (${count}) ▾`;
      }
    });

    document.getElementById('btnReviewLastAttempt')?.addEventListener('click', () => {
      if (typeof window.viewPastAttemptScorecard === 'function') {
        window.viewPastAttemptScorecard(0);
      }
    });

    document.getElementById('btnRetakeLastAttempt')?.addEventListener('click', () => {
      try {
        const history = JSON.parse(localStorage.getItem('mh_quiz_attempts_history') || '[]');
        if (history.length > 0) {
          const latest = history[0];
          if (courseSelect) courseSelect.value = latest.courseCode;
          quizConfig.courseCode = latest.courseCode;
          setPhase(latest.phase || 'quiz1');
          startQuiz();
        }
      } catch (e) {}
    });
  }

  function syncSideMode() {
    if (quizConfig.mode === 'exam') {
      sideModeExam?.classList.add('active');
      sideModeLearning?.classList.remove('active');
      modeBtnExam?.classList.add('active');
      modeBtnPractice?.classList.remove('active');
      btnCheckAnswer.style.display = 'none';
    } else {
      sideModeLearning?.classList.add('active');
      sideModeExam?.classList.remove('active');
      modeBtnPractice?.classList.add('active');
      modeBtnExam?.classList.remove('active');
      btnCheckAnswer.style.display = 'inline-flex';
    }
  }

  function getAnsweredCount() {
    let count = 0;
    currentQuestions.forEach(q => {
      if (hasUserAnswered(q)) count++;
    });
    return count;
  }

  // ==============================================================================
  // 3. Quiz Launch & Transition
  // ==============================================================================
  async function startQuiz(isExplicitPreview = false) {
    if (!isUserPro && !isExplicitPreview) {
      openProModal('term_pass');
      showToast('The Quiz Simulator is an exclusive Management Hub Pro feature. Upgrade to Pro Pass to start your full exam session.', 'warning', 'Pro Pass Required');
      return;
    }

    btnStartQuiz.disabled = true;
    if (btnStartQuizText) btnStartQuizText.textContent = 'Loading Simulator...';
    if (btnPreviewQuiz) btnPreviewQuiz.disabled = true;

    try {
      let qList = [];
      let isPreviewSession = false;
      const queryParams = new URLSearchParams({
        course: quizConfig.courseCode,
        phase: quizConfig.phase,
        type: quizConfig.typeFilter,
        limit: quizConfig.questionCount
      });

      try {
        const res = await fetch(`/api/quiz/questions?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          qList = data.questions || [];
          if (data.isPreviewOnly || !data.isPro) {
            isPreviewSession = true;
            showToast(data.message || 'Pro Preview: 2 sample questions unlocked. Upgrade to Pro Pass for the full paper.', 'info', 'Pro Preview Mode');
          }
        }
      } catch (e) {}

      // Fallback local fetch
      if (qList.length === 0) {
        const fallbackRes = await fetch('data/questions.json');
        const allQ = await fallbackRes.json();
        qList = allQ.filter(q => q.courseCode === quizConfig.courseCode);
        if (quizConfig.phase === 'quiz1') qList = qList.filter(q => q.week <= 4);
        else if (quizConfig.phase === 'quiz2') qList = qList.filter(q => q.week <= 8);
        else if (quizConfig.phase === 'endterm') qList = qList.filter(q => q.week <= 12);
        
        if (quizConfig.typeFilter !== 'all') {
          qList = qList.filter(q => q.type.toLowerCase() === quizConfig.typeFilter.toLowerCase());
        }

        qList.sort(() => 0.5 - Math.random());
        const maxLimit = (!isUserPro) ? 2 : quizConfig.questionCount;
        qList = qList.slice(0, maxLimit);
        if (!isUserPro) isPreviewSession = true;
      }

      if (qList.length === 0) {
        showToast('No questions found for the selected scope. Please try another course or milestone.', 'warning', 'No Questions Found');
        return;
      }

      currentQuestions = qList;
      currentIndex = 0;
      userResponses = {};
      questionStatus = {};

      currentQuestions.forEach(q => {
        questionStatus[q.id] = 'not-visited';
      });

      // Switch Screens
      screenSetup.style.display = 'none';
      screenResult.style.display = 'none';
      screenExam.style.display = 'grid';
      btnHeaderExit.style.display = 'inline-flex';

      // Show/hide preview banner
      if (examPreviewBanner) {
        examPreviewBanner.style.display = (isPreviewSession && !isUserPro) ? 'flex' : 'none';
      }

      // Update Sidebar Metadata (Image 1)
      const selectedCourse = availableCourses.find(c => c.code === quizConfig.courseCode);
      if (metaExam) metaExam.textContent = quizConfig.phase.toUpperCase();
      if (metaSubject) metaSubject.textContent = selectedCourse ? selectedCourse.title : quizConfig.courseCode;
      if (metaMarks) metaMarks.textContent = `${currentQuestions.length}.00`;
      if (metaQp) metaQp.textContent = `Indian Institute Of Technology, Madras`;

      syncSideMode();

      // Timer Setup
      initialDurationSeconds = quizConfig.durationMinutes * 60;
      startTimer(initialDurationSeconds);

      // Render Question Palette
      renderPalette();

      // Load Question 0
      loadQuestion(0);

    } catch (err) {
      console.error('Quiz start error:', err);
      showToast('Could not initialize quiz session. Please verify connection and try again.', 'error', 'Error Starting Quiz');
    } finally {
      btnStartQuiz.disabled = false;
      if (btnPreviewQuiz) btnPreviewQuiz.disabled = false;
      if (btnStartQuizText) {
        btnStartQuizText.textContent = isUserPro ? 'Start Exam Simulation ↗' : 'Start Practice (Pro Pass) ↗';
      }
    }
  }

  // ==============================================================================
  // 4. Question Loading & Interactive Options
  // ==============================================================================
  function loadQuestion(index) {
    if (index < 0 || index >= currentQuestions.length) return;
    currentIndex = index;

    const q = currentQuestions[currentIndex];

    if (questionStatus[q.id] === 'not-visited') {
      questionStatus[q.id] = 'not-answered';
    }

    // Top Question Bar (Image 1)
    const displayId = q.id.replace(/[^0-9]/g, '') || (6406532159030 + currentIndex + 1);
    if (qDisplayNumId) qDisplayNumId.textContent = `Question ${currentIndex + 1} : ${displayId}`;
    if (qMarksBadge) qMarksBadge.textContent = `${q.marks || 1}.00`;
    if (qTypeBadge) qTypeBadge.textContent = q.type.toUpperCase();

    // Render Question Text (Markdown & KaTeX)
    if (questionTextEl) questionTextEl.innerHTML = formatMathAndMarkdown(q.questionText);

    // Hide feedback box
    if (practiceFeedbackBox) practiceFeedbackBox.style.display = 'none';

    // Render Answer Area (In-place selection, NO multiplying bug!)
    renderAnswerArea(q);

    // Update Palette UI
    updatePaletteUI();

    // Render Math
    renderMathJax();

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAnswerArea(q) {
    if (!answerContainer) return;
    answerContainer.innerHTML = '';

    if (q.type === 'mcq') {
      renderMcqOptions(q);
    } else if (q.type === 'msq') {
      renderMsqOptions(q);
    } else if (q.type === 'nat') {
      renderNatInput(q);
    }
  }

  // A. MCQ (Single Choice Radio)
  function renderMcqOptions(q) {
    answerContainer.innerHTML = '';
    const selected = userResponses[q.id];
    const container = document.createElement('div');
    container.className = 'options-list';

    q.options.forEach((optText, idx) => {
      const isSelected = selected === idx;
      const letter = String.fromCharCode(65 + idx); // A, B, C, D

      const item = document.createElement('div');
      item.className = `option-item ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="option-marker">${letter}</div>
        <div class="option-content">${formatMathAndMarkdown(optText)}</div>
      `;

      item.addEventListener('click', () => {
        userResponses[q.id] = idx;
        questionStatus[q.id] = questionStatus[q.id] === 'review' ? 'ans-review' : 'answered';

        // Toggle selected class in-place (No duplicate DOM nodes!)
        container.querySelectorAll('.option-item').forEach((el, i) => {
          el.classList.toggle('selected', i === idx);
        });

        updatePaletteUI();
      });

      container.appendChild(item);
    });

    answerContainer.appendChild(container);
  }

  // B. MSQ (Multiple Select Checkboxes)
  function renderMsqOptions(q) {
    answerContainer.innerHTML = '';
    const selectedList = Array.isArray(userResponses[q.id]) ? userResponses[q.id] : [];
    
    const callout = document.createElement('div');
    callout.className = 'msq-guidance-callout';
    callout.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <span>MSQ: One or more options may be correct. Full marks require selecting ALL correct options with NO incorrect selections.</span>
    `;
    answerContainer.appendChild(callout);

    const container = document.createElement('div');
    container.className = 'options-list';

    q.options.forEach((optText, idx) => {
      const isSelected = selectedList.includes(idx);
      const letter = String.fromCharCode(65 + idx);

      const item = document.createElement('div');
      item.className = `option-item msq ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="option-marker">${isSelected ? '✓' : letter}</div>
        <div class="option-content">${formatMathAndMarkdown(optText)}</div>
      `;

      item.addEventListener('click', () => {
        let cur = Array.isArray(userResponses[q.id]) ? [...userResponses[q.id]] : [];
        if (cur.includes(idx)) {
          cur = cur.filter(i => i !== idx);
        } else {
          cur.push(idx);
        }
        userResponses[q.id] = cur;

        const isNowSelected = cur.includes(idx);
        item.classList.toggle('selected', isNowSelected);
        const marker = item.querySelector('.option-marker');
        if (marker) marker.textContent = isNowSelected ? '✓' : letter;

        if (cur.length > 0) {
          questionStatus[q.id] = questionStatus[q.id] === 'review' ? 'ans-review' : 'answered';
        } else {
          questionStatus[q.id] = 'not-answered';
        }

        updatePaletteUI();
      });

      container.appendChild(item);
    });

    answerContainer.appendChild(container);
  }

  // C. NAT (Numerical Answer Type)
  function renderNatInput(q) {
    answerContainer.innerHTML = '';
    const curVal = userResponses[q.id] !== undefined ? userResponses[q.id] : '';

    const container = document.createElement('div');
    container.className = 'nat-input-container';
    container.innerHTML = `
      <label class="nat-label">Enter Numerical Value (Integer or Decimal):</label>
      <input type="text" class="nat-input-field" id="natInput" value="${curVal}" placeholder="e.g. 14.5" autocomplete="off" />
      <div class="nat-virtual-keypad">
        <button type="button" class="keypad-btn" data-key="7">7</button>
        <button type="button" class="keypad-btn" data-key="8">8</button>
        <button type="button" class="keypad-btn" data-key="9">9</button>
        <button type="button" class="keypad-btn" data-key="BACK">⌫</button>
        <button type="button" class="keypad-btn" data-key="4">4</button>
        <button type="button" class="keypad-btn" data-key="5">5</button>
        <button type="button" class="keypad-btn" data-key="6">6</button>
        <button type="button" class="keypad-btn" data-key="CLEAR">C</button>
        <button type="button" class="keypad-btn" data-key="1">1</button>
        <button type="button" class="keypad-btn" data-key="2">2</button>
        <button type="button" class="keypad-btn" data-key="3">3</button>
        <button type="button" class="keypad-btn" data-key="-">-</button>
        <button type="button" class="keypad-btn" data-key="0">0</button>
        <button type="button" class="keypad-btn" data-key=".">.</button>
      </div>
    `;

    answerContainer.appendChild(container);

    const input = container.querySelector('#natInput');

    function updateNatValue(v) {
      input.value = v;
      const trimmed = v.trim();
      if (trimmed !== '') {
        userResponses[q.id] = trimmed;
        questionStatus[q.id] = questionStatus[q.id] === 'review' ? 'ans-review' : 'answered';
      } else {
        delete userResponses[q.id];
        questionStatus[q.id] = 'not-answered';
      }
      updatePaletteUI();
    }

    input.addEventListener('input', (e) => {
      updateNatValue(e.target.value);
    });

    container.querySelectorAll('.keypad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-key');
        let val = input.value;
        if (k === 'CLEAR') val = '';
        else if (k === 'BACK') val = val.slice(0, -1);
        else if (k === '.' && val.includes('.')) return;
        else if (k === '-' && val.length > 0) return;
        else val += k;
        updateNatValue(val);
      });
    });
  }

  // ==============================================================================
  // 5. Actions (Clear, Review, Next, Previous)
  // ==============================================================================
  function saveAndNext() {
    const q = currentQuestions[currentIndex];
    const hasResp = hasUserAnswered(q);

    if (hasResp) {
      questionStatus[q.id] = questionStatus[q.id] === 'review' || questionStatus[q.id] === 'ans-review' ? 'ans-review' : 'answered';
    } else {
      questionStatus[q.id] = 'not-answered';
    }

    if (currentIndex < currentQuestions.length - 1) {
      loadQuestion(currentIndex + 1);
    } else {
      updatePaletteUI();
      confirmSubmitQuiz();
    }
  }

  function markCurrentForReview() {
    const q = currentQuestions[currentIndex];
    const hasResp = hasUserAnswered(q);
    questionStatus[q.id] = hasResp ? 'ans-review' : 'review';

    if (currentIndex < currentQuestions.length - 1) {
      loadQuestion(currentIndex + 1);
    } else {
      updatePaletteUI();
    }
  }

  function clearCurrentResponse() {
    const q = currentQuestions[currentIndex];
    delete userResponses[q.id];
    questionStatus[q.id] = 'not-answered';
    renderAnswerArea(q);
    updatePaletteUI();
  }

  function goToPreviousQuestion() {
    if (currentIndex > 0) {
      loadQuestion(currentIndex - 1);
    }
  }

  function hasUserAnswered(q) {
    const resp = userResponses[q.id];
    if (q.type === 'mcq') return resp !== undefined && resp !== null;
    if (q.type === 'msq') return Array.isArray(resp) && resp.length > 0;
    if (q.type === 'nat') return resp !== undefined && String(resp).trim().length > 0;
    return false;
  }

  // Learning Mode Instant Check
  function checkAnswerInstant() {
    const q = currentQuestions[currentIndex];
    const isCorrect = evaluateQuestion(q, userResponses[q.id]);

    if (!practiceFeedbackBox) return;
    practiceFeedbackBox.style.display = 'block';
    practiceFeedbackBox.className = `practice-feedback-card ${isCorrect ? 'correct' : 'incorrect'}`;

    let correctText = '';
    if (q.type === 'mcq') {
      const letter = String.fromCharCode(65 + q.correctAnswer);
      correctText = `Option (${letter}): ${q.options[q.correctAnswer]}`;
    } else if (q.type === 'msq') {
      const letters = q.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ');
      correctText = `Options: ${letters}`;
    } else if (q.type === 'nat') {
      correctText = `Numerical Value: ${q.correctAnswer}`;
    }

    practiceFeedbackBox.innerHTML = `
      <div style="font-weight: 800; margin-bottom: 6px;">
        ${isCorrect ? '✓ Correct Answer!' : '✗ Incorrect Response'}
      </div>
      <div>
        <strong>Correct:</strong> ${formatMathAndMarkdown(correctText)}<br/>
        <strong>Explanation:</strong> ${formatMathAndMarkdown(q.explanation || 'Refer to course slides for details.')}
      </div>
    `;

    renderMathJax();
  }

  // ==============================================================================
  // 6. Question Menu (Palette) Synchronization (Image 1)
  // ==============================================================================
  function renderPalette() {
    if (!paletteGrid) return;
    paletteGrid.innerHTML = '';

    currentQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `qp-menu-chip ${questionStatus[q.id] || 'not-visited'} ${idx === currentIndex ? 'current' : ''}`;
      btn.textContent = (idx + 1).toString();
      btn.setAttribute('data-index', idx);

      btn.addEventListener('click', () => {
        loadQuestion(idx);
      });

      paletteGrid.appendChild(btn);
    });
  }

  function updatePaletteUI() {
    if (!paletteGrid) return;
    const btns = paletteGrid.querySelectorAll('.qp-menu-chip');
    btns.forEach((btn, idx) => {
      const q = currentQuestions[idx];
      const status = questionStatus[q.id] || 'not-visited';
      btn.className = `qp-menu-chip ${status} ${idx === currentIndex ? 'current' : ''}`;
    });
  }

  // ==============================================================================
  // 7. Timer Clock with Pause & Reset (Image 1)
  // ==============================================================================
  function startTimer(durationSeconds) {
    clearInterval(timerInterval);
    timeRemainingSeconds = durationSeconds;
    isTimerPaused = false;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      if (!isTimerPaused) {
        timeRemainingSeconds--;
        updateTimerDisplay();

        if (timeRemainingSeconds <= 0) {
          clearInterval(timerInterval);
          showToast('Time has expired! Submitting your exam automatically for evaluation...', 'warning', 'Timer Expired', 5000);
          finalizeQuizSubmission();
        }
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!timerDisplay) return;
    const mins = Math.floor(Math.max(0, timeRemainingSeconds) / 60);
    const secs = Math.max(0, timeRemainingSeconds) % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function toggleTimerPause() {
    isTimerPaused = !isTimerPaused;
    if (btnTimerPause) {
      btnTimerPause.textContent = isTimerPaused ? '▶️' : '⏸';
      btnTimerPause.title = isTimerPaused ? 'Resume Timer' : 'Pause Timer';
    }
  }

  async function resetTimer() {
    const confirmed = await showConfirmDialog({
      title: 'Reset Exam Timer?',
      message: 'Do you want to reset the timer back to the starting duration of this paper?',
      confirmText: 'Reset Timer',
      cancelText: 'Keep Running',
      type: 'warning'
    });

    if (confirmed) {
      timeRemainingSeconds = initialDurationSeconds;
      isTimerPaused = false;
      if (btnTimerPause) btnTimerPause.textContent = '⏸';
      updateTimerDisplay();
      showToast('Timer has been reset to starting duration.', 'info', 'Timer Reset');
    }
  }

  // ==============================================================================
  // 8. Evaluation & Submission
  // ==============================================================================
  async function confirmSubmitQuiz() {
    let answered = 0;
    currentQuestions.forEach(q => {
      if (hasUserAnswered(q)) answered++;
    });

    const unanswered = currentQuestions.length - answered;
    const msg = `Are you ready to submit your exam for evaluation?\n\n• Total Questions: ${currentQuestions.length}\n• Attempted: ${answered}\n• Unattempted: ${unanswered}`;

    const confirmed = await showConfirmDialog({
      title: 'Submit Exam Paper?',
      message: msg,
      confirmText: 'Submit & View Scorecard',
      cancelText: 'Back to Questions',
      type: 'success'
    });

    if (confirmed) {
      clearInterval(timerInterval);
      finalizeQuizSubmission();
    }
  }

  function finalizeQuizSubmission() {
    clearInterval(timerInterval);

    let totalScore = 0;
    let maxPossibleScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const evaluationResults = currentQuestions.map(q => {
      const marks = q.marks || 1;
      maxPossibleScore += marks;
      const resp = userResponses[q.id];
      const attempted = hasUserAnswered(q);

      if (!attempted) {
        unattemptedCount++;
        return { question: q, userResponse: null, isCorrect: false, status: 'skipped', earnedMarks: 0 };
      }

      const isCorrect = evaluateQuestion(q, resp);
      if (isCorrect) {
        correctCount++;
        totalScore += marks;
        return { question: q, userResponse: resp, isCorrect: true, status: 'correct', earnedMarks: marks };
      } else {
        incorrectCount++;
        return { question: q, userResponse: resp, isCorrect: false, status: 'incorrect', earnedMarks: 0 };
      }
    });

    const resultPayload = {
      totalScore,
      maxPossibleScore,
      correctCount,
      incorrectCount,
      unattemptedCount,
      evaluationResults
    };

    saveExamAttempt(resultPayload);
    renderResultScorecard(resultPayload);
  }

  function evaluateQuestion(q, userResp) {
    if (userResp === undefined || userResp === null) return false;

    if (q.type === 'mcq') {
      return parseInt(userResp) === parseInt(q.correctAnswer);
    }

    if (q.type === 'msq') {
      if (!Array.isArray(userResp) || !Array.isArray(q.correctAnswer)) return false;
      if (userResp.length !== q.correctAnswer.length) return false;
      const sortedUser = [...userResp].sort((a, b) => a - b);
      const sortedCorrect = [...q.correctAnswer].sort((a, b) => a - b);
      return sortedUser.every((val, i) => val === sortedCorrect[i]);
    }

    if (q.type === 'nat') {
      const uNum = parseFloat(userResp);
      const cNum = parseFloat(q.correctAnswer);
      if (isNaN(uNum) || isNaN(cNum)) return false;
      const tol = q.tolerance !== undefined ? parseFloat(q.tolerance) : 0.05;
      return Math.abs(uNum - cNum) <= tol;
    }

    return false;
  }

  // ==============================================================================
  // 9. Scorecard & Review
  // ==============================================================================
  function renderResultScorecard(data) {
    screenExam.style.display = 'none';
    screenSetup.style.display = 'none';
    screenResult.style.display = 'block';
    btnHeaderExit.style.display = 'inline-flex';
    btnHeaderExit.innerHTML = '<span>← Return to Gateway</span>';

    const percentage = data.maxPossibleScore > 0 ? (data.totalScore / data.maxPossibleScore) * 100 : 0;

    let grade = 'U (Fail)';
    if (percentage >= 90) grade = 'S Grade (Outstanding)';
    else if (percentage >= 80) grade = 'A Grade (Excellent)';
    else if (percentage >= 70) grade = 'B Grade (Very Good)';
    else if (percentage >= 60) grade = 'C Grade (Good)';
    else if (percentage >= 50) grade = 'D Grade (Satisfactory)';
    else if (percentage >= 40) grade = 'E Grade (Pass)';

    document.getElementById('resScoreVal').textContent = `${data.totalScore} / ${data.maxPossibleScore}`;
    document.getElementById('resGradeVal').textContent = `${percentage.toFixed(1)}% • ${grade}`;
    document.getElementById('resAccuracy').textContent = `${percentage.toFixed(0)}%`;
    document.getElementById('resCorrectCount').textContent = data.correctCount;
    document.getElementById('resIncorrectCount').textContent = data.incorrectCount;
    document.getElementById('resSkippedCount').textContent = data.unattemptedCount;

    // Review Cards
    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = data.evaluationResults.map((r, i) => {
      const q = r.question;
      let statusTag = '';
      if (r.status === 'correct') {
        statusTag = `<span class="review-status-tag correct">✓ Correct (+${r.earnedMarks})</span>`;
      } else if (r.status === 'incorrect') {
        statusTag = `<span class="review-status-tag incorrect">✗ Incorrect (0)</span>`;
      } else {
        statusTag = `<span class="review-status-tag skipped">○ Skipped (0)</span>`;
      }

      let userAnsFormatted = 'Not Attempted';
      let correctAnsFormatted = '';

      if (q.type === 'mcq') {
        if (r.userResponse !== null && r.userResponse !== undefined) {
          const uLetter = String.fromCharCode(65 + r.userResponse);
          userAnsFormatted = `(${uLetter}) ${q.options[r.userResponse]}`;
        }
        const cLetter = String.fromCharCode(65 + q.correctAnswer);
        correctAnsFormatted = `(${cLetter}) ${q.options[q.correctAnswer]}`;
      } else if (q.type === 'msq') {
        if (Array.isArray(r.userResponse) && r.userResponse.length > 0) {
          userAnsFormatted = r.userResponse.map(idx => `(${String.fromCharCode(65 + idx)}) ${q.options[idx]}`).join('<br/>');
        }
        correctAnsFormatted = q.correctAnswer.map(idx => `(${String.fromCharCode(65 + idx)}) ${q.options[idx]}`).join('<br/>');
      } else if (q.type === 'nat') {
        if (r.userResponse !== null && r.userResponse !== undefined) {
          userAnsFormatted = r.userResponse;
        }
        correctAnsFormatted = `${q.correctAnswer} (Tolerance: ±${q.tolerance || 0.05})`;
      }

      return `
        <div class="review-item-card">
          <div class="review-item-header">
            <div>
              <strong style="font-size:15px;">Question ${i + 1}</strong>
              <span style="font-size:11.5px; font-weight:800; background:#f3f4f6; padding:2px 8px; border-radius:4px; margin-left:8px;">${q.type.toUpperCase()}</span>
              <span style="font-size:11.5px; color:#6b7280; margin-left:6px;">Week ${q.week}</span>
            </div>
            ${statusTag}
          </div>
          <div style="font-size:15px; line-height:1.65; margin-bottom:14px;">
            ${formatMathAndMarkdown(q.questionText)}
          </div>
          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; font-size:13.5px; margin-bottom:10px;">
            <div style="margin-bottom:6px;"><strong>Your Answer:</strong> <span style="color:${r.isCorrect ? '#166534' : (r.status === 'skipped' ? '#6b7280' : '#b91c1c')}">${userAnsFormatted}</span></div>
            <div><strong>Correct Answer:</strong> <span style="color:#166534; font-weight:700;">${correctAnsFormatted}</span></div>
          </div>
          <div class="review-explanation-box">
            <strong style="display:block; margin-bottom:4px; color:#111827;">Explanation &amp; Solution:</strong>
            ${formatMathAndMarkdown(q.explanation || 'Refer to the official lecture slides for derivation.')}
          </div>
        </div>
      `;
    }).join('');

    renderMathJax();
  }

  function exitToSetup() {
    clearInterval(timerInterval);
    screenExam.style.display = 'none';
    screenResult.style.display = 'none';
    screenSetup.style.display = 'block';
    btnHeaderExit.style.display = 'none';
    loadUserProgressDashboard();
  }

  // ==============================================================================
  // 10. Math & Formatting Utility
  // ==============================================================================
  function formatMathAndMarkdown(text) {
    if (!text) return '';
    let str = String(text);
    // Bold
    str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return str;
  }

  function renderMathJax() {
    if (window.renderMathInElement && typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }

  // ==============================================================================
  // 11. Student Practice Progress & Exam History Persistence
  // ==============================================================================
  function saveExamAttempt(data) {
    const percentage = data.maxPossibleScore > 0 ? (data.totalScore / data.maxPossibleScore) * 100 : 0;
    let grade = 'U (Fail)';
    if (percentage >= 90) grade = 'S Grade (Outstanding)';
    else if (percentage >= 80) grade = 'A Grade (Excellent)';
    else if (percentage >= 70) grade = 'B Grade (Very Good)';
    else if (percentage >= 60) grade = 'C Grade (Good)';
    else if (percentage >= 50) grade = 'D Grade (Satisfactory)';
    else if (percentage >= 40) grade = 'E Grade (Pass)';

    const courseObj = availableCourses.find(c => c.code.toUpperCase() === (quizConfig.courseCode || '').toUpperCase());
    const courseTitle = courseObj ? courseObj.title : (quizConfig.courseCode || 'Course');
    const phaseLabel = quizConfig.phase === 'quiz1' ? 'Quiz 1' : (quizConfig.phase === 'quiz2' ? 'Quiz 2' : (quizConfig.phase === 'endterm' ? 'End Term' : 'Comprehensive'));

    const timeSpent = Math.max(1, initialDurationSeconds - timeRemainingSeconds);

    const attempt = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      courseCode: quizConfig.courseCode,
      courseTitle: courseTitle,
      paperName: `${phaseLabel} Mock Exam`,
      phase: quizConfig.phase,
      mode: quizConfig.mode,
      totalScore: data.totalScore,
      maxPossibleScore: data.maxPossibleScore,
      percentage: Math.round(percentage * 10) / 10,
      grade: grade,
      correctCount: data.correctCount,
      incorrectCount: data.incorrectCount,
      unattemptedCount: data.unattemptedCount,
      timeSpentSeconds: timeSpent,
      timestamp: new Date().toISOString(),
      evaluationResults: data.evaluationResults
    };

    // 1. Save to local storage for instant offline / guest resilience
    try {
      const stored = JSON.parse(localStorage.getItem('mh_quiz_attempts_history') || '[]');
      stored.unshift(attempt);
      if (stored.length > 50) stored.length = 50;
      localStorage.setItem('mh_quiz_attempts_history', JSON.stringify(stored));
    } catch (e) {}

    // 2. Sync to Express server API
    fetch('/api/quiz/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt)
    }).catch(e => console.warn('Could not sync attempt to server:', e));

    // 3. Refresh the progress dashboard
    loadUserProgressDashboard();
  }

  function loadUserProgressDashboard() {
    const dashboard = document.getElementById('userProgressDashboard');
    if (!dashboard) return;

    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('mh_quiz_attempts_history') || '[]');
    } catch (e) {
      history = [];
    }

    if (!Array.isArray(history) || history.length === 0) {
      dashboard.style.display = 'none';
      return;
    }

    dashboard.style.display = 'block';
    const latest = history[0];

    // Update Last Attempt Card
    const lastCourseTitle = document.getElementById('lastTestCourseTitle');
    const lastPaperName = document.getElementById('lastTestPaperName');
    const lastScoreText = document.getElementById('lastTestScoreText');
    const lastGradePill = document.getElementById('lastTestGradePill');
    const lastModeBadge = document.getElementById('lastTestModeBadge');
    const lastTimestamp = document.getElementById('lastTestTimestamp');

    if (lastCourseTitle) lastCourseTitle.textContent = `${latest.courseCode} — ${latest.courseTitle}`;
    if (lastPaperName) {
      const qCount = latest.evaluationResults ? latest.evaluationResults.length : (latest.correctCount + latest.incorrectCount + latest.unattemptedCount);
      lastPaperName.textContent = `${latest.paperName} • ${qCount} Questions • ${formatDuration(latest.timeSpentSeconds || 0)}`;
    }
    if (lastScoreText) lastScoreText.textContent = `${latest.totalScore} / ${latest.maxPossibleScore}`;
    if (lastGradePill) lastGradePill.textContent = `${latest.grade} (${latest.percentage}%)`;
    if (lastModeBadge) lastModeBadge.textContent = latest.mode === 'exam' ? '⏱️ Timed Exam' : '💡 Learning Mode';
    if (lastTimestamp) lastTimestamp.textContent = formatRelativeTime(latest.timestamp);

    // Cumulative Metrics
    const totalMocks = history.length;
    let sumPercentages = 0;
    let bestScore = 0;
    let totalQuestions = 0;

    history.forEach(h => {
      const pct = typeof h.percentage === 'number' ? h.percentage : 0;
      sumPercentages += pct;
      if (pct > bestScore) bestScore = pct;
      totalQuestions += (h.correctCount || 0) + (h.incorrectCount || 0);
    });

    const avgScore = totalMocks > 0 ? (sumPercentages / totalMocks).toFixed(1) : '0';

    const metricTotalMocks = document.getElementById('metricTotalMocks');
    const metricAvgScore = document.getElementById('metricAvgScore');
    const metricBestScore = document.getElementById('metricBestScore');
    const metricQuestionsSolved = document.getElementById('metricQuestionsSolved');
    const historyToggleText = document.getElementById('historyToggleText');

    if (metricTotalMocks) metricTotalMocks.textContent = totalMocks;
    if (metricAvgScore) metricAvgScore.textContent = `${avgScore}%`;
    if (metricBestScore) metricBestScore.textContent = `${bestScore.toFixed(1)}%`;
    if (metricQuestionsSolved) metricQuestionsSolved.textContent = totalQuestions;
    if (historyToggleText) historyToggleText.textContent = `View Recent History (${totalMocks}) ▾`;

    // Populate History List
    const historyListContainer = document.getElementById('historyListContainer');
    if (historyListContainer) {
      historyListContainer.innerHTML = history.slice(0, 8).map((att, idx) => {
        const timeAgo = formatRelativeTime(att.timestamp);
        return `
          <div class="qp-history-item">
            <div class="qp-history-left">
              <span class="qp-history-course">${att.courseCode} — ${att.paperName || 'Mock Exam'}</span>
              <span class="qp-history-meta">${timeAgo} • ${att.mode === 'exam' ? 'Timed Exam' : 'Practice'} • ${att.grade || ''}</span>
            </div>
            <div class="qp-history-right">
              <span class="qp-history-score" style="color: ${att.percentage >= 60 ? '#16a34a' : '#ea580c'};">
                ${att.totalScore}/${att.maxPossibleScore} (${att.percentage}%)
              </span>
              <button type="button" class="btn-review-attempt" style="padding: 5px 10px; font-size: 11.5px;" onclick="window.viewPastAttemptScorecard(${idx})">
                Review ↗
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  window.viewPastAttemptScorecard = function(index) {
    const history = JSON.parse(localStorage.getItem('mh_quiz_attempts_history') || '[]');
    const attempt = history[index];
    if (!attempt) return;

    renderResultScorecard({
      totalScore: attempt.totalScore,
      maxPossibleScore: attempt.maxPossibleScore,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unattemptedCount: attempt.unattemptedCount,
      evaluationResults: attempt.evaluationResults || []
    });
  };

  function formatRelativeTime(isoString) {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function formatDuration(seconds) {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  // Restart / New Quiz Buttons
  document.getElementById('btnRetakeQuiz')?.addEventListener('click', () => {
    startQuiz();
  });

  document.getElementById('btnNewQuiz')?.addEventListener('click', () => {
    exitToSetup();
  });

  init();
});
