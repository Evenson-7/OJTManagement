// fileName: EvaluationTab.jsx

import React, { useState, useEffect } from "react";
import { 
  collection, query, where, addDoc, updateDoc, doc, deleteDoc,
  serverTimestamp, onSnapshot, orderBy
} from "firebase/firestore";
import { db } from "../../../firebaseConfig"; 
import toast, { Toaster } from "react-hot-toast";
import TabSection from "../../components/TabSection"; 
import EvaluationCertificate from '../../components/EvaluationCertificate'; 
import { EVALUATION_TEMPLATES } from '../../utils//EvalForm'; 

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro'; 

import { HiOutlineXMark } from "react-icons/hi2";
import { FaStar, FaMedal, FaCrown, FaFire, FaGem } from "react-icons/fa";
import { BsGraphUpArrow } from "react-icons/bs";
import { FileText, Award, BarChart2, Send, Plus } from "lucide-react";

const COLORS = { primary: "text-[#42A5FF]", accent: "text-[#0094FF]", navy: "text-[#002B66]", bgLight: "bg-[#BDE4F7]", bgNavy: "bg-[#002B66]" };
const ratingScale = [ { value: "5", label: "Excellent", range: "E", score: 5, calculationValue: 5, color: "green" }, { value: "4", label: "Above Standard", range: "A", score: 4, calculationValue: 4, color: "blue" }, { value: "3", label: "Standard", range: "S", score: 3, calculationValue: 3, color: "yellow" }, { value: "2", label: "Needs Improvement", range: "N", score: 2, calculationValue: 2, color: "orange" }, { value: "1", label: "Poor", range: "P", score: 1, calculationValue: 1, color: "red" } ];

const calculateSectionScore = (sectionData) => { if (!sectionData) return 0; const ratings = Object.values(sectionData).filter(r => r); if (ratings.length === 0) return 0; const total = ratings.reduce((sum, r) => { const match = ratingScale.find(s => String(s.value) === String(r) || String(s.range) === String(r)); return sum + (match?.calculationValue || 0); }, 0); return Number((total / ratings.length).toFixed(2)); };
const calculateOverallScore = (formData, templateSections) => { if (!templateSections || !Array.isArray(templateSections)) return 0; let totalScore = 0; let totalCount = 0; templateSections.forEach((section) => { const sectionRatings = formData[section.id] || {}; Object.values(sectionRatings).forEach((val) => { const match = ratingScale.find(s => String(s.value) === String(val) || String(s.range) === String(val)); if (match) { totalScore += match.calculationValue; totalCount++; } }); }); return totalCount === 0 ? 0 : Number((totalScore / totalCount).toFixed(2)); };

const badgeDefinitions = [ 
    { id: "finisher", name: "Mission Complete", description: "Successfully completed 2 Evaluations.", icon: <FaMedal />, color: "from-gray-600 to-gray-800", criteria: (evals) => evals.length >= 2 },
    { id: "elite_performer", name: "Elite Performer", description: "Achieved a near-perfect overall score of 4.8+", icon: <FaCrown />, color: "from-purple-500 to-indigo-600", criteria: (evals) => evals.some(e => e.overallScore >= 4.8) }, 
    { id: "highly_reliable", name: "Highly Reliable", description: "Scored 4.0 or higher in an evaluation.", icon: <FaFire />, color: "from-orange-400 to-red-500", criteria: (evals) => evals.some(e => e.overallScore >= 4.0) },
    { id: "rising_star", name: "Rising Star", description: "Showed significant score improvement between evaluations.", icon: <FaGem />, color: "from-blue-400 to-cyan-500", criteria: (evals) => evals.length >= 2 && evals[evals.length - 1].overallScore > evals[0].overallScore },
    { id: "exemplary_conduct", name: "Exemplary Conduct", description: "Scored 4.5+ in Work Behavior/Conduct.", icon: <FaStar />, color: "from-emerald-400 to-green-600", criteria: (evals) => evals.some(e => e.sectionScores && Object.entries(e.sectionScores).some(([key, val]) => key.toLowerCase().includes('behavior') || key.toLowerCase().includes('conduct') ? val >= 4.5 : false)) },
    { id: "academic_excellence", name: "Academic Excellence", description: "Scored 4.5+ in Academic/Teaching Competence.", icon: <BsGraphUpArrow />, color: "from-yellow-400 to-amber-500", criteria: (evals) => evals.some(e => e.sectionScores && Object.entries(e.sectionScores).some(([key, val]) => key.toLowerCase().includes('academic') || key.toLowerCase().includes('competence') ? val >= 4.5 : false)) }
];

