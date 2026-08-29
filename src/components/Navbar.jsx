import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAdmin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Ecosystem' },
    { id: 'calculators', label: 'Calculators' },
    { id: 'notes', label: 'Course Notes' },
    { id: 'about', label: 'Curriculum' }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="brand-title" onClick={() => handleNavClick('home')}>
          [Management Hub]
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div>
          <button className="btn-header-admin" onClick={onOpenAdmin}>
            <Shield size={14} />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
