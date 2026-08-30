import React, { useState } from 'react';
import { Calculator, Target, Sparkles } from 'lucide-react';

export default function Calculators() {
  // CGPA State
  const [currentCgpa, setCurrentCgpa] = useState('');
  const [currentCredits, setCurrentCredits] = useState('');
  const [newGpa, setNewGpa] = useState('');
  const [newCredits, setNewCredits] = useState('');

  // End-Term Forecaster State (IIT Madras BS Formula)
  const [quiz1, setQuiz1] = useState('');
  const [quiz2, setQuiz2] = useState('');
  const [endTermF, setEndTermF] = useState('');

  // Calculate Cumulative CGPA
  const currC = parseFloat(currentCgpa) || 0;
  const currCr = parseFloat(currentCredits) || 0;
  const nG = parseFloat(newGpa) || 0;
  const nCr = parseFloat(newCredits) || 0;

  const totalCredits = currCr + nCr;
  const calculatedCgpa = (currentCgpa || currentCredits || newGpa || newCredits) && totalCredits > 0
    ? (((currC * currCr) + (nG * nCr)) / totalCredits).toFixed(2)
    : '--';

  // Calculate End-Term Forecast
  const isForecasterEmpty = !quiz1.trim() && !quiz2.trim() && !endTermF.trim();
  const q1 = Math.max(0, Math.min(100, parseFloat(quiz1) || 0));
  const q2 = Math.max(0, Math.min(100, parseFloat(quiz2) || 0));
  const f = Math.max(0, Math.min(100, parseFloat(endTermF) || 0));
  const maxQuiz = Math.max(q1, q2);

  // Formula 1: 0.6F + 0.3max(Q1, Q2)
  const t1 = (0.6 * f) + (0.3 * maxQuiz);
  // Formula 2: 0.45F + 0.25Q1 + 0.3Q2
  const t2 = (0.45 * f) + (0.25 * q1) + (0.3 * q2);
  const totalScore = Math.max(t1, t2);
  const diff = Math.abs(t1 - t2);

  let letterGrade = 'U (Fail)';
  if (totalScore >= 90) letterGrade = 'S Grade';
  else if (totalScore >= 80) letterGrade = 'A Grade';
  else if (totalScore >= 70) letterGrade = 'B Grade';
  else if (totalScore >= 60) letterGrade = 'C Grade';
  else if (totalScore >= 50) letterGrade = 'D Grade';
  else if (totalScore >= 40) letterGrade = 'E Grade (Pass)';

  const winningMessage = isForecasterEmpty
    ? 'Enter Quiz & End-Term scores above to calculate'
    : t2 > t1
    ? `Applied Formula 2: Boosted by +${diff.toFixed(2)} marks (Both Quizzes Weightage)`
    : t1 > t2
    ? `Applied Formula 1: Boosted by +${diff.toFixed(2)} marks (Best Quiz Weightage)`
    : `Both formulas yield identical score (${t1.toFixed(2)})`;

  // Passing Marks Predictor State
  const [passQ1, setPassQ1] = useState('');
  const [passQ2, setPassQ2] = useState('');
  const [passTarget, setPassTarget] = useState('40');

  const isPassEmpty = !passQ1.trim() && !passQ2.trim();
  const pq1 = Math.max(0, Math.min(100, parseFloat(passQ1) || 0));
  const pq2 = Math.max(0, Math.min(100, parseFloat(passQ2) || 0));
  const pTarget = parseFloat(passTarget) || 40;
  const pMaxQuiz = Math.max(pq1, pq2);

  const pf1 = (pTarget - (0.3 * pMaxQuiz)) / 0.6;
  const pf2 = (pTarget - (0.25 * pq1 + 0.3 * pq2)) / 0.45;
  const minPassF = Math.min(pf1, pf2);
  const bestPassOption = pf2 < pf1 ? 'Both Quizzes Rule (45% F + 25% Q1 + 30% Q2)' : 'Best Quiz Rule (60% F + 30% Best Quiz)';

  let passResultText = '--';
  let passSubText = 'Enter Quiz 1 & Quiz 2 scores to calculate passing requirement';

  if (!isPassEmpty) {
    if (minPassF <= 0) {
      passResultText = '0.0 / 100 (Pass Guaranteed! 🎉)';
      passSubText = `Quiz marks alone guarantee securing T ≥ ${pTarget}!`;
    } else if (minPassF > 100) {
      passResultText = `Need ${minPassF.toFixed(1)} (>100 max)`;
      passSubText = `Target score of ${pTarget} is not mathematically possible with current quiz scores.`;
    } else {
      passResultText = `${minPassF.toFixed(1)} / 100`;
      passSubText = `Min required via ${bestPassOption}`;
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
                  placeholder="e.g. 8.50"
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
                  placeholder="e.g. 32"
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
                  placeholder="e.g. 9.00"
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
                  placeholder="e.g. 16"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div className="form-group-calc">
                <label>Quiz I (Qz1)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="100" 
                  placeholder="0 - 100"
                  value={quiz1} 
                  onChange={(e) => setQuiz1(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>Quiz II (Qz2)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="100" 
                  placeholder="0 - 100"
                  value={quiz2} 
                  onChange={(e) => setQuiz2(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>End-Term (F)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="100" 
                  placeholder="0 - 100"
                  value={endTermF} 
                  onChange={(e) => setEndTermF(e.target.value)} 
                />
              </div>
            </div>

            {/* Formula Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '10px 0' }}>
              <div style={{
                background: !isForecasterEmpty && t1 >= t2 ? '#f0fdf4' : '#ffffff',
                border: `1px solid ${!isForecasterEmpty && t1 >= t2 ? '#86efac' : '#e4e4e7'}`,
                borderRadius: '8px',
                padding: '8px 10px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: !isForecasterEmpty && t1 >= t2 ? '#166534' : '#71717a' }}>
                  Formula 1 {!isForecasterEmpty && t1 >= t2 && '★ Highest'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: !isForecasterEmpty && t1 >= t2 ? '#166534' : '#09090b' }}>
                  {isForecasterEmpty ? '--' : t1.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>0.6F + 0.3·max(Q1,Q2)</div>
              </div>

              <div style={{
                background: !isForecasterEmpty && t2 >= t1 ? '#f0fdf4' : '#ffffff',
                border: `1px solid ${!isForecasterEmpty && t2 >= t1 ? '#86efac' : '#e4e4e7'}`,
                borderRadius: '8px',
                padding: '8px 10px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: !isForecasterEmpty && t2 >= t1 ? '#166534' : '#71717a' }}>
                  Formula 2 {!isForecasterEmpty && t2 >= t1 && '★ Highest'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: !isForecasterEmpty && t2 >= t1 ? '#166534' : '#09090b' }}>
                  {isForecasterEmpty ? '--' : t2.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>0.45F + 0.25Q1 + 0.3Q2</div>
              </div>
            </div>

            <div className="calc-result-box">
              <div className="calc-result-label">Expected Final Course Score (T):</div>
              <div className="calc-result-val">
                {isForecasterEmpty ? '--' : `${totalScore.toFixed(1)} / 100 (${letterGrade})`}
              </div>
              <div style={{ fontSize: '11.5px', color: '#71717a', marginTop: '6px' }}>{winningMessage}</div>
            </div>
          </div>

          {/* 3. End-Term Passing Marks Predictor */}
          <div className="calculator-card">
            <div className="calc-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={20} />
                <h3>End-Term Passing Predictor</h3>
              </div>
              <p>Calculate minimum marks needed in End-Term (F /100) to pass the course (T &ge; 40).</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-calc">
                <label>Quiz I (Qz1 /100)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="100" 
                  placeholder="0 - 100"
                  value={passQ1} 
                  onChange={(e) => setPassQ1(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>Quiz II (Qz2 /100)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="100" 
                  placeholder="0 - 100"
                  value={passQ2} 
                  onChange={(e) => setPassQ2(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div className="form-group-calc">
                <label>Target Passing Level</label>
                <select 
                  value={passTarget} 
                  onChange={(e) => setPassTarget(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e4e4e7' }}
                >
                  <option value="40">Minimum Passing Score (T &ge; 40 / E Grade)</option>
                  <option value="50">D Grade (T &ge; 50)</option>
                  <option value="60">C Grade (T &ge; 60)</option>
                  <option value="70">B Grade (T &ge; 70)</option>
                  <option value="80">A Grade (T &ge; 80)</option>
                  <option value="90">S Grade (T &ge; 90)</option>
                </select>
              </div>
            </div>

            <div className="calc-result-box" style={{ marginTop: '16px' }}>
              <div className="calc-result-label">Required in End-Term (F):</div>
              <div className="calc-result-val" style={{ color: minPassF <= 0 ? '#166534' : minPassF > 100 ? '#ef4444' : '#09090b' }}>
                {passResultText}
              </div>
              <div style={{ fontSize: '11.5px', color: '#71717a', marginTop: '6px' }}>{passSubText}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
