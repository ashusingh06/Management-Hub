import React, { useState } from 'react';
import { Calculator, Target, Sparkles } from 'lucide-react';

export default function Calculators() {
  // CGPA State
  const [currentCgpa, setCurrentCgpa] = useState('8.5');
  const [currentCredits, setCurrentCredits] = useState('32');
  const [newGpa, setNewGpa] = useState('9.0');
  const [newCredits, setNewCredits] = useState('16');

  // Grade Predictor State
  const [targetCgpa, setTargetCgpa] = useState('9.0');
  const [predCurrentCgpa, setPredCurrentCgpa] = useState('8.2');
  const [predCurrentCredits, setPredCurrentCredits] = useState('48');
  const [remainingCredits, setRemainingCredits] = useState('16');

  // Calculate Cumulative CGPA
  const currC = parseFloat(currentCgpa) || 0;
  const currCr = parseFloat(currentCredits) || 0;
  const nG = parseFloat(newGpa) || 0;
  const nCr = parseFloat(newCredits) || 0;

  const totalCredits = currCr + nCr;
  const calculatedCgpa = totalCredits > 0
    ? (((currC * currCr) + (nG * nCr)) / totalCredits).toFixed(2)
    : '0.00';

  // Calculate Required GPA
  const targetC = parseFloat(targetCgpa) || 0;
  const pCurrC = parseFloat(predCurrentCgpa) || 0;
  const pCurrCr = parseFloat(predCurrentCredits) || 0;
  const remCr = parseFloat(remainingCredits) || 0;

  const totalTargetCredits = pCurrCr + remCr;
  const requiredTotalPoints = targetC * totalTargetCredits;
  const currentPoints = pCurrC * pCurrCr;
  const neededGpaVal = remCr > 0 ? ((requiredTotalPoints - currentPoints) / remCr) : 0;
  const requiredGpa = neededGpaVal > 10 ? '> 10.0 (Unachievable)' : neededGpaVal < 0 ? '0.00 (Achieved)' : neededGpaVal.toFixed(2);

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

          {/* 2. Grade Forecaster */}
          <div className="calculator-card">
            <div className="calc-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Target size={20} />
                <h3>Target Grade Forecaster</h3>
              </div>
              <p>Determine the minimum term SGPA needed to achieve your graduation goal.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-calc">
                <label>Target CGPA</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="10" 
                  value={targetCgpa} 
                  onChange={(e) => setTargetCgpa(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>Current CGPA</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="10" 
                  value={predCurrentCgpa} 
                  onChange={(e) => setPredCurrentCgpa(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-calc">
                <label>Credits Earned</label>
                <input 
                  type="number" 
                  min="1" 
                  max="142" 
                  value={predCurrentCredits} 
                  onChange={(e) => setPredCurrentCredits(e.target.value)} 
                />
              </div>

              <div className="form-group-calc">
                <label>Upcoming Credits</label>
                <input 
                  type="number" 
                  min="1" 
                  max="40" 
                  value={remainingCredits} 
                  onChange={(e) => setRemainingCredits(e.target.value)} 
                />
              </div>
            </div>

            <div className="calc-result-box">
              <div className="calc-result-label">Required SGPA in Upcoming Term</div>
              <div className="calc-result-val" style={{ color: neededGpaVal > 10 ? '#ef4444' : '#09090b' }}>
                {requiredGpa}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
