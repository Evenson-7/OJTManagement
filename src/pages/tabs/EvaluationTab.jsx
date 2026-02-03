// fileName: EvaluationTab.jsx

import React, { useState, useEffect } from "react";
import { 
  collection, query, where, addDoc, updateDoc, doc, 
  serverTimestamp, onSnapshot 
} from "firebase/firestore";
import { db } from "../../../firebaseConfig"; 
import toast, { Toaster } from "react-hot-toast";
import TabSection from "../../components/TabSection"; 
import EvaluationCertificate from '../../components/EvaluationCertificate'; 

// --- IMPORTS FOR PDF & PRINT ---
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro'; 

import { HiOutlineXMark } from "react-icons/hi2";
import { FaStar, FaMedal, FaCrown, FaFire, FaGem } from "react-icons/fa";
import { BsGraphUpArrow } from "react-icons/bs";
import { FileText, Award, BarChart2 } from "lucide-react";

// --- COLOR PALETTE CONSTANTS ---
const COLORS = {
  primary: "text-[#42A5FF]", // Sky Blue
  accent: "text-[#0094FF]",  // Deep Blue
  navy: "text-[#002B66]",    // Navy Blue
  bgLight: "bg-[#BDE4F7]",   // Light Cyan
  bgNavy: "bg-[#002B66]",    // Navy Background
};

// --- CONSTANTS ---
const ratingScale = [
  { value: "E", label: "Excellent", range: "5", score: 5, calculationValue: 5, color: "green" }, 
  { value: "A", label: "Above Standard", range: "4", score: 4, calculationValue: 4, color: "blue" }, 
  { value: "S", label: "Standard", range: "3", score: 3, calculationValue: 3, color: "yellow" }, 
  { value: "N", label: "Needs Improvement", range: "2", score: 2, calculationValue: 2, color: "orange" }, 
  { value: "P", label: "Poor", range: "1", score: 1, calculationValue: 1, color: "red" } 
];

const STANDARD_TEMPLATE = {
  title: "Standard OJT Evaluation",
  sections: [
    {
      id: "sec_behavior", title: "I. BEHAVIOR AT WORK",
      items: [
        { id: "q_att", text: "Attention and concentration on tasks" },
        { id: "q_mot", text: "Motivation and initiative" },
        { id: "q_res", text: "Sense of responsibility" },
        { id: "q_per", text: "Perseverance and diligence" },
        { id: "q_rel", text: "Relationship with others" },
        { id: "q_atd", text: "Attendance" }
      ]
    },
    {
      id: "sec_academic", title: "II. ACADEMIC PERFORMANCE",
      items: [
        { id: "q_know", text: "Knowledge of assigned tasks" },
        { id: "q_learn", text: "Ability to learn" }
      ]
    }
  ],
  essays: [
    { id: "essay_str", question: "What are the intern's strengths?", placeholder: "List strengths..." },
    { id: "essay_imp", question: "Areas for improvement?", placeholder: "List areas..." }
  ]
};

// --- UTILITIES ---
const calculateSectionScore = (sectionData) => {
  if (!sectionData) return 0;
  const ratings = Object.values(sectionData).filter(r => r);
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, r) => {
    const match = ratingScale.find(s => s.value === r);
    return sum + (match?.calculationValue || 0);
  }, 0);
  return Number((total / ratings.length).toFixed(2));
};

const calculateOverallScore = (formData, templateSections) => {
  if (!templateSections || !Array.isArray(templateSections)) return 0;
  let totalScore = 0;
  let totalCount = 0;
  templateSections.forEach((section) => {
    const sectionRatings = formData[section.id] || {};
    Object.values(sectionRatings).forEach((val) => {
      const match = ratingScale.find(r => r.value === val);
      if (match) {
        totalScore += match.calculationValue;
        totalCount++;
      }
    });
  });
  return totalCount === 0 ? 0 : Number((totalScore / totalCount).toFixed(2));
};

