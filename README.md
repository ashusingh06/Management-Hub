# 🎓 Management Hub — IIT Madras BS Management & Analytics Portal

[![Live Portal](https://img.shields.io/badge/Live%20Demo-management--hub--1c14c.web.app-blue?style=for-the-badge&logo=firebase)](https://management-hub-1c14c.web.app)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%7C%20Firestore%20%7C%20Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-PDF%20Storage%20CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)

**Management Hub** is a fast, modern, and comprehensive academic resource platform designed specifically for students of the **IIT Madras BS in Management and Data Science / Business Analytics** program.

It provides centralized, 24/7 access to curated course catalogs, multi-contributor study notes, past year examination question papers (PYQs), dynamic grading calculators, search analytics, and administrative management tools.

---

## 🚀 Live Demo & Deployment

- **🌐 Live Production Website:** [https://management-hub-1c14c.web.app](https://management-hub-1c14c.web.app)
- **🔐 Administrator Portal:** [https://management-hub-1c14c.web.app/inmycontrol](https://management-hub-1c14c.web.app/inmycontrol)

---

## ✨ Key Features

### 📚 Academic Catalog & Study Resources
- **Full Curriculum Catalog:** Covers 52+ courses across Foundation, Diploma (Management & Analytics), and BS Degree tiers.
- **📁 Multi-Section / Contributor Notes:** Group study notes by author (e.g. *Ashu's Notes*, *Sibu's Notes*, *Lecture Slides*, *Handwritten Notes*, *Formula Sheets*).
- **📝 Previous Year Questions (PYQs):** Year-wise past exam question papers with one-click direct PDF preview and downloads.
- **⚡ Instant 0ms Load Time:** Smart in-memory client caching with asynchronous background Cloud Firestore synchronization.
- **🔍 Real-Time Intelligent Search:** Fast fuzzy search across course codes (`BSMS1201`), titles, levels, and prerequisites.

### 🧮 Student Productivity Tools
- **End-Term Passing Calculator:** Interactive grading calculator to compute exact required end-term scores based on assignments and quiz marks.
- **🔖 Local Bookmarks:** One-click course bookmarking saved to browser storage for offline quick reference.
- **🔗 Official IITM Ecosystem Links:** Curated direct shortcuts to Portal, Discourse Forum, Student Dashboard, and Support.

### 👑 Administrator Dashboard (`/inmycontrol`)
- **Secure Authentication:** 1-Click Google OAuth & encrypted passcode authorization for admin access.
- **Cloudinary High-Speed PDF Uploads:** Direct client-side signed SHA-1 uploads to Cloudinary CDN (supporting 1,000+ PDFs without server limits).
- **Resource Management Modal:** Attach, preview (`Open ↗`), and delete (`✕ Delete`) individual notes and PYQ papers per course.
- **Real-Time Database Maintenance:** Backup and restore full catalog JSON states, track live visitor search trends, and manage community contributors.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    User([Student / Admin Browser]) -->|HTTP / HTTPS| Hosting[Firebase Hosting CDN]
    User -->|Direct Signed Upload| Cloudinary[(Cloudinary Global CDN - PDFs)]
    User -->|Realtime Stream / Read| Firestore[(Firebase Cloud Firestore)]
    User -->|OAuth Sign-In| FirebaseAuth[Firebase Authentication]
    Admin[Admin Panel /inmycontrol] -->|Manage Resources| Firestore
    Admin -->|Upload Multi-Notes| Cloudinary
```

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3 (Modern Glassmorphism & Custom Properties), JavaScript (ES6+) |
| **Hosting & Deployment** | Firebase Hosting (`management-hub-1c14c.web.app`) |
| **Database** | Firebase Cloud Firestore (Real-time NoSQL cloud sync) |
| **Authentication** | Firebase Authentication (Google OAuth + Email/Password) |
| **PDF & Asset Storage** | Cloudinary REST API & Global CDN |
| **Local Development** | Node.js, Express.js (Optional REST Server) |

---

## 📂 Project Structure

```
Management-Hub/
├── index.html            # Main Student Portal & Interactive Course Catalog
├── course.html           # Dedicated Course Details Page (Multi-Section Folders & PYQs)
├── inmycontrol.html      # Secure Administrator Dashboard & PDF Resource Manager
├── login.html            # Student Login & Account Gateway
├── register.html         # User Registration Page
├── profile.html          # Student Profile & Saved Bookmarks
├── script.js             # Main Portal Application Logic & Instant Caching
├── style.css             # Unified Design System, Cards & Typography
├── firebase-config.js    # Firebase & Cloudinary Client SDK Integration
├── firebase.json         # Firebase Hosting Configuration & Route Rewrites
├── server.js             # Node.js Express Backend (for Local Development)
├── package.json          # Project Dependencies & Build Scripts
└── data/
    └── courses.json      # Master Fallback Course Catalog (52 Courses)
```

---

## 🛠️ Getting Started (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/ashusingh06/Management-Hub.git
cd Management-Hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

### 4. Run Locally
```bash
# Option A: Start Local Node Express Server
npm start

# Option B: Run via Vite Live Reload
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🚀 Deploying to Firebase Hosting

To deploy updates to the live web application:

```bash
# 1. Login to Firebase CLI (if not already logged in)
npx firebase login

# 2. Deploy only static hosting files
npx firebase-tools deploy --only hosting
```

---

## 👥 Contributors & Community

- **Aashish Singh (Ashu)** — Creator & Lead Maintainer ([@ashusingh06](https://github.com/ashusingh06))
- **Sibu** — Core Academic Contributor

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
