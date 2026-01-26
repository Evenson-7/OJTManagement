// fileName: EvaluationTab.jsx

import React, { useState, useEffect } from "react";
import { 
  collection, query, where, addDoc, updateDoc, doc, 
  serverTimestamp, onSnapshot 
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import toast, { Toaster } from "react-hot-toast";
import TabSection from "../../components/TabSection";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro'; 
import EvaluationCertificate from '../../components/EvaluationCertificate'; 
import { HiOutlineXMark, HiOutlineArrowDownTray } from "react-icons/hi2";
import { 
  FaStar, FaTrophy, FaMedal, FaCrown, FaFire, FaGem 
} from "react-icons/fa";
import { BsGraphUpArrow, BsActivity } from "react-icons/bs";
import { HiCheckCircle, HiExclamationTriangle } from "react-icons/hi2";

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

// --- BADGE DEFINITIONS ---
const badgeDefinitions = [
    { 
      id: "elite_performer", name: "Elite Performer", description: "Achieved a near-perfect score of 4.8+", 
      icon: <FaCrown />, color: "from-purple-500 to-indigo-600", 
      criteria: (evals) => evals.some(e => e.overallScore >= 4.8) 
    },
    { 
      id: "gold_standard", name: "Gold Standard", description: "Maintained an average above 4.5", 
      icon: <FaGem />, color: "from-yellow-400 to-amber-500", 
      criteria: (evals) => {
          if (evals.length === 0) return false;
          const avg = evals.reduce((a,b) => a + (b.overallScore || 0), 0) / evals.length;
          return avg >= 4.5;
      }
    },
    { 
      id: "section_master", name: "Section Master", description: "Scored a perfect 5.0 in any section", 
      icon: <FaStar />, color: "from-blue-400 to-cyan-500", 
      criteria: (evals) => evals.some(ev => ev.sectionScores && Object.values(ev.sectionScores).some(score => score === 5.0))
    },
    { 
      id: "rapid_growth", name: "Rapid Growth", description: "Improved overall score by 0.5+ points", 
      icon: <BsGraphUpArrow />, color: "from-green-400 to-emerald-600", 
      criteria: (evals) => {
        if (evals.length < 2) return false;
        const sorted = [...evals].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        return (sorted[sorted.length - 1].overallScore - sorted[0].overallScore) >= 0.5;
      }
    },
    { 
      id: "momentum", name: "Momentum", description: "Received 3 consecutive evaluations", 
      icon: <FaFire />, color: "from-orange-500 to-red-500", 
      criteria: (evals) => evals.length >= 3
    },
    { 
      id: "finisher", name: "Mission Complete", description: "Completed the Final Evaluation", 
      icon: <FaMedal />, color: "from-gray-600 to-gray-800", 
      criteria: (evals) => evals.some(e => e.periodCovered === "Final Evaluation")
    }
];

// --- ANALYTICS ENGINE ---
const calculateAnalytics = (allEvaluations) => {
    const submitted = allEvaluations.filter(e => e.status === "submitted" || e.status === "completed");
    
    // Sort chronologically in JS
    const sortedEvaluations = [...submitted].sort((a, b) => 
        (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
    );

    const scoresOnly = sortedEvaluations.map(e => e.overallScore || 0);
    const avgOverall = scoresOnly.length > 0 ? scoresOnly.reduce((a,b) => a+b, 0) / scoresOnly.length : 0;
    const latestScore = scoresOnly.length > 0 ? scoresOnly[scoresOnly.length - 1] : 0;
    
    // Strengths & Weaknesses
    const sectionAggregates = {};
    submitted.forEach(ev => {
        if (ev.sectionScores) {
            Object.entries(ev.sectionScores).forEach(([title, score]) => {
                const cleanTitle = title.trim();
                if (!sectionAggregates[cleanTitle]) sectionAggregates[cleanTitle] = { sum: 0, count: 0 };
                sectionAggregates[cleanTitle].sum += score;
                sectionAggregates[cleanTitle].count += 1;
            });
        }
    });

    const sectionAverages = Object.entries(sectionAggregates).map(([title, data]) => ({
        section: title,
        score: Number((data.sum / data.count).toFixed(2))
    }));

    const strengths = [...sectionAverages].filter(s => s.score >= 4.0).sort((a,b) => b.score - a.score).slice(0, 3);
    const improvementAreas = [...sectionAverages].filter(s => s.score < 4.0).sort((a,b) => a.score - b.score).slice(0, 3);

    // Intern Rankings
    const internMap = {};
    submitted.forEach(ev => {
        if (!internMap[ev.internId]) internMap[ev.internId] = { name: ev.internName, id: ev.internId, evaluations: [] };
        internMap[ev.internId].evaluations.push(ev);
    });

    const internPerformance = Object.values(internMap).map(i => {
        const iEvals = i.evaluations.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        const iScores = iEvals.map(e => e.overallScore);
        const iAvg = iScores.reduce((a,b) => a+b, 0) / iScores.length;
        const trendVal = iScores.length > 1 ? iScores[iScores.length-1] - iScores[0] : 0;
        let trend = 'Stable';
        if (trendVal > 0.1) trend = 'Improving';
        if (trendVal < -0.1) trend = 'Declining';

        return {
            internId: i.id,
            internName: i.name,
            averageScore: Number(iAvg.toFixed(2)),
            totalEvaluations: i.evaluations.length,
            latestScore: iScores[iScores.length-1],
            trend,
            trendValue: trendVal,
            history: iEvals.map(e => ({ date: e.periodCovered, score: e.overallScore })),
            badgesEarned: badgeDefinitions.filter(b => b.criteria(i.evaluations)),
            strengths: strengths,
            improvementAreas: improvementAreas
        };
    }).sort((a,b) => b.averageScore - a.averageScore); 

    return {
        performanceInsights: {
            totalEvaluations: submitted.length,
            averageScore: Number(avgOverall.toFixed(2)),
            latestScore: Number(latestScore.toFixed(2)),
            topPerformers: internPerformance.filter(i => i.averageScore >= 4.5).length
        },
        internPerformance,
        strengths,
        improvementAreas
    };
};

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
      formTemplate.sections.forEach(sec => {
          sectionScores[sec.title] = calculateSectionScore(evaluationForm[sec.id]);
      });

      const dataToSave = {
        ...evaluationForm,
        status,
        overallScore,
        sectionScores, 
        savedTemplateSnapshot: formTemplate,
        supervisorId: user.uid,
        updatedAt: serverTimestamp()
      };

      if (status === "submitted") dataToSave.submittedAt = serverTimestamp();

      if (isEditMode && editingEvaluation) {
        await updateDoc(doc(db, "evaluations", editingEvaluation.id), dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, "evaluations"), dataToSave);
      }

      toast.success(`Evaluation ${status === 'draft' ? 'saved' : 'submitted'}!`);
      setActiveView("dashboard");
      setEvaluationForm({ internId: "", internName: "", periodCovered: "", status: "draft", essayQuestions: {}, supervisorName: user.name, evaluationDate: "" });
      setEditingEvaluation(null);
      setIsEditMode(false);
    } catch (e) {
      console.error(e);
      toast.error("Error saving.");
    } finally {
      setEvaluationSubmitting(false);
    }
  };

  const handlePDF = (elementId, filename) => {
    setTimeout(() => {
        const input = document.getElementById(elementId);
        if (!input) return toast.error("Report element not found");
        toast.loading("Generating PDF...", { id: "pdf-toast" });
        html2canvas(input, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${filename}.pdf`);
            toast.dismiss("pdf-toast");
            toast.success("Downloaded!");
        });
    }, 500);
  };

  // --- DATA LOADING ---
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
    
    let q;
    if (user.role === "supervisor") {
        q = query(ref, where("supervisorId", "==", user.uid));
    } else {
        q = query(ref, where("status", "in", ["submitted", "completed"]));
    }

    const unsub = onSnapshot(q, snap => {
        const rawEvals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // IMPORTANT: Sort in Javascript to fix "Missing Index" and "Not Showing Recent" issues
        // Sort Descending (Newest First)
        const sortedEvals = rawEvals.sort((a, b) => {
           const dateA = a.createdAt?.seconds || 0;
           const dateB = b.createdAt?.seconds || 0;
           return dateB - dateA; 
        });

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

  // View Controllers
  const handleEditEvaluation = (ev) => {
    if (ev.status === "submitted" && user.role !== 'supervisor') return handleViewEvaluation(ev);
    setEvaluationForm({ ...initialFormState, ...ev });
    if (ev.savedTemplateSnapshot) setFormTemplate(ev.savedTemplateSnapshot); 
    setEditingEvaluation(ev);
    setIsEditMode(true);
    setActiveView("form");
  };

  const handleViewEvaluation = (ev) => {
    setEvaluationForm({ ...initialFormState, ...ev });
    if (ev.savedTemplateSnapshot) setFormTemplate(ev.savedTemplateSnapshot);
    setEditingEvaluation(ev);
    setIsEditMode(false);
    setActiveView("form");
  };

  const handleViewCertificate = (ev) => {
      const intern = allInterns.find(i => i.uid === ev.internId);
      setViewingCertificate({ evaluation: ev, intern });
  };

  const resetForm = () => {
    setEvaluationForm(initialFormState);
    setFormTemplate({ title: "OJT Evaluation", sections: [], essays: [] });
    setEditingEvaluation(null);
    setIsEditMode(false);
  };

  const initialFormState = {
    internId: "", internName: "", periodCovered: "", periodStartMonth: "", periodEndMonth: "",
    status: "draft", essayQuestions: {}, supervisorName: user?.name || "", evaluationDate: ""
  };

  const dashboardEvaluations = user.role === 'intern' 
     ? evaluations.filter(e => e.internId === user.uid)
     : evaluations;

  const dataProps = {
    evaluations: dashboardEvaluations,
    allEvaluations: evaluations,
    myInterns, allInterns, internRankings, myBadges, performanceData,
    evaluationForm, loading, evaluationSubmitting, editingEvaluation,
    isEditMode, ratingScale, formTemplate, badgeDefinitions,
    calculateSectionScore
  };

  const handlerProps = {
    setActiveView, handleEditEvaluation, handleViewEvaluation, resetEvaluationForm: resetForm, handleSaveEvaluation,
    handleRatingChange, handlePDF, handleViewCertificate,
    handleInternSelection: (uid) => {
        const i = myInterns.find(k => k.uid === uid);
        if(i) setEvaluationForm(p => ({...p, internId: uid, internName: (i.firstName ? `${i.firstName} ${i.lastName}` : i.name)}));
    },
    handleFormChange: (f, v) => setEvaluationForm(p => ({...p, [f]: v})),
    handleEssayAnswerChange: (id, v) => setEvaluationForm(p => ({...p, essayQuestions: {...p.essayQuestions, [id]: v}})),
    addSection, removeSection, updateSectionTitle, addQuestion, removeQuestion, updateQuestionText,
    addEssay, removeEssay, updateEssayText, loadStandardTemplate
  };

  return (
    <>
      <Toaster position="top-right" />
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl relative max-w-4xl">
            <button onClick={() => setViewingCertificate(null)} className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all">
              <HiOutlineXMark />
            </button>
            <EvaluationCertificate evaluation={viewingCertificate.evaluation} intern={viewingCertificate.intern} />
            <div className="p-4 bg-gray-100 flex justify-center">
               <button onClick={() => handlePDF('certificate-container', 'Certificate')} className="px-6 py-3 bg-[#002B66] text-white rounded-lg flex items-center gap-2">
                 <HiOutlineArrowDownTray /> Export PDF
               </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-6 bg-gray-50 min-h-full">
        <TabSection currentTab={activeView} data={dataProps} user={user} handlers={handlerProps} />
      </div>
    </>
  );
};

export default EvaluationTab;