// --- ANALYTICS HELPERS ---
const badgeDefinitions = [
    { id: "elite_performer", name: "Elite Performer", description: "Achieved a near-perfect score of 4.8+", icon: <FaCrown />, color: "from-purple-500 to-indigo-600", criteria: (evals) => evals.some(e => e.overallScore >= 4.8) },
    { id: "gold_standard", name: "Gold Standard", description: "Maintained an average above 4.5", icon: <FaGem />, color: "from-yellow-400 to-amber-500", criteria: (evals) => { if (evals.length === 0) return false; const avg = evals.reduce((a,b) => a + (b.overallScore || 0), 0) / evals.length; return avg >= 4.5; } },
    { id: "section_master", name: "Section Master", description: "Scored a perfect 5.0 in any section", icon: <FaStar />, color: "from-blue-400 to-cyan-500", criteria: (evals) => evals.some(ev => ev.sectionScores && Object.values(ev.sectionScores).some(score => score === 5.0)) },
    { id: "rapid_growth", name: "Rapid Growth", description: "Improved overall score by 0.5+ points", icon: <BsGraphUpArrow />, color: "from-green-400 to-emerald-600", criteria: (evals) => { if (evals.length < 2) return false; const sorted = [...evals].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)); return (sorted[sorted.length - 1].overallScore - sorted[0].overallScore) >= 0.5; } },
    { id: "momentum", name: "Momentum", description: "Received 2 consecutive evaluations", icon: <FaFire />, color: "from-orange-500 to-red-500", criteria: (evals) => evals.length >= 2 },
    { id: "finisher", name: "Mission Complete", description: "Completed the Final Evaluation", icon: <FaMedal />, color: "from-gray-600 to-gray-800", criteria: (evals) => evals.some(e => e.periodCovered === "Final Evaluation") }
];

const analyzeSections = (evalList) => {
    const sectionAggregates = {};
    evalList.forEach(ev => { if (ev.sectionScores) { Object.entries(ev.sectionScores).forEach(([title, score]) => { const cleanTitle = title.trim(); if (!sectionAggregates[cleanTitle]) sectionAggregates[cleanTitle] = { sum: 0, count: 0 }; sectionAggregates[cleanTitle].sum += score; sectionAggregates[cleanTitle].count += 1; }); } });
    const sectionAverages = Object.entries(sectionAggregates).map(([title, data]) => ({ section: title, score: Number((data.sum / data.count).toFixed(2)) }));
    const strengths = [...sectionAverages].filter(s => s.score >= 3.5).sort((a,b) => b.score - a.score).slice(0, 3);
    const improvementAreas = [...sectionAverages].filter(s => s.score < 4.0).sort((a,b) => a.score - b.score).slice(0, 3);
    return { strengths, improvementAreas };
};

