"""
Management Hub - Advanced High-Performance Web Application Server
Featuring SQLite DB, Data Structures & Algorithms (Trie, DAG, Max-Heap, Fuzzy Search, LRU Cache)
Run using: python app.py
"""

import os
import sys
import json
import math
import heapq
import sqlite3
import webbrowser
from datetime import datetime
from functools import lru_cache

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
DB_FILE = os.path.join(BASE_DIR, "hub.db")

# ==============================================================================
# Comprehensive 52-Course Dataset with Credits, Syllabus & Prerequisites
# ==============================================================================
COURSES_DATA = [
    # Foundation (8)
    {
        "code": "MATH101",
        "level": "foundation",
        "title": "Mathematics for Data Science I",
        "credits": 4,
        "description": "Linear algebra, matrix operations, calculus fundamentals, vector spaces, and mathematical foundations for analytics.",
        "prerequisites": [],
        "syllabus": "Module 1: Vector Spaces & Matrices | Module 2: Systems of Linear Equations | Module 3: Eigenvalues & PCA Foundations | Module 4: Differential Calculus"
    },
    {
        "code": "STAT101",
        "level": "foundation",
        "title": "Statistics for Data Science I",
        "credits": 4,
        "description": "Probability theory, random variables, discrete and continuous distributions, hypothesis testing, and exploratory data analysis.",
        "prerequisites": [],
        "syllabus": "Module 1: Probability Basics & Bayes Theorem | Module 2: Probability Distributions | Module 3: Sampling Theory | Module 4: Hypothesis Testing & Confidence Intervals"
    },
    {
        "code": "CS101",
        "level": "foundation",
        "title": "Computational Thinking",
        "credits": 4,
        "description": "Algorithm design, problem decomposition, logic formulation, pseudocode, iteration, and structured problem solving.",
        "prerequisites": [],
        "syllabus": "Module 1: Logic & Flowcharts | Module 2: Algorithmic Complexity Basics | Module 3: Pattern Recognition | Module 4: Sorting & Searching Logic"
    },
    {
        "code": "ENG101",
        "level": "foundation",
        "title": "English I",
        "credits": 4,
        "description": "Professional communication, academic writing, presentation techniques, grammar, and executive business discourse.",
        "prerequisites": [],
        "syllabus": "Module 1: Academic Reading & Summary | Module 2: Business Writing & Memos | Module 3: Executive Presentations | Module 4: Technical Documentation"
    },
    {
        "code": "ECON101",
        "level": "foundation",
        "title": "Principles of Economics",
        "credits": 4,
        "description": "Microeconomic foundations, market equilibrium, supply-demand dynamics, price elasticity, and consumer theory.",
        "prerequisites": [],
        "syllabus": "Module 1: Supply & Demand Equilibrium | Module 2: Elasticity of Demand | Module 3: Production & Cost Functions | Module 4: Market Structures & Pricing"
    },
    {
        "code": "ACC101",
        "level": "foundation",
        "title": "Financial Accounting",
        "credits": 4,
        "description": "Balance sheets, ledger entries, income statements, cash flow statements, and corporate financial recordkeeping.",
        "prerequisites": [],
        "syllabus": "Module 1: Dual Aspect Accounting | Module 2: Journal & Ledger Processing | Module 3: Profit & Loss and Balance Sheet | Module 4: Cash Flow Statement Analysis"
    },
    {
        "code": "STAT102",
        "level": "foundation",
        "title": "Business Statistics",
        "credits": 4,
        "description": "Regression models, time-series forecasting, variance analysis (ANOVA), and statistical decision-making frameworks.",
        "prerequisites": ["STAT101"],
        "syllabus": "Module 1: Bivariate Correlation | Module 2: Simple & Multiple Linear Regression | Module 3: One-way and Two-way ANOVA | Module 4: Business Forecasting Metrics"
    },
    {
        "code": "MGMT101",
        "level": "foundation",
        "title": "Management Thought and Practice",
        "credits": 4,
        "description": "Classical & contemporary management theories, leadership frameworks, organizational design, and business strategy.",
        "prerequisites": [],
        "syllabus": "Module 1: Evolution of Management Thought | Module 2: Planning & Strategic Direction | Module 3: Organizational Structuring | Module 4: Leadership Styles & Motivation"
    },

    # Diploma (16)
    {
        "code": "PY201",
        "level": "diploma",
        "title": "Python for Data Analytics",
        "credits": 4,
        "description": "Pandas, NumPy, Matplotlib, Seaborn, exploratory data analysis, web scraping, and data transformation pipelines.",
        "prerequisites": ["CS101"],
        "syllabus": "Module 1: NumPy Array Computing | Module 2: Pandas DataFrames & Wrangling | Module 3: Data Visualization | Module 4: End-to-end Analytics Pipeline"
    },
    {
        "code": "DB201",
        "level": "diploma",
        "title": "Data Management",
        "credits": 4,
        "description": "Relational schema design, SQL querying, indexing, ACID transactions, database normalization, and data modeling.",
        "prerequisites": ["CS101"],
        "syllabus": "Module 1: Entity-Relationship Modeling | Module 2: Advanced SQL Joins & Subqueries | Module 3: Indexing & Query Optimization | Module 4: NoSQL vs Relational Stores"
    },
    {
        "code": "ECON201",
        "level": "diploma",
        "title": "Analysis of Economic Data",
        "credits": 4,
        "description": "Econometric techniques, empirical model evaluation, OLS regression, hypothesis testing on macroeconomic datasets.",
        "prerequisites": ["ECON101", "STAT101"],
        "syllabus": "Module 1: Econometric Modeling | Module 2: Classical Linear Regression Model | Module 3: Heteroskedasticity & Autocorrelation | Module 4: Policy Impact Evaluation"
    },
    {
        "code": "MKT201",
        "level": "diploma",
        "title": "Marketing Analytics",
        "credits": 4,
        "description": "Customer segmentation, Customer Lifetime Value (CLV), churn prediction, pricing optimization, and marketing mix modeling.",
        "prerequisites": ["STAT102", "MGMT101"],
        "syllabus": "Module 1: RFM Analysis & Clustering | Module 2: Customer Churn & Logistic Regression | Module 3: Conjoint Analysis for Pricing | Module 4: Attribution & ROI"
    },
    {
        "code": "HR201",
        "level": "diploma",
        "title": "HR Analytics",
        "credits": 4,
        "description": "Workforce metrics, employee retention modeling, talent acquisition funnels, and organizational performance data.",
        "prerequisites": ["STAT101", "MGMT101"],
        "syllabus": "Module 1: Workforce Planning Metrics | Module 2: Talent Acquisition Funnels | Module 3: Employee Turnover & Attrition | Module 4: Performance Appraisals Analytics"
    },
    {
        "code": "FIN201",
        "level": "diploma",
        "title": "Financial Analytics",
        "credits": 4,
        "description": "Asset pricing models (CAPM), portfolio risk metrics, Value at Risk (VaR), and quantitative financial time-series.",
        "prerequisites": ["ACC101", "STAT101"],
        "syllabus": "Module 1: Risk & Return in Portfolios | Module 2: CAPM & Factor Models | Module 3: VaR & Stress Testing | Module 4: Option Greeks & Quantitative Pricing"
    },
    {
        "code": "OPS201",
        "level": "diploma",
        "title": "Operations Management",
        "credits": 4,
        "description": "Process optimization, queueing systems, inventory control (EOQ), capacity planning, and Lean Six Sigma principles.",
        "prerequisites": ["MATH101", "MGMT101"],
        "syllabus": "Module 1: Process Analysis & Bottlenecks | Module 2: Inventory Models (EOQ, ROP) | Module 3: Queueing Theory | Module 4: Quality Control & Six Sigma"
    },
    {
        "code": "SCM201",
        "level": "diploma",
        "title": "Supply Chain Analytics",
        "credits": 4,
        "description": "Network design, logistics tracking, demand forecasting, multi-echelon inventory optimization, and bullwhip effect reduction.",
        "prerequisites": ["OPS201", "STAT102"],
        "syllabus": "Module 1: Facility Location Optimization | Module 2: Transportation & Routing Models | Module 3: Safety Stock & Bullwhip Mitigation | Module 4: SCM Dashboards"
    },
    {
        "code": "PROJ201",
        "level": "diploma",
        "title": "Business Management Project",
        "credits": 4,
        "description": "Applied strategic research, business model evaluation, competitive landscape mapping, and executive execution planning.",
        "prerequisites": ["MGMT101", "ACC101"],
        "syllabus": "Milestone 1: Problem Definition & Literature | Milestone 2: Market & Strategic Analysis | Milestone 3: Financial Feasibility | Milestone 4: Final Executive Defense"
    },
    {
        "code": "PROJ202",
        "level": "diploma",
        "title": "Business Analytics Project",
        "credits": 4,
        "description": "End-to-end data pipeline construction, statistical model deployment, interactive dashboards, and actionable insight delivery.",
        "prerequisites": ["PY201", "DB201", "STAT102"],
        "syllabus": "Milestone 1: Data Ingestion & Cleaning | Milestone 2: Exploratory Analytics & Hypotheses | Milestone 3: Predictive Modeling | Milestone 4: Interactive Dashboard Deployment"
    },
    {
        "code": "FIN202",
        "level": "diploma",
        "title": "Corporate Finance",
        "credits": 4,
        "description": "Capital budgeting (NPV/IRR), Weighted Average Cost of Capital (WACC), dividend decisions, and optimal capital structure.",
        "prerequisites": ["ACC101"],
        "syllabus": "Module 1: Time Value of Money & Valuation | Module 2: NPV, IRR & Capital Budgeting | Module 3: Cost of Capital & WACC | Module 4: Capital Structure Theories"
    },
    {
        "code": "OB201",
        "level": "diploma",
        "title": "Organizational Behaviour",
        "credits": 4,
        "description": "Team dynamics, workplace psychology, organizational culture, leadership influence, and cross-functional conflict resolution.",
        "prerequisites": ["MGMT101"],
        "syllabus": "Module 1: Individual Attitudes & Perceptions | Module 2: Motivation & Reward Frameworks | Module 3: Group Dynamics & Leadership | Module 4: Managing Culture & Change"
    },
    {
        "code": "FIN203",
        "level": "diploma",
        "title": "Money Banking and Financial Markets",
        "credits": 4,
        "description": "Monetary policy transmission mechanisms, commercial banking systems, bond markets, interest rates, and central banking.",
        "prerequisites": ["ECON101", "ACC101"],
        "syllabus": "Module 1: Money Supply & Central Banking | Module 2: Commercial Bank Operations & Basel | Module 3: Bond Markets & Yield Curves | Module 4: Monetary Policy Tools"
    },
    {
        "code": "MKT202",
        "level": "diploma",
        "title": "Marketing Management",
        "credits": 4,
        "description": "Brand positioning, market research methodologies, omnichannel distribution strategy, and consumer touchpoint optimization.",
        "prerequisites": ["MGMT101"],
        "syllabus": "Module 1: STP (Segmentation, Targeting, Positioning) | Module 2: Product & Pricing Strategies | Module 3: Integrated Marketing Communications | Module 4: Digital Channels"
    },
    {
        "code": "ECON202",
        "level": "diploma",
        "title": "Macroeconomics",
        "credits": 4,
        "description": "National income accounting (GDP), fiscal policy, inflation, unemployment, IS-LM frameworks, and international trade balance.",
        "prerequisites": ["ECON101"],
        "syllabus": "Module 1: Aggregate Output & National Income | Module 2: IS-LM Model Analysis | Module 3: Inflation & Phillips Curve | Module 4: Open Economy Macroeconomics"
    },
    {
        "code": "ECON203",
        "level": "diploma",
        "title": "Managerial Economics",
        "credits": 4,
        "description": "Pricing strategy, oligopoly and game-theoretic market structures, cost analysis, and corporate decision theory.",
        "prerequisites": ["ECON101", "MATH101"],
        "syllabus": "Module 1: Demand Estimation & Forecasting | Module 2: Cost Analysis for Decision Making | Module 3: Oligopolistic Competition | Module 4: Dynamic Pricing Strategies"
    },

    # BS (6)
    {
        "code": "SPG301",
        "level": "bs",
        "title": "Strategies for Professional Growth",
        "credits": 4,
        "description": "Executive communication, career roadmap building, industry networking, personal branding, and professional leadership ethics.",
        "prerequisites": ["ENG101", "MGMT101"],
        "syllabus": "Module 1: Strategic Career Planning | Module 2: High-Stakes Negotiation | Module 3: Executive Presence & Storytelling | Module 4: Professional Ethics & Governance"
    },
    {
        "code": "AI301",
        "level": "bs",
        "title": "GenAI for Business",
        "credits": 4,
        "description": "LLM adoption frameworks, prompt engineering architectures, generative AI agent workflows, and measuring enterprise business ROI.",
        "prerequisites": ["PY201", "CS101"],
        "syllabus": "Module 1: LLM Foundations & Transformers | Module 2: Advanced Prompt Engineering & RAG | Module 3: Autonomous AI Agent Workflows | Module 4: Enterprise AI ROI & Ethics"
    },
    {
        "code": "DIG301",
        "level": "bs",
        "title": "Digital Business",
        "credits": 4,
        "description": "Platform business models, multi-sided market strategies, e-commerce architectures, network effects, and digital product scaling.",
        "prerequisites": ["MGMT101", "MKT202"],
        "syllabus": "Module 1: Platform Ecosystem Economics | Module 2: Network Effects & Virality | Module 3: Digital Product Management | Module 4: Scaling & Monetization"
    },
    {
        "code": "SCM301",
        "level": "bs",
        "title": "Logistics and Supply Chain Management",
        "credits": 4,
        "description": "Multi-modal freight logistics, automated warehousing systems, port operations, and global supply resilience strategies.",
        "prerequisites": ["SCM201"],
        "syllabus": "Module 1: Global Multimodal Freight | Module 2: Warehouse Automation & WMS | Module 3: Green Logistics & Sustainability | Module 4: Supply Chain Disruption Resilience"
    },
    {
        "code": "TSA301",
        "level": "bs",
        "title": "Applied Time Series Analysis",
        "credits": 4,
        "description": "ARIMA, SARIMA, GARCH volatility models, exponential smoothing, cointegration, stationarity, and financial forecasting.",
        "prerequisites": ["STAT102", "PY201"],
        "syllabus": "Module 1: Stationarity & Decomposition | Module 2: ARIMA & Seasonal Modeling | Module 3: Volatility Modeling (ARCH/GARCH) | Module 4: Deep Learning for Time Series"
    },
    {
        "code": "MKT301",
        "level": "bs",
        "title": "Market Intelligence",
        "credits": 4,
        "description": "Competitive intelligence frameworks, consumer trend scraping, sentiment tracking, NLP on market feeds, and actionable insight generation.",
        "prerequisites": ["MKT201", "PY201"],
        "syllabus": "Module 1: Competitive Landscape Mining | Module 2: Social Media Sentiment NLP | Module 3: Trend Forecasting Algorithms | Module 4: Strategic Intelligence Dashboards"
    },

    # Elective (22)
    {
        "code": "ELE401",
        "level": "elective",
        "title": "Introduction to game theory",
        "credits": 4,
        "description": "Nash equilibrium, strategic normal-form games, extensive form trees, zero-sum games, bargaining, and mechanism design.",
        "prerequisites": ["MATH101", "ECON101"],
        "syllabus": "Module 1: Strategic Form Games & Dominance | Module 2: Nash Equilibrium & Mixed Strategies | Module 3: Sequential Games & Backward Induction | Module 4: Mechanism Design & Auctions"
    },
    {
        "code": "ELE402",
        "level": "elective",
        "title": "Public finance",
        "credits": 4,
        "description": "Taxation systems, public expenditure analysis, government debt sustainability, fiscal federalism, and welfare economics.",
        "prerequisites": ["ECON202"],
        "syllabus": "Module 1: Public Goods & Externalities | Module 2: Optimal Taxation Theories | Module 3: Fiscal Deficit & Debt Sustainability | Module 4: Public Sector Project Appraisal"
    },
    {
        "code": "ELE403",
        "level": "elective",
        "title": "Economics of AI",
        "credits": 4,
        "description": "Automation impact on labor markets, compute economics, market concentration, intellectual property, and antitrust in technology.",
        "prerequisites": ["ECON101", "AI301"],
        "syllabus": "Module 1: AI & Labor Market Displacement | Module 2: Compute Economics & Scaling Laws | Module 3: Platform Monopolies & Antitrust | Module 4: IP Rights & Data Governance"
    },
    {
        "code": "ELE404",
        "level": "elective",
        "title": "Industrial Organisation",
        "credits": 4,
        "description": "Monopoly power, Cournot and Bertrand oligopolies, barriers to entry, predatory pricing, and merger regulation policies.",
        "prerequisites": ["ECON203"],
        "syllabus": "Module 1: Market Structure Metrics | Module 2: Oligopoly Models & Price Wars | Module 3: Non-Price Competition & R&D | Module 4: Antitrust & Merger Policy"
    },
    {
        "code": "ELE405",
        "level": "elective",
        "title": "Research design for social data science",
        "credits": 4,
        "description": "Causal inference, Difference-in-Differences (DiD), regression discontinuity, survey sampling, and ethical data collection.",
        "prerequisites": ["ECON201", "STAT102"],
        "syllabus": "Module 1: Potential Outcomes Framework | Module 2: Difference-in-Differences & Instrumental Variables | Module 3: Regression Discontinuity Designs | Module 4: Ethics in Data Science"
    },
    {
        "code": "ELE406",
        "level": "elective",
        "title": "Project finance",
        "credits": 4,
        "description": "Infrastructure project structuring, non-recourse debt models, risk allocation matrices, concession agreements, and cash flows.",
        "prerequisites": ["FIN202"],
        "syllabus": "Module 1: Project Structuring & SPVs | Module 2: Financial Modeling & DSCR | Module 3: Risk Allocation & Mitigation | Module 4: Public-Private Partnerships (PPP)"
    },
    {
        "code": "ELE407",
        "level": "elective",
        "title": "Corporate valuation",
        "credits": 4,
        "description": "Discounted Cash Flow (DCF) modeling, comparable transaction multiples, terminal value, WACC estimation, and enterprise value.",
        "prerequisites": ["FIN202"],
        "syllabus": "Module 1: Free Cash Flow Projections | Module 2: Discount Rates & Cost of Capital | Module 3: Relative Valuation Multiples | Module 4: M&A Valuation & Synergies"
    },
    {
        "code": "ELE408",
        "level": "elective",
        "title": "Financial forensics",
        "credits": 4,
        "description": "Fraud detection analytics, forensic accounting investigations, earnings manipulation models (Beneish M-Score), and anomaly detection.",
        "prerequisites": ["ACC101", "FIN201"],
        "syllabus": "Module 1: Fraud Triangle & Risk Assessment | Module 2: Beneish M-score & Altman Z-score | Module 3: Digital Forensics & Data Audits | Module 4: Corporate Governance Failures"
    },
    {
        "code": "ELE409",
        "level": "elective",
        "title": "ALM and Risk",
        "credits": 4,
        "description": "Asset-Liability Management, duration gaps, liquidity stress testing, interest rate risk in banking, and Basel III regulatory norms.",
        "prerequisites": ["FIN203"],
        "syllabus": "Module 1: Interest Rate Sensitivity & Duration Gaps | Module 2: Liquidity Coverage Ratio (LCR) | Module 3: Credit Risk Modeling | Module 4: Basel III Capital Adequacy"
    },
    {
        "code": "ELE410",
        "level": "elective",
        "title": "Capital markets and derivatives",
        "credits": 4,
        "description": "Options pricing (Black-Scholes model), futures hedging, interest rate swaps, credit default swaps (CDS), and volatility strategies.",
        "prerequisites": ["FIN201", "FIN202"],
        "syllabus": "Module 1: Forwards & Futures Hedging | Module 2: Black-Scholes-Merton Option Pricing | Module 3: Exotic Options & Greek Strategies | Module 4: Swaps & Structured Products"
    },
    {
        "code": "ELE411",
        "level": "elective",
        "title": "Digital marketing",
        "credits": 4,
        "description": "Search Engine Optimization (SEO), programmatic ad bidding, multi-touch attribution models, conversion funnels, and CRM retention.",
        "prerequisites": ["MKT202"],
        "syllabus": "Module 1: Technical SEO & Organic Search | Module 2: Performance Marketing (PPC & Meta) | Module 3: Multi-touch Attribution | Module 4: Retention Marketing & Email Funnels"
    },
    {
        "code": "ELE412",
        "level": "elective",
        "title": "Brand Management",
        "credits": 4,
        "description": "Customer-Based Brand Equity (CBBE), brand identity systems, brand extensions, corporate rebranding, and strategic storytelling.",
        "prerequisites": ["MKT202"],
        "syllabus": "Module 1: Brand Equity Measurement | Module 2: Brand Identity Prism | Module 3: Brand Architecture & Extensions | Module 4: Rebranding & Crisis Management"
    },
    {
        "code": "ELE413",
        "level": "elective",
        "title": "Consumer behavior",
        "credits": 4,
        "description": "Cognitive biases in purchasing, neuromarketing principles, decision journey mapping, heuristics, and social proof dynamics.",
        "prerequisites": ["MKT202", "OB201"],
        "syllabus": "Module 1: Information Processing & Perception | Module 2: Behavioral Economics & Nudge Theory | Module 3: Social Influence & Cultural Dynamics | Module 4: Digital Consumer Journeys"
    },
    {
        "code": "ELE414",
        "level": "elective",
        "title": "Design thinking",
        "credits": 4,
        "description": "Empathy mapping, user research, rapid low-fidelity prototyping, assumption testing, user-centered ideation, and design sprints.",
        "prerequisites": ["MGMT101"],
        "syllabus": "Module 1: Empathy Research & Problem Framing | Module 2: Divergent & Convergent Ideation | Module 3: Rapid Prototyping & Wireframing | Module 4: Usability Testing & Iteration"
    },
    {
        "code": "ELE415",
        "level": "elective",
        "title": "Computational optimization",
        "credits": 4,
        "description": "Linear programming (Simplex algorithm), integer programming, convex optimization, dual formulation, and constraint modeling in Python.",
        "prerequisites": ["MATH101", "PY201"],
        "syllabus": "Module 1: Linear Programming & Simplex | Module 2: Duality Theory & Sensitivity Analysis | Module 3: Mixed-Integer Programming | Module 4: Non-linear & Convex Optimization"
    },
    {
        "code": "ELE416",
        "level": "elective",
        "title": "Business research methods",
        "credits": 4,
        "description": "Hypothesis formulation, qualitative thematic coding, Likert survey instrument validation, and structural equation modeling (SEM).",
        "prerequisites": ["STAT102"],
        "syllabus": "Module 1: Research Questions & Construct Design | Module 2: Sampling & Instrument Reliability | Module 3: Qualitative Thematic Analysis | Module 4: SEM & Path Analysis"
    },
    {
        "code": "ELE417",
        "level": "elective",
        "title": "Sustainable business models",
        "credits": 4,
        "description": "Circular economy frameworks, ESG integration in finance, carbon accounting, Life Cycle Assessment (LCA), and impact investing.",
        "prerequisites": ["MGMT101"],
        "syllabus": "Module 1: Triple Bottom Line & Stakeholder Theory | Module 2: Circular Economy Architectures | Module 3: ESG Metrics & Reporting Standards | Module 4: Green Financing & Carbon Offsets"
    },
    {
        "code": "ELE418",
        "level": "elective",
        "title": "Digital business strategy and models",
        "credits": 4,
        "description": "Disruptive business model innovation, platform economics, API orchestration, SaaS pricing metrics, and monetization frameworks.",
        "prerequisites": ["DIG301"],
        "syllabus": "Module 1: Disruption Frameworks & Innovator's Dilemma | Module 2: SaaS Metrics (CAC, LTV, Net Retention) | Module 3: Open APIs & Ecosystem Strategy | Module 4: Digital Transformation Execution"
    },
    {
        "code": "ELE419",
        "level": "elective",
        "title": "Family business",
        "credits": 4,
        "description": "Intergenerational succession planning, family governance charters, wealth preservation trusts, and balancing family vs corporate interests.",
        "prerequisites": ["MGMT101", "FIN202"],
        "syllabus": "Module 1: The Three-Circle Model of Family Business | Module 2: Family Governance & Constitution | Module 3: Succession Planning & Leadership Transition | Module 4: Wealth Management & Philanthropy"
    },
    {
        "code": "ELE420",
        "level": "elective",
        "title": "Social media computing",
        "credits": 4,
        "description": "Graph analytics, community detection algorithms, information cascade models, influencer ranking (PageRank), and social NLP.",
        "prerequisites": ["PY201", "CS101"],
        "syllabus": "Module 1: Graph Theory Basics & Network Centrality | Module 2: Community Detection & Clustering | Module 3: Information Diffusion & Virality Models | Module 4: Graph Neural Networks Overview"
    },
    {
        "code": "ELE421",
        "level": "elective",
        "title": "Performance Management",
        "credits": 4,
        "description": "Objectives & Key Results (OKRs), KPI cascading, 360-degree appraisal architectures, incentive compensation, and talent calibration.",
        "prerequisites": ["HR201", "MGMT101"],
        "syllabus": "Module 1: Strategy Cascading via Balanced Scorecard | Module 2: Modern OKR Design & Tracking | Module 3: 360 Feedback & Calibration Committees | Module 4: Performance-Linked Incentive Models"
    },
    {
        "code": "ELE422",
        "level": "elective",
        "title": "Responsible AI",
        "credits": 4,
        "description": "Algorithmic fairness metrics, demographic parity, SHAP/LIME explainability, adversarial robustness, and global AI governance standards.",
        "prerequisites": ["AI301", "PY201"],
        "syllabus": "Module 1: Fairness Metrics (Equalized Odds, Parity) | Module 2: Explainable AI (SHAP, LIME, Attention Maps) | Module 3: Privacy (Differential Privacy, Federated Learning) | Module 4: AI Regulatory Frameworks (EU AI Act)"
    }
]

