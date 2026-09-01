import React from 'react';
import { ExternalLink, Shield } from 'lucide-react';

export default function Footer({ onOpenAdmin }) {
  return (
    <footer className="site-footer" id="about">
      <div className="content-wrapper">
        <div className="footer-top-grid">
          <div className="footer-col">
            <h4>Curriculum Levels</h4>
            <ul>
              <li><a href="#notes">Foundation Tier (8 Courses)</a></li>
              <li><a href="#notes">Diploma in Programming & Data (16 Courses)</a></li>
              <li><a href="#notes">BS Degree Specialization (6 Courses)</a></li>
              <li><a href="#notes">Elective Breadth (22 Courses)</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Academic Tools</h4>
            <ul>
              <li><a href="#calculators">Cumulative CGPA Engine</a></li>
              <li><a href="#calculators">Target Grade Forecaster</a></li>
              <li><a href="#notes">Study Notes & PDF Downloads</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Official Portals</h4>
            <ul>
              <li>
                <a href="https://study.iitm.ac.in/mg/index.html" target="_blank" rel="noopener noreferrer">
                  IITM Official Website <ExternalLink size={11} style={{ display: 'inline', marginLeft: '3px' }} />
                </a>
              </li>
              <li>
                <a href="https://discourse.onlinedegree.iitm.ac.in" target="_blank" rel="noopener noreferrer">
                  IITM Discourse Forum <ExternalLink size={11} style={{ display: 'inline', marginLeft: '3px' }} />
                </a>
              </li>
              <li>
                <a href="https://lookerstudio.google.com/u/0/reporting/d02dac13-665b-49cc-8d51-0451268a6a3e/page/5sgkE" target="_blank" rel="noopener noreferrer">
                  Looker Studio Dashboard <ExternalLink size={11} style={{ display: 'inline', marginLeft: '3px' }} />
                </a>
              </li>
              <li>
                <a href="https://score-checker-379619009600.asia-south1.run.app/" target="_blank" rel="noopener noreferrer">
                  Grading Score Checker <ExternalLink size={11} style={{ display: 'inline', marginLeft: '3px' }} />
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Platform Control</h4>
            <ul>
              <li>
                <a 
                  href="#admin" 
                  onClick={(e) => { e.preventDefault(); onOpenAdmin(); }}
                  style={{ fontWeight: 600, color: '#09090b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Shield size={12} />
                  <span>Admin Access (aashishsinghh06@gmail.com)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 [Management Hub] - IIT Madras B.S. in Management & Data Science Student Companion</span>
          <span style={{ color: '#71717a' }}>Built with React + Vite + Node.js</span>
        </div>
      </div>
    </footer>
  );
}
