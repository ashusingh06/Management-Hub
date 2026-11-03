import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DEFAULT_COURSES } from './src/data/defaultCourses.js';
import { v2 as cloudinary } from 'cloudinary';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mghub_jwt_super_secure_secret_2026_key';

// Ensure data directory exists (uploads no longer needed — Cloudinary handles storage)
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const COMMUNITY_FILE = path.join(DATA_DIR, 'community.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

function getPayments() {
  try {
    if (!fs.existsSync(PAYMENTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function savePayments(payments) {
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
}

const PRO_PLANS = {
  term_pass: {
    id: 'term_pass',
    name: 'IITM BS Term Pro Pass',
    badge: 'TERM PRO',
    price: 149,
    amount: 14900, // in paise (₹149)
    currency: 'INR',
    durationDays: 120, // 4 months
    description: 'Complete Quiz Simulator (Quiz 1, 2 & End-Term) & Full Authentic PYQs for Current Term',
    features: [
      'Full 45-min & 2.5-hour Timed Exam Simulators for All Milestones',
      'All Authentic Previous Year Exam Papers (Quiz 1, 2 & End-Term)',
      'Step-by-step Detailed Explanations & Solutions',
      'Personalized Attempt Tracking & Detailed Performance Reports'
    ]
  },
  annual_pass: {
    id: 'annual_pass',
    name: 'All-Course Annual Master Pass',
    badge: 'ANNUAL PRO',
    price: 299,
    amount: 29900, // in paise (₹299)
    currency: 'INR',
    durationDays: 365, // 1 year
    description: 'All Foundation, Diploma & Degree PYQs for 3 Consecutive Terms',
    features: [
      'Everything in Term Pro Pass for 3 consecutive terms',
      'Priority access to newly solved PYQ papers',
      'Downloadable PDF Solution Keys & Detailed Formula Cheatsheets',
      'Special Pro Scholar Badge on Student Dashboard'
    ]
  }
};

let razorpayInstance = null;
const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

if (RZP_KEY_ID && RZP_KEY_SECRET && !RZP_KEY_ID.includes('placeholder')) {
  try {
    razorpayInstance = new Razorpay({
      key_id: RZP_KEY_ID,
      key_secret: RZP_KEY_SECRET
    });
    console.log('[Razorpay] Initialized with live/test key:', RZP_KEY_ID);
  } catch (err) {
    console.warn('[Razorpay] Initialization warning:', err.message);
  }
}

function checkIfUserIsPro(req) {
  
  const proToken = req.cookies?.mghub_pro_token || req.headers['x-pro-token'];
  if (proToken) {
    try {
      const decoded = jwt.verify(proToken, JWT_SECRET);
      if (decoded && decoded.isPremium && new Date(decoded.expiresAt) > new Date()) {
        return { isPro: true, plan: decoded.plan, expiresAt: decoded.expiresAt };
      }
    } catch (e) {}
  }

  let token = req.cookies?.mghub_auth_token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin') {
        return { isPro: true, plan: 'admin_lifetime', expiresAt: '2099-12-31T23:59:59.000Z' };
      }
      const users = getUsers();
      const user = users.find(u => u.id === decoded.id || u.email.toLowerCase() === decoded.email?.toLowerCase());
      if (user && user.isPremium && (!user.premiumExpiry || new Date(user.premiumExpiry) > new Date())) {
        return { isPro: true, plan: user.premiumPlan || 'term_pass', expiresAt: user.premiumExpiry };
      }
    } catch (e) {}
  }

  return { isPro: false };
}

const DEFAULT_COMMUNITY_SETTINGS = {
  title: "Join Our Community",
  subtitle: "Connect with fellow students, collaborate on coursework, share study materials, and stay updated with official announcements across our community groups.",
  whatsapp: {
    enabled: true,
    title: "Official WhatsApp Community",
    subtitle: "Active discussion group for IITM BS students. Ask questions, share notes, and get instant updates.",
    url: "https://chat.whatsapp.com/ClB7IBHguCWKgjWtuyjfvf",
    badge: "Active Community",
    buttonText: "Join WhatsApp Community"
  },
  telegram: {
    enabled: true,
    title: "Telegram Channel & Group",
    subtitle: "Direct broadcast channel & discussion forum for study materials, PYQ papers, and important alerts.",
    url: "https://t.me/MrBlessing143",
    badge: "Fast Alerts & Resources",
    buttonText: "Join on Telegram"
  },
  customChannels: []
};

// Initialize database files if missing
if (!fs.existsSync(COURSES_FILE)) {
  fs.writeFileSync(COURSES_FILE, JSON.stringify(DEFAULT_COURSES, null, 2));
}

if (!fs.existsSync(ANALYTICS_FILE)) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({ searches: [], bookmarks: [] }, null, 2));
}