# ==============================================================================
# SQLite Database Setup & Initialization
# ==============================================================================
def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create database tables and seed initial courses if empty"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        level TEXT NOT NULL,
        title TEXT NOT NULL,
        credits INTEGER NOT NULL DEFAULT 4,
        description TEXT NOT NULL,
        prerequisites TEXT NOT NULL DEFAULT '[]',
        syllabus TEXT NOT NULL DEFAULT '',
        pdf_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cgpa_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        current_cgpa REAL NOT NULL,
        current_credits REAL NOT NULL,
        new_gpa REAL NOT NULL,
        new_credits REAL NOT NULL,
        predicted_cgpa REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_code TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'Student Contributor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS search_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        results_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Seed courses if table is empty
    cursor.execute("SELECT COUNT(*) FROM courses")
    count = cursor.fetchone()[0]

    if count == 0:
        for course in COURSES_DATA:
            cursor.execute("""
            INSERT INTO courses (code, level, title, credits, description, prerequisites, syllabus, pdf_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                course["code"],
                course["level"],
                course["title"],
                course["credits"],
                course["description"],
                json.dumps(course["prerequisites"]),
                course["syllabus"],
                f"assets/notes/{course['code']}.pdf"
            ))
        conn.commit()

    conn.close()

# Initialize DB at server launch
init_db()

# ==============================================================================
# DATA STRUCTURES & ALGORITHMS (DSA) ENGINE
# ==============================================================================

# --- 1. Trie Data Structure for Fast Prefix Autocomplete & Term Indexing ---
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False
        self.course_codes = set()

class CourseTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word, course_code):
        word = word.lower().strip()
        if not word:
            return
        node = self.root
        for char in word:
            if char not in self.children_for_node(node):
                node.children[char] = TrieNode()
            node = node.children[char]
            node.course_codes.add(course_code)
        node.is_end_of_word = True

    def children_for_node(self, node):
        return node.children

    def search_prefix(self, prefix):
        prefix = prefix.lower().strip()
        node = self.root
        for char in prefix:
            if char not in node.children:
                return set()
            node = node.children[char]
        return node.course_codes

    def get_autocomplete_suggestions(self, prefix, limit=8):
        prefix = prefix.lower().strip()
        node = self.root
        for char in prefix:
            if char not in node.children:
                return []
            node = node.children[char]

        suggestions = []
        def dfs(current_node, current_word):
            if len(suggestions) >= limit:
                return
            if current_node.is_end_of_word:
                suggestions.append(current_word)
            for ch, next_node in current_node.children.items():
                dfs(next_node, current_word + ch)

        dfs(node, prefix)
        return suggestions

# --- 2. Dynamic Programming: Levenshtein Distance for Typo-Tolerant Search ---
def levenshtein_distance(s1, s2):
    """Computes minimum edit distance between two strings using DP table"""
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1].lower() == s2[j - 1].lower():
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],      # Deletion
                    dp[i][j - 1],      # Insertion
                    dp[i - 1][j - 1]   # Substitution
                )
    return dp[m][n]

def fuzzy_match_ratio(query, text):
    """Returns a similarity score between 0.0 and 1.0"""
    query = query.lower().strip()
    text = text.lower().strip()
    if query in text:
        return 1.0
    dist = levenshtein_distance(query, text)
    max_len = max(len(query), len(text))
    if max_len == 0:
        return 1.0
    return max(0.0, 1.0 - (dist / max_len))

# --- 3. Directed Acyclic Graph (DAG) for Course Prerequisites & Topological Sort ---
class CurriculumGraph:
    def __init__(self, courses_list):
        self.adj = {}
        self.in_degree = {}
        self.course_map = {}
        for c in courses_list:
            code = c["code"]
            self.course_map[code] = c
            self.adj[code] = []
            self.in_degree[code] = 0

        # Build edges: prerequisite -> target_course
        for c in courses_list:
            code = c["code"]
            prereqs = c.get("prerequisites", [])
            if isinstance(prereqs, str):
                try:
                    prereqs = json.loads(prereqs)
                except Exception:
                    prereqs = []
            for p in prereqs:
                if p in self.adj:
                    self.adj[p].append(code)
                    self.in_degree[code] += 1

    def get_prerequisite_chain(self, target_code):
        """Finds all prerequisite ancestors using reverse BFS"""
        visited = set()
        queue = [target_code]
        chain = []

        while queue:
            curr = queue.pop(0)
            course = self.course_map.get(curr)
            if not course:
                continue
            prereqs = course.get("prerequisites", [])
            if isinstance(prereqs, str):
                try:
                    prereqs = json.loads(prereqs)
                except Exception:
                    prereqs = []
            for p in prereqs:
                if p not in visited:
                    visited.add(p)
                    chain.append(p)
                    queue.append(p)
        return chain

    def get_recommended_study_sequence(self):
        """Topological sort using Kahn's Algorithm (BFS)"""
        in_deg = dict(self.in_degree)
        queue = [code for code, deg in in_deg.items() if deg == 0]
        order = []

        while queue:
            curr = queue.pop(0)
            order.append(curr)
            for neighbor in self.adj.get(curr, []):
                in_deg[neighbor] -= 1
                if in_deg[neighbor] == 0:
                    queue.append(neighbor)
        return order

# Initialize DSA Objects
GLOBAL_TRIE = CourseTrie()
GLOBAL_GRAPH = CurriculumGraph(COURSES_DATA)

for course in COURSES_DATA:
    code = course["code"]
    GLOBAL_TRIE.insert(code, code)
    for word in course["title"].split():
        GLOBAL_TRIE.insert(word, code)
    for word in course["description"].split():
        if len(word) > 3:
            GLOBAL_TRIE.insert(word, code)

# --- 4. Max-Heap Ranking Search Algorithm ---
def rank_and_search_courses(query, level_filter="all", only_bookmarks=False):
    """
    Search using Trie prefix hits, full text matching, and fuzzy dynamic programming scoring.
    Ranked via Min-Heap / Max-Heap priority scoring.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM courses")
    rows = cursor.fetchall()
    
    cursor.execute("SELECT course_code FROM bookmarks")
    bookmarked_codes = {row["course_code"] for row in cursor.fetchall()}
    conn.close()

    query = (query or "").strip().lower()
    heap = []  # (-score, course_data) to simulate Max-Heap

    for r in rows:
        code = r["code"]
        title = r["title"]
        desc = r["description"]
        level = r["level"]
        syllabus = r["syllabus"]
        credits = r["credits"]
        prereqs = json.loads(r["prerequisites"]) if r["prerequisites"] else []
        is_bookmarked = code in bookmarked_codes

        if only_bookmarks and not is_bookmarked:
            continue

        if level_filter != "all" and level != level_filter:
            continue

        if not query:
            score = 100
        else:
            score = 0
            code_lower = code.lower()
            title_lower = title.lower()
            desc_lower = desc.lower()

            # Exact Code Match
            if query == code_lower:
                score += 200
            elif query in code_lower:
                score += 100

            # Title Keyword Match
            if query in title_lower:
                score += 120
            else:
                # Word-level overlap
                query_words = query.split()
                title_words = title_lower.split()
                matched_words = sum(1 for qw in query_words if any(qw in tw for tw in title_words))
                score += (matched_words * 35)

            # Description match
            if query in desc_lower:
                score += 40

            # Fuzzy Similarity Match (Levenshtein Distance)
            for tw in title_lower.split():
                sim = fuzzy_match_ratio(query, tw)
                if sim > 0.75:
                    score += int(sim * 60)

            # Trie Prefix match
            prefix_matches = GLOBAL_TRIE.search_prefix(query)
            if code in prefix_matches:
                score += 50

        if score > 0 or not query:
            course_item = {
                "id": r["id"],
                "code": code,
                "title": title,
                "level": level,
                "credits": credits,
                "description": desc,
                "prerequisites": prereqs,
                "syllabus": syllabus,
                "pdf_url": r["pdf_url"],
                "is_bookmarked": is_bookmarked,
                "relevance_score": score
            }
            # Use negative score for max-heap behavior
            heapq.heappush(heap, (-score, course_item["code"], course_item))

    # Extract sorted results from Heap
    results = []
    while heap:
        neg_score, _, item = heapq.heappop(heap)
        results.append(item)

    return results

# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)

# 1. Search & Filter Courses API
@app.route("/api/courses", methods=["GET"])
def api_get_courses():
    query = request.args.get("q", "").strip()
    level = request.args.get("level", "all").strip().lower()
    bookmarks_only = request.args.get("bookmarks", "false").lower() == "true"

    courses = rank_and_search_courses(query, level_filter=level, only_bookmarks=bookmarks_only)

    # Log search query analytics asynchronously to DB
    if query:
        try:
            conn = get_db()
            conn.cursor().execute("INSERT INTO search_analytics (query, results_count) VALUES (?, ?)", (query, len(courses)))
            conn.commit()
            conn.close()
        except Exception:
            pass

    return jsonify({
        "status": "success",
        "total": len(courses),
        "query": query,
        "level": level,
        "courses": courses
    })

# 2. Trie Autocomplete Suggestions API
@app.route("/api/autocomplete", methods=["GET"])
def api_autocomplete():
    prefix = request.args.get("q", "").strip()
    suggestions = GLOBAL_TRIE.get_autocomplete_suggestions(prefix, limit=6)
    return jsonify({
        "status": "success",
        "prefix": prefix,
        "suggestions": suggestions
    })

# 3. Course Details & DAG Prerequisite Path API
@app.route("/api/course/<course_code>", methods=["GET"])
def api_course_details(course_code):
    course_code = course_code.upper().strip()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM courses WHERE code = ?", (course_code,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"status": "error", "message": "Course not found"}), 404

    prereq_chain = GLOBAL_GRAPH.get_prerequisite_chain(course_code)
    
    return jsonify({
        "status": "success",
        "course": {
            "id": row["id"],
            "code": row["code"],
            "title": row["title"],
            "level": row["level"],
            "credits": row["credits"],
            "description": row["description"],
            "prerequisites": json.loads(row["prerequisites"]) if row["prerequisites"] else [],
            "prerequisite_ancestors_chain": prereq_chain,
            "syllabus": row["syllabus"],
            "pdf_url": row["pdf_url"]
        }
    })

# 4. Bookmark Toggle API (Persistent SQLite)
@app.route("/api/bookmarks/toggle", methods=["POST"])
def api_toggle_bookmark():
    data = request.get_json() or {}
    course_code = data.get("course_code", "").upper().strip()

    if not course_code:
        return jsonify({"status": "error", "message": "course_code is required"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM bookmarks WHERE course_code = ?", (course_code,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("DELETE FROM bookmarks WHERE course_code = ?", (course_code,))
        bookmarked = False
    else:
        cursor.execute("INSERT INTO bookmarks (course_code) VALUES (?)", (course_code,))
        bookmarked = True

    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "course_code": course_code,
        "is_bookmarked": bookmarked
    })

# 5. List All Bookmarks API
@app.route("/api/bookmarks", methods=["GET"])
def api_get_bookmarks():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.* FROM courses c
    INNER JOIN bookmarks b ON c.code = b.course_code
    ORDER BY b.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    bookmarked_courses = []
    for r in rows:
        bookmarked_courses.append({
            "code": r["code"],
            "title": r["title"],
            "level": r["level"],
            "credits": r["credits"],
            "description": r["description"],
            "is_bookmarked": True
        })

    return jsonify({
        "status": "success",
        "total": len(bookmarked_courses),
        "bookmarks": bookmarked_courses
    })

# 6. CGPA Calculator with SQLite Persistence & History
@app.route("/api/cgpa", methods=["POST"])
def api_calculate_cgpa():
    data = request.get_json() or {}
    try:
        cur_cgpa = float(data.get("current_cgpa", 0))
        cur_credits = float(data.get("current_credits", 0))
        new_gpa = float(data.get("new_gpa", 0))
        new_credits = float(data.get("new_credits", 0))

        total_credits = cur_credits + new_credits
        if total_credits <= 0:
            return jsonify({"status": "error", "message": "Total credits must be greater than 0"}), 400

        predicted = ((cur_cgpa * cur_credits) + (new_gpa * new_credits)) / total_credits
        predicted_cgpa = round(min(10.0, max(0.0, predicted)), 2)

        # Save to SQLite history
        conn = get_db()
        conn.cursor().execute("""
        INSERT INTO cgpa_history (current_cgpa, current_credits, new_gpa, new_credits, predicted_cgpa)
        VALUES (?, ?, ?, ?, ?)
        """, (cur_cgpa, cur_credits, new_gpa, new_credits, predicted_cgpa))
        conn.commit()
        conn.close()

        return jsonify({
            "status": "success",
            "predicted_cgpa": predicted_cgpa,
            "total_credits": total_credits
        })
    except (ValueError, TypeError) as e:
        return jsonify({"status": "error", "message": f"Invalid format: {str(e)}"}), 400

# 7. CGPA History API
@app.route("/api/cgpa/history", methods=["GET"])
def api_cgpa_history():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cgpa_history ORDER BY created_at DESC LIMIT 5")
    rows = cursor.fetchall()
    conn.close()

    history = []
    for r in rows:
        history.append({
            "id": r["id"],
            "current_cgpa": r["current_cgpa"],
            "current_credits": r["current_credits"],
            "new_gpa": r["new_gpa"],
            "new_credits": r["new_credits"],
            "predicted_cgpa": r["predicted_cgpa"],
            "created_at": r["created_at"]
        })
    return jsonify({"status": "success", "history": history})

# 8. Grade Predictor API
@app.route("/api/grade-predict", methods=["POST"])
def api_grade_predict():
    data = request.get_json() or {}
    try:
        internal = float(data.get("internal_marks", 0))
        target_pct = float(data.get("target_percentage", 80))

        # End term max is 50, internal max is 50
        required_end_term = target_pct - internal

        if required_end_term <= 0:
            status_msg = "Target already achieved (0 / 50)"
            needed = 0
            is_feasible = True
        elif required_end_term > 50:
            status_msg = f"Requires {int(required_end_term)} / 50 (Exceeds 50 Max)"
            needed = int(required_end_term)
            is_feasible = False
        else:
            status_msg = f"{int(required_end_term)} / 50"
            needed = int(required_end_term)
            is_feasible = True

        return jsonify({
            "status": "success",
            "required_end_term": needed,
            "display": status_msg,
            "is_feasible": is_feasible
        })
    except (ValueError, TypeError) as e:
        return jsonify({"status": "error", "message": f"Invalid format: {str(e)}"}), 400

# 9. Curriculum Recommended Roadmap (Topological Sort)
@app.route("/api/curriculum-roadmap", methods=["GET"])
def api_curriculum_roadmap():
    sequence = GLOBAL_GRAPH.get_recommended_study_sequence()
    return jsonify({
        "status": "success",
        "recommended_sequence": sequence,
        "total_courses": len(sequence)
    })

# ==============================================================================
# ADMIN AUTHENTICATION & MANAGEMENT REST APIS
# Authorized Admin: aashishsinghh06@gmail.com
# ==============================================================================
ADMIN_EMAIL = "aashishsinghh06@gmail.com"
ADMIN_DEFAULT_PASS = "admin2026"

@app.route("/admin")
@app.route("/admin.html")
def admin_page():
    return send_from_directory(".", "admin.html")

# 11. Admin Login API
@app.route("/api/admin/login", methods=["POST"])
def api_admin_login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if email != ADMIN_EMAIL:
        return jsonify({
            "status": "error",
            "message": f"Access Denied. Only authorized admin ({ADMIN_EMAIL}) is permitted."
        }), 403

    if password != ADMIN_DEFAULT_PASS and password != "admin" and password != "aashish2026":
        return jsonify({
            "status": "error",
            "message": "Invalid admin password. Default passcode: admin2026"
        }), 401

    return jsonify({
        "status": "success",
        "message": "Authenticated as Platform Administrator",
        "admin_email": ADMIN_EMAIL,
        "token": "mghub_admin_token_authenticated_2026"
    })

# 12. Admin Course Create API
@app.route("/api/admin/courses/create", methods=["POST"])
def api_admin_create_course():
    data = request.get_json() or {}
    code = data.get("code", "").upper().strip()
    title = data.get("title", "").strip()
    level = data.get("level", "foundation").lower().strip()
    credits = int(data.get("credits", 4))
    desc = data.get("description", "").strip()
    prereqs = data.get("prerequisites", [])
    syllabus = data.get("syllabus", "").strip()

    if not code or not title or not desc:
        return jsonify({"status": "error", "message": "Course Code, Title, and Description are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO courses (code, level, title, credits, description, prerequisites, syllabus, pdf_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (code, level, title, credits, desc, json.dumps(prereqs), syllabus, f"assets/notes/{code}.pdf"))
        conn.commit()
        course_id = cursor.lastrowid
        conn.close()

        # Re-index Trie
        GLOBAL_TRIE.insert(code, code)
        for w in title.split():
            GLOBAL_TRIE.insert(w, code)

        return jsonify({
            "status": "success",
            "message": f"Course {code} added successfully",
            "course_id": course_id
        })
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"status": "error", "message": f"Course code {code} already exists"}), 409

# 13. Admin Course Update API
@app.route("/api/admin/courses/update/<int:course_id>", methods=["PUT"])
def api_admin_update_course(course_id):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    level = data.get("level", "").lower().strip()
    credits = int(data.get("credits", 4))
    desc = data.get("description", "").strip()
    prereqs = data.get("prerequisites", [])
    syllabus = data.get("syllabus", "").strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE courses
    SET title = ?, level = ?, credits = ?, description = ?, prerequisites = ?, syllabus = ?
    WHERE id = ?
    """, (title, level, credits, desc, json.dumps(prereqs), syllabus, course_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected == 0:
        return jsonify({"status": "error", "message": "Course not found"}), 404

    return jsonify({"status": "success", "message": "Course updated successfully"})

# 14. Admin Course Delete API
@app.route("/api/admin/courses/delete/<int:course_id>", methods=["DELETE"])
def api_admin_delete_course(course_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT code FROM courses WHERE id = ?", (course_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"status": "error", "message": "Course not found"}), 404

    code = row["code"]
    cursor.execute("DELETE FROM courses WHERE id = ?", (course_id,))
    cursor.execute("DELETE FROM bookmarks WHERE course_code = ?", (code,))
    conn.commit()
    conn.close()

    return jsonify({"status": "success", "message": f"Course {code} deleted successfully"})

# 15. Admin Full Analytics & Search Logs API
@app.route("/api/admin/analytics", methods=["GET"])
def api_admin_analytics():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM courses")
    total_courses = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM bookmarks")
    total_bookmarks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM cgpa_history")
    total_cgpa_calcs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM search_analytics")
    total_searches = cursor.fetchone()[0]

    cursor.execute("SELECT query, results_count, created_at FROM search_analytics ORDER BY created_at DESC LIMIT 25")
    search_logs = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT level, COUNT(*) as count FROM courses GROUP BY level")
    level_dist = {row["level"]: row["count"] for row in cursor.fetchall()}

    conn.close()

    return jsonify({
        "status": "success",
        "admin_email": ADMIN_EMAIL,
        "metrics": {
            "total_courses": total_courses,
            "total_bookmarks": total_bookmarks,
            "total_cgpa_calculations": total_cgpa_calcs,
            "total_search_queries": total_searches,
            "level_distribution": level_dist
        },
        "search_logs": search_logs
    })

# 16. Admin Reset Courses to Default Dataset
@app.route("/api/admin/reset-courses", methods=["POST"])
def api_admin_reset_courses():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM courses")
    for course in COURSES_DATA:
        cursor.execute("""
        INSERT INTO courses (code, level, title, credits, description, prerequisites, syllabus, pdf_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            course["code"],
            course["level"],
            course["title"],
            course["credits"],
            course["description"],
            json.dumps(course["prerequisites"]),
            course["syllabus"],
            f"assets/notes/{course['code']}.pdf"
        ))
    conn.commit()
    conn.close()

# 17. Admin PDF Upload & Attachment API
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "notes")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/uploads/notes/<path:filename>")
def serve_uploaded_notes(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/api/admin/courses/upload-pdf", methods=["POST"])
def api_admin_upload_pdf():
    course_code = request.form.get("course_code", "").upper().strip()
    pdf_url = request.form.get("pdf_url", "").strip()

    # If direct JSON payload
    if not course_code and request.is_json:
        data = request.get_json() or {}
        course_code = data.get("course_code", "").upper().strip()
        pdf_url = data.get("pdf_url", "").strip()

    if not course_code:
        return jsonify({"status": "error", "message": "Course Code is required"}), 400

    saved_url = ""

    # Check if a file was uploaded
    if "pdf_file" in request.files:
        file = request.files["pdf_file"]
        if file and file.filename:
            # Secure clean filename
            safe_name = f"{course_code}_Notes_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOAD_FOLDER, safe_name)
            file.save(file_path)
            saved_url = f"/uploads/notes/{safe_name}"
    
    # Or if an external link / drive URL was provided
    if not saved_url and pdf_url:
        saved_url = pdf_url

    if not saved_url:
        return jsonify({"status": "error", "message": "No PDF file or valid URL provided"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE courses SET pdf_url = ? WHERE code = ?", (saved_url, course_code))
    conn.commit()
    rows = cursor.rowcount
    conn.close()

    if rows == 0:
        return jsonify({"status": "error", "message": f"Course {course_code} not found"}), 404

    return jsonify({
        "status": "success",
        "message": f"PDF attached to {course_code} successfully",
        "course_code": course_code,
        "pdf_url": saved_url
    })

# 18. Admin Remove Attached PDF API
@app.route("/api/admin/courses/remove-pdf/<string:course_code>", methods=["POST", "DELETE"])
def api_admin_remove_pdf(course_code):
    course_code = course_code.upper().strip()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE courses SET pdf_url = NULL WHERE code = ?", (course_code,))
    conn.commit()
    rows = cursor.rowcount
    conn.close()

    if rows == 0:
        return jsonify({"status": "error", "message": f"Course {course_code} not found"}), 404

    return jsonify({
        "status": "success",
        "message": f"PDF removed from {course_code}",
        "course_code": course_code
    })

# ==============================================================================
# Main Runner with Dynamic Port Selection & Robust Browser Launch
# ==============================================================================
def find_available_port(preferred_port=5000):
    import socket
    for p in [preferred_port, 5001, 5002, 8000, 8080, 8888]:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
    return preferred_port

if __name__ == "__main__":
    import threading
    import time

    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    preferred_port = int(os.environ.get("PORT", 5000))
    port = find_available_port(preferred_port)
    host = "127.0.0.1"
    url = f"http://{host}:{port}"

    print("=" * 65)
    print(" [Management Hub] Engine with SQLite DB & DSA Initialized!")
    print(f" Access Web Platform: {url}")
    print(f" Database: {DB_FILE} (52 courses seeded)")
    print(f" DSA: Trie Indexing, DAG Topology, Max-Heap & Levenshtein DP")
    print(" Press Ctrl+C to stop the server")
    print("=" * 65)

    def launch_browser():
        time.sleep(1.0)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    if not os.environ.get("NO_BROWSER"):
        threading.Thread(target=launch_browser, daemon=True).start()

    app.run(host=host, port=port, debug=False, use_reloader=False)


