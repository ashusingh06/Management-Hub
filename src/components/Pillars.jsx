import React from 'react';
import { BookMarked, Calculator, Network, ArrowUpRight } from 'lucide-react';

export default function Pillars() {
  const pillars = [
    {
      icon: <BookMarked size={20} />,
      title: "52 Course Notes Catalog",
      desc: "Structured study guides, lecture summaries, and direct downloadable PDF notes for Foundation, Diploma, BS, and Elective tiers.",
      target: "notes",
      linkText: "Browse Notes"
    },
    {
      icon: <Calculator size={20} />,
      title: "Academic Grade Calculators",
      desc: "Precision CGPA calculation engine and target grade predictor to project future GPA based on credit weightings.",
      target: "calculators",
      linkText: "Calculate CGPA"
    },
    {
      icon: <Network size={20} />,
      title: "Prerequisite DAG Graph",
      desc: "Directed Acyclic Graph traversal mapping every foundational prerequisite so you can plan course registration safely.",
      target: "notes",
      linkText: "View Dependencies"
    }
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="page-section" style={{ paddingTop: 0 }}>
      <div className="content-wrapper">
        <div className="pillars-grid">
          {pillars.map((p, idx) => (
            <div key={idx} className="pillar-card">
              <div className="pillar-icon-box">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <a 
                href={`#${p.target}`} 
                className="pillar-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(p.target);
                }}
              >
                <span>{p.linkText}</span>
                <ArrowUpRight size={15} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
