import React, { useState } from "react";
import { 
  HiOutlineChartPie, HiOutlinePencil, HiOutlineTrophy, HiOutlineChartBar, 
  HiOutlineStar, HiOutlineCheckBadge, HiOutlineUsers, HiOutlinePencilSquare, 
  HiOutlineTrash, HiOutlinePlus, HiOutlineDocumentText, HiOutlineCheckCircle,
  HiOutlineArrowDownTray, HiOutlineArchiveBox, HiArrowTrendingUp, HiArrowTrendingDown,
  HiOutlineMagnifyingGlass, HiOutlineClock, HiOutlineEye, HiArrowRight,
  HiOutlineExclamationTriangle, HiOutlineCheck, HiRocketLaunch, HiOutlineInformationCircle,
  HiOutlinePrinter
} from "react-icons/hi2";
import { FaStar, FaTrophy, FaMedal, FaCrown } from "react-icons/fa";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- FIXED: ID MUST MATCH THE LOGIC IN EvaluationTab.jsx ---
const REPORT_ID = "printable-evaluation-content"; 

const COLOR_HEX_MAP = {
  green: "#22c55e", blue: "#3b82f6", yellow: "#eab308", orange: "#f97316", red: "#ef4444"
};

const getLetterMetric = (score) => {
  if (score >= 4.5) return "E"; if (score >= 4.0) return "A"; if (score >= 3.0) return "S"; if (score >= 2.0) return "N"; return "P"; 
};