const calculateAnalytics = (allEvaluations) => {
    const submitted = allEvaluations.filter(e => e.status === "submitted" || e.status === "completed");
    const sortedEvaluations = [...submitted].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    const scoresOnly = sortedEvaluations.map(e => e.overallScore || 0);
    const avgOverall = scoresOnly.length > 0 ? scoresOnly.reduce((a,b) => a+b, 0) / scoresOnly.length : 0;
    const latestScore = scoresOnly.length > 0 ? scoresOnly[scoresOnly.length - 1] : 0;
    const { strengths: globalStrengths, improvementAreas: globalWeaknesses } = analyzeSections(submitted);
    const internMap = {};
    submitted.forEach(ev => { if (!internMap[ev.internId]) internMap[ev.internId] = { name: ev.internName, id: ev.internId, evaluations: [] }; internMap[ev.internId].evaluations.push(ev); });
    const internPerformance = Object.values(internMap).map(i => {
        const iEvals = i.evaluations.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        const iScores = iEvals.map(e => e.overallScore);
        const iAvg = iScores.reduce((a,b) => a+b, 0) / iScores.length;
        const trendVal = iScores.length > 1 ? iScores[iScores.length-1] - iScores[0] : 0;
        let trend = 'Stable'; if (trendVal > 0.1) trend = 'Improving'; if (trendVal < -0.1) trend = 'Declining';
        const { strengths: indStrengths, improvementAreas: indWeaknesses } = analyzeSections(iEvals);
        return { internId: i.id, internName: i.name, averageScore: Number(iAvg.toFixed(2)), totalEvaluations: i.evaluations.length, latestScore: iScores[iScores.length-1], trend, trendValue: trendVal, history: iEvals.map(e => ({ date: e.periodCovered, score: e.overallScore })), badgesEarned: badgeDefinitions.filter(b => b.criteria(i.evaluations)), strengths: indStrengths, improvementAreas: indWeaknesses };
    }).sort((a,b) => b.averageScore - a.averageScore); 
    return { performanceInsights: { totalEvaluations: submitted.length, averageScore: Number(avgOverall.toFixed(2)), latestScore: Number(latestScore.toFixed(2)), topPerformers: internPerformance.filter(i => i.averageScore >= 4.5).length }, internPerformance, strengths: globalStrengths, improvementAreas: globalWeaknesses };
};

