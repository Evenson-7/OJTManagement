// fileName: EvalFormat.jsx

import React from "react";
import { 
  HiOutlineInformationCircle, 
  HiOutlineArrowDownTray, 
  HiOutlinePrinter 
} from "react-icons/hi2";

import { GRADE_CONVERSION_GUIDE, translateFinalGrade } from '../utils/EvalForm';

const REPORT_ID = "printable-evaluation-content"; 
const COLOR_HEX_MAP = { green: "#22c55e", blue: "#3b82f6", yellow: "#eab308", orange: "#f97316", red: "#ef4444" };

const EvaluationForm = ({ data, handlers, user }) => {
    const { formTemplate, evaluationForm, isEditMode, editingEvaluation } = data;
    const isSubmitted = evaluationForm.status === "submitted" || evaluationForm.status === "completed";
    const isReadOnly = isSubmitted && (!isEditMode || editingEvaluation);
    
    const formatType = formTemplate?.gradingFormat || "CTE_5_POINT";
    const guide = GRADE_CONVERSION_GUIDE[formatType] || GRADE_CONVERSION_GUIDE["CTE_5_POINT"];
  
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
            <div>
                <label className="block text-gray-400 font-bold uppercase text-xs mb-1">Official Grade</label>
                <div className="font-bold text-lg text-[#0094FF]">
                    {translateFinalGrade(
                        isReadOnly ? evaluationForm.overallScore : (data.calculateOverallScore ? data.calculateOverallScore(evaluationForm, formTemplate.sections, formatType) : 0), 
                        formatType
                    )}
                </div>
            </div>
          </div>

          {!formTemplate || formTemplate.sections?.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"><p className="text-gray-400">Template payload is missing.</p></div> : 
            <div className="space-y-8">
              
              {/* --- EXACT REPLICATION OF RATING GUIDES --- */}
              
              {/* CSS: Site Supervisor Matrix */}
              {guide.type === "matrix" && (
                  <div className="bg-white border border-gray-300 p-6 mb-6 pdf-block shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-sm font-bold text-gray-900 mx-8">
                          <div>E – Excellent (90 – 100)</div>
                          <div>N – Needs Improvement (75 – 79)</div>
                          <div>A – Above Standard (85 – 89)</div>
                          <div>P – Poor (below 75)</div>
                          <div>S – Standard (80 – 84)</div>
                      </div>
                  </div>
              )}

              {/* CTE: Table Rubric */}
              {guide.type === "table" && (
                  <div className="bg-white border border-black mb-6 pdf-block">
                      <div className="font-bold text-gray-900 border-b border-black p-2 text-sm">
                          Rating Scale with Rubric Descriptors
                      </div>
                      <div className="flex flex-col text-sm">
                          {guide.scales.map((s, i) => (
                              <div key={i} className="flex border-b border-black last:border-0">
                                  <div className="w-1/3 p-2 border-r border-black font-medium">{s.label}</div>
                                  <div className="w-2/3 p-2">{s.desc}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* CBE: Instructions */}
              {guide.type === "info" && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-center gap-3 pdf-block">
                      <HiOutlineInformationCircle className="w-6 h-6 text-[#0094FF] shrink-0"/>
                      <div>
                          <p className="text-sm font-bold text-gray-800 mt-0.5">{guide.text}</p>
                      </div>
                  </div>
              )}

              {/* --- EVALUATION QUESTIONS --- */}
              {formTemplate.sections.map((section) => (
              <div key={section.id} className="pb-6 pdf-block">
                <div className="flex justify-between items-center text-white px-4 py-2 rounded mb-4" style={{ backgroundColor: "#002B66" }}>
                    <h3 className="font-bold">{section.title}</h3>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Avg: {data.calculateSectionScore(evaluationForm[section.id], formatType).toFixed(2)}</span>
                </div>
                <div className="space-y-1">{section.items.map((item, idx) => (
                  <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b border-gray-100 px-2" style={{ borderColor: "#f3f4f6" }}>
                    <div className="w-full sm:w-2/3 text-sm text-gray-800 mb-2 sm:mb-0"><span className="font-bold text-gray-400 mr-2">{idx+1}.</span> {item.text}</div>
                    
                    {formatType === "CBE_100_POINT" ? (
                        <div className="flex gap-2 items-center self-end sm:self-auto">
                            <span className="text-xs text-gray-400 font-bold uppercase">Score:</span>
                            <input 
                                type="number" 
                                min="75" 
                                max="100" 
                                value={(evaluationForm[section.id]||{})[item.id] || ''} 
                                onKeyDown={(e) => {
                                    // Prevent typing non-integer characters entirely
                                    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    // Restrict to max 3 digits
                                    if (val.length > 3) val = val.slice(0, 3);
                                    // Restrict maximum value to 100
                                    if (val !== "" && Number(val) > 100) val = 100;
                                    
                                    handlers.handleRatingChange(section.id, item.id, val);
                                }} 
                                disabled={isReadOnly}
                                placeholder="75-100"
                                className="w-20 text-center border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-[#0094FF] outline-none font-bold text-[#002B66] disabled:bg-gray-100"
                            />                        </div>
                    ) : (
                        <div className="flex gap-1.5 self-end sm:self-auto">
                          {guide.scales.map((scale) => { 
                            const isChecked = String((evaluationForm[section.id]||{})[item.id]) === String(scale.val); 
                            const activeColor = COLOR_HEX_MAP[scale.color] || "#2563eb"; 
                            return (
                              <label key={scale.val} className="cursor-pointer">
                                <input type="radio" name={`${section.id}_${item.id}`} value={scale.val} checked={isChecked} onChange={()=>handlers.handleRatingChange(section.id, item.id, scale.val)} disabled={isReadOnly} className="hidden" />
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors" style={{ backgroundColor: isChecked ? activeColor : "#ffffff", color: isChecked ? "#ffffff" : "#9ca3af", borderColor: isChecked ? activeColor : "#e5e7eb" }}>
                                    {scale.display}
                                </div>
                              </label>
                            ); 
                          })}
                        </div>
                    )}
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

export default EvaluationForm;