if (!fs.existsSync(COMMUNITY_FILE)) {
  fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(DEFAULT_COMMUNITY_SETTINGS, null, 2));
}

// Database Helpers
function getUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getCourses() {
  try {
    return JSON.parse(fs.readFileSync(COURSES_FILE, 'utf-8'));
  } catch (e) {
    return DEFAULT_COURSES;
  }
}

function saveCourses(courses) {
  fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2));
}

function getAnalytics() {
  try {
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
  } catch (e) {
    return { searches: [], bookmarks: [] };
  }
}

function saveAnalytics(data) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

function getCommunitySettings() {
  try {
    if (!fs.existsSync(COMMUNITY_FILE)) return DEFAULT_COMMUNITY_SETTINGS;
    return JSON.parse(fs.readFileSync(COMMUNITY_FILE, 'utf-8'));
  } catch (e) {
    return DEFAULT_COMMUNITY_SETTINGS;
  }
}

function saveCommunitySettings(settings) {
  fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(settings, null, 2));
}

// Cloudinary Configuration (PDF Storage — Free 25GB, 24*7 accessible)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a buffer to Cloudinary and return the permanent secure URL
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} publicId - Unique identifier for the file
 * @returns {Promise<string>} - Permanent HTTPS URL of the uploaded PDF
 */
function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'auto',         // 'auto' allows proper PDF viewing
        folder: 'management-hub/pdfs',
        overwrite: true,
        use_filename: true,
        unique_filename: false
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Multer — Memory Storage (PDF buffer streamed directly to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Ensure default admin account exists with bcrypt hash
async function ensureAdminExists() {
  const users = getUsers();
  const adminEmail = (process.env.ADMIN_EMAIL || 'aashishsinghh06@gmail.com').toLowerCase().trim();
  const hasAdmin = users.some(u => u.role === 'admin' || u.email.toLowerCase() === adminEmail);
  if (!hasAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSCODE || 'homeaccess#2345#thisisrealaurafarming', salt);
    users.unshift({
      id: Date.now().toString(),
      name: process.env.ADMIN_NAME || 'Aashish Singh',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
  }
}
ensureAdminExists();

// Middleware Configuration
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication & Role-Based Authorization Middleware

/**
 * Extracts and verifies JWT from HTTP-Only cookie or Authorization Bearer header
 */
function authenticateToken(req, res, next) {
  let token = req.cookies?.mghub_auth_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired session token. Please log in again.'
    });
  }
}