const getPerformanceStyle = (score) => {
    if (score >= 4.5) return { bg: "bg-green-50", border: "border-green-100", text: "text-green-700", badge: "bg-green-100 text-green-700" }; 
    if (score >= 4.0) return { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" };    
    if (score >= 3.0) return { bg: "bg-yellow-50", border: "border-yellow-100", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" }; 
    if (score >= 2.0) return { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" }; 
    return { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", badge: "bg-red-100 text-red-700" }; 
};

const getPerformanceStatus = (score, trendValue) => {
  if (score >= 4.5) {
    if (trendValue < -0.2) return { label: "High Performer (At Risk)", color: "text-orange-600", bg: "bg-orange-50", icon: <HiOutlineExclamationTriangle className="w-5 h-5"/> };
    return { label: "Top Talent", color: "text-[#002B66]", bg: "bg-[#BDE4F7]", icon: <FaCrown className="w-5 h-5"/> };
  }
  if (score >= 4.0) {
    if (trendValue > 0.1) return { label: "Rising Star", color: "text-green-600", bg: "bg-green-50", icon: <HiRocketLaunch className="w-5 h-5"/> };
    return { label: "Strong Performer", color: "text-blue-600", bg: "bg-blue-50", icon: <HiOutlineCheckBadge className="w-5 h-5"/> };
  }
  if (score >= 3.0) {
    if (trendValue < -0.3) return { label: "Slipping", color: "text-red-600", bg: "bg-red-50", icon: <HiArrowTrendingDown className="w-5 h-5"/> };
    return { label: "Consistent", color: "text-gray-600", bg: "bg-gray-50", icon: <HiOutlineCheck className="w-5 h-5"/> };
  }
  return { label: "Needs Intervention", color: "text-red-700", bg: "bg-red-100", icon: <HiOutlineExclamationTriangle className="w-5 h-5"/> };
};

const TemplateBuilder = ({ template, handlers, onSave }) => {
    const { addSection, removeSection, updateSectionTitle, addQuestion, removeQuestion, updateQuestionText, addEssay, removeEssay, updateEssayText, loadStandardTemplate } = handlers;
    return (
      <div className="space-y-8 bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-5xl mx-auto">
        <div className="flex justify-between items-center border-b pb-6"><div><h2 className="text-2xl font-bold text-gray-900">Evaluation Template</h2><p className="text-gray-500">Customize criteria or load standard.</p></div><button onClick={loadStandardTemplate} className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium border border-blue-200">Load Standard</button></div>
        <div className="space-y-6">
          {template.sections.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"><p className="text-gray-500">Empty Form.</p></div> : template.sections.map((section, sIndex) => (
              <div key={section.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4"><div className="bg-[#002B66] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">{sIndex + 1}</div><input type="text" value={section.title} onChange={(e) => updateSectionTitle(section.id, e.target.value)} className="flex-1 text-lg font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none px-2" placeholder="Section Title" /><button onClick={() => removeSection(section.id)} className="text-gray-400 hover:text-red-500 p-2"><HiOutlineTrash className="w-5 h-5" /></button></div>
                <div className="pl-11 space-y-3">{section.items.map((item, qIndex) => (<div key={item.id} className="flex items-center gap-3"><span className="text-gray-400 text-xs w-4 text-right">{qIndex + 1}.</span><input type="text" value={item.text} onChange={(e) => updateQuestionText(section.id, item.id, e.target.value)} className="flex-1 p-3 border border-gray-200 rounded-lg bg-white outline-none text-sm" placeholder="Criterion..." /><button onClick={() => removeQuestion(section.id, item.id)} className="text-gray-300 hover:text-red-500"><HiOutlineTrash className="w-4 h-4" /></button></div>))}<button onClick={() => addQuestion(section.id)} className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> Add Criteria</button></div>
              </div>
          ))}
          <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-blue-50 flex justify-center items-center gap-2"><HiOutlinePlus className="w-5 h-5" /> Add Section</button>
        </div>
        <div className="border-t pt-8 mt-8"><h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><HiOutlineDocumentText className="text-blue-600" /> Essay Questions</h3><div className="space-y-4">{template.essays.map((essay, eIndex) => (<div key={essay.id} className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center gap-3"><span className="text-blue-400 font-bold text-sm">Q{eIndex + 1}</span><input type="text" value={essay.question} onChange={(e) => updateEssayText(essay.id, e.target.value)} className="flex-1 p-2 bg-white border border-gray-200 rounded outline-none" placeholder="Question..." /><button onClick={() => removeEssay(essay.id)} className="text-gray-400 hover:text-red-500"><HiOutlineTrash className="w-4 h-4" /></button></div>))}</div><button onClick={addEssay} className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> Add Essay</button></div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 pb-2 mt-8 flex justify-end"><button onClick={onSave} className="bg-[#0094FF] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-[#002B66] flex items-center gap-2"><HiOutlineCheckCircle className="w-5 h-5" /> Save & Continue</button></div>
      </div>
    );
};

const EvaluationForm = ({ data, handlers, user }) => {
    const { formTemplate, evaluationForm, isEditMode, editingEvaluation } = data;
    const [isBuilderMode, setIsBuilderMode] = useState(false);
    const isSubmitted = evaluationForm.status === "submitted" || evaluationForm.status === "completed";
    const isReadOnly = isSubmitted && (!isEditMode || editingEvaluation);
    const canEditTemplate = user?.role === "supervisor" && !isReadOnly && !isSubmitted;
  
    if (isBuilderMode) return <TemplateBuilder template={formTemplate} handlers={handlers} onSave={() => setIsBuilderMode(false)} />;
  
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <button onClick={() => handlers.setActiveView("dashboard")} className="text-gray-500 hover:bg-gray-100 px-3 py-2 rounded">Back to Dashboard</button>
          <div className="flex items-center gap-2">
            {canEditTemplate && (
              <button onClick={() => setIsBuilderMode(true)} className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"><HiOutlinePencilSquare className="w-4 h-4" /> {formTemplate.sections.length === 0 ? "Setup Template" : "Edit Template"}</button>
            )}
            
            {/* BUTTONS */}
            {isSubmitted && (
                <>
                    <button onClick={() => handlers.handlePDF(REPORT_ID)} className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors text-sm font-medium">
                        <HiOutlineArrowDownTray size={16} /> Export PDF
                    </button>
                    <button onClick={() => handlers.handlePrintEvaluation(REPORT_ID)} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black flex items-center gap-2 shadow-sm transition-colors text-sm font-medium">
                        <HiOutlinePrinter size={16} /> Print
                    </button>
                </>
            )}
          </div>
        </div>
        
        {/* --- MAIN REPORT CONTAINER (ID MATCHED) --- */}
        <div id={REPORT_ID} className="p-10 rounded-xl shadow-xl border border-gray-200 min-h-[800px] mb-10 bg-white text-gray-900">
          
          {/* HEADER */}
          <div className="text-center border-b-2 border-gray-800 pb-6 mb-8 break-inside-avoid" style={{ borderColor: "#1f2937" }}>
            <h1 className="text-2xl font-black uppercase text-[#002B66] tracking-wider">Performance Evaluation</h1>
            <p className="text-gray-500 mt-2 font-medium">Internship Program</p>
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-2 gap-6 p-6 rounded-lg mb-10 text-sm border border-gray-100 break-inside-avoid" style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}>
            <div>
                <label className="block text-gray-400 font-bold uppercase text-xs mb-1">Intern</label>
                {!isReadOnly ? (
                    <select value={evaluationForm.internId} onChange={(e)=>handlers.handleInternSelection(e.target.value)} className="w-full bg-transparent border-b border-gray-300 font-bold text-gray-800 outline-none pb-1"><option value="">Select...</option>{data.myInterns.map(i=><option key={i.uid} value={i.uid}>{i.firstName?`${i.firstName} ${i.lastName}`:i.name}</option>)}</select>
                ) : (
                    <div className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-1">{evaluationForm.internName}</div>
                )}
            </div>
            <div><label className="block text-gray-400 font-bold uppercase text-xs mb-1">Overall Score</label><div className="font-bold text-lg text-blue-600">{Number(evaluationForm.overallScore || 0).toFixed(2)} / 5.00</div></div>
            
            <div>
                <label className="block text-gray-400 font-bold uppercase text-xs mb-1">Period</label>
                {!isReadOnly ? (
                    <select value={evaluationForm.periodCovered} onChange={(e)=>handlers.handleFormChange("periodCovered", e.target.value)} className="bg-transparent border-b border-gray-300 w-full outline-none font-medium"><option value="">Select...</option><option value="Midterm Evaluation">Midterm Evaluation</option><option value="Final Evaluation">Final Evaluation</option></select>
                ) : (
                    <div className="font-bold text-gray-900 border-b border-gray-200 pb-1">{evaluationForm.periodCovered || "—"}</div>
                )}
            </div>
            
            <div className="flex gap-2">
                <div className="w-1/2">
                    <label className="block text-gray-400 font-bold uppercase text-xs mb-1">Start</label>
                    {!isReadOnly ? (
                        <select value={evaluationForm.periodStartMonth} onChange={(e)=>handlers.handleFormChange("periodStartMonth", e.target.value)} className="bg-transparent border-b border-gray-300 w-full outline-none"><option value="">Month</option>{MONTHS.map(m=><option key={m} value={m}>{m}</option>)}</select>
                    ) : (
                        <div className="font-bold text-gray-900 border-b border-gray-200 pb-1">{evaluationForm.periodStartMonth || "—"}</div>
                    )}
                </div>
                <div className="w-1/2">
                    <label className="block text-gray-400 font-bold uppercase text-xs mb-1">End</label>
                    {!isReadOnly ? (
                        <select value={evaluationForm.periodEndMonth} onChange={(e)=>handlers.handleFormChange("periodEndMonth", e.target.value)} className="bg-transparent border-b border-gray-300 w-full outline-none"><option value="">Month</option>{MONTHS.map(m=><option key={m} value={m}>{m}</option>)}</select>
                    ) : (
                        <div className="font-bold text-gray-900 border-b border-gray-200 pb-1">{evaluationForm.periodEndMonth || "—"}</div>
                    )}
                </div>
            </div>
          </div>

          {formTemplate.sections.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"><p className="text-gray-400">No questions.</p>{!isReadOnly && <button onClick={()=>setIsBuilderMode(true)} className="text-blue-600 font-bold hover:underline">Setup Template</button>}</div> : 
            <div className="space-y-8">
              
              {/* RATING GUIDE */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs break-inside-avoid">
                  <div className="flex items-center gap-1 font-bold text-gray-500 uppercase tracking-widest mr-2"><HiOutlineInformationCircle className="w-4 h-4"/> Rating Guide:</div>
                  {data.ratingScale.map((s) => (<div key={s.value} className="flex items-center gap-1.5"><span className="flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px]" style={{ backgroundColor: COLOR_HEX_MAP[s.color] }}>{s.value}</span><span className="text-gray-700 font-medium">= {s.label} ({s.range})</span></div>))}
              </div>

              {formTemplate.sections.map((section) => (
              <div key={section.id} className="break-inside-avoid">
                <div className="flex justify-between items-center text-white px-4 py-2 rounded mb-4" style={{ backgroundColor: "#002B66" }}><h3 className="font-bold">{section.title}</h3><span className="text-xs bg-white/20 px-2 py-0.5 rounded">Avg: {data.calculateSectionScore(evaluationForm[section.id]).toFixed(2)}</span></div>
                <div className="space-y-1">{section.items.map((item, idx) => (<div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b border-gray-100 px-2" style={{ borderColor: "#f3f4f6" }}><div className="w-full sm:w-2/3 text-sm text-gray-800 mb-2 sm:mb-0"><span className="font-bold text-gray-400 mr-2">{idx+1}.</span> {item.text}</div><div className="flex gap-1 self-end sm:self-auto">{data.ratingScale.map((scale) => { const isChecked = (evaluationForm[section.id]||{})[item.id] === scale.value; const activeColor = COLOR_HEX_MAP[scale.color] || "#2563eb"; return (<label key={scale.value} className="cursor-pointer"><input type="radio" name={`${section.id}_${item.id}`} value={scale.value} checked={isChecked} onChange={()=>handlers.handleRatingChange(section.id, item.id, scale.value)} disabled={isReadOnly} className="hidden" /><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors" style={{ backgroundColor: isChecked ? activeColor : "#ffffff", color: isChecked ? "#ffffff" : "#9ca3af", borderColor: isChecked ? activeColor : "#e5e7eb" }}>{scale.value}</div></label>); })}</div></div>))}</div>
              </div>
            ))}</div>
          }

          {/* FEEDBACK */}
          {formTemplate.essays.length > 0 && (<div className="mt-10 break-inside-avoid"><h3 className="font-bold px-4 py-2 rounded mb-4 uppercase text-sm tracking-wide" style={{ backgroundColor: "#f3f4f6", color: "#374151" }}>Feedback</h3><div className="space-y-6">{formTemplate.essays.map(essay => (<div key={essay.id}><label className="block text-gray-800 font-bold text-sm mb-2">{essay.question}</label><textarea value={(evaluationForm.essayQuestions||{})[essay.id] || ""} onChange={(e) => handlers.handleEssayAnswerChange(essay.id, e.target.value)} disabled={isReadOnly} className="w-full border border-gray-200 rounded p-3 text-sm outline-none resize-none" style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb", color: "#111827" }} rows={3} placeholder={essay.placeholder} /></div>))}</div></div>)}
          
          {/* SIGNATURE BLOCK */}
          <div className="mt-16 pt-4 break-inside-avoid" style={{ borderColor: "#d1d5db" }}>
            <div className="w-full max-w-sm">
                {!isReadOnly ? (
                  <input 
                    type="text" 
                    value={evaluationForm.supervisorName} 
                    onChange={(e) => handlers.handleFormChange("supervisorName", e.target.value)} 
                    className="w-full border-b-2 border-black pb-1 outline-none font-bold text-lg bg-transparent" 
                    placeholder="Supervisor Name" 
                  />
                ) : (
                  <div className="relative">
                    <div className="font-bold text-lg text-gray-900 px-1" style={{ marginBottom: "0px" }}>
                      {evaluationForm.supervisorName || "_________________"}
                    </div>
                    <div className="w-full border-t-2 border-black"></div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">Supervisor Signature</div>
            </div>
          </div>

        </div>
        
        {!isReadOnly && <div className="flex justify-end gap-4 mt-8 pb-10 no-print"><button onClick={() => handlers.handleSaveEvaluation("draft")} className="px-6 py-3 border rounded-lg hover:bg-gray-50 text-gray-600 font-medium">Save Draft</button><button onClick={() => handlers.handleSaveEvaluation("submitted")} className="px-6 py-3 bg-[#0094FF] text-white rounded-lg hover:bg-[#002B66] shadow-lg font-bold">Submit Final Evaluation</button></div>}
      </div>
    );
};

// ... (Rest of component exports)
const RankingsSection = ({ internRankings, user }) => {
    const isIntern = user.role === 'intern';
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-900">{isIntern ? "Leaderboard & My Standing" : "Intern Leaderboard"}</h3></div>
        {internRankings.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Rank</th><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Name</th><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Avg Score</th><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Trend</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{internRankings.map((intern, index) => {
               const isMe = intern.internId === user.uid;
               return (
                   <tr key={index} className={`transition-colors ${isMe ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
                     <td className="px-6 py-4">{index === 0 && <FaCrown className="text-yellow-500 text-lg" />}{index > 0 && index < 3 && <FaMedal className={index===1?"text-gray-400":"text-orange-400"} />}{index >= 3 && <span className="font-bold text-gray-400">#{index + 1}</span>}</td>
                     <td className="px-6 py-4 font-medium text-gray-900">{intern.internName} {isMe && <span className="ml-2 bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">You</span>}</td>
                     <td className="px-6 py-4 text-[#0094FF] font-bold">{intern.averageScore}</td>
                     <td className="px-6 py-4"><span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit ${intern.trend === 'Improving' ? 'bg-green-100 text-green-700' : intern.trend === 'Declining' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{intern.trend === 'Improving' && <HiArrowTrendingUp />}{intern.trend === 'Declining' && <HiArrowTrendingDown />}{intern.trend}</span></td>
                   </tr>
               );
          })}</tbody></table></div>
        ) : <div className="text-center py-12 text-gray-500">No rankings available yet.</div>}
      </div>
    );
};
  
const BadgesSection = ({ myBadges, badgeDefinitions }) => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">My Achievements</h3>
        {myBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {myBadges.map((badge) => (
              <div key={badge.id} className={`bg-gradient-to-br ${badge.color} text-white rounded-xl p-4 shadow-lg transform hover:-translate-y-1 transition-transform relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">{badge.icon}</div>
                <div className="relative z-10"><div className="text-3xl bg-white/20 p-3 rounded-full w-fit mb-3 shadow-sm">{badge.icon}</div><h4 className="font-bold text-lg leading-tight mb-1">{badge.name}</h4><p className="text-xs opacity-90 leading-snug">{badge.description}</p><div className="mt-3 inline-block px-2 py-0.5 bg-white/30 rounded text-[10px] font-bold uppercase tracking-wider">Unlocked</div></div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-400 italic">No badges earned yet.</div>}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">All Available Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{badgeDefinitions.map(b => (
           <div key={b.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all flex items-center gap-4"><div className="text-3xl text-gray-400 grayscale opacity-70">{b.icon}</div><div><h4 className="font-bold text-sm text-gray-700">{b.name}</h4><p className="text-xs text-gray-500">{b.description}</p></div></div>
        ))}</div>
      </div>
    </div>
);
  
const PerformanceSection = ({ performanceData, internRankings, user }) => {
    const [selectedIntern, setSelectedIntern] = useState("all");
    const isSupervisor = user.role === 'supervisor';
    const targetData = isSupervisor 
      ? (selectedIntern === "all" ? performanceData : internRankings.find(i => i.internId === selectedIntern)) 
      : internRankings.find(i => i.internId === user.uid);
  
    if (!targetData) return <div className="text-center p-10 text-gray-500">Not enough data for performance analysis.</div>;
  
    const { performanceInsights = {}, strengths = [], improvementAreas = [], trend, trendValue } = targetData;
    const avgScore = Number(targetData.averageScore || performanceInsights.averageScore || 0);
    const latest = Number(targetData.latestScore || performanceInsights.latestScore || 0);
    const performanceStatus = getPerformanceStatus(avgScore, trendValue || 0);
  
    return (
      <div className="space-y-6">
         {isSupervisor && (
           <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
              <HiOutlineMagnifyingGlass className="text-gray-400 w-5 h-5" />
              <select value={selectedIntern} onChange={(e) => setSelectedIntern(e.target.value)} className="bg-transparent outline-none flex-1 font-medium text-gray-700">
                 <option value="all">Class Overview (All Interns)</option>
                 {internRankings.map(i => <option key={i.internId} value={i.internId}>{i.internName}</option>)}
              </select>
           </div>
         )}
         {selectedIntern !== "all" && (
           <div className={`${performanceStatus.bg} p-4 rounded-lg border border-transparent flex items-center gap-3`}>
              <div className={`p-2 rounded-full bg-white ${performanceStatus.color} shadow-sm`}>{performanceStatus.icon}</div>
              <div><p className={`text-xs font-bold uppercase ${performanceStatus.color} opacity-80`}>Current Status</p><h3 className={`text-lg font-bold ${performanceStatus.color}`}>{performanceStatus.label}</h3></div>
           </div>
         )}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><HiOutlineChartPie className="w-24 h-24"/></div>
               <p className="text-sm font-bold text-gray-500 uppercase">Average Score</p>
               <div className="flex items-baseline gap-2 mt-2"><p className="text-4xl font-black text-[#0094FF]">{avgScore.toFixed(2)}</p><span className="text-xl font-bold text-gray-400">({getLetterMetric(avgScore)})</span></div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
               <p className="text-sm font-bold text-gray-500 uppercase">Latest Rating</p>
               <div className="flex items-baseline gap-2 mt-2"><p className={`text-4xl font-black ${latest >= 4 ? 'text-green-600' : 'text-indigo-600'}`}>{latest.toFixed(2)}</p><span className="text-xl font-bold text-gray-400">({getLetterMetric(latest)})</span></div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
               <p className="text-sm font-bold text-gray-500 uppercase">Evaluations</p><p className="text-4xl font-black text-gray-800 mt-2">{targetData.totalEvaluations || performanceInsights.totalEvaluations}</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
               <p className="text-sm font-bold text-gray-500 uppercase">Stability Trend</p>
               <div className="flex items-center gap-2 mt-2"><span className={`text-2xl font-black ${trend === 'Improving' ? 'text-green-500' : trend === 'Declining' ? 'text-red-500' : 'text-gray-400'}`}>{trend || (trendValue > 0 ? "Up" : "Stable")}</span>{trend === 'Improving' ? <HiArrowTrendingUp className="w-6 h-6 text-green-500"/> : <HiArrowTrendingDown className="w-6 h-6 text-red-500"/>}</div>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2"><FaStar className="text-yellow-500"/> Top Strengths</h3>
               {strengths.length > 0 ? (
                 <div className="space-y-3">
                   {strengths.map((s, idx) => {
                      const style = getPerformanceStyle(s.score);
                      return (
                          <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${style.bg} ${style.border}`}>
                             <div className="flex items-center gap-3"><span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${style.badge}`}>{idx+1}</span><span className="font-medium text-gray-800">{s.section}</span></div>
                             <div className="text-right"><span className={`font-bold block ${style.text}`}>{s.score}</span><span className={`text-[10px] font-bold px-1 rounded ${style.badge}`}>{getLetterMetric(s.score)}</span></div>
                          </div>
                      );
                   })}
                 </div>
               ) : <div className="text-center py-8 text-gray-400 italic">No data yet.</div>}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2"><HiOutlineChartBar className="text-red-500"/> Areas for Growth</h3>
               {improvementAreas.length > 0 ? (
                 <div className="space-y-3">
                   {improvementAreas.map((s, idx) => {
                      const style = getPerformanceStyle(s.score);
                      return (
                          <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${style.bg} ${style.border}`}>
                             <div className="flex items-center gap-3"><span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${style.badge}`}>{idx+1}</span><span className="font-medium text-gray-800">{s.section}</span></div>
                             <div className="text-right"><span className={`font-bold block ${style.text}`}>{s.score}</span><span className={`text-[10px] font-bold px-1 rounded ${style.badge}`}>{getLetterMetric(s.score)}</span></div>
                          </div>
                      );
                   })}
                 </div>
               ) : <div className="text-center py-8 text-gray-400 italic">No weak areas.</div>}
            </div>
         </div>
      </div>
    );
};
  
const DashboardView = ({ data, handlers, user }) => {
    const isSupervisor = user.role === 'supervisor';
    const [viewMode, setViewMode] = useState('summary'); 
    const [searchTerm, setSearchTerm] = useState('');
    const recentSubmitted = data.evaluations.filter(e => e.status === 'submitted' || e.status === 'completed').slice(0, 3);
    const drafts = isSupervisor ? data.evaluations.filter(e => e.status === 'draft') : [];
    const allHistory = data.evaluations.filter(e => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (e.internName?.toLowerCase().includes(searchLower) || e.status?.toLowerCase().includes(searchLower));
    });
  
    if (viewMode === 'history') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
                    <button onClick={() => setViewMode('summary')} className="text-gray-500 hover:bg-gray-100 px-3 py-2 rounded font-medium">← Back</button>
                    <div className="flex-1 relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-3 text-gray-400 w-5 h-5"/>
                        <input type="text" placeholder="Search evaluations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"/>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Full Evaluation History</h3>
                    <div className="space-y-3">
                        {allHistory.map(ev => (
                            <div key={ev.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg hover:shadow-md transition-shadow bg-white">
                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                    <div className={`p-3 rounded-lg ${ev.status === 'submitted' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}><HiOutlineArchiveBox className="w-6 h-6"/></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{ev.title || `Evaluation for ${ev.internName}`}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${ev.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ev.status}</span><span>•</span><span>{ev.periodCovered}</span><span>•</span><span className="font-medium text-gray-700">Score: {ev.overallScore ? Number(ev.overallScore).toFixed(2) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => handlers.handleEditEvaluation(ev)} className="flex-1 md:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">{ev.status === 'draft' ? 'Edit Draft' : 'View Details'}</button>
                                    {ev.periodCovered === 'Final Evaluation' && ev.status === 'submitted' && (<button onClick={() => handlers.handleViewCertificate(ev)} className="flex-1 md:flex-none px-4 py-2 text-sm bg-[#002B66] text-white rounded-lg hover:bg-blue-900 font-medium shadow-md transition-colors flex items-center justify-center gap-2"><HiOutlineCheckCircle className="w-4 h-4"/> Certificate</button>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
  
    return (
        <div className="space-y-6">
            {isSupervisor && (
                <div className="mb-6">
                    <button onClick={() => { handlers.resetEvaluationForm(); handlers.setActiveView('form'); }} className="w-full bg-white p-5 rounded-lg border-2 border-dashed border-[#0094FF] text-[#0094FF] hover:bg-blue-50 transition-all font-bold text-lg flex items-center justify-center gap-2 shadow-sm">
                        <HiOutlinePlus className="w-6 h-6" /> Create New Evaluation
                    </button>
                </div>
            )}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><HiOutlineClock className="text-blue-500"/> Recently Submitted</h3>
                    <button onClick={() => setViewMode('history')} className="text-sm font-bold text-[#0094FF] hover:underline flex items-center gap-1">View Full History <HiArrowRight/></button>
                </div>
                {recentSubmitted.length === 0 ? <div className="text-center py-8 text-gray-400 italic">No recent submissions found.</div> : (
                    <div className="space-y-3">
                        {recentSubmitted.map(ev => (
                            <div key={ev.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-green-100 bg-green-50/30 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                    <div className="p-3 rounded-lg bg-green-100 text-green-600"><HiOutlineCheckCircle className="w-6 h-6"/></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{ev.title || `Evaluation for ${ev.internName}`}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span className="text-green-700 font-bold text-xs uppercase px-2 py-0.5 bg-green-200 rounded">Submitted</span><span>•</span><span>{ev.periodCovered}</span><span>•</span><span className="font-medium text-gray-700">Score: {Number(ev.overallScore).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handlers.handleViewEvaluation(ev)} className="px-4 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors">View Details</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {drafts.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><HiOutlinePencilSquare className="text-orange-500"/> Continue Working (Drafts)</h3>
                    <div className="space-y-3">
                        {drafts.slice(0, 3).map(ev => (
                            <div key={ev.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-orange-100 bg-orange-50/30 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                    <div className="p-3 rounded-lg bg-orange-100 text-orange-600"><HiOutlinePencilSquare className="w-6 h-6"/></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{ev.internName} (Draft)</h4>
                                        <div className="text-sm text-gray-500 mt-1">Last edited: {ev.updatedAt?.seconds ? new Date(ev.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}</div>
                                    </div>
                                </div>
                                <button onClick={() => handlers.handleEditEvaluation(ev)} className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-bold transition-colors">Resume Edit</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
  
const TabSection = ({ currentTab, data, user, handlers }) => {
  const isSupervisor = user?.role === 'supervisor';
  const navItems = isSupervisor 
    ? [ { id: 'dashboard', label: 'Dashboard', icon: <HiOutlineChartPie /> }, { id: 'rankings', label: 'Rankings', icon: <HiOutlineTrophy /> }, { id: 'performance', label: 'Performance', icon: <HiOutlineChartBar /> } ] 
    : [ { id: 'dashboard', label: 'My Reviews', icon: <HiOutlineStar /> }, { id: 'rankings', label: 'Rankings', icon: <HiOutlineTrophy /> }, { id: 'badges', label: 'Badges', icon: <HiOutlineCheckBadge /> }, { id: 'performance', label: 'Performance', icon: <HiOutlineChartBar /> } ];

  if (currentTab === 'form') return <EvaluationForm data={data} handlers={handlers} user={user} />;

  return (
    <div className="space-y-6">
       <div className="flex space-x-2 bg-white p-1 rounded-lg border border-gray-200 w-fit mb-6 shadow-sm overflow-x-auto">{navItems.map(item => (<button key={item.id} onClick={() => handlers.setActiveView(item.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${currentTab === item.id ? 'bg-[#0094FF] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}><span className="text-lg">{item.icon}</span> <span>{item.label}</span></button>))}</div>
       {currentTab === 'dashboard' && <DashboardView data={data} handlers={handlers} user={user} />}
       {currentTab === 'rankings' && <RankingsSection internRankings={data.internRankings} user={user} />}
       {currentTab === 'badges' && <BadgesSection myBadges={data.myBadges} badgeDefinitions={data.badgeDefinitions || []} />}
       {currentTab === 'performance' && <PerformanceSection performanceData={data.performanceData} internRankings={data.internRankings} user={user} />}
    </div>
  );
};
export default TabSection;