const analyzeSections = (evalList) => { const sectionAggregates = {}; evalList.forEach(ev => { if (ev.sectionScores) { Object.entries(ev.sectionScores).forEach(([title, score]) => { const cleanTitle = title.trim(); if (!sectionAggregates[cleanTitle]) sectionAggregates[cleanTitle] = { sum: 0, count: 0 }; sectionAggregates[cleanTitle].sum += score; sectionAggregates[cleanTitle].count += 1; }); } }); const sectionAverages = Object.entries(sectionAggregates).map(([title, data]) => ({ section: title, score: Number((data.sum / data.count).toFixed(2)) })); const strengths = [...sectionAverages].filter(s => s.score >= 3.5).sort((a,b) => b.score - a.score).slice(0, 3); const improvementAreas = [...sectionAverages].filter(s => s.score < 4.0).sort((a,b) => a.score - b.score).slice(0, 3); return { strengths, improvementAreas }; };

const calculateAnalytics = (allEvaluations, allInternsList) => { 
  const submitted = allEvaluations.filter(e => e.status === "submitted" || e.status === "completed"); 
  const internMap = {}; 
  const globalSections = {}; 

  allInternsList.forEach(i => {
      internMap[i.uid] = {
         name: i.name || `${i.firstName} ${i.lastName}`,
         id: i.uid,
         internshipStatus: i.internshipStatus || "Active",
         officialFinalGrade: i.officialFinalGrade || null,
         evaluations: []
      };
  });

  submitted.forEach(ev => { 
    if (internMap[ev.internId]) {
        internMap[ev.internId].evaluations.push(ev); 
        if (ev.sectionScores) {
            Object.entries(ev.sectionScores).forEach(([title, score]) => {
                const cleanTitle = title.trim();
                if (!globalSections[cleanTitle]) { globalSections[cleanTitle] = { sum: 0, count: 0, internScores: {} }; }
                globalSections[cleanTitle].sum += score;
                globalSections[cleanTitle].count += 1;
                if (!globalSections[cleanTitle].internScores[ev.internId]) { globalSections[cleanTitle].internScores[ev.internId] = { name: internMap[ev.internId].name, sum: 0, count: 0 }; }
                globalSections[cleanTitle].internScores[ev.internId].sum += score;
                globalSections[cleanTitle].internScores[ev.internId].count += 1;
            });
        }
    }
  }); 
  
  const internPerformance = Object.values(internMap).map(i => { 
    const iEvals = i.evaluations.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)); 
    const isComplete = iEvals.length >= 3; 
    const totalScore = iEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0); 
    const finalAverage = iEvals.length > 0 ? Number((totalScore / iEvals.length).toFixed(2)) : 0; 
    const { strengths: indStrengths, improvementAreas: indWeaknesses } = analyzeSections(iEvals); 
    
    return { 
      internId: i.id, 
      internName: i.name, 
      internshipStatus: i.internshipStatus, 
      officialFinalGrade: i.officialFinalGrade,
      averageScore: finalAverage, 
      isComplete: isComplete, 
      evaluationsCompleted: iEvals.length, 
      history: iEvals.map(e => ({ date: e.evaluationType, score: e.overallScore })), 
      badgesEarned: badgeDefinitions.filter(b => b.criteria(i.evaluations)), 
      strengths: indStrengths, 
      improvementAreas: indWeaknesses 
    }; 
  }).filter(i => i.evaluationsCompleted > 0).sort((a,b) => b.averageScore - a.averageScore); 
  
  const globalSectionStats = Object.entries(globalSections).map(([title, data]) => {
      const avgScore = Number((data.sum / data.count).toFixed(2));
      const internAverages = Object.values(data.internScores).map(ind => ({ name: ind.name, score: Number((ind.sum / ind.count).toFixed(2)) }));
      const excelling = internAverages.filter(i => i.score >= 4.5).sort((a,b) => b.score - a.score);
      const struggling = internAverages.filter(i => i.score <= 3.5).sort((a,b) => a.score - b.score);
      return { section: title, averageScore: avgScore, excelling, struggling };
  });

  const activeInterns = internPerformance.filter(i => i.evaluationsCompleted > 0);
  const globalAvg = activeInterns.length > 0 ? activeInterns.reduce((sum, i) => sum + i.averageScore, 0) / activeInterns.length : 0; 
  
  return { 
      performanceInsights: { totalEvaluations: submitted.length, averageScore: Number(globalAvg.toFixed(2)), completedInterns: internPerformance.filter(i => i.isComplete).length }, 
      internPerformance,
      globalSectionStats
  }; 
};

