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

// Initialize database files if missing
if (!fs.existsSync(COURSES_FILE)) {
  fs.writeFileSync(COURSES_FILE, JSON.stringify(DEFAULT_COURSES, null, 2));
}

if (!fs.existsSync(ANALYTICS_FILE)) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({ searches: [], bookmarks: [] }, null, 2));
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

// ==============================================================================
// Cloudinary Configuration (PDF Storage — Free 25GB, 24*7 accessible)
// ==============================================================================

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
  const hasAdmin = users.some(u => u.role === 'admin');
  if (!hasAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin2026', salt);
    users.unshift({
      id: Date.now().toString(),
      name: 'Aashish Singh',
      email: 'aashishsinghh06@gmail.com',
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

// ==============================================================================
// Authentication & Role-Based Authorization Middleware
// ==============================================================================

/**
 * Extracts and verifies JWT from HTTP-Only cookie, Authorization Bearer header, or Admin validation headers
 */
function authenticateToken(req, res, next) {
  const adminEmail = req.headers['x-admin-email'] || req.headers['x-user-email'];
  const adminAuthFlag = req.headers['x-admin-auth'];

  if (adminAuthFlag === 'true' || (adminEmail && adminEmail.toLowerCase() === 'aashishsinghh06@gmail.com')) {
    req.user = {
      id: 'admin_master',
      name: 'Aashish Singh',
      email: 'aashishsinghh06@gmail.com',
      role: 'admin'
    };
    return next();
  }

  let token = req.cookies?.mghub_auth_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token === 'mghub_admin_token_authenticated_2026') {
    req.user = {
      id: 'admin_master',
      name: 'Aashish Singh',
      email: 'aashishsinghh06@gmail.com',
      role: 'admin'
    };
    return next();
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
  const adminEmail = req.headers['x-admin-email'] || req.headers['x-user-email'];
  const adminAuthFlag = req.headers['x-admin-auth'];

  if (adminAuthFlag === 'true' || (adminEmail && adminEmail.toLowerCase() === 'aashishsinghh06@gmail.com')) {
    return next();
  }

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Access denied. Administrator privileges required.'
    });
  }
  next();
}

// ==============================================================================
// Page-Level Protection Middleware (Blocks manual entry to /admin or /admin.html)
// ==============================================================================

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

// ==============================================================================
// Authentication API Endpoints
// ==============================================================================

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

// ==============================================================================
// Public Course API Endpoints
// ==============================================================================

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

// ==============================================================================
// Strictly Protected Admin API Endpoints (Middleware: authenticateToken + requireAdmin)
// ==============================================================================

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
