import React from 'react';
import { ArrowRight, BookOpen, Calculator } from 'lucide-react';

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section" id="home">
      <div className="content-wrapper">
        <div className="hero-badge">
          <span>🏛️</span>
          <span>IIT Madras B.S. in Management & Data Science</span>
        </div>

        <h1 className="hero-title">
          The Definitive Student Platform for Academic Excellence
        </h1>

        <p className="hero-subtitle">
          Curated course notes repository, live CGPA calculator, grade forecaster, and prerequisite dependency visualizer for the complete 52-course curriculum.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => scrollTo('notes')}>
            <BookOpen size={16} />
            <span>Explore 52 Course Notes</span>
            <ArrowRight size={16} />
          </button>

          <button className="btn-hero-secondary" onClick={() => scrollTo('calculators')}>
            <Calculator size={16} />
            <span>CGPA Calculator</span>
          </button>
        </div>
      </div>
    </section>
  );
}
