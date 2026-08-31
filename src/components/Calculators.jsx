import React, { useState } from 'react';
import { Calculator, Target, Sparkles } from 'lucide-react';

export default function Calculators() {
  // Dynamic Subjects CGPA State
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Subject 1', gradePoint: '' },
    { id: 2, name: 'Subject 2', gradePoint: '' },
    { id: 3, name: 'Subject 3', gradePoint: '' }
  ]);

  const addSubject = () => {
    setSubjects(prev => [
      ...prev,
      { id: Date.now(), name: `Subject ${prev.length + 1}`, gradePoint: '' }
    ]);
  };

  const removeSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const updateSubject = (id, field, value) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Calculate Cumulative CGPA = Total Grade Points ÷ Total Subjects
  const validSubjects = subjects.filter(s => s.gradePoint !== '' && !isNaN(parseFloat(s.gradePoint)) && parseFloat(s.gradePoint) >= 0);
  const totalGradePoints = validSubjects.reduce((sum, s) => sum + Math.min(10, Math.max(0, parseFloat(s.gradePoint))), 0);
  const totalValidSubjects = validSubjects.length;
  const calculatedCgpa = totalValidSubjects > 0 ? (totalGradePoints / totalValidSubjects).toFixed(2) : '--';

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
          {/* 1. Dynamic Subject-Based CGPA Calculator */}
          <div className="calculator-card">
            <div className="calc-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Calculator size={20} />
                <h3>CGPA Calculator</h3>
              </div>
              <p>Official Formula: <code>CGPA = Total Grade Points ÷ Total Subjects</code></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
              {subjects.map((subj, index) => (
                <div key={subj.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder={`Subject ${index + 1}`}
                    value={subj.name}
                    onChange={(e) => updateSubject(subj.id, 'name', e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #e4e4e7', outline: 'none' }}
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Grade (0-10)"
                    value={subj.gradePoint}
                    onChange={(e) => updateSubject(subj.id, 'gradePoint', e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #e4e4e7', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubject(subj.id)}
                    style={{ background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}
                    title="Remove Subject"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={addSubject}
                style={{ flex: 1, padding: '6px 12px', fontSize: '12.5px', fontWeight: '700', background: '#fff', border: '1px dashed #a1a1aa', borderRadius: '6px', cursor: 'pointer' }}
              >
                + Add Subject
              </button>
              <button
                type="button"
                onClick={() => setSubjects([{ id: 1, name: 'Subject 1', gradePoint: '' }, { id: 2, name: 'Subject 2', gradePoint: '' }, { id: 3, name: 'Subject 3', gradePoint: '' }])}
                style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: '6px', cursor: 'pointer', color: '#71717a' }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f4f4f5', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>
              <span>Total Points: <strong>{totalGradePoints.toFixed(2)}</strong></span>
              <span>Total Subjects: <strong>{totalValidSubjects}</strong></span>
            </div>

            <div className="calc-result-box">
              <div className="calc-result-label">Cumulative CGPA</div>
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
