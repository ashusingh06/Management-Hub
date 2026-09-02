const admin = require("./node_modules/firebase-admin/lib/index.js");

const serviceAccount = {
  "type": "service_account",
  "project_id": "management-hub-1c14c",
};

// Use application default credentials via firebase CLI token
const app = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "management-hub-1c14c"
});

const db = admin.firestore();

const courses = [
  { id: 1, code: "BSMA1001", level: "foundation", title: "Mathematics for Data Science I", credits: 4, prerequisites: [], description: "Linear algebra, matrix operations, calculus fundamentals.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 2, code: "BSMA1002", level: "foundation", title: "Statistics for Data Science I", credits: 4, prerequisites: [], description: "Probability theory, random variables, discrete distributions.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 3, code: "BSCS1001", level: "foundation", title: "Computational Thinking", credits: 4, prerequisites: [], description: "Algorithm design, problem decomposition, logic formulation.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 4, code: "BSHS1001", level: "foundation", title: "English I", credits: 4, prerequisites: [], description: "Professional communication and academic writing.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 5, code: "BSMS1201", level: "foundation", title: "Principles of Economics", credits: 4, prerequisites: [], description: "Microeconomic foundations, market equilibrium.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 6, code: "BSMS1202", level: "foundation", title: "Financial Accounting", credits: 4, prerequisites: [], description: "Balance sheets, ledger entries, income statements.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 7, code: "BSMS1203", level: "foundation", title: "Business Statistics", credits: 4, prerequisites: ["BSMA1002"], description: "Regression models, time-series forecasting.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 8, code: "BSMS1204", level: "foundation", title: "Management Thought and Practice", credits: 4, prerequisites: [], description: "Classical management theories, leadership frameworks.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 9, code: "BSMS2201", level: "diploma", title: "Python for Data Analytics", credits: 4, prerequisites: ["BSCS1001"], description: "Pandas, NumPy, Matplotlib, Seaborn.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 10, code: "BSMS2202", level: "diploma", title: "Data Management", credits: 4, prerequisites: ["BSCS1001"], description: "Relational schema design, SQL querying.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 11, code: "BSMS2203", level: "diploma", title: "Analysis of Economic Data", credits: 4, prerequisites: ["BSMS1201", "BSMA1002"], description: "Econometric techniques, empirical model evaluation.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 12, code: "BSMS3201", level: "diploma", title: "Marketing Analytics", credits: 4, prerequisites: ["BSMS1203", "BSMS1204"], description: "Customer segmentation, CLV, churn prediction.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 13, code: "BSMS3202", level: "diploma", title: "HR Analytics", credits: 4, prerequisites: ["BSMA1002", "BSMS1204"], description: "Workforce metrics, employee retention modeling.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 14, code: "BSMS3203", level: "diploma", title: "Financial Analytics", credits: 4, prerequisites: ["BSMS1202", "BSMA1002"], description: "Asset pricing models (CAPM), portfolio risk metrics.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 15, code: "BSMS2204", level: "diploma", title: "Operations Management", credits: 4, prerequisites: ["BSMA1001", "BSMS1204"], description: "Process optimization, queueing systems.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 16, code: "BSMS3204", level: "diploma", title: "Supply Chain Analytics", credits: 4, prerequisites: ["BSMS2204", "BSMS1203"], description: "Network design, logistics tracking.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 17, code: "BSMS3901", level: "diploma", title: "Business Management Project", credits: 4, prerequisites: ["BSMS1204", "BSMS1202"], description: "Applied strategic research, business model evaluation.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 18, code: "BSMS3902", level: "diploma", title: "Business Analytics Project", credits: 4, prerequisites: ["BSMS2201", "BSMS2202", "BSMS1203"], description: "End-to-end data pipeline construction.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 19, code: "BSMS2205", level: "diploma", title: "Corporate Finance", credits: 4, prerequisites: ["BSMS1202"], description: "Capital budgeting (NPV/IRR), WACC.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 20, code: "BSMS2206", level: "diploma", title: "Organizational Behaviour", credits: 4, prerequisites: ["BSMS1204"], description: "Team dynamics, workplace psychology.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 21, code: "BSMS3205", level: "diploma", title: "Money Banking and Financial Markets", credits: 4, prerequisites: ["BSMS1201", "BSMS1202"], description: "Monetary policy, commercial banking systems.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 22, code: "BSMS2207", level: "diploma", title: "Marketing Management", credits: 4, prerequisites: ["BSMS1204"], description: "Brand positioning, market research methodologies.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 23, code: "BSMS2208", level: "diploma", title: "Macroeconomics", credits: 4, prerequisites: ["BSMS1201"], description: "National income accounting (GDP), fiscal policy.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 24, code: "BSMS3206", level: "diploma", title: "Managerial Economics", credits: 4, prerequisites: ["BSMS1201", "BSMA1001"], description: "Pricing strategy, oligopoly and game-theoretic markets.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 25, code: "BSGN3001", level: "bs", title: "Strategies for Professional Growth", credits: 4, prerequisites: ["BSHS1001", "BSMS1204"], description: "Executive communication, career roadmap building.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 26, code: "BSMS3207", level: "bs", title: "GenAI for Business", credits: 4, prerequisites: ["BSMS2201", "BSCS1001"], description: "LLM adoption frameworks, prompt engineering.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 27, code: "BSMS3208", level: "bs", title: "Digital Business", credits: 4, prerequisites: ["BSMS1204", "BSMS2207"], description: "Platform business models, multi-sided market strategies.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 28, code: "BSMS3209", level: "bs", title: "Logistics and Supply Chain Management", credits: 4, prerequisites: ["BSMS3204"], description: "Multi-modal freight logistics, automated warehousing.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 29, code: "BSMS4201", level: "bs", title: "Applied Time Series Analysis", credits: 4, prerequisites: ["BSMS1203", "BSMS2201"], description: "ARIMA, SARIMA, GARCH volatility models.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] },
  { id: 30, code: "BSMS4202", level: "bs", title: "Market Intelligence", credits: 4, prerequisites: ["BSMS3201", "BSMS2201"], description: "Competitive intelligence frameworks, sentiment tracking.", pdf_url: "", notes: { available: false, fileName: "", fileUrl: "" }, pyqs: [] }
];

async function pushData() {
  console.log("Pushing", courses.length, "courses to Firestore...");
  const batch = db.batch();
  courses.forEach(c => {
    const ref = db.collection("courses").doc(c.code.toUpperCase());
    batch.set(ref, { ...c, updatedAt: new Date().toISOString() }, { merge: true });
  });
  await batch.commit();
  
  // Also save to settings/courses
  await db.collection("settings").doc("courses").set({
    list: courses,
    updatedAt: new Date().toISOString()
  });
  
  console.log("SUCCESS! All", courses.length, "courses pushed to Firestore.");
  process.exit(0);
}

pushData().catch(e => { console.error("ERROR:", e.message); process.exit(1); });