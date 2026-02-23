// fileName: TabSection.jsx

import React, { useState } from "react";
import toast from "react-hot-toast";
import { 
  HiOutlineChartPie, HiOutlineTrophy, HiOutlineChartBar, 
  HiOutlineStar, HiOutlineCheckBadge, HiOutlineArchiveBox, HiArrowTrendingUp, HiArrowTrendingDown,
  HiOutlineMagnifyingGlass, HiOutlineClock, HiArrowRight,
  HiOutlineExclamationTriangle, HiOutlineCheck, HiRocketLaunch, HiOutlineInformationCircle,
  HiOutlinePrinter, HiOutlineArrowDownTray, HiOutlineDocumentText,
  HiOutlineCheckCircle, HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlus,
  HiOutlineUserGroup, HiOutlineCalculator
} from "react-icons/hi2";
import { FaStar, FaMedal, FaCrown } from "react-icons/fa";

const REPORT_ID = "printable-evaluation-content"; 

const COLOR_HEX_MAP = { green: "#22c55e", blue: "#3b82f6", yellow: "#eab308", orange: "#f97316", red: "#ef4444" };

const getLetterMetric = (score) => { if (score >= 4.5) return "E"; if (score >= 4.0) return "A"; if (score >= 3.0) return "S"; if (score >= 2.0) return "N"; return "P"; };

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