// --- UPDATED DASHBOARD CARD COMPONENT ---
const EvaluationDashboard = ({ stats, rankings }) => {
  const { totalEvaluations, averageScore } = stats.performanceInsights || { totalEvaluations: 0, averageScore: 0 };
  const topPerformerName = rankings.length > 0 ? rankings[0].internName : "N/A";
  const topPerformerDisplay = topPerformerName !== "N/A" ? topPerformerName.split(" ")[0] : "N/A";
  const topPerformerScore = rankings.length > 0 ? rankings[0].averageScore : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* CARD 1: Total Evaluations (Light Blue) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Evaluations</p>
          <h3 className={`text-3xl font-bold ${COLORS.navy}`}>{totalEvaluations}</h3>
        </div>
        <div className={`w-12 h-12 ${COLORS.bgLight} rounded-full flex items-center justify-center ${COLORS.navy}`}>
          <FileText size={24} />
        </div>
      </div>

      {/* CARD 2: Class Average (Green -> Changed to Accent Blue/Navy mix for brand consistency) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Class Average</p>
          <h3 className={`text-3xl font-bold ${COLORS.navy}`}>{averageScore}</h3>
        </div>
        <div className={`w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center ${COLORS.accent}`}>
          <BarChart2 size={24} />
        </div>
      </div>

      {/* CARD 3: Top Performer (Purple -> Changed to Deep Navy for prominence) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Top Performer</p>
          <h3 className={`text-xl font-bold ${COLORS.navy}`}>{topPerformerDisplay}</h3>
          <p className={`text-xs ${COLORS.accent} font-medium mt-1`}>
            {rankings.length > 0 ? `Avg Score: ${topPerformerScore}` : "No data"}
          </p>
        </div>
        <div className={`w-12 h-12 ${COLORS.bgNavy} rounded-full flex items-center justify-center text-white`}>
          <Award size={24} />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const EvaluationTab = ({ user }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [myInterns, setMyInterns] = useState([]);
  const [allInterns, setAllInterns] = useState([]); 
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluationSubmitting, setEvaluationSubmitting] = useState(false);
  
  const [formTemplate, setFormTemplate] = useState({ title: "OJT Evaluation", sections: [], essays: [] });
  const [evaluationForm, setEvaluationForm] = useState({
    internId: "", internName: "", periodCovered: "", periodStartMonth: "", periodEndMonth: "",
    status: "draft", essayQuestions: {}, supervisorName: user?.name || "", evaluationDate: ""
  });
  
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  const [performanceData, setPerformanceData] = useState({});
  const [internRankings, setInternRankings] = useState([]); 
  const [myBadges, setMyBadges] = useState([]);

  // --- CERTIFICATE PRINT HANDLER ---
  const handleCertificatePrint = () => {
    const input = document.getElementById("certificate-visual");
    if (!input) return toast.error("Certificate not found");

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) return toast.error("Pop-up blocked. Please allow pop-ups.");
    const content = input.outerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Certificate</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: white; -webkit-print-color-adjust: exact; }
            .hide-on-export { display: none !important; }
          </style>
        </head>
        <body>
          ${content}
          <script>setTimeout(() => { window.focus(); window.print(); window.close(); }, 800);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- CERTIFICATE PDF HANDLER ---
  const handleCertificatePDF = (elementId = "certificate-visual", filename = "Certificate") => {
    const input = document.getElementById(elementId);
    if (!input) return toast.error("Certificate element not found");
    
    toast.loading("Generating Certificate PDF...", { id: "cert-pdf" });
    setTimeout(async () => {
        try {
            const width = 1123; const height = 794;
            const wrapper = document.createElement('div');
            wrapper.style.position = 'fixed'; wrapper.style.top = '-10000px'; wrapper.style.left = '-10000px';
            wrapper.style.width = `${width}px`; wrapper.style.height = `${height}px`; wrapper.style.zIndex = '-9999';
            
            const clone = input.cloneNode(true);
            clone.style.width = '100%'; clone.style.height = '100%'; clone.style.margin = '0'; clone.style.transform = 'none';
            clone.querySelectorAll('.hide-on-export').forEach(el => el.style.display = 'none');
            
            clone.querySelectorAll('input').forEach(input => {
                const div = document.createElement('div');
                div.textContent = input.value; div.className = input.className; div.style.cssText = input.style.cssText;
                div.style.border = 'none'; div.style.outline = 'none';
                if (input.className.includes('border-b')) div.style.borderBottom = input.style.borderBottom || '2px solid black';
                input.parentNode.replaceChild(div, input);
            });

            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(clone, { scale: 2.5, width, height, windowWidth: width, windowHeight: height, backgroundColor: "#ffffff", useCORS: true });
            document.body.removeChild(wrapper);
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('l', 'px', [width, height]);
            pdf.addImage(imgData, 'PNG', 0, 0, width, height, '', 'FAST');
            pdf.save(`${filename}.pdf`);
            toast.dismiss("cert-pdf"); toast.success("Certificate Downloaded");
        } catch (err) { console.error(err); toast.error("Failed to export"); toast.dismiss("cert-pdf"); }
    }, 500);
  };

  // --- REPORT PRINT HANDLER ---
  const handleReportPrint = (elementId) => {
    const input = document.getElementById(elementId);
    if (!input) return toast.error("Report content not found.");
    const printWindow = window.open('', '', 'width=1000,height=1200');
    if (!printWindow) return toast.error("Pop-up blocked.");
    const content = input.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Evaluation Report</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 0; }
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
              table { width: 100%; border-collapse: collapse; }
              thead { display: table-header-group; } tfoot { display: table-footer-group; }
              .header-space, .footer-space { height: 20mm; }
              .report-content { padding-left: 20mm; padding-right: 20mm; width: 100%; }
              button, .no-print { display: none !important; }
              .break-inside-avoid { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <table><thead><tr><td><div class="header-space">&nbsp;</div></td></tr></thead><tbody><tr><td class="report-content">${content}</td></tr></tbody><tfoot><tr><td><div class="footer-space">&nbsp;</div></td></tr></tfoot></table>
          <script>setTimeout(() => { window.focus(); window.print(); window.close(); }, 800);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- REPORT PDF HANDLER ---
  const handleReportPDF = (elementId) => {
    const input = document.getElementById(elementId);
    if (!input) return toast.error("Report content not found.");
    toast.loading("Generating Report...", { id: "rep-pdf" });

    setTimeout(async () => {
        try {
            const PDF_WIDTH_PX = 794; const MARGIN_TOP = 40; const MARGIN_BOTTOM = 40; const PAGE_HEIGHT_PX = 1123; const CONTENT_HEIGHT = PAGE_HEIGHT_PX - MARGIN_TOP - MARGIN_BOTTOM;
            const clone = input.cloneNode(true);
            clone.style.width = `${PDF_WIDTH_PX}px`; clone.style.padding = '40px'; clone.style.boxSizing = 'border-box'; clone.style.background = 'white';
            clone.classList.remove("shadow-xl", "border", "rounded-xl", "mb-10");

            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute'; wrapper.style.left = '-9999px'; wrapper.style.top = '0'; wrapper.style.width = `${PDF_WIDTH_PX}px`;
            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);

            let potentialBreaks = Array.from(clone.querySelectorAll('.break-inside-avoid'));
            if(potentialBreaks.length === 0) potentialBreaks = Array.from(clone.children);
            let currentY = 0; 
            potentialBreaks.forEach((child) => {
                const rect = child.getBoundingClientRect();
                if (currentY + rect.height > CONTENT_HEIGHT) { child.style.marginTop = `${(CONTENT_HEIGHT - currentY) + MARGIN_TOP}px`; currentY = rect.height; } else { currentY += rect.height; }
            });

            const canvas = await html2canvas(clone, { scale: 2, width: PDF_WIDTH_PX, windowWidth: PDF_WIDTH_PX, useCORS: true });
            document.body.removeChild(wrapper);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfPageWidth = pdf.internal.pageSize.getWidth(); const pdfPageHeight = pdf.internal.pageSize.getHeight();
            const totalImgHeight = (canvas.height * pdfPageWidth) / canvas.width;
            let heightLeft = totalImgHeight; let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfPageWidth, totalImgHeight);
            heightLeft -= pdfPageHeight;
            while (heightLeft > 0) { position = heightLeft - totalImgHeight; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, pdfPageWidth, totalImgHeight); heightLeft -= pdfPageHeight; }
            pdf.save("Evaluation_Report.pdf");
            toast.dismiss("rep-pdf"); toast.success("PDF Downloaded");
        } catch (err) { console.error(err); toast.error("Export failed"); toast.dismiss("rep-pdf"); }
    }, 500);
  };

  // --- FIREBASE HOOKS ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"), where("role", "==", "intern"));
    const unsub = onSnapshot(q, snap => {
        const interns = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setAllInterns(interns);
        setMyInterns(interns.filter(i => i.supervisorId === user.uid));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "evaluations");
    let q = user.role === "supervisor" ? query(ref, where("supervisorId", "==", user.uid)) : query(ref, where("status", "in", ["submitted", "completed"]));
    const unsub = onSnapshot(q, snap => {
        const rawEvals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sortedEvals = rawEvals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setEvaluations(sortedEvals);
        const analytics = calculateAnalytics(sortedEvals);
        setPerformanceData(analytics);
        setInternRankings(analytics.internPerformance);
        if (user.role === "intern") {
            const myEvals = sortedEvals.filter(e => e.internId === user.uid);
            setMyBadges(badgeDefinitions.filter(b => b.criteria(myEvals)));
        }
    });
    return () => unsub();
  }, [user]);

  // --- HANDLERS ---
  const addSection = () => setFormTemplate(p => ({ ...p, sections: [...p.sections, { id: `sec_${Date.now()}`, title: "New Section", items: [] }] }));
  const removeSection = (id) => { if(confirm("Remove section?")) setFormTemplate(p => ({ ...p, sections: p.sections.filter(s => s.id !== id) })); };
  const updateSectionTitle = (id, v) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === id ? { ...s, title: v } : s) }));
  const addQuestion = (sid) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: [...s.items, { id: `q_${Date.now()}`, text: "New Question" }] } : s) }));
  const removeQuestion = (sid, qid) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: s.items.filter(i => i.id !== qid) } : s) }));
  const updateQuestionText = (sid, qid, v) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: s.items.map(i => i.id === qid ? { ...i, text: v } : i) } : s) }));
  const addEssay = () => setFormTemplate(p => ({ ...p, essays: [...p.essays, { id: `es_${Date.now()}`, question: "New Essay", placeholder: "..." }] }));
  const removeEssay = (id) => setFormTemplate(p => ({ ...p, essays: p.essays.filter(e => e.id !== id) }));
  const updateEssayText = (id, v) => setFormTemplate(p => ({ ...p, essays: p.essays.map(e => e.id === id ? { ...e, question: v } : e) }));
  
  const loadStandardTemplate = () => {
    if (formTemplate.sections.length > 0 && !confirm("Overwrite current template?")) return;
    setFormTemplate(JSON.parse(JSON.stringify(STANDARD_TEMPLATE)));
    toast.success("Standard template loaded");
  };

  const handleRatingChange = (sectionId, itemId, rating) => {
    if (!isEditMode && editingEvaluation && editingEvaluation.status === 'submitted') return;
    setEvaluationForm(prev => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [itemId]: rating }
    }));
  };

  const handleSaveEvaluation = async (status) => {
    if (!evaluationForm.internId && !isEditMode) return toast.error("Select an intern first");
    if (status === "submitted") {
        if (!evaluationForm.periodCovered || !evaluationForm.supervisorName) return toast.error("Please fill in all header details and signature.");
        if (formTemplate.essays && formTemplate.essays.length > 0) {
            for (const essay of formTemplate.essays) {
                const answer = evaluationForm.essayQuestions?.[essay.id];
                if (!answer || !answer.trim()) return toast.error("Please answer all essay questions.");
            }
        }
        if (!isEditMode) {
            const existingInternEvals = evaluations.filter(e => e.internId === evaluationForm.internId && (e.status === 'submitted' || e.status === 'completed'));
            if (existingInternEvals.length >= 2) return toast.error("This intern already has 2 submitted evaluations.");
            const duplicatePeriod = existingInternEvals.find(e => e.periodCovered?.trim().toLowerCase() === evaluationForm.periodCovered?.trim().toLowerCase());
            if (duplicatePeriod) return toast.error(`A "${evaluationForm.periodCovered}" has already been submitted.`);
        }
        if (formTemplate.sections.length === 0) return toast.error("Template is empty.");
        for (const sec of formTemplate.sections) {
            const data = evaluationForm[sec.id] || {};
            if (sec.items.some(i => !data[i.id])) return toast.error(`Incomplete ratings in ${sec.title}`);
        }
    }
    setEvaluationSubmitting(true);
    try {
      const overallScore = calculateOverallScore(evaluationForm, formTemplate.sections);
      const sectionScores = {};
      formTemplate.sections.forEach(sec => { sectionScores[sec.title] = calculateSectionScore(evaluationForm[sec.id]); });
      const dataToSave = {
        ...evaluationForm, status, overallScore, sectionScores, 
        savedTemplateSnapshot: formTemplate, supervisorId: user.uid, updatedAt: serverTimestamp()
      };
      if (status === "submitted") dataToSave.submittedAt = serverTimestamp();
      if (isEditMode && editingEvaluation) { await updateDoc(doc(db, "evaluations", editingEvaluation.id), dataToSave); } 
      else { dataToSave.createdAt = serverTimestamp(); await addDoc(collection(db, "evaluations"), dataToSave); }
      toast.success(`Evaluation ${status === 'draft' ? 'saved' : 'submitted'}!`);
      setActiveView("dashboard");
      setEvaluationForm({ internId: "", internName: "", periodCovered: "", status: "draft", essayQuestions: {}, supervisorName: user.name, evaluationDate: "" });
      setEditingEvaluation(null); setIsEditMode(false);
    } catch (e) { console.error(e); toast.error("Error saving."); } finally { setEvaluationSubmitting(false); }
  };

  const handleEditEvaluation = (ev) => {
    if (ev.status === "submitted" && user.role !== 'supervisor') return handleViewEvaluation(ev);
    setEvaluationForm({ ...initialFormState, ...ev });
    if (ev.savedTemplateSnapshot) setFormTemplate(ev.savedTemplateSnapshot); 
    setEditingEvaluation(ev); setIsEditMode(true); setActiveView("form");
  };
  
  const handleViewEvaluation = (ev) => {
    setEvaluationForm({ ...initialFormState, ...ev });
    if (ev.savedTemplateSnapshot) setFormTemplate(ev.savedTemplateSnapshot);
    setEditingEvaluation(ev); setIsEditMode(false); setActiveView("form");
  };
  
  const handleViewCertificate = (ev) => {
      const intern = allInterns.find(i => i.uid === ev.internId);
      setViewingCertificate({ evaluation: ev, intern });
  };
  
  const resetForm = () => {
    setEvaluationForm(initialFormState);
    setFormTemplate({ title: "OJT Evaluation", sections: [], essays: [] });
    setEditingEvaluation(null); setIsEditMode(false);
  };
  
  const initialFormState = { internId: "", internName: "", periodCovered: "", periodStartMonth: "", periodEndMonth: "", status: "draft", essayQuestions: {}, supervisorName: user?.name || "", evaluationDate: "" };
  const dashboardEvaluations = user.role === 'intern' ? evaluations.filter(e => e.internId === user.uid) : evaluations;
  
  const dataProps = { evaluations: dashboardEvaluations, allEvaluations: evaluations, myInterns, allInterns, internRankings, myBadges, performanceData, evaluationForm, loading, evaluationSubmitting, editingEvaluation, isEditMode, ratingScale, formTemplate, badgeDefinitions, calculateSectionScore };
  const handlerProps = { 
    setActiveView, handleEditEvaluation, handleViewEvaluation, resetEvaluationForm: resetForm, 
    handleSaveEvaluation, handleRatingChange, handleViewCertificate, handlePrintEvaluation: handleReportPrint, handlePDF: handleReportPDF,             
    handleInternSelection: (uid) => { const i = myInterns.find(k => k.uid === uid); if(i) setEvaluationForm(p => ({...p, internId: uid, internName: (i.firstName ? `${i.firstName} ${i.lastName}` : i.name)})); }, 
    handleFormChange: (f, v) => setEvaluationForm(p => ({...p, [f]: v})), 
    handleEssayAnswerChange: (id, v) => setEvaluationForm(p => ({...p, essayQuestions: {...p.essayQuestions, [id]: v}})), 
    addSection, removeSection, updateSectionTitle, addQuestion, removeQuestion, updateQuestionText, addEssay, removeEssay, updateEssayText, loadStandardTemplate 
  };

  return (
    <>
      <Toaster position="top-right" />
      
      {/* --- CERTIFICATE MODAL (FIXED RESPONSIVENESS) --- */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl shadow-2xl relative w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            
            <button 
                onClick={() => setViewingCertificate(null)} 
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
            >
                <HiOutlineXMark className="w-6 h-6" />
            </button>
            
            {/* Added overflow-auto to prevent clipping on small screens */}
            <div className="bg-gray-200 p-4 md:p-8 overflow-auto flex justify-center items-center h-full">
                 <div id="cert-wrapper" className="scale-75 md:scale-100 origin-center transition-transform"> 
                    <EvaluationCertificate 
                        user={user} 
                        evaluation={viewingCertificate.evaluation} 
                        intern={viewingCertificate.intern} 
                    />
                 </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTAINER (FIXED WIDTH) --- */}
      <div className="w-full max-w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Evaluations & Performance</h1>
                <p className="text-gray-600">Unified view for performance ratings and official rankings.</p>
            </div>
        </div>
        
        {activeView === 'dashboard' && <EvaluationDashboard stats={performanceData} rankings={internRankings} />}
        <TabSection currentTab={activeView} data={dataProps} user={user} handlers={handlerProps} />
      </div>
    </>
  );
};

export default EvaluationTab;