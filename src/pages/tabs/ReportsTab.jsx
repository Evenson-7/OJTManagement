// fileName: ReportsTab.jsx

import React, { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import toast, { Toaster } from "react-hot-toast";
import {
  FileText, Plus, Calendar, Search, Send, X, Loader2, Printer, 
  TrendingUp, Users, Download, CheckSquare, Square, Clock, Info
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

// --- EXTERNAL COMPONENTS ---
import ReportPrint from "../../components/ReportPrint";
import AttendanceDTR from "../../components/AttendanceDTR"; 

// --- Configuration ---
const cloudName = "dixpsqyhx";
const uploadPreset = "Profile";

const COLORS = {
  primary: "text-[#42A5FF]", 
  accent: "text-[#0094FF]",  
  navy: "text-[#002B66]",    
  bgLight: "bg-[#BDE4F7]",   
  bgNavy: "bg-[#002B66]",    
};

const getCurrentYear = () => new Date().getFullYear();
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Date formatter to convert objects to "Feb 08 2026"
const formatToCustomDate = (dateObj) => {
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${month} ${day} ${year}`;
};

// Date formatter to catch old "2026-02-08" formats and convert them for display
const formatDisplayDateString = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.match(/^\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}$/)) {
        const parts = dateStr.split(' to ');
        const parsePart = (dStr) => {
            const d = new Date(dStr);
            return `${d.toLocaleString('en-US', { month: 'short' })} ${String(d.getDate()).padStart(2, '0')} ${d.getFullYear()}`;
        };
        return `${parsePart(parts[0])} to ${parsePart(parts[1])}`;
    }
    return dateStr;
};

const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
      return (await response.json()).secure_url;
    } catch (error) { console.error(error); return null; }
};

// =========================================================
// SUB-COMPONENT: MANAGER DASHBOARD
// =========================================================
const SupervisorDashboard = ({ relevantReports }) => {
  const totalReports = relevantReports.length;
  
  const internStats = relevantReports.length > 0 ? Object.values(relevantReports.reduce((stats, r) => {
    if (!stats[r.userId]) stats[r.userId] = { name: r.userName, count: 0 };
    stats[r.userId].count += 1;
    return stats;
  }, {})).sort((a, b) => b.count - a.count) : [];

  const activeInternsCount = internStats.length;
  const mostActiveInternDisplay = internStats.length > 0 ? internStats[0].name.split(" ")[0] : "N/A";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500 mb-1">Total Reports</p><h3 className={`text-3xl font-bold ${COLORS.navy}`}>{totalReports}</h3></div>
        <div className={`w-12 h-12 ${COLORS.bgLight} rounded-full flex items-center justify-center ${COLORS.navy}`}><FileText size={24} /></div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500 mb-1">Active Interns</p><h3 className={`text-3xl font-bold ${COLORS.navy}`}>{activeInternsCount}</h3></div>
        <div className={`w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600`}><Users size={24} /></div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500 mb-1">Top Contributor</p><h3 className={`text-xl font-bold ${COLORS.navy}`}>{mostActiveInternDisplay}</h3><p className={`text-xs ${COLORS.accent} font-medium mt-1`}>{internStats.length > 0 ? `${internStats[0].count} reports` : "No data"}</p></div>
        <div className={`w-12 h-12 ${COLORS.bgNavy} rounded-full flex items-center justify-center text-white`}><TrendingUp size={24} /></div>
      </div>
    </div>
  );
};

// =========================================================
// SUB-COMPONENT: SUBMISSION STATUS LIST
// =========================================================
const SubmissionStatusList = ({ interns, reports, isManager, currentUser }) => {
  const submissionData = interns.map((intern) => {
    const submittedCount = reports.filter((r) => r.userId === intern.id && r.type === "weekly").length;
    return { ...intern, submittedCount };
  });

  const displayData = isManager ? submissionData : submissionData.filter(i => i.id === currentUser.uid);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm animate-fadeIn">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#002B66] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#0094FF]" />
            {isManager ? "Intern Submission Status" : "My Submission Status"}
        </h3>
      </div>
      
      {displayData.length === 0 ? (
         <div className="text-center py-10 text-gray-500 italic">No interns found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Intern Name</th>
                      <th className="px-6 py-3 text-center text-xs font-bold uppercase text-gray-500 w-48">Submitted Reports</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((intern) => (
                      <tr key={intern.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{intern.name}</td>
                          <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${intern.submittedCount > 0 ? 'bg-blue-100 text-[#0094FF]' : 'bg-gray-100 text-gray-500'}`}>
                                  {intern.submittedCount} {intern.submittedCount === 1 ? 'Report' : 'Reports'}
                              </span>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =========================================================
// SUB-COMPONENT: CREATE REPORT MODAL
// =========================================================
const CreateReportModal = ({ form, setForm, handleSubmit, submitting, isOpen, onClose }) => {
  const [uploadingImage, setUploadingImage] = useState(null);

  if (!isOpen) return null;

  const handleImageChange = async (index, file) => {
    setUploadingImage(index);
    const imageUrl = await uploadImageToCloudinary(file);
    setUploadingImage(null);
    if (imageUrl) {
      const newImages = [...form.images];
      newImages[index] = imageUrl;
      setForm((prev) => ({ ...prev, images: newImages }));
    }
  };

  const uploadedCount = form.images.filter((i) => i).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 text-[#0094FF] rounded-lg"><Plus size={20} /></div>
                 <h3 className="text-xl font-bold text-[#002B66]">Create New Report</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-md"><X className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Report Type</label>
                <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF] transition-all bg-gray-50"><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Report Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF] transition-all" placeholder="e.g. Week 1 Accomplishments" required />
            </div>
          </div>

          {form.type === "weekly" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label><DatePicker selected={form.startDate} onChange={(date) => setForm((prev) => ({ ...prev, startDate: date }))} dateFormat="MMM dd yyyy" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF]" required /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">End Date</label><DatePicker selected={form.endDate} onChange={(date) => setForm((prev) => ({ ...prev, endDate: date }))} dateFormat="MMM dd yyyy" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF]" required /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Month</label>
                <select value={form.month} onChange={(e) => setForm((prev) => ({ ...prev, month: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF] bg-gray-50">
                    {MONTHS.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Year</label><select value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF] bg-gray-50">{["0", "1", "2"].map((i) => (<option key={i} value={String(getCurrentYear() - i)}>{getCurrentYear() - i}</option>))}</select></div>
            </div>
          )}

          <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Activities & Content</label>
              <textarea value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Describe your tasks and accomplishments..." rows="6" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0094FF]" />
          </div>

          <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Evidence / Attachments (Attach 1-3 images)</label>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[0, 1, 2].map((index) => (
                    <div key={index} className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center relative bg-gray-50 flex-shrink-0 hover:border-[#0094FF] transition-colors cursor-pointer">
                    {uploadingImage === index ? <Loader2 className="animate-spin text-[#0094FF]" /> : form.images[index] ? <img src={form.images[index]} className="w-full h-full object-cover rounded-xl" /> : <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center"><Plus size={24} className="text-gray-400" /><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files.length && handleImageChange(index, e.target.files[0])} /></label>}
                    </div>
                ))}
              </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" disabled={submitting || uploadedCount === 0} className="w-full py-3.5 bg-[#0094FF] text-white rounded-xl font-bold shadow-md shadow-blue-200 flex justify-center items-center disabled:opacity-50 hover:bg-[#002B66] hover:shadow-lg transition-all active:scale-[0.98]">
                {submitting ? 'Submitting...' : <><Send className="w-5 h-5 mr-2" /> Submit Report</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
function ReportsTab({ user }) {
  const [activeTab, setActiveTab] = useState("accomplishments");
  const [allReports, setAllReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [internList, setInternList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilterIntern, setSelectedFilterIntern] = useState("All");
  const [submitting, setSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [viewingReport, setViewingReport] = useState(null);

  const [form, setForm] = useState({
    title: "", content: "", type: "weekly",
    startDate: new Date(), endDate: new Date(),
    month: MONTHS[new Date().getMonth()],
    year: String(getCurrentYear()), images: [null, null, null],
  });

  const isManager = ["supervisor", "admin", "coordinator"].includes(user.role);
  const canSelect = isManager || user.role === "intern";

  useEffect(() => {
    if (isManager) {
      const q = query(collection(db, "users"), where("role", "==", "intern"));
      getDocs(q).then((snap) => {
        let interns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (user.role === 'coordinator' && user.departmentId) {
            interns = interns.filter(i => i.departmentId === user.departmentId);
        } else if (user.role === 'supervisor') {
            interns = interns.filter(i => i.supervisorId === user.uid);
        }

        setInternList(interns.map((i) => ({ 
            id: i.id, 
            name: i.firstName ? `${i.firstName} ${i.lastName}` : i.name || "Intern", 
            supervisorName: i.supervisorName 
        })));
      });
    }
  }, [user, isManager]);

  useEffect(() => {
    let q = isManager ? query(collection(db, "reports"), orderBy("createdAt", "desc")) : query(collection(db, "reports"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (isManager) setAllReports(data); else setMyReports(data);
    });
    return () => unsub();
  }, [user, isManager]);

  const relevantReports = useMemo(() => {
    if (!isManager) return myReports;
    if (user.role === "admin") return allReports;
    if (user.role === "coordinator" || user.role === "supervisor") {
      const assignedInternIds = new Set(internList.map((i) => i.id));
      return allReports.filter((report) => assignedInternIds.has(report.userId));
    }
    return [];
  }, [isManager, user.role, allReports, myReports, internList]);

  const resolveSupervisorName = (reportUserId) => {
    if (user.role === "supervisor") return user.firstName ? `${user.firstName} ${user.lastName}` : user.name;
    if (user.role === "intern") return user.supervisorName || "Unassigned";
    const intern = internList.find(i => i.id === reportUserId);
    return intern?.supervisorName || "_______________________";
  };

  const filteredReports = relevantReports.filter((r) => {
      const matchesSearch = r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIntern = selectedFilterIntern === "All" ? true : r.userId === selectedFilterIntern;
      return matchesSearch && matchesIntern;
  });

  const toggleReportSelection = (id) => setSelectedReportIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSelectAll = () => {
    if (selectedReportIds.length === filteredReports.length) setSelectedReportIds([]);
    else setSelectedReportIds(filteredReports.map(r => r.id));
  };

  const handleBulkPrint = () => {
    const element = document.getElementById("accomplishment-export-template");
    if (!element) return toast.error("Nothing to print");
    const content = element.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups to print");
    printWindow.document.write(`<html><head><title>Print Reports</title><style>body { margin: 0; padding: 0; background-color: white; } img { max-width: 100%; height: auto; } @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; @page { size: auto; margin: 0; } }</style></head><body>${content}<script>window.onload = function() { setTimeout(function() { window.focus(); window.print(); }, 500); };</script></body></html>`);
    printWindow.document.close();
  };

  const handleBulkPDF = async () => {
    const template = document.getElementById("accomplishment-export-template");
    if (!template) { toast.error("Export element not found"); return; }
    const reportElements = template.querySelectorAll(".printable-report-item");
    if (!reportElements || reportElements.length === 0) { toast.error("No reports to export"); return; }
    toast.loading(`Generating PDF (${reportElements.length} pages)...`, { id: "bulk_pdf" });
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    try {
        for (let i = 0; i < reportElements.length; i++) {
            const canvas = await html2canvas(reportElements[i], { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/png");
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
        }
        pdf.save(`OJT_Reports_Batch_${new Date().getTime()}.pdf`);
        toast.dismiss("bulk_pdf"); toast.success("PDF Downloaded");
    } catch (err) { console.error(err); toast.dismiss("bulk_pdf"); toast.error("PDF Generation failed"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const period = form.type === "weekly" 
        ? `${formatToCustomDate(form.startDate)} to ${formatToCustomDate(form.endDate)}` 
        : `${form.month} ${form.year}`;
        
    try {
      await addDoc(collection(db, "reports"), {
        title: form.title, content: form.content, type: form.type, date: period, images: form.images.filter((i) => i),
        userId: user.uid, userName: user.firstName ? `${user.firstName} ${user.lastName}` : user.name || "Intern",
        createdAt: serverTimestamp(), status: "submitted",
      });
      toast.success("Submitted Successfully!");
      setForm({ ...form, title: "", content: "", images: [null, null, null] });
      setIsCreateModalOpen(false); 
    } catch (err) { toast.error("Error submitting"); } finally { setSubmitting(false); }
  };

  return (
    <div className="w-full max-w-full space-y-6 pb-20">
      <Toaster position="top-right" />
      
      {/* HIDDEN TEMPLATE FOR BULK EXPORT */}
      <div id="accomplishment-export-template" style={{ position: "absolute", top: "-9999px", left: "-9999px", width: "210mm", zIndex: -1 }}>
        <ReportPrint reports={relevantReports.filter(r => selectedReportIds.includes(r.id)).map(r => ({ ...r, supervisorName: resolveSupervisorName(r.userId) }))} />
      </div>

      <CreateReportModal form={form} setForm={setForm} handleSubmit={handleSubmit} submitting={submitting} isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Unified view for accomplishments and official time records.</p>
        </div>
        {user.role === 'intern' && (
            <div className="flex gap-2">
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-white text-[#0094FF] border border-[#0094FF] px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all hover:bg-blue-50 active:scale-95">
                    <Plus className="w-5 h-5" /><span>Create Report</span>
                </button>
            </div>
        )}
      </div>

      {/* --- DASHBOARD --- */}
      {isManager && activeTab === "accomplishments" && <SupervisorDashboard relevantReports={relevantReports} />}

      {/* --- PILL TABS NAVIGATION --- */}
      <div className="flex space-x-2 bg-white p-1 rounded-lg border border-gray-200 w-fit mb-6 shadow-sm overflow-x-auto">
        <button onClick={() => setActiveTab("accomplishments")} className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${activeTab === "accomplishments" ? "bg-[#0094FF] text-white shadow" : "text-gray-600 hover:bg-gray-50"}`}>
            <FileText size={18} /> <span>Inbox & History</span>
        </button>
        {isManager && (
            <button onClick={() => setActiveTab("status")} className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${activeTab === "status" ? "bg-[#0094FF] text-white shadow" : "text-gray-600 hover:bg-gray-50"}`}>
                <CheckSquare size={18} /> <span>Submission Status</span>
            </button>
        )}
        <button onClick={() => setActiveTab("attendance")} className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${activeTab === "attendance" ? "bg-[#0094FF] text-white shadow" : "text-gray-600 hover:bg-gray-50"}`}>
            <Calendar size={18} /> <span>Attendance DTR</span>
        </button>
      </div>

      {/* --- TAB CONTENT ROUTING --- */}
      {activeTab === "attendance" && (
          <AttendanceDTR user={user} interns={internList} isManager={isManager} />
      )}

      {activeTab === "status" && (
          <SubmissionStatusList interns={internList} reports={relevantReports} isManager={isManager} currentUser={user} />
      )}

      {activeTab === "accomplishments" && (
        <div className="space-y-6 animate-fadeIn">
            
            {/* VIEW DETAILS MODAL */}
            {viewingReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex gap-4 items-start">
                        <div className="p-3 bg-blue-100 text-[#0094FF] rounded-xl mt-1">
                          <FileText size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-2xl font-black text-[#002B66]">{viewingReport.title}</h3>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${viewingReport.type === "weekly" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-purple-200 text-purple-700 bg-purple-50"}`}>
                              {viewingReport.type}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-500">
                            Submitted by <span className="text-gray-900 font-bold">{viewingReport.userName}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar size={12} /> {formatDisplayDateString(viewingReport.date)}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setViewingReport(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X size={24} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50/50">
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Activities & Tasks</h4>
                        <div className="prose max-w-none text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">
                          {viewingReport.content}
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Attached Evidence</h4>
                        {viewingReport.images?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {viewingReport.images.map((img, i) => (
                                <a key={i} href={img} target="_blank" rel="noreferrer" className="group block relative rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-video bg-gray-100">
                                  <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={`Evidence ${i + 1}`} />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transition-opacity duration-300">View Full Size</span>
                                  </div>
                                </a>
                            ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No images attached.</p>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
            )}

            {/* --- EXPORT INSTRUCTION BANNER --- */}
            {canSelect && selectedReportIds.length === 0 && filteredReports.length > 0 && (
                <div className="bg-blue-50 text-blue-700 p-3.5 rounded-lg text-sm flex items-start gap-3 border border-blue-100 animate-in fade-in">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <strong>Export Instructions:</strong> Want to print or download reports? Simply select the checkboxes next to the reports below to reveal the Print and PDF Export buttons.
                    </div>
                </div>
            )}

            {/* SEARCH AND FILTER ACTIONS */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                
                <div className="flex w-full lg:flex-1 gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-[#0094FF] w-5 h-5"/>
                        <input type="text" placeholder="Search reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0094FF] focus:ring-1 focus:ring-[#0094FF] transition-all"/>
                    </div>
                    
                    {/* DROPDOWN FILTER ONLY VISIBLE TO MANAGERS */}
                    {isManager && (
                        <select 
                            value={selectedFilterIntern} 
                            onChange={(e) => setSelectedFilterIntern(e.target.value)}
                            className="w-1/3 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#0094FF] focus:ring-1 focus:ring-[#0094FF] bg-white cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                        >
                            <option value="All">All Interns</option>
                            {internList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    )}
                </div>
                
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    {(isManager || user.role === "intern") && selectedReportIds.length > 0 ? (
                        <div className="flex gap-2 animate-in slide-in-from-right-4 fade-in w-full">
                            <button onClick={handleBulkPDF} className="flex-1 lg:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex justify-center items-center gap-2 shadow-sm text-sm font-medium"><Download size={16} /> PDF</button>
                            <button onClick={handleBulkPrint} className="flex-1 lg:flex-none px-4 py-2 bg-[#002B66] text-white rounded-lg hover:bg-blue-900 flex justify-center items-center gap-2 shadow-sm text-sm font-medium"><Printer size={16} /> Print ({selectedReportIds.length})</button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 hidden lg:flex items-center gap-1.5 italic px-2">
                            Select reports to enable export
                        </div>
                    )}
                </div>
            </div>

            {/* LIST SECTION */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-[#002B66] flex items-center gap-2">
                        <Clock className="text-[#0094FF] w-5 h-5"/> 
                        {isManager ? "Recently Submitted" : "My Recent Submissions"}
                    </h3>
                    {canSelect && filteredReports.length > 0 && (
                        <button onClick={handleSelectAll} className="text-sm font-bold text-[#0094FF] hover:underline flex items-center gap-1">
                            <CheckSquare size={16}/> Select All
                        </button>
                    )}
                </div>

                {filteredReports.length === 0 ? <div className="text-center py-12 text-gray-400 italic border border-dashed border-gray-200 rounded-lg">No reports found.</div> : (
                    <div className="space-y-3">
                        {filteredReports.map(report => (
                            <div key={report.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg transition-all bg-white border ${selectedReportIds.includes(report.id) ? 'border-[#0094FF] shadow-md bg-blue-50/10' : 'border-gray-100 hover:shadow-md'}`}>
                                <div className="flex items-center gap-4 mb-3 md:mb-0 w-full md:w-auto">
                                    {canSelect && (
                                        <button onClick={() => toggleReportSelection(report.id)} className="text-gray-300 hover:text-[#0094FF] transition-colors shrink-0">
                                            {selectedReportIds.includes(report.id) ? <CheckSquare className="text-[#0094FF]" size={22} /> : <Square size={22} />}
                                        </button>
                                    )}
                                    
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => canSelect ? toggleReportSelection(report.id) : setViewingReport(report)}>
                                        <h4 className="font-bold text-gray-900 truncate pr-4">{report.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">SUBMITTED</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${report.type === "weekly" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-purple-200 text-purple-700 bg-purple-50"}`}>{report.type}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="font-medium text-gray-700 truncate">{report.userName}</span>
                                            <span className="hidden sm:inline">•</span>
                                            {/* Uses the formatter here so even old database strings show cleanly */}
                                            <span className="font-medium text-gray-500 whitespace-nowrap">{formatDisplayDateString(report.date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 pl-14 md:pl-0">
                                    <button onClick={() => setViewingReport(report)} className="w-full md:w-auto px-4 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-50 hover:text-[#0094FF] hover:border-[#0094FF] font-medium transition-colors">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

export default ReportsTab;