const EvaluationDashboard = ({ stats, rankings, user }) => {
  const { averageScore } = stats.performanceInsights || { averageScore: 0 };
  const topPerformerData = rankings && rankings.length > 0 ? rankings[0] : null;
  
  // FIX: Intern sees their specific form count instead of the whole department's count
  const myData = user.role === 'intern' ? rankings?.find(i => i.internId === user.uid) : null;
  const displayTotal = user.role === 'intern' ? (myData?.evaluationsCompleted || 0) : (stats.performanceInsights?.totalEvaluations || 0);

let topPerformerName = "Pending";
  if (topPerformerData) {
      const firstName = topPerformerData.internName.split(" ")[0];
      if (user.role === 'intern' && topPerformerData.internId === user.uid) {
          topPerformerName = "You!";
      } else {
          topPerformerName = firstName;
      }
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">{user.role === 'intern' ? 'My Total Evaluations' : 'Total Evaluations'}</p><h3 className={`text-3xl font-bold ${COLORS.navy}`}>{displayTotal}</h3></div><div className={`w-12 h-12 ${COLORS.bgLight} rounded-full flex items-center justify-center ${COLORS.navy}`}><FileText size={24} /></div></div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">{user.role === 'intern' ? 'Department Avg' : 'Class Average'}</p><h3 className={`text-3xl font-bold ${COLORS.navy}`}>{averageScore > 0 ? averageScore : "N/A"}</h3></div><div className={`w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center ${COLORS.accent}`}><BarChart2 size={24} /></div></div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Top Performer</p>
              <h3 className={`text-xl font-bold ${COLORS.navy} truncate`}>{topPerformerName}</h3>
              <p className={`text-xs ${COLORS.accent} font-medium mt-1`}>{topPerformerData ? `Score: ${topPerformerData.averageScore}` : "Evaluating..."}</p>
          </div>
          <div className={`w-12 h-12 ${COLORS.bgNavy} rounded-full flex items-center justify-center text-white`}><Award size={24} /></div>
      </div>
    </div>
  );
};

