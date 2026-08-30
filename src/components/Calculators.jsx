import React, { useState } from 'react';
import { Calculator, Target, Sparkles } from 'lucide-react';

export default function Calculators() {
  // CGPA State
  const [currentCgpa, setCurrentCgpa] = useState('8.5');
  const [currentCredits, setCurrentCredits] = useState('32');
  const [newGpa, setNewGpa] = useState('9.0');
  const [newCredits, setNewCredits] = useState('16');

  // End-Term Forecaster State (IIT Madras BS Formula)
  const [quiz1, setQuiz1] = useState('70');
  const [quiz2, setQuiz2] = useState('80');
  const [targetGrade, setTargetGrade] = useState('80');
  const [expectedFinal, setExpectedFinal] = useState('');

  // Calculate Cumulative CGPA
  const currC = parseFloat(currentCgpa) || 0;
  const currCr = parseFloat(currentCredits) || 0;
  const nG = parseFloat(newGpa) || 0;
  const nCr = parseFloat(newCredits) || 0;

  const totalCredits = currCr + nCr;
  const calculatedCgpa = totalCredits > 0
    ? (((currC * currCr) + (nG * nCr)) / totalCredits).toFixed(2)
    : '0.00';

  // Calculate End-Term Forecast
  const q1 = Math.max(0, Math.min(100, parseFloat(quiz1) || 0));
  const q2 = Math.max(0, Math.min(100, parseFloat(quiz2) || 0));
  const maxQuiz = Math.max(q1, q2);
  const target = parseFloat(targetGrade) || 80;
  const expF = expectedFinal.trim() !== '' ? Math.max(0, Math.min(100, parseFloat(expectedFinal))) : null;

  let resultLabel = 'Required End-Term (F):';
  let resultVal = '';
  let resultSub = '';

  if (expF !== null && !isNaN(expF)) {
    const t1 = (0.6 * expF) + (0.3 * maxQuiz);
    const t2 = (0.45 * expF) + (0.25 * q1) + (0.3 * q2);
    const total = Math.max(t1, t2);
    let grade = 'U';
    if (total >= 90) grade = 'S';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B';
    else if (total >= 60) grade = 'C';
    else if (total >= 50) grade = 'D';
    else if (total >= 40) grade = 'E (Pass)';

    resultLabel = 'Projected Total Score (T):';
    resultVal = `${total.toFixed(1)} / 100 (${grade})`;
    resultSub = `Opt 1: ${t1.toFixed(1)} | Opt 2: ${t2.toFixed(1)} ➔ Best: ${t2 > t1 ? 'Both Quizzes Rule' : 'Best Quiz Rule'}`;
  } else {
    const f1 = (target - (0.3 * maxQuiz)) / 0.6;
    const f2 = (target - (0.25 * q1 + 0.3 * q2)) / 0.45;
    const minReqF = Math.min(f1, f2);
    const bestRule = f2 < f1 ? 'Both Quizzes (45% F + 25% Q1 + 30% Q2)' : 'Best Quiz (60% F + 30% Best Quiz)';

    if (minReqF <= 0) {
      resultVal = 'Achieved (0 / 100)';
      resultSub = 'Target already secured with quiz scores!';
    } else if (minReqF > 100) {
      resultVal = `Need ${minReqF.toFixed(1)} (>100 max)`;
      resultSub = 'Target grade not mathematically reachable with current quiz scores.';
    } else {
      resultVal = `${minReqF.toFixed(1)} / 100`;
      resultSub = `Strategy: ${bestRule}`;
    }
  }

  return (
    <section className="page-section alt-bg" id="calculators">
      <div className="content-wrapper">
        <div className="section-header">
          <div className="pill-tag">Academic Planning Suite</div>
          <h2>CGPA Calculator & Target Forecaster</h2>
          <p className="subtitle">Real-time credit-weighted projection engine designed specifically for the IIT Madras grading policy.</p>
        </div>

        <div className="calculators-grid">
          {/* 1. CGPA Calculator */}
          <div className="calculator-card">
            <div className="calc-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Calculator size={20} />
                <h3>CGPA Calculator</h3>
              </div>
              <p>Calculate your updated cumulative GPA after completing a new term.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-calc">
                <label>Current CGPA</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="10" 
                  value={currentCgpa} 
                  onChange={(e) => setCurrentCgpa(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>Completed Credits</label>
                <input 
                  type="number" 
                  min="1" 
                  max="142" 
                  value={currentCredits} 
                  onChange={(e) => setCurrentCredits(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-calc">
                <label>New Term SGPA</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="10" 
                  value={newGpa} 
                  onChange={(e) => setNewGpa(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>New Term Credits</label>
                <input 
                  type="number" 
                  min="1" 
                  max="32" 
                  value={newCredits} 
                  onChange={(e) => setNewCredits(e.target.value)} 
                />
              </div>
            </div>

            <div className="calc-result-box">
              <div className="calc-result-label">Predicted Cumulative CGPA</div>
              <div className="calc-result-val">{calculatedCgpa}</div>
            </div>
          </div>

          {/* 2. End-Term Target Forecaster */}
          <div className="calculator-card">
            <div className="calc-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Target size={20} />
                <h3>End-Term Target Forecaster</h3>
              </div>
              <p>Formula: <code>T = max(0.6F + 0.3max(Q1,Q2), 0.45F + 0.25Q1 + 0.3Q2)</code></p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-calc">
                <label>Quiz I (Qz1 /100)</label>
                <input 
                  type="number" 
                  step="1" 
                  min="0" 
                  max="100" 
                  value={quiz1} 
                  onChange={(e) => setQuiz1(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>Quiz II (Qz2 /100)</label>
                <input 
                  type="number" 
                  step="1" 
                  min="0" 
                  max="100" 
                  value={quiz2} 
                  onChange={(e) => setQuiz2(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-calc">
                <label>Target Grade</label>
                <select 
                  value={targetGrade} 
                  onChange={(e) => setTargetGrade(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e4e4e7' }}
                >
                  <option value="90">S Grade (90+)</option>
                  <option value="80">A Grade (80+)</option>
                  <option value="70">B Grade (70+)</option>
                  <option value="60">C Grade (60+)</option>
                  <option value="50">D Grade (50+)</option>
                  <option value="40">E / Pass (40+)</option>
                </select>
              </div>

              <div className="form-group-calc">
                <label>Expected Final (F /100)</label>
                <input 
                  type="number" 
                  step="1" 
                  min="0" 
                  max="100" 
                  placeholder="Optional simulator" 
                  value={expectedFinal} 
                  onChange={(e) => setExpectedFinal(e.target.value)} 
                />
              </div>
            </div>

            <div className="calc-result-box">
              <div className="calc-result-label">{resultLabel}</div>
              <div className="calc-result-val">
                {resultVal}
              </div>
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>{resultSub}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