const InternRosterSection = ({ data, handlers, user }) => {
    const [activeComputeModal, setActiveComputeModal] = useState(null); 
    const [selectedEvals, setSelectedEvals] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("All"); 
    const isCoordinator = user.role === 'coordinator';

    const openCalculator = (internId) => {
        const internEvals = data.allEvaluations.filter(e => e.internId === internId && (e.status === 'submitted' || e.status === 'completed'));
        if (internEvals.length === 0) return toast.error("No evaluations to compute yet.");
        setSelectedEvals(internEvals.map(e => e.id)); 
        setActiveComputeModal(internId);
    };

    const toggleEvalSelection = (evalId) => {
        setSelectedEvals(prev => prev.includes(evalId) ? prev.filter(id => id !== evalId) : [...prev, evalId]);
    };

    const confirmOfficialGrade = (internId) => {
        const targetEvals = data.allEvaluations.filter(e => selectedEvals.includes(e.id));
        if (targetEvals.length === 0) return toast.error("Select at least one evaluation.");
        
        const total = targetEvals.reduce((sum, ev) => sum + Number(ev.overallScore || 0), 0);
        const average = (total / targetEvals.length).toFixed(2);
        
        handlers.handleComputeOfficialGrade(internId, average);
        setActiveComputeModal(null);
    };

    const uniqueCourses = [...new Set(data.myInterns.map(i => i.course || i.program || "Unknown").filter(Boolean))];

    const filteredInterns = data.myInterns.filter(i => {
        if (selectedCourse === "All") return true;
        const internCourse = i.course || i.program || "Unknown";
        return internCourse === selectedCourse;
    });

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm animate-fadeIn">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-lg font-bold text-[#002B66]">Intern Status & Roster</h3>
                {uniqueCourses.length > 0 && (
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#0094FF] bg-white shadow-sm font-medium text-gray-700 cursor-pointer"
                    >
                        <option value="All">All Programs / Courses</option>
                        {uniqueCourses.map(course => (
                            <option key={course} value={course}>{course}</option>
                        ))}
                    </select>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Intern Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Supervisor</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Evaluations</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Official Grade</th>
                            {isCoordinator && <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Set Status</th>}
                            {isCoordinator && <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInterns.map((intern) => {
                            const internEvals = data.allEvaluations.filter(e => e.internId === intern.uid && (e.status === 'submitted' || e.status === 'completed'));
                            const isComputing = activeComputeModal === intern.uid;
                            const assignedSup = data.supervisors?.find(s => s.uid === intern.supervisorId);

                            return (
                                <React.Fragment key={intern.uid}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {intern.name || `${intern.firstName} ${intern.lastName}`}
                                            {selectedCourse === "All" && (intern.course || intern.program) && (
                                                <div className="text-[10px] text-gray-400 uppercase mt-0.5">{intern.course || intern.program}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {assignedSup ? (
                                                <div className="flex flex-col">
                                                    <span className="text-gray-800 font-medium text-sm">{assignedSup.name || `${assignedSup.firstName} ${assignedSup.lastName}`}</span>
                                                    <span className="text-gray-500 text-[10px] uppercase tracking-wider">{assignedSup.companyName || 'N/A'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{internEvals.length} Forms</span></td>
                                        <td className="px-6 py-4">
                                            {intern.officialFinalGrade ? <span className="text-[#0094FF] font-black text-lg">{intern.officialFinalGrade}</span> : <span className="text-gray-400 text-sm italic">Not computed</span>}
                                        </td>
                                        {isCoordinator && (
                                            <td className="px-6 py-4">
                                                <select value={intern.internshipStatus || "Active"} onChange={(e) => handlers.handleChangeInternStatus(intern.uid, e.target.value)} className={`text-xs font-bold px-3 py-1.5 rounded outline-none cursor-pointer transition-colors shadow-sm border ${intern.internshipStatus === "Finished" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-white"}`}>
                                                    <option value="Active">Active (In Progress)</option>
                                                    <option value="Finished">Finished (Ready for Cert)</option>
                                                </select>
                                            </td>
                                        )}
                                        {isCoordinator && (
                                            <td className="px-6 py-4">
                                                <button onClick={() => isComputing ? setActiveComputeModal(null) : openCalculator(intern.uid)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${isComputing ? "bg-red-100 text-red-600" : "bg-[#0094FF] text-white hover:bg-[#002B66]"}`}>
                                                    <HiOutlineCalculator className="w-4 h-4" /> {isComputing ? "Close" : "Compute Average"}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                    {isComputing && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
                                                <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm max-w-2xl">
                                                    <h4 className="font-bold text-[#002B66] mb-3 border-b pb-2">Select Valid Evaluations to Compute</h4>
                                                    <div className="space-y-2 mb-4">
                                                        {internEvals.map(ev => (
                                                            <label key={ev.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                                                                <input type="checkbox" checked={selectedEvals.includes(ev.id)} onChange={() => toggleEvalSelection(ev.id)} className="w-4 h-4 text-[#0094FF] rounded focus:ring-[#0094FF]" />
                                                                <span className="font-medium text-gray-800 flex-1">{ev.evaluationType}</span>
                                                                <span className="font-bold text-[#0094FF]">Score: {Number(ev.overallScore).toFixed(2)}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                                        <button onClick={() => confirmOfficialGrade(intern.uid)} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors">Stamp Official Grade</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {filteredInterns.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-8 text-gray-500 italic">No interns found for the selected course/program.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TemplateBuilder = ({ template, handlers }) => {
    const { addSection, removeSection, updateSectionTitle, addQuestion, removeQuestion, updateQuestionText, addEssay, removeEssay, updateEssayText, updateTemplateTitle, handleSaveCustomTemplate, setActiveView } = handlers;
    return (
      <div className="space-y-8 bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-5xl mx-auto animate-fadeIn">
        <div className="flex justify-between items-center border-b pb-6">
            <div>
                <input type="text" value={template.title} onChange={(e) => updateTemplateTitle(e.target.value)} className="text-3xl font-black text-[#002B66] bg-transparent border-b-2 border-transparent focus:border-[#0094FF] outline-none px-2 w-full" placeholder="Enter Custom Template Name..." />
                <p className="text-gray-500 mt-2 px-2">Build a custom evaluation form for your department.</p>
            </div>
            <button onClick={() => setActiveView("dashboard")} className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium transition-colors">Cancel</button>
        </div>
        <div className="space-y-6">
          {template.sections.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"><p className="text-gray-500">Empty Form.</p></div> : template.sections.map((section, sIndex) => (
              <div key={section.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4"><div className="bg-[#002B66] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">{sIndex + 1}</div><input type="text" value={section.title} onChange={(e) => updateSectionTitle(section.id, e.target.value)} className="flex-1 text-lg font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none px-2" placeholder="Section Title (e.g., I. BEHAVIOR AT WORK)" /><button onClick={() => removeSection(section.id)} className="text-gray-400 hover:text-red-500 p-2"><HiOutlineTrash className="w-5 h-5" /></button></div>
                <div className="pl-11 space-y-3">{section.items.map((item, qIndex) => (<div key={item.id} className="flex items-center gap-3"><span className="text-gray-400 text-xs w-4 text-right">{qIndex + 1}.</span><input type="text" value={item.text} onChange={(e) => updateQuestionText(section.id, item.id, e.target.value)} className="flex-1 p-3 border border-gray-200 rounded-lg bg-white outline-none text-sm" placeholder="Grading criterion..." /><button onClick={() => removeQuestion(section.id, item.id)} className="text-gray-300 hover:text-red-500"><HiOutlineTrash className="w-4 h-4" /></button></div>))}
                <button onClick={() => addQuestion(section.id)} className="mt-2 text-sm text-[#0094FF] font-medium flex items-center gap-1 hover:underline"><HiOutlinePlus className="w-4 h-4" /> Add Criteria</button></div>
              </div>
          ))}
          <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-[#0094FF] hover:border-[#0094FF] transition-colors flex justify-center items-center gap-2"><HiOutlinePlus className="w-5 h-5" /> Add New Grading Section</button>
        </div>
        <div className="border-t pt-8 mt-8"><h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><HiOutlineDocumentText className="text-[#0094FF]" /> Essay Questions</h3><div className="space-y-4">{template.essays.map((essay, eIndex) => (<div key={essay.id} className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center gap-3"><span className="text-[#0094FF] font-bold text-sm">Q{eIndex + 1}</span><input type="text" value={essay.question} onChange={(e) => updateEssayText(essay.id, e.target.value)} className="flex-1 p-2 bg-white border border-gray-200 rounded outline-none" placeholder="Essay question..." /><button onClick={() => removeEssay(essay.id)} className="text-gray-400 hover:text-red-500"><HiOutlineTrash className="w-4 h-4" /></button></div>))}</div><button onClick={addEssay} className="mt-3 text-sm text-[#0094FF] font-medium flex items-center gap-1 hover:underline"><HiOutlinePlus className="w-4 h-4" /> Add Essay Question</button></div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 pb-2 mt-8 flex justify-end">
            <button onClick={handleSaveCustomTemplate} className="bg-[#0094FF] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-[#002B66] transition-colors flex items-center gap-2">
                <HiOutlineCheckCircle className="w-5 h-5" /> 
                {template.id ? "Update Existing Template" : "Save Template to Database"}
            </button>
        </div>
      </div>
    );
};

const EvaluationForm = ({ data, handlers, user }) => {
    const { formTemplate, evaluationForm, isEditMode, editingEvaluation } = data;
    const isSubmitted = evaluationForm.status === "submitted" || evaluationForm.status === "completed";
    const isReadOnly = isSubmitted && (!isEditMode || editingEvaluation);
  
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-6 no-print">
          <button onClick={() => handlers.setActiveView("dashboard")} className="text-gray-500 hover:bg-gray-100 px-3 py-2 rounded">Back to Inbox</button>
          <div className="flex items-center gap-2">
            {isSubmitted && (
                <>
                    <button onClick={() => handlers.handlePDF(REPORT_ID)} className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"><HiOutlineArrowDownTray size={16} /> Export PDF</button>
                    <button onClick={() => handlers.handlePrintEvaluation(REPORT_ID)} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"><HiOutlinePrinter size={16} /> Print</button>
                </>
            )}
          </div>
        </div>
        
        <div id={REPORT_ID} className="p-10 rounded-xl shadow-xl border border-gray-200 min-h-[800px] mb-10 bg-white text-gray-900 w-full mx-auto">
          
          <div className="text-center border-b-2 border-gray-800 pb-6 mb-8 pdf-block" style={{ borderColor: "#1f2937" }}>
            <h1 className="text-2xl font-black uppercase text-[#002B66] tracking-wider">{formTemplate?.title || "Performance Evaluation"}</h1>
            <p className="text-gray-500 mt-2 font-medium">Official Internship Program Document</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 rounded-lg mb-8 text-sm border border-gray-100 pdf-block" style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}>
            <div><label className="block text-gray-400 font-bold uppercase text-xs mb-1">Intern Assigned</label><div className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-1">{evaluationForm.internName}</div></div>
            <div><label className="block text-gray-400 font-bold uppercase text-xs mb-1">Evaluation Phase</label><div className="font-bold text-gray-900 border-b border-gray-200 pb-1">{evaluationForm.evaluationType || "—"}</div></div>
            <div><label className="block text-gray-400 font-bold uppercase text-xs mb-1">Overall Score</label><div className="font-bold text-lg text-[#0094FF]">{Number(evaluationForm.overallScore || 0).toFixed(2)} / 5.00</div></div>
          </div>

          {!formTemplate || formTemplate.sections?.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"><p className="text-gray-400">Template payload is missing.</p></div> : 
            <div className="space-y-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs pdf-block">
                  <div className="flex items-center gap-1 font-bold text-gray-500 uppercase tracking-widest mr-2"><HiOutlineInformationCircle className="w-4 h-4"/> Rating Guide:</div>
                  {data.ratingScale.map((s) => (<div key={s.value} className="flex items-center gap-1.5"><span className="flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px]" style={{ backgroundColor: COLOR_HEX_MAP[s.color] }}>{s.value}</span><span className="text-gray-700 font-medium">= {s.label} ({s.range})</span></div>))}
              </div>

              {formTemplate.sections.map((section) => (
              <div key={section.id} className="pb-6 pdf-block">
                <div className="flex justify-between items-center text-white px-4 py-2 rounded mb-4" style={{ backgroundColor: "#002B66" }}><h3 className="font-bold">{section.title}</h3><span className="text-xs bg-white/20 px-2 py-0.5 rounded">Avg: {data.calculateSectionScore(evaluationForm[section.id]).toFixed(2)}</span></div>
                <div className="space-y-1">{section.items.map((item, idx) => (
                  <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b border-gray-100 px-2" style={{ borderColor: "#f3f4f6" }}>
                    <div className="w-full sm:w-2/3 text-sm text-gray-800 mb-2 sm:mb-0"><span className="font-bold text-gray-400 mr-2">{idx+1}.</span> {item.text}</div>
                    <div className="flex gap-1 self-end sm:self-auto">
                      {data.ratingScale.map((scale) => { 
                        const isChecked = String((evaluationForm[section.id]||{})[item.id]) === String(scale.value); 
                        const activeColor = COLOR_HEX_MAP[scale.color] || "#2563eb"; 
                        return (
                          <label key={scale.value} className="cursor-pointer">
                            <input type="radio" name={`${section.id}_${item.id}`} value={scale.value} checked={isChecked} onChange={()=>handlers.handleRatingChange(section.id, item.id, scale.value)} disabled={isReadOnly} className="hidden" />
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors" style={{ backgroundColor: isChecked ? activeColor : "#ffffff", color: isChecked ? "#ffffff" : "#9ca3af", borderColor: isChecked ? activeColor : "#e5e7eb" }}>{scale.value}</div>
                          </label>
                        ); 
                      })}
                    </div>
                  </div>
                ))}</div>
              </div>
            ))}</div>
          }

          {formTemplate?.essays?.length > 0 && (
          <div className="mt-8 pb-4 pdf-block">
              <h3 className="font-bold px-4 py-2 rounded mb-4 uppercase text-sm tracking-wide" style={{ backgroundColor: "#f3f4f6", color: "#374151" }}>Feedback</h3>
              <div className="space-y-6">
                  {formTemplate.essays.map(essay => (
                      <div key={essay.id}>
                          <label className="block text-gray-800 font-bold text-sm mb-2">{essay.question}</label>
                          {isReadOnly ? (
                              <div className="w-full border border-gray-200 rounded p-3 text-sm bg-gray-50 whitespace-pre-wrap" style={{ borderColor: "#e5e7eb", color: "#111827", minHeight: "80px" }}>
                                  {(evaluationForm.essayQuestions||{})[essay.id] || "No response provided."}
                              </div>
                          ) : (
                              <textarea value={(evaluationForm.essayQuestions||{})[essay.id] || ""} onChange={(e) => handlers.handleEssayAnswerChange(essay.id, e.target.value)} disabled={isReadOnly} className="w-full border border-gray-200 rounded p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-[#0094FF]" style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb", color: "#111827" }} rows={3} placeholder={essay.placeholder} />
                          )}
                      </div>
                  ))}
              </div>
          </div>)}
          
          {/* --- FIXED PDF PADDING: Added pt-16 and pb-8 so html2canvas never cuts the bottom text --- */}
          <div className="pdf-block w-full pt-16 pb-5" style={{ borderColor: "#d1d5db" }}>
            <div className="w-full max-w-sm">
                {!isReadOnly ? (
                    <input type="text" value={evaluationForm.supervisorName} onChange={(e) => handlers.handleFormChange("supervisorName", e.target.value)} className="w-full border-b-2 border-black pb-1 outline-none font-bold text-lg bg-transparent focus:border-[#0094FF] transition-colors" placeholder="Type your Full Name to sign" />
                ) : (
                    <div className="relative">
                        <div className="font-bold text-lg text-gray-900 px-1 pb-1">{evaluationForm.supervisorName || "_________________"}</div>
                        <div className="w-full border-t-[1.5px] border-black"></div>
                    </div>
                )}
                <div className="text-xs text-gray-500 mt-1.5 font-medium tracking-wide">Supervisor Signature</div>
            </div>
          </div>
        </div>
        
        {!isReadOnly && <div className="flex justify-end gap-4 mt-8 pb-10 no-print"><button onClick={() => handlers.handleSaveEvaluation("draft")} className="px-6 py-3 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition-colors">Save Draft</button><button onClick={() => handlers.handleSaveEvaluation("submitted")} className="px-6 py-3 bg-[#0094FF] text-white rounded-lg hover:bg-[#002B66] shadow-lg font-bold transition-colors">Submit Evaluation</button></div>}
      </div>
    );
};

const RankingsSection = ({ internRankings, user }) => {
    const isIntern = user.role === 'intern';

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm animate-fadeIn">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
                {isIntern ? "Department Leaderboard" : "Intern Leaderboard"}
            </h3>
        </div>
        
        {internRankings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Rank</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Name</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Avg Score</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Trend</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {internRankings.map((intern, index) => {
                     const isMe = isIntern && intern.internId === user.uid;
                     
                     return (
                         <tr key={index} className={isMe ? "bg-blue-50 transition-colors" : "hover:bg-gray-50 transition-colors"}>
                           <td className="px-6 py-4 font-bold text-[#002B66] flex items-center gap-3">
                               <span className="text-gray-500 w-4">{index + 1}</span>
                               {index === 0 && <FaCrown className="text-yellow-500 text-xl drop-shadow-sm" />}
                               {index === 1 && <FaMedal className="text-gray-400 text-lg" />}
                               {index === 2 && <FaMedal className="text-orange-400 text-lg" />}
                           </td>
                           <td className="px-6 py-4 font-medium text-gray-900">
                               {intern.internName} 
                               {isMe && <span className="ml-3 text-[10px] bg-[#0094FF] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">You</span>}
                           </td>
                           <td className="px-6 py-4 text-[#0094FF] font-black">{Number(intern.averageScore).toFixed(2)}</td>
                           <td className="px-6 py-4">
                               <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit ${intern.trend === 'Improving' ? 'bg-green-100 text-green-700' : intern.trend === 'Declining' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                   {intern.trend === 'Improving' && <HiArrowTrendingUp />}
                                   {intern.trend === 'Declining' && <HiArrowTrendingDown />}
                                   {intern.trend || "Stable"}
                               </span>
                           </td>
                         </tr>
                     );
                })}
              </tbody>
            </table>
          </div>
        ) : (
            <div className="text-center py-12 text-gray-500 italic">
                No rankings available yet.
            </div>
        )}
      </div>
    );
};
  
const BadgesSection = ({ myBadges, badgeDefinitions }) => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
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
        ) : <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-400 italic border border-dashed border-gray-200">No badges earned yet. Complete evaluations to unlock!</div>}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">All Available Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{badgeDefinitions.map(b => (
           <div key={b.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all flex items-center gap-4"><div className="text-3xl text-gray-400 grayscale opacity-70">{b.icon}</div><div><h4 className="font-bold text-sm text-gray-700">{b.name}</h4><p className="text-xs text-gray-500">{b.description}</p></div></div>
        ))}</div>
      </div>
    </div>
);

const PerformanceSection = ({ performanceData, internRankings, user }) => {
    const [selectedIntern, setSelectedIntern] = useState("all");
    const isStaff = user.role === 'supervisor' || user.role === 'coordinator';
    
    const isGlobalView = selectedIntern === "all" && isStaff;

    const targetData = isGlobalView 
      ? performanceData 
      : internRankings.find(i => i.internId === selectedIntern || i.internId === user.uid);
  
    if (!targetData) return <div className="text-center p-10 text-gray-500">Not enough data for performance analysis.</div>;
  
    const avgScore = isGlobalView ? performanceData.performanceInsights?.averageScore : targetData.averageScore;
    const { strengths = [], improvementAreas = [], trend, trendValue } = targetData;
    const latest = isGlobalView ? null : Number(targetData.latestScore || 0);
    const performanceStatus = getPerformanceStatus(avgScore || 0, trendValue || 0);
  
    return (
      <div className="space-y-6">
         {isStaff && (
           <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 shadow-sm">
              <HiOutlineMagnifyingGlass className="text-[#0094FF] w-5 h-5" />
              <select value={selectedIntern} onChange={(e) => setSelectedIntern(e.target.value)} className="bg-transparent outline-none flex-1 font-bold text-[#002B66] cursor-pointer">
                 <option value="all">Class Overview (All Interns)</option>
                 {internRankings.map(i => <option key={i.internId} value={i.internId}>{i.internName}</option>)}
              </select>
           </div>
         )}
         
         {isGlobalView ? (
             <div className="space-y-6 animate-fadeIn">
                 <div className="mb-4 border-b pb-4">
                     <h2 className="text-2xl font-black text-[#002B66]">Intern Performance Overview</h2>
                     <p className="text-gray-500 text-sm mt-1">Review the individual strengths, growth areas, and current standing of every evaluated intern.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                     {internRankings.map(intern => {
                         const pStatus = getPerformanceStatus(intern.averageScore || 0, intern.trendValue || 0);
                         
                         return (
                             <div key={intern.internId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                 <div className={`p-4 border-b ${pStatus.bg} flex justify-between items-center`}>
                                     <div>
                                         <h3 className="font-bold text-lg text-gray-900">{intern.internName}</h3>
                                         <div className="flex gap-2 items-center mt-1">
                                             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white ${pStatus.color} shadow-sm border ${pStatus.border} flex items-center gap-1`}>
                                                 {pStatus.label}
                                             </span>
                                             <span className="text-xs text-gray-500 font-medium bg-white/50 px-2 py-0.5 rounded-full">
                                                 {intern.evaluationsCompleted} Forms
                                             </span>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <span className="text-sm font-bold text-gray-500 uppercase block mb-[-4px]">Avg Score</span>
                                         <span className="text-3xl font-black text-[#0094FF]">{intern.averageScore.toFixed(2)}</span>
                                     </div>
                                 </div>
                                 
                                 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 flex-1">
                                     <div>
                                         <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1"><FaStar className="text-yellow-500"/> Top Strengths</h4>
                                         {intern.strengths?.length > 0 ? (
                                             <div className="space-y-2">
                                                 {intern.strengths.map((s, idx) => (
                                                     <div key={idx} className="bg-white border border-green-100 p-2.5 rounded-lg shadow-sm flex justify-between items-center">
                                                         <span className="text-xs text-gray-700 font-medium truncate pr-2" title={s.section}>{s.section}</span>
                                                         <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{s.score}</span>
                                                     </div>
                                                 ))}
                                             </div>
                                         ) : <span className="text-xs text-gray-400 italic">No strong data yet.</span>}
                                     </div>

                                     <div>
                                         <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1"><HiOutlineChartBar className="text-red-500"/> Areas for Growth</h4>
                                         {intern.improvementAreas?.length > 0 ? (
                                             <div className="space-y-2">
                                                 {intern.improvementAreas.map((s, idx) => (
                                                     <div key={idx} className="bg-white border border-red-100 p-2.5 rounded-lg shadow-sm flex justify-between items-center">
                                                         <span className="text-xs text-gray-700 font-medium truncate pr-2" title={s.section}>{s.section}</span>
                                                         <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{s.score}</span>
                                                     </div>
                                                 ))}
                                             </div>
                                         ) : <span className="text-xs text-gray-400 italic">No weak areas identified.</span>}
                                     </div>
                                 </div>
                             </div>
                         );
                     })}
                     
                     {internRankings.length === 0 && (
                         <div className="col-span-full text-center py-12 text-gray-400 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                             No intern evaluations have been submitted yet.
                         </div>
                     )}
                 </div>
             </div>
         ) : (
             <div className="space-y-6 animate-fadeIn">
                 <div className={`${performanceStatus.bg} p-4 rounded-lg border border-transparent flex items-center gap-3 shadow-sm`}>
                    <div className={`p-2 rounded-full bg-white ${performanceStatus.color} shadow-sm`}>{performanceStatus.icon}</div>
                    <div><p className={`text-xs font-bold uppercase ${performanceStatus.color} opacity-80`}>Current Status</p><h3 className={`text-lg font-bold ${performanceStatus.color}`}>{performanceStatus.label}</h3></div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden group">
                       <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><HiOutlineChartPie className="w-24 h-24"/></div>
                       <p className="text-sm font-bold text-gray-500 uppercase">Average Score</p>
                       <div className="flex items-baseline gap-2 mt-2"><p className="text-4xl font-black text-[#0094FF]">{avgScore?.toFixed(2)}</p><span className="text-xl font-bold text-gray-400">({getLetterMetric(avgScore || 0)})</span></div>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                       <p className="text-sm font-bold text-gray-500 uppercase">Latest Rating</p>
                       <div className="flex items-baseline gap-2 mt-2"><p className={`text-4xl font-black ${latest >= 4 ? 'text-green-600' : 'text-indigo-600'}`}>{latest?.toFixed(2) || "0.00"}</p><span className="text-xl font-bold text-gray-400">({getLetterMetric(latest || 0)})</span></div>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                       <p className="text-sm font-bold text-gray-500 uppercase">Evaluations</p><p className="text-4xl font-black text-gray-800 mt-2">{targetData.evaluationsCompleted || 0}</p>
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
         )}
      </div>
    );
};

const DashboardView = ({ data, handlers, user }) => {
    const isSupervisor = user.role === 'supervisor';
    const isCoordinator = user.role === 'coordinator';
    const [viewMode, setViewMode] = useState('summary'); 
    const [searchTerm, setSearchTerm] = useState('');
    
    const pendingTasks = isSupervisor ? data.evaluations.filter(e => e.status === 'pending_supervisor') : [];
    const drafts = isSupervisor ? data.evaluations.filter(e => e.status === 'draft') : [];
    const recentSubmitted = data.evaluations.filter(e => e.status === 'submitted' || e.status === 'completed').slice(0, 5);
    
    const allHistory = data.evaluations.filter(e => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (e.internName?.toLowerCase().includes(searchLower) || e.status?.toLowerCase().includes(searchLower));
    });
  
    if (viewMode === 'history') {
        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => setViewMode('summary')} className="text-gray-500 hover:bg-gray-100 px-3 py-2 rounded font-medium transition-colors">← Back</button>
                    <div className="flex-1 relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-3 text-[#0094FF] w-5 h-5"/>
                        <input type="text" placeholder="Search evaluation history..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0094FF] focus:ring-1 focus:ring-[#0094FF] transition-all"/>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[#002B66] mb-6">Full Evaluation History</h3>
                    <div className="space-y-3">
                        {allHistory.map(ev => (
                            <div key={ev.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg hover:shadow-md transition-all bg-white border border-gray-100">
                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                    <div className={`p-3 rounded-lg ${ev.status === 'submitted' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}><HiOutlineArchiveBox className="w-6 h-6"/></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{ev.evaluationType} for {ev.internName}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ev.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ev.status}</span><span>•</span><span className="font-medium text-gray-700">Score: {ev.overallScore ? Number(ev.overallScore).toFixed(2) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => handlers.handleEditEvaluation(ev)} className="flex-1 md:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-[#0094FF] hover:border-[#0094FF] font-medium transition-colors">{ev.status === 'draft' || ev.status === 'pending_supervisor' ? 'Open Task' : 'View Details'}</button>
                                </div>
                            </div>
                        ))}
                        {allHistory.length === 0 && <div className="text-center py-8 text-gray-400 italic">No history found.</div>}
                    </div>
                </div>
            </div>
        );
    }
  
    return (
        <div className="space-y-6 animate-fadeIn">
            {isCoordinator && data.customTemplates?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#0094FF]"></div>
                    <h3 className="text-lg font-bold text-[#002B66] mb-4 flex items-center gap-2">
                        <HiOutlinePencilSquare className="text-[#0094FF] w-6 h-6" /> Manage Custom Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.customTemplates.map(template => (
                            <div key={template.id} className="border border-gray-200 bg-gray-50 rounded-lg p-4 flex flex-col justify-between hover:border-[#0094FF] transition-colors shadow-sm">
                                <div>
                                    <h4 className="font-bold text-gray-900">{template.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{template.sections?.length || 0} Grading Sections • {template.essays?.length || 0} Essays</p>
                                </div>
                                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                                    <button onClick={() => handlers.handleEditTemplate(template)} className="flex-1 text-sm bg-white border border-[#0094FF] text-[#0094FF] py-1.5 rounded-lg font-medium hover:bg-blue-50 transition-colors">Edit</button>
                                    <button onClick={() => handlers.handleDeleteTemplate(template.id)} className="px-3 text-sm bg-white border border-red-200 text-red-500 rounded-lg font-medium hover:bg-red-50 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isSupervisor && pendingTasks.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#0094FF]"></div>
                    <h3 className="text-xl font-bold text-[#002B66] mb-4 flex items-center gap-2">
                        <HiOutlineDocumentText className="text-[#0094FF] w-6 h-6" /> Action Required ({pendingTasks.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingTasks.map(task => (
                            <div key={task.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-blue-100 hover:border-[#0094FF] transition-colors">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="p-2 rounded-full bg-blue-100 text-[#0094FF] font-black w-10 h-10 flex items-center justify-center shrink-0">!</div>
                                    <div>
                                        <p className="font-bold text-gray-900">{task.internName}</p>
                                        <p className="text-sm text-gray-500">{task.evaluationType} • Assigned by Coordinator</p>
                                    </div>
                                </div>
                                <button onClick={() => handlers.handleEditEvaluation(task)} className="mt-4 md:mt-0 w-full md:w-auto px-6 py-2 bg-[#0094FF] text-white font-bold rounded-lg hover:bg-[#002B66] shadow transition-colors whitespace-nowrap">
                                    Start Evaluation
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isSupervisor && drafts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[#002B66] mb-6 flex items-center gap-2"><HiOutlinePencilSquare className="text-orange-500"/> Continue Working (Drafts)</h3>
                    <div className="space-y-3">
                        {drafts.slice(0, 3).map(ev => (
                            <div key={ev.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-orange-100 bg-orange-50/30 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                    <div className="p-3 rounded-lg bg-orange-100 text-orange-600"><HiOutlinePencilSquare className="w-6 h-6"/></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{ev.evaluationType} for {ev.internName}</h4>
                                        <div className="text-sm text-gray-500 mt-1">Last edited: {ev.updatedAt?.seconds ? new Date(ev.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}</div>
                                    </div>
                                </div>
                                <button onClick={() => handlers.handleEditEvaluation(ev)} className="w-full md:w-auto px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-bold transition-colors">Resume Edit</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-[#002B66] flex items-center gap-2"><HiOutlineClock className="text-[#0094FF]"/> Recently Submitted</h3>
                    <button onClick={() => setViewMode('history')} className="text-sm font-bold text-[#0094FF] hover:underline flex items-center gap-1">View Full History <HiArrowRight/></button>
                </div>
                {recentSubmitted.length === 0 ? <div className="text-center py-12 text-gray-400 italic border border-dashed border-gray-200 rounded-lg">No recent submissions found.</div> : (
                    <div className="space-y-3">
                        {recentSubmitted.map(ev => {
                            const internData = data.internRankings?.find(i => i.internId === ev.internId);
                            const isFinished = internData?.internshipStatus === "Finished";

                            const internEvals = data.allEvaluations.filter(e => 
                                e.internId === ev.internId && 
                                (e.status === 'submitted' || e.status === 'completed')
                            );
                            
                            const hasFinal = internEvals.some(e => e.evaluationType === "Final");
                            let isCertificateBearer = false;

                            if (ev.evaluationType === "Final") {
                                isCertificateBearer = true;
                            } else if (ev.evaluationType === "Regular" && !hasFinal) {
                                const latestRegular = internEvals
                                    .filter(e => e.evaluationType === "Regular")
                                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
                                
                                if (latestRegular && ev.id === latestRegular.id) {
                                    isCertificateBearer = true;
                                }
                            }

                            return (
                                <div key={ev.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-green-100 bg-green-50/30 rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4 mb-3 md:mb-0">
                                        <div className="p-3 rounded-lg bg-green-100 text-green-600"><HiOutlineCheckCircle className="w-6 h-6"/></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{ev.evaluationType} for {ev.internName}</h4>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <span className="text-green-700 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 bg-green-200 rounded">Submitted</span><span>•</span><span className="font-medium text-gray-700">Score: {Number(ev.overallScore).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        
                                        {isCertificateBearer && isSupervisor && (
                                            <button 
                                                disabled={!isFinished}
                                                onClick={() => handlers.handleViewCertificate(ev)}
                                                className={`px-4 py-2 text-sm rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 ${
                                                    isFinished 
                                                    ? "bg-yellow-500 text-white hover:bg-yellow-600 active:scale-95" 
                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                                }`}
                                            >
                                                {isFinished ? (
                                                    <><FaMedal /> Manage Certificate</>
                                                ) : (
                                                    "Awaiting Coordinator"
                                                )}
                                            </button>
                                        )}

                                        {isCertificateBearer && !isSupervisor && ev.certificateIssued && (
                                            <button onClick={() => handlers.handleViewCertificate(ev)} className="px-4 py-2 text-sm bg-[#0094FF] text-white rounded-lg font-bold hover:bg-[#002B66] transition-colors shadow-sm flex items-center gap-2"><FaMedal /> View Certificate</button>
                                        )}

                                        <button onClick={() => handlers.handleViewEvaluation(ev)} className="px-4 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-50 hover:text-[#0094FF] hover:border-[#0094FF] font-medium transition-colors">View Details</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const TabSection = ({ currentTab, data, user, handlers }) => {
  const isStaff = user?.role === 'supervisor' || user?.role === 'coordinator';
  const navItems = isStaff 
    ? [ { id: 'dashboard', label: 'Inbox & History', icon: <HiOutlineChartPie /> }, { id: 'roster', label: 'Intern Roster', icon: <HiOutlineUserGroup /> }, { id: 'rankings', label: 'Rankings', icon: <HiOutlineTrophy /> }, { id: 'performance', label: 'Analytics', icon: <HiOutlineChartBar /> } ] 
    : [ { id: 'dashboard', label: 'My Reviews', icon: <HiOutlineStar /> }, { id: 'rankings', label: 'Rankings', icon: <HiOutlineTrophy /> }, { id: 'badges', label: 'Badges', icon: <HiOutlineCheckBadge /> }, { id: 'performance', label: 'Analytics', icon: <HiOutlineChartBar /> } ];

  if (currentTab === 'form') return <EvaluationForm data={data} handlers={handlers} user={user} />;
  if (currentTab === 'template_builder') return <TemplateBuilder template={data.formTemplate} handlers={handlers} />;

  return (
    <div className="space-y-6">
       <div className="flex space-x-2 bg-white p-1 rounded-lg border border-gray-200 w-fit mb-6 shadow-sm overflow-x-auto">{navItems.map(item => (<button key={item.id} onClick={() => handlers.setActiveView(item.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${currentTab === item.id ? 'bg-[#0094FF] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}><span className="text-lg">{item.icon}</span> <span>{item.label}</span></button>))}</div>
       {currentTab === 'dashboard' && <DashboardView data={data} handlers={handlers} user={user} />}
       {currentTab === 'roster' && <InternRosterSection data={data} handlers={handlers} user={user} />}
       {currentTab === 'rankings' && <RankingsSection internRankings={data.internRankings} user={user} />}
       {currentTab === 'badges' && <BadgesSection myBadges={data.myBadges} badgeDefinitions={data.badgeDefinitions || []} />}
       {currentTab === 'performance' && <PerformanceSection performanceData={data.performanceData} internRankings={data.internRankings} user={user} />}
    </div>
  );
};
export default TabSection;