const EvaluationTab = ({ user }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [myInterns, setMyInterns] = useState([]);
  const [allInterns, setAllInterns] = useState([]); 
  const [supervisors, setSupervisors] = useState([]); 
  const [allEvaluations, setAllEvaluations] = useState([]); 
  const [myEvaluations, setMyEvaluations] = useState([]);

  const [customTemplates, setCustomTemplates] = useState([]);
  const combinedTemplates = [...EVALUATION_TEMPLATES, ...customTemplates];

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({ internId: "", supervisorId: "", evaluationType: "Regular", templateId: EVALUATION_TEMPLATES[0].id });
  const [sending, setSending] = useState(false);

  const [formTemplate, setFormTemplate] = useState(EVALUATION_TEMPLATES[0]);
  const initialFormState = { internId: "", internName: "", evaluationType: "", status: "draft", essayQuestions: {}, supervisorName: user?.name || "", evaluationDate: "" };
  const [evaluationForm, setEvaluationForm] = useState(initialFormState);
  
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  const [performanceData, setPerformanceData] = useState({});
  const [internRankings, setInternRankings] = useState([]); 
  const [myBadges, setMyBadges] = useState([]);

  useEffect(() => {
    if (!user) return;
    const qInterns = query(collection(db, "users"), where("role", "==", "intern"));
    const unsubInterns = onSnapshot(qInterns, snap => {
        const interns = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        if (user.role === 'coordinator' && user.departmentId) {
            const deptInterns = interns.filter(i => i.departmentId === user.departmentId);
            setAllInterns(deptInterns); setMyInterns(deptInterns); 
        } else if (user.role === 'supervisor') {
            const supInterns = interns.filter(i => i.supervisorId === user.uid);
            setAllInterns(supInterns); setMyInterns(supInterns); 
        } else if (user.role === 'intern' && user.departmentId) {
            const deptInterns = interns.filter(i => i.departmentId === user.departmentId);
            setAllInterns(deptInterns); setMyInterns([interns.find(i => i.uid === user.uid)]); 
        } else { 
            setAllInterns(interns); setMyInterns(interns); 
        }
    });

    const qSups = query(collection(db, "users"), where("role", "==", "supervisor"));
    const unsubSups = onSnapshot(qSups, snap => { setSupervisors(snap.docs.map(d => ({ uid: d.id, ...d.data() }))); });

    if (user.role === 'coordinator' && user.departmentId) {
        const qTemplates = query(collection(db, "evaluation_templates"), where("departmentId", "==", user.departmentId));
        const unsubTemplates = onSnapshot(qTemplates, snap => {
            setCustomTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubInterns(); unsubSups(); unsubTemplates(); };
    }

    return () => { unsubInterns(); unsubSups(); };
  }, [user]);

// --- FIXED: SEPARATE GLOBAL DATA (ANALYTICS) FROM UI DATA (LISTS) ---
  useEffect(() => {
    if (!user || allInterns.length === 0) return;
    const ref = collection(db, "evaluations");
    
    // --- THE FIX IS HERE ---
    let qEvals;
    if (user.role === "supervisor") {
        // Supervisors MUST strictly query only their own data to pass Firebase Security Rules
        qEvals = query(ref, where("supervisorId", "==", user.uid));
    } else {
        // Coordinators and Interns use the global query
        qEvals = query(ref); 
    }
      
    const unsubEvals = onSnapshot(qEvals, snap => {
        const rawEvals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // 1. Establish the Cohort (for Analytics & Leaderboard)
        const cohortInternIds = allInterns.map(i => i.uid);
        const cohortEvals = rawEvals.filter(ev => cohortInternIds.includes(ev.internId));
        const sortedCohortEvals = cohortEvals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAllEvaluations(sortedCohortEvals); 

        // 2. Filter specifically for the UI List (Inbox / My Reviews)
        let relevantEvalsForList = sortedCohortEvals;
        if (user.role === "supervisor") {
            // Supervisors only see their action items in the list
            relevantEvalsForList = rawEvals.filter(ev => ev.supervisorId === user.uid)
                                          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        } else if (user.role === "intern") {
            // Interns ONLY see their own evaluations in the list
            relevantEvalsForList = rawEvals.filter(ev => ev.internId === user.uid && ["submitted", "completed"].includes(ev.status))
                                          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }
        setMyEvaluations(relevantEvalsForList);
        
        // 3. Compute Global Analytics based on Cohort data
        const analytics = calculateAnalytics(sortedCohortEvals, allInterns);
        setPerformanceData(analytics);
        setInternRankings(analytics.internPerformance);

        if (user.role === 'intern') {
            const myStats = analytics.internPerformance.find(i => i.internId === user.uid);
            if (myStats && myStats.badgesEarned) {
                setMyBadges(myStats.badgesEarned);
            }
        }
    });
    return () => unsubEvals();
  }, [user, allInterns]);

  const handleChangeInternStatus = async (internId, newStatus) => {
    try {
      const internRef = doc(db, "users", internId);
      await updateDoc(internRef, { internshipStatus: newStatus, statusUpdatedAt: serverTimestamp(), statusUpdatedBy: user.uid });
      toast.success(`Intern status updated to: ${newStatus}`);
    } catch (e) { console.error(e); toast.error("Failed to update status."); }
  };

  const handleComputeOfficialGrade = async (internId, officialGrade) => {
    try {
      const internRef = doc(db, "users", internId);
      await updateDoc(internRef, { officialFinalGrade: officialGrade, gradeComputedAt: serverTimestamp(), gradeComputedBy: user.uid });
      toast.success(`Official Average recorded: ${officialGrade}`);
    } catch (e) { console.error(e); toast.error("Failed to save official grade."); }
  };

  const handleSaveCustomTemplate = async () => {
    if (!formTemplate.title || !formTemplate.title.trim()) return toast.error("Please provide a template title.");
    if (formTemplate.sections.length === 0) return toast.error("Add at least one grading section.");
    try {
      if (formTemplate.id) {
        const templateRef = doc(db, "evaluation_templates", formTemplate.id);
        await updateDoc(templateRef, { title: formTemplate.title, sections: formTemplate.sections, essays: formTemplate.essays, updatedAt: serverTimestamp() });
        toast.success("Template updated successfully!");
      } else {
        await addDoc(collection(db, "evaluation_templates"), { title: formTemplate.title, sections: formTemplate.sections, essays: formTemplate.essays, createdBy: user.uid, departmentId: user.departmentId, createdAt: serverTimestamp() });
        toast.success("Custom template created successfully!");
      }
      setActiveView("dashboard");
    } catch (e) { console.error(e); toast.error("Failed to save template to database."); }
  };

  const handleOpenBuilder = () => { setFormTemplate({ title: "New Custom Template", sections: [], essays: [] }); setActiveView('template_builder'); };
  const handleEditTemplate = (template) => { setFormTemplate(template); setActiveView('template_builder'); };
  const handleDeleteTemplate = async (templateId) => {
      if (!window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) return;
      try { await deleteDoc(doc(db, "evaluation_templates", templateId)); toast.success("Template deleted successfully."); } catch (error) { console.error(error); toast.error("Failed to delete template."); }
  };

  const handleSendEvaluation = async (e) => {
    e.preventDefault();
    if (!sendForm.internId || !sendForm.supervisorId) return toast.error("Select both intern and supervisor.");
    setSending(true);
    try {
      if (sendForm.evaluationType !== "Regular") {
          const existing = allEvaluations.find(ev => ev.internId === sendForm.internId && ev.evaluationType === sendForm.evaluationType);
          if (existing) { setSending(false); return toast.error(`A ${sendForm.evaluationType} form has already been sent for this intern.`); }
      }
      const selectedIntern = myInterns.find(i => i.uid === sendForm.internId);
      const selectedTemplate = combinedTemplates.find(t => t.id === sendForm.templateId);
      await addDoc(collection(db, "evaluations"), { internId: sendForm.internId, internName: selectedIntern.name || `${selectedIntern.firstName} ${selectedIntern.lastName}`, supervisorId: sendForm.supervisorId, evaluationType: sendForm.evaluationType, status: "pending_supervisor", sentBy: user.uid, savedTemplateSnapshot: selectedTemplate, createdAt: serverTimestamp() });
      toast.success(`${sendForm.evaluationType} sent successfully!`);
      setShowSendModal(false);
      setSendForm({ internId: "", supervisorId: "", evaluationType: "Regular", templateId: EVALUATION_TEMPLATES[0].id });
    } catch (err) { console.error(err); toast.error("Failed to send form."); } finally { setSending(false); }
  };

  const handleSaveEvaluation = async (status) => {
    if (!editingEvaluation || !editingEvaluation.id) return toast.error("Error: Cannot submit. No valid task selected.");
    if (status === "submitted") {
        if (!evaluationForm.supervisorName) return toast.error("Please sign the evaluation.");
        if (formTemplate.essays && formTemplate.essays.length > 0) {
            for (const essay of formTemplate.essays) {
                const answer = evaluationForm.essayQuestions?.[essay.id];
                if (!answer || !answer.trim()) return toast.error("Please answer all essay questions.");
            }
        }
        for (const sec of formTemplate.sections) {
            const data = evaluationForm[sec.id] || {};
            if (sec.items.some(i => !data[i.id])) return toast.error(`Incomplete ratings in ${sec.title}`);
        }
    }
    try {
      const overallScore = calculateOverallScore(evaluationForm, formTemplate.sections);
      const sectionScores = {};
      formTemplate.sections.forEach(sec => { sectionScores[sec.title] = calculateSectionScore(evaluationForm[sec.id]); });
      const dataToSave = { ...evaluationForm, status, overallScore, sectionScores, updatedAt: serverTimestamp() };
      if (status === "submitted") dataToSave.submittedAt = serverTimestamp();
      await updateDoc(doc(db, "evaluations", editingEvaluation.id), dataToSave); 
      toast.success(`Evaluation ${status === 'draft' ? 'saved' : 'submitted'}!`);
      setActiveView("dashboard"); setEvaluationForm(initialFormState); setEditingEvaluation(null); setIsEditMode(false);
    } catch (e) { console.error(e); toast.error("Error saving."); }
  };

  const PERFECT_PRINT_CSS = `
      @page { 
          size: A4 portrait; 
          margin: 30 !important; 
      }
      body { 
          margin: 0 !important; 
          padding: 15mm !important; 
          background-color: white !important; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          font-family: sans-serif; 
      }
      #printable-evaluation-content { 
          width: 100% !important; 
          max-width: 100% !important; 
          margin: 0 auto !important; 
          box-sizing: border-box !important;
          box-shadow: none !important; 
          border: none !important; 
          padding: 0 !important; 
      }
      .pdf-block { 
          page-break-inside: avoid !important; 
          break-inside: avoid !important; 
      }
      .no-print { display: none !important; }
  `;

  const handlePrintEvaluation = (reportId) => {
      const input = document.getElementById(reportId);
      if (!input) return toast.error("Report content not found.");
      const printWindow = window.open('', '', 'width=900,height=1000');
      if (!printWindow) return toast.error("Pop-up blocked. Please allow pop-ups.");
      printWindow.document.write(`<html><head><title>Evaluation Form</title><script src="https://cdn.tailwindcss.com"></script><style>${PERFECT_PRINT_CSS}</style></head><body>${input.outerHTML}<script>setTimeout(() => { window.focus(); window.print(); window.close(); }, 1000); </script></body></html>`);
      printWindow.document.close();
  };

  const handlePDF = async (reportId) => {
      const input = document.getElementById(reportId);
      if (!input) return toast.error("Report content not found.");
      
      toast.loading("Compiling Center-Fit A4 PDF...", { id: "pdf-form-toast" });
      
      try {
          const renderWidthPx = 794; 
          const clone = input.cloneNode(true);
          
          clone.style.width = `${renderWidthPx}px`;
          clone.style.maxWidth = `${renderWidthPx}px`;
          clone.style.boxShadow = "none";
          clone.style.background = "white";
          clone.style.margin = "0 auto";
          clone.style.padding = "30px 40px"; 
          clone.style.boxSizing = "border-box";

          const textAreas = clone.querySelectorAll('textarea');
          textAreas.forEach(ta => {
              const div = document.createElement('div');
              div.style.whiteSpace = 'pre-wrap';
              div.style.border = '1px solid #e5e7eb';
              div.style.padding = '12px';
              div.style.borderRadius = '6px';
              div.style.fontSize = '14px';
              div.style.minHeight = '80px';
              div.style.background = '#f9fafb';
              div.style.wordWrap = 'break-word';
              div.textContent = ta.value || "No response provided.";
              ta.parentNode.replaceChild(div, ta);
          });

          const styleEl = document.createElement('style');
          styleEl.innerHTML = PERFECT_PRINT_CSS;
          clone.appendChild(styleEl);
          
          const wrapper = document.createElement('div');
          wrapper.style.position = 'absolute'; 
          wrapper.style.top = '-10000px'; 
          wrapper.style.left = '-10000px';
          wrapper.appendChild(clone);
          document.body.appendChild(wrapper);
          
          await new Promise(resolve => setTimeout(resolve, 600));

          const pdf = new jsPDF('p', 'mm', 'a4'); 
          const pdfWidth = 210; 
          const pdfHeight = 297; 
          const marginX = 20; 
          const marginTop = 20; 
          const marginBot = 20;
          const contentWidth = pdfWidth - (marginX * 2);
          const maxPageHeight = pdfHeight - marginTop - marginBot;
          
          let currentY = marginTop;

          const blocks = clone.querySelectorAll('.pdf-block');
          for (let i = 0; i < blocks.length; i++) {
              const block = blocks[i];
              const canvas = await html2canvas(block, { 
                  scale: 2, 
                  useCORS: true, 
                  logging: false, 
                  windowWidth: renderWidthPx, 
                  backgroundColor: "#ffffff" 
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgProps = pdf.getImageProperties(imgData);
              const blockPdfHeight = (imgProps.height * contentWidth) / imgProps.width;

              if (currentY + blockPdfHeight > pdfHeight - marginBot) { 
                  if (blockPdfHeight > maxPageHeight) {
                      if (currentY !== marginTop) {
                          pdf.addPage();
                          currentY = marginTop;
                      }
                      
                      let heightLeft = blockPdfHeight;
                      let position = 0;
                      
                      while (heightLeft > 0) {
                          pdf.addImage(imgData, 'PNG', marginX, marginTop + position, contentWidth, blockPdfHeight);
                          
                          if (heightLeft > maxPageHeight) {
                              pdf.addPage();
                              position -= maxPageHeight;
                              heightLeft -= maxPageHeight;
                          } else {
                              currentY = marginTop + heightLeft + 8; 
                              heightLeft = 0; 
                          }
                      }
                  } else {
                      pdf.addPage(); 
                      currentY = marginTop; 
                      pdf.addImage(imgData, 'PNG', marginX, currentY, contentWidth, blockPdfHeight);
                      currentY += blockPdfHeight + 8; 
                  }
              } else {
                  pdf.addImage(imgData, 'PNG', marginX, currentY, contentWidth, blockPdfHeight);
                  currentY += blockPdfHeight + 8;
              }
          }
          
          document.body.removeChild(wrapper); 
          const fileName = `Evaluation_${evaluationForm.internName.replace(/\s+/g, '_')}_${evaluationForm.evaluationType}.pdf`;
          pdf.save(fileName);
          toast.dismiss("pdf-form-toast"); 
          toast.success("Center-Fit A4 PDF Downloaded!");

      } catch (err) { 
          console.error("PDF Error:", err); 
          toast.dismiss("pdf-form-toast"); 
          toast.error("Failed to generate PDF."); 
      }
  };

  const addSection = () => setFormTemplate(p => ({ ...p, sections: [...p.sections, { id: `sec_${Date.now()}`, title: "New Section", items: [] }] }));
  const removeSection = (id) => { if(confirm("Remove section?")) setFormTemplate(p => ({ ...p, sections: p.sections.filter(s => s.id !== id) })); };
  const updateSectionTitle = (id, v) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === id ? { ...s, title: v } : s) }));
  const addQuestion = (sid) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: [...s.items, { id: `q_${Date.now()}`, text: "New Question" }] } : s) }));
  const removeQuestion = (sid, qid) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: s.items.filter(i => i.id !== qid) } : s) }));
  const updateQuestionText = (sid, qid, v) => setFormTemplate(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: s.items.map(i => i.id === qid ? { ...i, text: v } : i) } : s) }));
  const addEssay = () => setFormTemplate(p => ({ ...p, essays: [...p.essays, { id: `es_${Date.now()}`, question: "New Essay", placeholder: "..." }] }));
  const removeEssay = (id) => setFormTemplate(p => ({ ...p, essays: p.essays.filter(e => e.id !== id) }));
  const updateEssayText = (id, v) => setFormTemplate(p => ({ ...p, essays: p.essays.map(e => e.id === id ? { ...e, question: v } : e) }));

  const handleRatingChange = (sectionId, itemId, rating) => {
    if (!isEditMode && editingEvaluation && editingEvaluation.status === 'submitted') return;
    setEvaluationForm(prev => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), [itemId]: rating } }));
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

  const handleViewCertificate = (ev) => { const intern = allInterns.find(i => i.uid === ev.internId); setViewingCertificate({ evaluation: ev, intern }); };
  const resetForm = () => { setEvaluationForm(initialFormState); setEditingEvaluation(null); setIsEditMode(false); };
  
  const dataProps = { supervisors, customTemplates, evaluations: myEvaluations, allEvaluations, myInterns, allInterns, internRankings, myBadges, performanceData, evaluationForm, editingEvaluation, isEditMode, ratingScale, formTemplate, badgeDefinitions, calculateSectionScore };
  const handlerProps = { setActiveView, handleChangeInternStatus, handleComputeOfficialGrade, handleEditEvaluation, handleViewEvaluation, resetEvaluationForm: resetForm, handleSaveEvaluation, handleRatingChange, handleViewCertificate, handlePrintEvaluation, handlePDF, handleFormChange: (f, v) => setEvaluationForm(p => ({...p, [f]: v})), handleEssayAnswerChange: (id, v) => setEvaluationForm(p => ({...p, essayQuestions: {...p.essayQuestions, [id]: v}})), addSection, removeSection, updateSectionTitle, addQuestion, removeQuestion, updateQuestionText, addEssay, removeEssay, updateEssayText, updateTemplateTitle: (v) => setFormTemplate(p => ({...p, title: v})), handleSaveCustomTemplate, handleEditTemplate, handleDeleteTemplate };

  return (
    <>
      <Toaster position="top-right" />
      {showSendModal && user.role === 'coordinator' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 text-[#0094FF] rounded-lg"><Send size={20} /></div>
                 <h3 className="text-xl font-bold text-[#002B66]">Send Evaluation Form</h3>
              </div>
              <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-md"><HiOutlineXMark className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSendEvaluation} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">1. Select Intern</label>
                <select required value={sendForm.internId} onChange={(e) => { const selectedInternId = e.target.value; const internObj = myInterns.find(i => i.uid === selectedInternId); setSendForm({ ...sendForm, internId: selectedInternId, supervisorId: internObj?.supervisorId || "" }); }} className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF] focus:border-transparent transition-all bg-gray-50 hover:bg-white cursor-pointer">
                  <option value="">-- Choose Intern --</option>
                  {myInterns.map(i => (<option key={i.uid} value={i.uid}>{i.name || `${i.firstName} ${i.lastName}`}</option>))}
                </select>
              </div>
              <div className="space-y-1.5 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="flex justify-between items-end mb-1"><label className="block text-sm font-bold text-gray-700">2. Assign Supervisor</label>{sendForm.internId && sendForm.supervisorId && myInterns.find(i => i.uid === sendForm.internId)?.supervisorId === sendForm.supervisorId && (<span className="text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Auto-Selected</span>)}</div>
                <select required value={sendForm.supervisorId} onChange={(e) => setSendForm({...sendForm, supervisorId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0094FF] bg-white cursor-pointer">
                  <option value="">-- Choose Supervisor --</option>
                  {supervisors.map(s => (<option key={s.uid} value={s.uid}>{s.name || `${s.firstName} ${s.lastName}`} ({s.companyName || 'N/A'})</option>))}
                </select>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{myInterns.find(i => i.uid === sendForm.internId)?.supervisorId === sendForm.supervisorId ? "This is the intern's currently assigned supervisor." : "Select the supervisor who will evaluate this intern."}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5"><label className="block text-sm font-bold text-gray-700">Evaluation Phase</label><select required value={sendForm.evaluationType} onChange={(e) => setSendForm({...sendForm, evaluationType: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0094FF] bg-gray-50 hover:bg-white cursor-pointer"><option value="Regular">Regular Evaluation</option><option value="Midterm">Midterm Evaluation</option><option value="Final">Final Evaluation</option></select></div>
                <div className="space-y-1.5"><label className="block text-sm font-bold text-gray-700">Template</label><select required value={sendForm.templateId} onChange={(e) => setSendForm({...sendForm, templateId: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0094FF] bg-gray-50 hover:bg-white cursor-pointer">{combinedTemplates.map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}</select></div>
              </div>
              <div className="pt-4"><button type="submit" disabled={sending} className="w-full py-3.5 bg-[#0094FF] text-white rounded-xl font-bold shadow-md shadow-blue-200 flex justify-center items-center disabled:opacity-50 hover:bg-[#002B66] hover:shadow-lg transition-all active:scale-[0.98]">{sending ? 'Sending...' : <><Send className="w-5 h-5 mr-2" /> Dispatch Form</>}</button></div>
            </form>
          </div>
        </div>
      )}

      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl relative w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"><button onClick={() => setViewingCertificate(null)} className="absolute top-4 right-4 z-50 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><HiOutlineXMark className="w-6 h-6" /></button><div className="bg-gray-200 p-4 overflow-auto flex justify-center items-center h-full"><div id="cert-wrapper" className="scale-75 md:scale-100 origin-center transition-transform"><EvaluationCertificate user={user} evaluation={viewingCertificate.evaluation} intern={viewingCertificate.intern} /></div></div></div>
        </div>
      )}

      <div className="w-full max-w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
            <div><h1 className="text-2xl md:text-3xl font-bold text-gray-900">Evaluations & Performance</h1><p className="text-gray-600">{user.role === 'coordinator' ? "Send forms and manage evaluation templates." : "Check your pending action items and submit grades."}</p></div>
            {user.role === 'coordinator' && activeView === 'dashboard' && (
              <div className="flex gap-2">
                  <button onClick={handleOpenBuilder} className="flex items-center gap-2 bg-white text-[#0094FF] border border-[#0094FF] px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all hover:bg-blue-50 active:scale-95"><Plus className="w-5 h-5" /><span>Create Template</span></button>
                  <button onClick={() => setShowSendModal(true)} className="flex items-center gap-2 bg-[#0094FF] text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95 hover:bg-[#002B66]"><Send className="w-5 h-5" /><span>Send Form</span></button>
              </div>
            )}
        </div>
        
        {activeView === 'dashboard' && <EvaluationDashboard stats={performanceData} rankings={internRankings} user={user} />}
        
        <TabSection currentTab={activeView} data={dataProps} user={user} handlers={handlerProps} />
      </div>
    </>
  );
};

export default EvaluationTab;