/**
 * Strictly enforces that req.user has role === 'admin'
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Access denied. Administrator privileges required.'
    });
  }
  next();
}

// Page-Level Protection Middleware (Blocks manual entry to /admin or /admin.html)

function protectAdminHtml(req, res, next) {
  let token = req.cookies?.mghub_auth_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.redirect('/login.html?error=unauthorized&redirect=/admin.html');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.redirect('/login.html?error=forbidden&redirect=/admin.html');
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/login.html?error=session_expired&redirect=/admin.html');
  }
}

// Protected Admin Dashboard Route
app.get(['/admin', '/admin.html'], protectAdminHtml, (req, res) => {
  const adminHtmlPath = path.join(__dirname, 'admin.html');
  if (fs.existsSync(adminHtmlPath)) {
    res.sendFile(adminHtmlPath);
  } else {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Authentication API Endpoints

// Register a new Student / User account (Always role: 'user')
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const users = getUsers();

  const exists = users.some(u => u.email.toLowerCase() === sanitizedEmail);
  if (exists) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // Hash password securely with bcrypt (Salt rounds = 10)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    id: Date.now().toString(),
    name: (name || 'Student User').trim(),
    email: sanitizedEmail,
    password: hashedPassword,
    role: 'user', // Public registration is strictly role: user
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Generate JWT token
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set HTTP-Only Cookie
  res.cookie('mghub_auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    redirectTo: '/index.html'
  });
});

// Login for both Users and Admins (Validates bcrypt hash)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === sanitizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Verify bcrypt password hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate signed JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set HTTP-Only Cookie
  res.cookie('mghub_auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    redirectTo: user.role === 'admin' ? '/admin.html' : '/index.html'
  });
});

// Legacy / Direct Admin Login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = (email || '').trim().toLowerCase();

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === sanitizedEmail && u.role === 'admin');

  if (!user) {
    return res.status(403).json({ success: false, message: 'Access denied: Not an administrator account' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid admin passcode' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('mghub_auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    redirectTo: '/admin.html'
  });
});

// Get Current User Profile (Protected)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout (Clears HTTP-Only Cookie)
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('mghub_auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Public Course API Endpoints

app.get('/api/courses', (req, res) => {
  const { level, q } = req.query;
  let courses = getCourses();

  if (level && level !== 'all') {
    courses = courses.filter(c => c.level.toLowerCase() === level.toLowerCase());
  }

  if (q) {
    const query = q.toLowerCase().trim();
    courses = courses.filter(c => 
      c.code.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    );
  }

  res.json({ courses, total: courses.length });
});

app.get('/api/course/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const courses = getCourses();
  const course = courses.find(c => c.code.toUpperCase() === code);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const visited = new Set();
  const chain = [];

  function traversePrereqs(cCode) {
    const target = courses.find(c => c.code.toUpperCase() === cCode);
    if (!target || visited.has(cCode)) return;
    visited.add(cCode);

    if (Array.isArray(target.prerequisites)) {
      target.prerequisites.forEach(pCode => {
        traversePrereqs(pCode.toUpperCase());
        if (!chain.includes(pCode.toUpperCase())) {
          chain.push(pCode.toUpperCase());
        }
      });
    }
  }

  traversePrereqs(code);

  res.json({ course, prerequisite_chain: chain });
});

app.post('/api/analytics/search', (req, res) => {
  const { query, results_count } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });

  const analytics = getAnalytics();
  analytics.searches.unshift({
    query: query.trim(),
    results_count: results_count || 0,
    created_at: new Date().toISOString()
  });

  if (analytics.searches.length > 200) analytics.searches.pop();
  saveAnalytics(analytics);

  res.json({ success: true });
});

// Community Settings (Public Endpoint)
app.get('/api/community', (req, res) => {
  res.json(getCommunitySettings());
});

const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');

function getQuestions() {
  try {
    if (!fs.existsSync(QUESTIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveQuestions(questions) {
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
}

app.get('/api/quiz/questions', (req, res) => {
  const { course, phase, week, type, limit } = req.query;
  let questions = getQuestions();

  if (course && course !== 'all') {
    questions = questions.filter(q => q.courseCode.toUpperCase() === course.toUpperCase().trim());
  }

  if (phase && phase !== 'all') {
    const p = phase.toLowerCase().trim();
    if (p === 'quiz1') {
      questions = questions.filter(q => (q.examMilestones && q.examMilestones.includes('quiz1')) || (q.week && q.week <= 4));
    } else if (p === 'quiz2') {
      questions = questions.filter(q => (q.examMilestones && q.examMilestones.includes('quiz2')) || (q.week && q.week <= 8));
    } else if (p === 'endterm') {
      questions = questions.filter(q => (q.examMilestones && q.examMilestones.includes('endterm')) || (q.week && q.week <= 12));
    }
  }

  if (week && week !== 'all') {
    const w = parseInt(week);
    if (!isNaN(w)) {
      questions = questions.filter(q => q.week === w);
    }
  }

  if (type && type !== 'all') {
    questions = questions.filter(q => q.type.toLowerCase() === type.toLowerCase().trim());
  }

  const proStatus = checkIfUserIsPro(req);

  let isPreviewOnly = false;
  if (!proStatus.isPro) {
    isPreviewOnly = true;
  }

  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  const maxLimit = isPreviewOnly ? 2 : (parseInt(limit) || questions.length);
  const result = questions.slice(0, maxLimit);

  res.json({
    total: questions.length,
    returned: result.length,
    isPro: proStatus.isPro,
    isPreviewOnly,
    message: isPreviewOnly
      ? 'The Quiz Simulator is an exclusive Management Hub Pro feature. Upgrade to Pro Pass (₹149) for full access to all authentic papers & step-by-step solutions.'
      : undefined,
    questions: result
  });
});

app.get('/api/quiz/courses', (req, res) => {
  const questions = getQuestions();
  const summary = {};

  questions.forEach(q => {
    const code = q.courseCode.toUpperCase();
    if (!summary[code]) {
      summary[code] = {
        code,
        title: q.courseTitle || code,
        totalQuestions: 0,
        quiz1Questions: 0,
        quiz2Questions: 0,
        endtermQuestions: 0,
        weeks: new Set(),
        types: { mcq: 0, msq: 0, nat: 0 }
      };
    }
    summary[code].totalQuestions++;
    if (q.week) summary[code].weeks.add(q.week);
    if (q.type && summary[code].types[q.type.toLowerCase()] !== undefined) {
      summary[code].types[q.type.toLowerCase()]++;
    }
    if ((q.examMilestones && q.examMilestones.includes('quiz1')) || (q.week && q.week <= 4)) {
      summary[code].quiz1Questions++;
    }
    if ((q.examMilestones && q.examMilestones.includes('quiz2')) || (q.week && q.week <= 8)) {
      summary[code].quiz2Questions++;
    }
    if ((q.examMilestones && q.examMilestones.includes('endterm')) || (q.week && q.week <= 12)) {
      summary[code].endtermQuestions++;
    }
  });

  const list = Object.values(summary).map(item => ({
    ...item,
    weeks: Array.from(item.weeks).sort((a, b) => a - b)
  }));

  res.json({ courses: list, totalQuestions: questions.length });
});

app.get('/api/admin/quiz/questions', authenticateToken, requireAdmin, (req, res) => {
  const { course, week } = req.query;
  let questions = getQuestions();
  if (course && course !== 'all') {
    questions = questions.filter(q => q.courseCode && q.courseCode.toUpperCase() === course.toUpperCase().trim());
  }
  if (week && week !== 'all') {
    const w = parseInt(week);
    if (!isNaN(w)) questions = questions.filter(q => q.week === w);
  }
  res.json({ total: questions.length, questions });
});

app.post('/api/admin/quiz/questions', authenticateToken, requireAdmin, (req, res) => {
  const newQuestions = req.body.questions || [req.body];
  if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
    return res.status(400).json({ error: 'Valid questions array is required' });
  }

  const existing = getQuestions();
  newQuestions.forEach(q => {
    if (!q.id) q.id = `${q.courseCode || 'GEN'}_W${q.week || 0}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    existing.push(q);
  });

  saveQuestions(existing);
  res.json({ success: true, message: `Added ${newQuestions.length} questions`, total: existing.length });
});

app.put('/api/admin/quiz/questions/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const existing = getQuestions();
  const idx = existing.findIndex(q => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }
  existing[idx] = { ...existing[idx], ...updatedData, id };
  saveQuestions(existing);
  res.json({ success: true, message: 'Question updated successfully', question: existing[idx] });
});

app.delete('/api/admin/quiz/questions/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  let existing = getQuestions();
  const initialLen = existing.length;
  existing = existing.filter(q => q.id !== id);
  if (existing.length === initialLen) {
    return res.status(404).json({ error: 'Question not found' });
  }
  saveQuestions(existing);
  res.json({ success: true, message: 'Question deleted successfully', total: existing.length });
});

app.post('/api/admin/quiz/questions/clear', authenticateToken, requireAdmin, (req, res) => {
  const { course } = req.body;
  let existing = getQuestions();
  if (course && course !== 'all') {
    existing = existing.filter(q => q.courseCode && q.courseCode.toUpperCase() !== course.toUpperCase().trim());
  } else {
    existing = [];
  }
  saveQuestions(existing);
  res.json({ success: true, message: 'Questions cleared', total: existing.length });
});

const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');

function getAttempts() {
  try {
    if (!fs.existsSync(ATTEMPTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveAttempts(attempts) {
  fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
}

app.post('/api/quiz/attempts', (req, res) => {
  const attempt = req.body;
  if (!attempt || typeof attempt !== 'object') {
    return res.status(400).json({ error: 'Valid attempt data required' });
  }

  const attempts = getAttempts();
  const newAttempt = {
    ...attempt,
    id: attempt.id || `ATT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  attempts.unshift(newAttempt);
  if (attempts.length > 1000) attempts.length = 1000;
  saveAttempts(attempts);

  res.json({ success: true, attempt: newAttempt });
});

app.get('/api/quiz/attempts', (req, res) => {
  const { userId, courseCode, limit } = req.query;
  let attempts = getAttempts();

  if (userId) {
    attempts = attempts.filter(a => a.userId === userId || a.userEmail === userId);
  }
  if (courseCode && courseCode !== 'all') {
    attempts = attempts.filter(a => a.courseCode && a.courseCode.toUpperCase() === courseCode.toUpperCase());
  }

  const max = parseInt(limit) || 20;
  res.json({
    total: attempts.length,
    attempts: attempts.slice(0, max)
  });
});

app.get('/api/quiz/progress', (req, res) => {
  const { userId, courseCode } = req.query;
  let attempts = getAttempts();

  if (userId) {
    attempts = attempts.filter(a => a.userId === userId || a.userEmail === userId);
  }
  if (courseCode && courseCode !== 'all') {
    attempts = attempts.filter(a => a.courseCode && a.courseCode.toUpperCase() === courseCode.toUpperCase());
  }

  if (attempts.length === 0) {
    return res.json({
      hasAttempts: false,
      totalAttempts: 0,
      avgScorePercent: 0,
      bestScorePercent: 0,
      totalQuestionsAnswered: 0,
      latestAttempt: null,
      recentAttempts: []
    });
  }

  let totalPct = 0;
  let bestPct = 0;
  let totalAnswered = 0;

  attempts.forEach(a => {
    const pct = a.percentage !== undefined ? a.percentage : (a.maxPossibleScore > 0 ? (a.totalScore / a.maxPossibleScore) * 100 : 0);
    totalPct += pct;
    if (pct > bestPct) bestPct = pct;
    totalAnswered += (a.correctCount || 0) + (a.incorrectCount || 0);
  });

  res.json({
    hasAttempts: true,
    totalAttempts: attempts.length,
    avgScorePercent: Math.round(totalPct / attempts.length),
    bestScorePercent: Math.round(bestPct),
    totalQuestionsAnswered: totalAnswered,
    latestAttempt: attempts[0],
    recentAttempts: attempts.slice(0, 5)
  });
});

app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/api/payment/config', (req, res) => {
  res.json({
    keyId: RZP_KEY_ID || 'rzp_test_placeholder',
    isLiveConfigured: Boolean(razorpayInstance),
    plans: PRO_PLANS
  });
});

app.get('/api/payment/status', (req, res) => {
  const proStatus = checkIfUserIsPro(req);
  res.json(proStatus);
});

app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { planId = 'term_pass', userEmail, userName } = req.body;
    const plan = PRO_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid subscription plan selected' });
    }

    const orderReceipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let order;

    if (razorpayInstance) {
      
      order = await razorpayInstance.orders.create({
        amount: plan.amount,
        currency: plan.currency,
        receipt: orderReceipt,
        notes: {
          planId: plan.id,
          userEmail: userEmail || '',
          userName: userName || ''
        }
      });
    } else {
      
      order = {
        id: `order_demo_${Date.now()}`,
        entity: 'order',
        amount: plan.amount,
        amount_paid: 0,
        amount_due: plan.amount,
        currency: plan.currency,
        receipt: orderReceipt,
        status: 'created',
        notes: {
          planId: plan.id,
          isDemoMode: true
        },
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    const payments = getPayments();
    payments.unshift({
      orderId: order.id,
      receipt: orderReceipt,
      planId: plan.id,
      amount: plan.amount,
      currency: plan.currency,
      status: 'pending',
      userEmail: userEmail || '',
      userName: userName || '',
      isDemoMode: !razorpayInstance,
      createdAt: new Date().toISOString()
    });
    savePayments(payments);

    res.json({
      success: true,
      order,
      keyId: RZP_KEY_ID || 'rzp_test_placeholder',
      plan,
      isDemoMode: !razorpayInstance
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ error: 'Failed to initiate checkout: ' + (err.message || 'Payment gateway error') });
  }
});

app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId = 'term_pass',
      userEmail
    } = req.body;

    const plan = PRO_PLANS[planId] || PRO_PLANS.term_pass;
    let isValid = false;

    if (razorpayInstance && RZP_KEY_SECRET) {
      
      const expectedSignature = crypto
        .createHmac('sha256', RZP_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = (expectedSignature === razorpay_signature);
    } else {
      
      isValid = Boolean(razorpay_order_id && razorpay_payment_id);
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Payment verification failed: Invalid cryptographic signature.' });
    }

    const payments = getPayments();
    const target = payments.find(p => p.orderId === razorpay_order_id);
    if (target) {
      target.status = 'paid';
      target.paymentId = razorpay_payment_id;
      target.signature = razorpay_signature || 'demo_signature';
      target.paidAt = new Date().toISOString();
    } else {
      payments.unshift({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planId: plan.id,
        amount: plan.amount,
        currency: plan.currency,
        status: 'paid',
        paidAt: new Date().toISOString(),
        isDemoMode: !razorpayInstance
      });
    }
    savePayments(payments);

    const expiryDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();

    let token = req.cookies?.mghub_auth_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = getUsers();
        const user = users.find(u => u.id === decoded.id || u.email.toLowerCase() === decoded.email?.toLowerCase());
        if (user) {
          user.isPremium = true;
          user.premiumPlan = plan.id;
          user.premiumExpiry = expiryDate;
          saveUsers(users);
        }
      } catch (e) {}
    }

    const proToken = jwt.sign(
      { isPremium: true, plan: plan.id, expiresAt: expiryDate, orderId: razorpay_order_id },
      JWT_SECRET,
      { expiresIn: `${plan.durationDays}d` }
    );

    res.cookie('mghub_pro_token', proToken, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: plan.durationDays * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: `🎉 Welcome to Management Hub Pro! Your ${plan.name} is now active.`,
      isPremium: true,
      plan: plan.id,
      expiresAt: expiryDate,
      proToken
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Server error during payment verification: ' + err.message });
  }
});

app.get('/api/admin/payments', authenticateToken, requireAdmin, (req, res) => {
  const payments = getPayments();
  res.json({
    totalTransactions: payments.length,
    paidCount: payments.filter(p => p.status === 'paid').length,
    totalRevenueInINR: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount / 100), 0),
    transactions: payments
  });
});

// Update Community Settings (Protected Admin)
app.post('/api/admin/community', authenticateToken, requireAdmin, (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload' });
  }
  saveCommunitySettings(settings);
  res.json({ success: true, message: 'Community settings updated successfully', settings });
});

// Admin Analytics
app.get('/api/admin/analytics', authenticateToken, requireAdmin, (req, res) => {
  const courses = getCourses();
  const analytics = getAnalytics();
  const users = getUsers();
  const pdfCount = courses.filter(c => c.pdf_url && c.pdf_url.trim().length > 0).length;

  res.json({
    metrics: {
      total_courses: courses.length,
      pdf_notes_attached: pdfCount,
      total_search_queries: analytics.searches.length,
      total_users: users.length
    },
    search_logs: analytics.searches.slice(0, 30)
  });
});

// Upload PDF File or Attach Online URL
app.post('/api/admin/courses/upload-pdf', authenticateToken, requireAdmin, upload.single('pdf_file'), async (req, res) => {
  const { course_code, pdf_url } = req.body;
  if (!course_code) return res.status(400).json({ error: 'Course code is required' });

  const courses = getCourses();
  const targetIndex = courses.findIndex(c => c.code.toUpperCase() === course_code.toUpperCase());

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  let finalPdfUrl = '';

  if (req.file) {
    try {
      const publicId = `${course_code}_Notes_${Date.now()}`;
      finalPdfUrl = await uploadToCloudinary(req.file.buffer, publicId);
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return res.status(500).json({ error: 'Failed to upload PDF to Cloudinary' });
    }
  } else if (pdf_url && pdf_url.trim().length > 0) {
    finalPdfUrl = pdf_url.trim();
  } else {
    return res.status(400).json({ error: 'No PDF file or URL provided' });
  }

  courses[targetIndex].pdf_url = finalPdfUrl;
  courses[targetIndex].notes = {
    available: true,
    fileName: req.file ? req.file.originalname : `${course_code}_Notes.pdf`,
    fileUrl: finalPdfUrl
  };
  saveCourses(courses);

  res.json({
    success: true,
    message: `PDF attached successfully to ${course_code}`,
    pdf_url: finalPdfUrl,
    course: courses[targetIndex]
  });
});

// Upload Resource (Notes or PYQ)
app.post('/api/admin/courses/upload-resource', authenticateToken, requireAdmin, upload.single('resource_file'), async (req, res) => {
  const { course_code, resource_type, title, year, resource_url } = req.body;
  if (!course_code) return res.status(400).json({ error: 'Course code is required' });

  const courses = getCourses();
  const targetIndex = courses.findIndex(c => c.code.toUpperCase() === course_code.toUpperCase());

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  let finalUrl = '';
  let finalFileName = '';

  if (req.file) {
    try {
      const typeLabel = resource_type === 'pyq' ? 'PYQ' : 'Notes';
      const publicId = `${course_code}_${typeLabel}_${Date.now()}`;
      finalUrl = await uploadToCloudinary(req.file.buffer, publicId);
      finalFileName = req.file.originalname;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return res.status(500).json({ error: 'Failed to upload PDF to Cloudinary' });
    }
  } else if (resource_url && resource_url.trim().length > 0) {
    finalUrl = resource_url.trim();
    finalFileName = title ? `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : `${course_code}_Document.pdf`;
  } else {
    return res.status(400).json({ error: 'No file or URL provided' });
  }

  if (resource_type === 'pyq') {
    if (!Array.isArray(courses[targetIndex].pyqs)) {
      courses[targetIndex].pyqs = [];
    }

    const pyqYear = year && String(year).trim().length > 0 ? String(year).trim() : String(new Date().getFullYear());
    const customPyqTitle = title && title.trim().length > 0 ? title.trim() : `${course_code} — PYQ ${pyqYear}`;
    const newPyq = {
      year: pyqYear,
      title: customPyqTitle,
      fileName: finalFileName || `${customPyqTitle}.pdf`,
      fileUrl: finalUrl
    };

    courses[targetIndex].pyqs.unshift(newPyq);
  } else {
    // Default: Study Notes
    const customNotesName = title && title.trim().length > 0 ? title.trim() : (finalFileName || `${course_code}_Notes.pdf`);
    courses[targetIndex].pdf_url = finalUrl;
    courses[targetIndex].notes = {
      available: true,
      title: customNotesName,
      fileName: customNotesName,
      fileUrl: finalUrl
    };
  }

  saveCourses(courses);

  res.json({
    success: true,
    message: `${resource_type === 'pyq' ? 'PYQ paper' : 'Study Notes'} attached successfully to ${course_code}`,
    course: courses[targetIndex]
  });
});

// Update Resource Title directly
app.post('/api/admin/courses/update-resource-title', authenticateToken, requireAdmin, (req, res) => {
  const { course_code, resource_type, title, pyq_index } = req.body;
  if (!course_code || !title) return res.status(400).json({ error: 'Course code and title are required' });

  const courses = getCourses();
  const targetIndex = courses.findIndex(c => c.code.toUpperCase() === course_code.toUpperCase());
  if (targetIndex === -1) return res.status(404).json({ error: 'Course not found' });

  if (resource_type === 'notes') {
    if (!courses[targetIndex].notes) {
      courses[targetIndex].notes = { available: true, fileUrl: courses[targetIndex].pdf_url || '' };
    }
    courses[targetIndex].notes.title = title.trim();
    courses[targetIndex].notes.fileName = title.trim();
  } else if (resource_type === 'pyq' && Array.isArray(courses[targetIndex].pyqs) && courses[targetIndex].pyqs[pyq_index] !== undefined) {
    courses[targetIndex].pyqs[pyq_index].title = title.trim();
  }

  saveCourses(courses);

  res.json({
    success: true,
    message: 'Resource title updated successfully',
    course: courses[targetIndex]
  });
});

// Delete Specific PYQ from Course
app.post('/api/admin/courses/delete-pyq', authenticateToken, requireAdmin, (req, res) => {
  const { course_code, pyq_index } = req.body;
  if (!course_code) return res.status(400).json({ error: 'Course code is required' });

  const courses = getCourses();
  const targetIndex = courses.findIndex(c => c.code.toUpperCase() === course_code.toUpperCase());

  if (targetIndex === -1) return res.status(404).json({ error: 'Course not found' });

  if (Array.isArray(courses[targetIndex].pyqs) && courses[targetIndex].pyqs[pyq_index] !== undefined) {
    courses[targetIndex].pyqs.splice(pyq_index, 1);
    saveCourses(courses);
    return res.json({ success: true, message: 'PYQ removed', course: courses[targetIndex] });
  }

  res.status(400).json({ error: 'Invalid PYQ index' });
});

// Remove PDF / Notes
app.post('/api/admin/courses/remove-pdf/:code', authenticateToken, requireAdmin, (req, res) => {
  const code = req.params.code.toUpperCase();
  const courses = getCourses();
  const targetIndex = courses.findIndex(c => c.code.toUpperCase() === code);

  if (targetIndex === -1) return res.status(404).json({ error: 'Course not found' });

  courses[targetIndex].pdf_url = '';
  courses[targetIndex].notes = { available: false, fileName: '', fileUrl: '' };
  saveCourses(courses);

  res.json({ success: true, message: `PDF notes removed from ${code}`, course: courses[targetIndex] });
});

// Create Course
app.post('/api/admin/courses/create', authenticateToken, requireAdmin, (req, res) => {
  const { code, level, title, credits, description, prerequisites, syllabus } = req.body;
  if (!code || !title) return res.status(400).json({ error: 'Code and Title are required' });

  const courses = getCourses();
  const exists = courses.some(c => c.code.toUpperCase() === code.toUpperCase());
  if (exists) return res.status(409).json({ error: `Course ${code} already exists` });

  const newCourse = {
    id: Date.now(),
    code: code.toUpperCase().trim(),
    level: level || 'foundation',
    title: title.trim(),
    credits: parseInt(credits) || 4,
    description: description || '',
    prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
    syllabus: syllabus || '',
    pdf_url: ''
  };

  courses.unshift(newCourse);
  saveCourses(courses);

  res.status(201).json({ success: true, course: newCourse });
});

// Update Course
app.put('/api/admin/courses/update/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const courses = getCourses();
  const targetIndex = courses.findIndex(c => c.id === id || c.code === req.body.code);

  if (targetIndex === -1) return res.status(404).json({ error: 'Course not found' });

  const existing = courses[targetIndex];
  courses[targetIndex] = {
    ...existing,
    ...req.body,
    id: existing.id,
    code: req.body.code ? req.body.code.toUpperCase().trim() : existing.code
  };

  saveCourses(courses);
  res.json({ success: true, course: courses[targetIndex] });
});

// Delete Course
app.delete('/api/admin/courses/delete/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  let courses = getCourses();
  const initialLen = courses.length;

  courses = courses.filter(c => c.id !== id);
  if (courses.length === initialLen) {
    return res.status(404).json({ error: 'Course not found' });
  }

  saveCourses(courses);
  res.json({ success: true, message: 'Course deleted successfully' });
});

// Reset Courses to default 52
app.post('/api/admin/reset-courses', authenticateToken, requireAdmin, (req, res) => {
  saveCourses(DEFAULT_COURSES);
  res.json({ success: true, message: 'Restored 52 default courses', courses: DEFAULT_COURSES });
});

// Serve Static Frontend Assets (HTML, CSS, JS)
app.use(express.static(__dirname));

if (fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Explicit Secret Admin Route
app.get('/inmycontrol', (req, res) => {
  res.sendFile(path.join(__dirname, 'inmycontrol.html'));
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` [Management Hub] Secure Role-Based Express Backend`);
  console.log(` Port: http://127.0.0.1:${PORT}`);
  console.log(` Hashing: Bcrypt (10 rounds)`);
  console.log(` Auth: JWT + HTTP-Only Cookie`);
  console.log(`=======================================================`);
});
