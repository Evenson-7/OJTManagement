// fileName: ReportsTab.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  collection, query, where, getDocs, addDoc, doc, 
  serverTimestamp, onSnapshot, orderBy, getDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import toast, { Toaster } from "react-hot-toast";
import {
  FileText, Plus, Calendar, User, Search, Filter, 
  Send, X, Loader2, Printer, BarChart2, TrendingUp, 
  Users, Download, CheckSquare, Square
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- PDF Generation Imports ---
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

// --- IMPORT NEW COMPONENT ---
import ReportPrint from "../../components/ReportPrint";

// --- Configuration ---
const cloudName = "dixpsqyhx";
const uploadPreset = "Profile";

// --- COLOR PALETTE CONSTANTS ---
const COLORS = {
  primary: "text-[#42A5FF]", // Sky Blue
  accent: "text-[#0094FF]",  // Deep Blue
  navy: "text-[#002B66]",    // Navy Blue
  bgLight: "bg-[#BDE4F7]",   // Light Cyan
  bgNavy: "bg-[#002B66]",    // Navy Background
  btnPrimary: "bg-[#0094FF] hover:bg-blue-600",
};

// --- Styling Constants ---
const PRIMARY_FOCUS_RING = "focus:ring-[#0094FF] focus:border-[#0094FF]";

// ==========================================
// HELPER: LOCAL DATE STRING
// ==========================================
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ==========================================
// UTILITY: Print Official DTR (MATCHING "DESIGN 1")
// ==========================================
const printWebDTR = (internName, startDate, endDate, logs, supervisorName) => {
    const printWindow = window.open("", "_blank");
    const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    const totalHours = logs
        .reduce((sum, log) => sum + (parseFloat(log.hoursWorked) || 0), 0)
        .toFixed(2);
    
    const finalSupervisor = supervisorName && supervisorName !== "Unassigned" 
        ? supervisorName 
        : "_______________________";

    printWindow.document.write(`
        <html>
            <head>
                <title>DTR - ${internName}</title>
                <style>
                    /* PAGE SETUP */
                    @page { size: A4 portrait; margin: 10mm; } 
                    body { 
                        font-family: 'Arial', sans-serif; 
                        -webkit-print-color-adjust: exact; 
                        color: #000; 
                        margin: 0; 
                        padding: 0;
                    }

                    /* HEADER */
                    .header { text-align: center; margin-bottom: 20px; }
                    .title { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; }
                    .sub-title { font-size: 12px; color: #444; margin-top: 5px; font-style: italic; }
                    .header-line { border-bottom: 2px solid #000; margin-top: 10px; margin-bottom: 15px; }

                    /* META INFO BOX */
                    .meta-box {
                        width: 100%;
                        border: 1px solid #000;
                        padding: 8px;
                        margin-bottom: 10px;
                        font-size: 11px;
                        font-weight: 700;
                        display: flex;
                        justify-content: space-between;
                        background-color: #f3f4f6;
                    }

                    /* TABLE DESIGN (MATCHING IMAGE 1) */
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: 11px; 
                        table-layout: fixed; 
                    }
                    
                    /* BOLD GRAY HEADERS */
                    th { 
                        background-color: #d1d5db !important; /* The Grey Color */
                        color: #000 !important;
                        font-weight: 900; 
                        text-transform: uppercase; 
                        border: 1px solid #000; 
                        height: 30px; 
                        padding: 0;
                        -webkit-print-color-adjust: exact; 
                    }
                    
                    /* TALLER ROWS TO FILL PAGE */
                    td { 
                        border: 1px solid #000; 
                        padding: 0 5px; 
                        text-align: center; 
                        vertical-align: middle; 
                        height: 26px; /* Optimized height for 31 days */
                        white-space: nowrap; 
                        overflow: hidden;
                    }

                    /* STATUS COLORS */
                    .weekend { background-color: #f9fafb; color: #9ca3af; font-style: italic; }
                    .absent { color: #dc2626; background-color: #fee2e2; font-weight: bold; }
                    .time-text { font-family: 'Courier New', monospace; font-size: 10px; font-weight: 600; }

                    /* FOOTER */
                    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; page-break-inside: avoid; }
                    .sign-box { text-align: center; width: 40%; }
                    .sign-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-weight: bold; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">DAILY TIME RECORD</div>
                    <div class="sub-title">OJT Management System</div>
                    <div class="header-line"></div>
                </div>

                <div class="meta-box">
                    <span>NAME: ${internName}</span>
                    <span>PERIOD: ${dateRange}</span>
                    <span>TOTAL: ${totalHours} HRS</span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 8%;">DATE</th>
                            <th style="width: 15%;">DAY</th>
                            <th style="width: 47%;">TIME LOG</th>
                            <th style="width: 15%;">HOURS</th>
                            <th style="width: 15%;">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map((log) => {
                            const dateObj = new Date(log.date);
                            const dayNum = dateObj.getDate();
                            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
                            const isWeekend = log.status === "Weekend";
                            const isAbsent = log.status === "Absent";
                            
                            let timeDisplay = "";
                            if (log.morningIn || log.morningOut) timeDisplay += `AM:${log.morningIn||'--'}-${log.morningOut||'--'} `;
                            if (log.afternoonIn || log.afternoonOut) timeDisplay += `PM:${log.afternoonIn||'--'}-${log.afternoonOut||'--'}`;
                            if (!timeDisplay && (log.timeIn || log.timeOut)) timeDisplay = `${log.timeIn||'--'} - ${log.timeOut||'--'}`;
                            if (!timeDisplay && !isWeekend && !isAbsent) timeDisplay = "";

                            const rowClass = isWeekend ? "weekend" : isAbsent ? "absent" : "";

                            return `
                                <tr class="${rowClass}">
                                    <td>${dayNum}</td>
                                    <td style="text-align: left; padding-left: 10px;">${dayName}</td>
                                    <td class="time-text">${timeDisplay}</td>
                                    <td style="font-weight: bold;">${log.hoursWorked > 0 ? log.hoursWorked : ""}</td>
                                    <td>${log.status}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>

                <div class="footer">
                    <div class="sign-box">
                        I certify the above report is true and correct.
                        <div class="sign-line">${internName}</div>
                        <div>Intern Signature</div>
                    </div>
                    <div class="sign-box">
                        Certified Correct:
                        <div class="sign-line">${finalSupervisor}</div>
                        <div>Supervisor / Certifier</div>
                    </div>
                </div>

                <script>
                    window.onload = function() { setTimeout(function() { window.print(); }, 500); }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
};

const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      return (await response.json()).secure_url;
    } catch (error) {
      console.error(error);
      return null;
    }
};

const getCurrentYear = () => new Date().getFullYear();

// =========================================================
// MANAGER DASHBOARD
// =========================================================
const SupervisorDashboard = ({ relevantReports }) => {
  const totalReports = relevantReports.length;

  const internStats = useMemo(() => {
    const stats = {};
    relevantReports.forEach((r) => {
      if (!stats[r.userId]) {
        stats[r.userId] = { name: r.userName, count: 0 };
      }
      stats[r.userId].count += 1;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [relevantReports]);

  const activeInternsCount = internStats.length;
  const mostActiveInternFull =
    internStats.length > 0 ? internStats[0].name : "N/A";
  const mostActiveInternDisplay =
    mostActiveInternFull !== "N/A" ? mostActiveInternFull.split(" ")[0] : "N/A";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Total Reports */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Reports</p>
          <h3 className={`text-3xl font-bold ${COLORS.navy}`}>{totalReports}</h3>
        </div>
        <div className={`w-12 h-12 ${COLORS.bgLight} rounded-full flex items-center justify-center ${COLORS.navy}`}>
          <FileText size={24} />
        </div>
      </div>

      {/* Active Interns */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Active Interns</p>
          <h3 className={`text-3xl font-bold ${COLORS.navy}`}>{activeInternsCount}</h3>
        </div>
        <div className={`w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600`}>
          <Users size={24} />
        </div>
      </div>

      {/* Top Contributor */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Top Contributor</p>
          <h3 className={`text-xl font-bold ${COLORS.navy}`}>{mostActiveInternDisplay}</h3>
          <p className={`text-xs ${COLORS.accent} font-medium mt-1`}>
            {internStats.length > 0 ? `${internStats[0].count} reports` : "No data"}
          </p>
        </div>
        <div className={`w-12 h-12 ${COLORS.bgNavy} rounded-full flex items-center justify-center text-white`}>
          <TrendingUp size={24} />
        </div>
      </div>
    </div>
  );
};

// =========================================================
// SECTION: ATTENDANCE DTR GENERATOR
// =========================================================
const AttendanceDTRSection = ({ user, interns, isManager }) => {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [selectedInternId, setSelectedInternId] = useState(isManager ? "" : user.uid);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tracedSupervisorName, setTracedSupervisorName] = useState("Unassigned");

  useEffect(() => {
    if (isManager && interns.length > 0 && !selectedInternId) {
      setSelectedInternId(interns[0].id);
    }
  }, [isManager, interns, selectedInternId]);

  useEffect(() => {
    const traceSupervisor = async () => {
      setTracedSupervisorName("Loading...");
      if (user.role === "supervisor") {
        const myName = user.firstName ? `${user.firstName} ${user.lastName}` : user.name || "Unassigned";
        setTracedSupervisorName(myName);
        return;
      }
      if (selectedInternId) {
        try {
          const internRef = doc(db, "users", selectedInternId);
          const internSnap = await getDoc(internRef);
          if (internSnap.exists()) {
            const internData = internSnap.data();
            setTracedSupervisorName(internData.supervisorName || "Unassigned"); 
          }
        } catch (error) { console.error(error); }
      }
    };
    traceSupervisor();
  }, [selectedInternId, user.role]);

  const iName = isManager ? interns.find((i) => i.id === selectedInternId)?.name || "Intern" : user.firstName ? `${user.firstName} ${user.lastName}` : user.name;

  const handlePrint = () => {
    printWebDTR(iName, startDate, endDate, logs, tracedSupervisorName);
  };

  // --- PDF EXPORT (IDENTICAL TO PRINT DESIGN) ---
  const handleExportPDF = () => {
    const element = document.createElement("div");
    
    // CONTAINER: 210mm x 297mm (A4) with 10mm padding
    element.innerHTML = `
      <div style="width: 210mm; min-height: 297mm; padding: 10mm; font-family: Arial, sans-serif; background: white; color: black; box-sizing: border-box; display: flex; flex-direction: column;">
        
        <div style="text-align: center; margin-bottom: 20px;">
           <h2 style="margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">DAILY TIME RECORD</h2>
           <p style="margin: 5px 0 0 0; font-size: 12px; color: #444; font-style: italic;">OJT Management System</p>
           <div style="border-bottom: 2px solid black; margin-top: 10px; margin-bottom: 15px;"></div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; font-weight: 700; border: 1px solid black; padding: 8px; background-color: #f3f4f6;">
           <span>NAME: ${iName}</span>
           <span>PERIOD: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</span>
           <span>TOTAL: ${logs.reduce((sum, log) => sum + (parseFloat(log.hoursWorked) || 0), 0).toFixed(2)} HRS</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; flex-grow: 1;">
           <thead>
              <tr>
                 <th style="background-color: #d1d5db; color: black; font-weight: 900; text-transform: uppercase; border: 1px solid black; height: 30px; padding: 0; width: 8%;">DATE</th>
                 <th style="background-color: #d1d5db; color: black; font-weight: 900; text-transform: uppercase; border: 1px solid black; height: 30px; padding: 0; width: 15%;">DAY</th>
                 <th style="background-color: #d1d5db; color: black; font-weight: 900; text-transform: uppercase; border: 1px solid black; height: 30px; padding: 0; width: 47%;">TIME LOG</th>
                 <th style="background-color: #d1d5db; color: black; font-weight: 900; text-transform: uppercase; border: 1px solid black; height: 30px; padding: 0; width: 15%;">HOURS</th>
                 <th style="background-color: #d1d5db; color: black; font-weight: 900; text-transform: uppercase; border: 1px solid black; height: 30px; padding: 0; width: 15%;">STATUS</th>
              </tr>
           </thead>
           <tbody>
              ${logs.map(log => {
                  const d = new Date(log.date);
                  const isWeekend = log.status === "Weekend";
                  const isAbsent = log.status === "Absent";
                  let time = "";
                  
                  if (log.morningIn || log.morningOut) time += `AM:${log.morningIn||'--'}-${log.morningOut||'--'} `;
                  if (log.afternoonIn || log.afternoonOut) time += `PM:${log.afternoonIn||'--'}-${log.afternoonOut||'--'}`;
                  if (!time && (log.timeIn || log.timeOut)) time = `${log.timeIn||'--'} - ${log.timeOut||'--'}`;
                  
                  // Row Styling
                  const bg = isWeekend ? "#f9fafb" : isAbsent ? "#fee2e2" : "transparent";
                  const color = isWeekend ? "#9ca3af" : isAbsent ? "#dc2626" : "black";
                  const weight = isAbsent ? "bold" : "normal";
                  const style = isWeekend ? "italic" : "normal";

                  return `
                    <tr style="background-color: ${bg}; color: ${color}; font-weight: ${weight}; font-style: ${style};">
                       <td style="border: 1px solid black; padding: 0 4px; text-align: center; height: 26px;">${d.getDate()}</td>
                       <td style="border: 1px solid black; padding: 0 4px 0 10px; text-align: left;">${d.toLocaleDateString('en-US', {weekday:'long'})}</td>
                       <td style="border: 1px solid black; padding: 0 4px; text-align: center; font-family: monospace; font-size: 10px; font-weight: 600; color: black;">${time}</td>
                       <td style="border: 1px solid black; padding: 0 4px; text-align: center; font-weight: bold; color: black;">${log.hoursWorked > 0 ? log.hoursWorked : ''}</td>
                       <td style="border: 1px solid black; padding: 0 4px; text-align: center;">${log.status}</td>
                    </tr>
                  `
              }).join('')}
           </tbody>
        </table>
         
         <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px;">
            <div style="text-align: center; width: 40%;">
                <div style="margin-bottom: 40px;">I certify the above report is true and correct.</div>
                <div style="border-top: 1px solid black; padding-top: 5px; font-weight: bold; text-transform: uppercase;">${iName}</div>
                <div>Intern Signature</div>
            </div>
            <div style="text-align: center; width: 40%;">
                <div style="margin-bottom: 40px;">Certified Correct:</div>
                <div style="border-top: 1px solid black; padding-top: 5px; font-weight: bold; text-transform: uppercase;">${tracedSupervisorName}</div>
                <div>Supervisor / Certifier</div>
            </div>
         </div>
      </div>
    `;
    
    element.style.position = "absolute";
    element.style.top = "0";
    element.style.left = "-9999px";
    document.body.appendChild(element);

    toast.loading("Generating PDF...", { id: "dtr_pdf" });

    html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
        document.body.removeChild(element);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;
        
        let finalWidth = pdfWidth;
        let finalHeight = pdfWidth / imgRatio;

        // Auto-scale if height exceeds A4 (prevents cutting)
        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = finalHeight * imgRatio;
        }

        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, "PNG", xOffset, 0, finalWidth, finalHeight);
        pdf.save(`DTR_${iName.replace(/\s+/g, "_")}.pdf`);
        toast.dismiss("dtr_pdf");
        toast.success("PDF Downloaded!");
    }).catch(err => {
        console.error(err);
        if(document.body.contains(element)) document.body.removeChild(element);
        toast.dismiss("dtr_pdf");
        toast.error("Export Failed");
    });
  };

  const generateReport = async () => {
    if (!selectedInternId) return toast.error("Please select an intern.");
    setLoading(true);
    setLogs([]); 
    try {
      const q = query(collection(db, "attendance"), where("internId", "==", selectedInternId), orderBy("date", "asc"));
      const snapshot = await getDocs(q);
      const rawLogs = snapshot.docs.map((doc) => doc.data());
      
      const filteredLogs = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = getLocalDateString(d);
        const log = rawLogs.find((r) => r.date === dateKey || (r.date && r.date.startsWith && r.date.startsWith(dateKey)));

        if (log) {
          filteredLogs.push({ 
            date: dateKey, 
            morningIn: log.morningIn || null, morningOut: log.morningOut || null, 
            afternoonIn: log.afternoonIn || null, afternoonOut: log.afternoonOut || null, 
            timeIn: log.timeIn || null, timeOut: log.timeOut || null,
            hoursWorked: log.hoursWorked || 0, status: log.status || "Present" 
          });
        } else {
          const day = d.getDay();
          const isWeekend = day === 0 || day === 6;
          filteredLogs.push({ date: dateKey, hoursWorked: 0, status: isWeekend ? "Weekend" : "Absent" });
        }
      }
      setLogs(filteredLogs);
      if (filteredLogs.length > 0) toast.success("Records loaded!");
    } catch (error) { console.error(error); toast.error("Failed to load attendance."); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className={COLORS.accent} /> Attendance Record
          </h3>
          <p className="text-sm text-gray-500">Official time logs and calculated hours.</p>
        </div>
        {logs.length > 0 && (
          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-colors">
              <Download size={18} /> Export PDF
            </button>
            <button onClick={handlePrint} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black flex items-center justify-center gap-2 shadow-sm transition-colors">
              <Printer size={18} /> Print
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {isManager && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Intern</label>
            <select className={`w-full p-2 border border-gray-300 rounded-md text-sm ${PRIMARY_FOCUS_RING}`} value={selectedInternId} onChange={(e) => setSelectedInternId(e.target.value)}>
              {interns.length === 0 && <option value="">Loading...</option>}
              {interns.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
            </select>
          </div>
        )}
        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label><DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="MMM d, yyyy" className={`w-full p-2 border border-gray-300 rounded-md text-sm ${PRIMARY_FOCUS_RING}`} /></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label><DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="MMM d, yyyy" className={`w-full p-2 border border-gray-300 rounded-md text-sm ${PRIMARY_FOCUS_RING}`} /></div>
        <div className="flex items-end"><button onClick={generateReport} disabled={loading} className={`w-full py-2 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 ${COLORS.btnPrimary}`}>{loading ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />} Load Records</button></div>
      </div>

      {logs.length > 0 ? (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 w-16">Date</th>
                <th className="px-6 py-4 font-bold text-gray-700 w-32">Day</th>
                <th className="px-6 py-4 font-bold text-gray-700">Time Log</th>
                <th className="px-6 py-4 font-bold text-center text-gray-700">Total Hours</th>
                <th className="px-6 py-4 font-bold text-right text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {logs.map((log, index) => {
                const dateObj = new Date(log.date);
                const isWeekend = log.status === "Weekend";
                const isAbsent = log.status === "Absent";
                
                const hasMorning = log.morningIn || log.morningOut;
                const hasAfternoon = log.afternoonIn || log.afternoonOut;
                const hasGeneric = log.timeIn || log.timeOut;

                return (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors ${isWeekend ? "bg-gray-50/50" : isAbsent ? "bg-red-50/30" : ""}`}>
                    <td className="px-6 py-4 font-bold text-gray-700">{dateObj.getDate()}</td>
                    <td className="px-6 py-4 text-gray-500">{dateObj.toLocaleDateString("en-US", { weekday: "long" })}</td>
                    <td className="px-6 py-4">
                        {(isWeekend || isAbsent) ? (
                            <span className="text-gray-300 text-xs italic">--</span>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {hasMorning && <div className="text-xs text-gray-600"><span className="font-semibold text-blue-600">AM:</span> {log.morningIn} - {log.morningOut}</div>}
                                {hasAfternoon && <div className="text-xs text-gray-600"><span className="font-semibold text-orange-600">PM:</span> {log.afternoonIn} - {log.afternoonOut}</div>}
                                {!hasMorning && !hasAfternoon && hasGeneric && <div className="text-xs text-gray-600"><span className="font-semibold">Shift:</span> {log.timeIn} - {log.timeOut}</div>}
                                {!hasMorning && !hasAfternoon && !hasGeneric && <span className="text-gray-400 text-xs">No Time Logged</span>}
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-gray-900">{log.hoursWorked > 0 ? log.hoursWorked : "-"}</td>
                    <td className="px-6 py-4 text-right"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === "Present" ? "bg-green-100 text-green-800" : log.status === "Absent" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-500"}`}>{log.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Calendar size={48} className="mb-4 text-gray-300" />
            <p>Select dates and click "Load Records" to view attendance.</p>
        </div>
      )}
    </div>
  );
};

const CreateReportForm = ({ user, form, setForm, handleSubmit, submitting }) => {
  const [uploadingImage, setUploadingImage] = useState(null);
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
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <h3 className="text-xl font-medium text-gray-900 mb-4">New Report</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className={`w-full px-4 py-2 shadow rounded-lg ${PRIMARY_FOCUS_RING}`}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
          <input type="text" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className={`w-full px-4 py-2 shadow rounded-lg ${PRIMARY_FOCUS_RING}`} placeholder="Title" required />
        </div>
        {form.type === "weekly" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker selected={form.startDate} onChange={(date) => setForm((prev) => ({ ...prev, startDate: date }))} className={`w-full px-4 py-2 shadow rounded-lg ${PRIMARY_FOCUS_RING}`} required placeholderText="Start Date" />
            <DatePicker selected={form.endDate} onChange={(date) => setForm((prev) => ({ ...prev, endDate: date }))} className={`w-full px-4 py-2 shadow rounded-lg ${PRIMARY_FOCUS_RING}`} required placeholderText="End Date" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.month} onChange={(e) => setForm((prev) => ({ ...prev, month: e.target.value }))} className={`w-full px-4 py-2 shadow rounded-lg ${PRIMARY_FOCUS_RING}`}>{["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => (<option key={m} value={m}>{m}</option>))}</select>
            <select value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))} className={`w-full px-4 py-2 shadow rounded-lg ${PRIMARY_FOCUS_RING}`}>{["0", "1", "2"].map((i) => (<option key={i} value={String(getCurrentYear() - i)}>{getCurrentYear() - i}</option>))}</select>
          </div>
        )}
        <textarea value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Content (Min 100 words)..." rows="5" className={`w-full px-4 py-3 shadow rounded-lg ${PRIMARY_FOCUS_RING}`} />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="w-20 h-20 border border-dashed border-gray-300 rounded-lg flex items-center justify-center relative bg-gray-50 flex-shrink-0">
              {uploadingImage === index ? <Loader2 className="animate-spin" /> : form.images[index] ? <img src={form.images[index]} className="w-full h-full object-cover rounded-lg" /> : <label className="cursor-pointer flex flex-col items-center"><Plus size={20} className="text-gray-400" /><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files.length && handleImageChange(index, e.target.files[0])} /></label>}
            </div>
          ))}
        </div>
        <button type="submit" disabled={submitting || form.images.filter((i) => i).length !== 3} className={`w-full text-white py-3 rounded-lg flex items-center justify-center gap-2 ${COLORS.btnPrimary} disabled:opacity-50`}>
           <Send size={18} /> {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

// --- UPDATED REPORT LIST WITH CHECKBOXES & BETTER MODAL ---
const ReportList = ({ reports, isManager, user, selectedIds, onToggleSelect, onSelectAll }) => {
  const [viewingReport, setViewingReport] = useState(null);

  if (reports.length === 0) return <div className="text-center py-10 text-gray-500 bg-white rounded-lg border">No reports found.</div>;

  return (
    <div className="space-y-4">
      {/* SELECTION HEADER */}
      {isManager && reports.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-2">
           <button onClick={onSelectAll} className={`text-xs font-semibold flex items-center gap-1 hover:underline ${COLORS.accent}`}>
             <CheckSquare size={14} /> Select All Shown
           </button>
        </div>
      )}

      {/* IMPROVED VIEW MODAL */}
      {viewingReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
               <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">{viewingReport.title}</h3>
                  <p className="text-sm text-gray-500">Submitted by {viewingReport.userName} • {viewingReport.date}</p>
               </div>
               <button onClick={() => setViewingReport(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <div className="prose max-w-none text-gray-800 leading-relaxed mb-8 whitespace-pre-wrap">{viewingReport.content}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {viewingReport.images?.map((img, i) => (
                   <a key={i} href={img} target="_blank" rel="noreferrer" className="group relative">
                      <img src={img} className="w-full h-48 object-cover rounded-xl shadow-sm group-hover:opacity-90 transition-opacity" alt="Evidence" />
                   </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIST ITEMS */}
      {reports.map((report) => (
        <div key={report.id} className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4 ${selectedIds.includes(report.id) ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200'}`}>
          {isManager && (
             <button onClick={() => onToggleSelect(report.id)} className="mt-1 text-gray-400 hover:text-blue-500 transition-colors">
                {selectedIds.includes(report.id) ? <CheckSquare className={COLORS.accent} size={20} /> : <Square size={20} />}
             </button>
          )}
          <div className="flex-1 cursor-pointer" onClick={() => isManager ? onToggleSelect(report.id) : setViewingReport(report)}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 line-clamp-1">{report.title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase shrink-0 ${report.type === "weekly" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                {report.type}
              </span>
            </div>
            <div className="text-sm text-gray-500 flex flex-wrap gap-4 mt-1">
              {isManager && <span className="flex items-center gap-1"><User size={14} /> {report.userName}</span>}
              <span className="flex items-center gap-1"><Calendar size={14} /> {report.date}</span>
            </div>
          </div>
          <button onClick={() => setViewingReport(report)} className={`hover:bg-blue-50 p-2 rounded-lg transition-colors ${COLORS.accent}`}><FileText size={20} /></button>
        </div>
      ))}
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
  const [submitting, setSubmitting] = useState(false);
  
  // NEW STATE FOR SELECTION
  const [selectedReportIds, setSelectedReportIds] = useState([]);

  const [form, setForm] = useState({
    title: "", content: "", type: "weekly",
    startDate: new Date(), endDate: new Date(),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    year: String(getCurrentYear()), images: [null, null, null],
  });

  const isManager = ["supervisor", "admin", "coordinator"].includes(user.role);

  // 1. Fetch Interns
  useEffect(() => {
    if (isManager) {
      let q;
      if (user.role === "supervisor") {
        q = query(collection(db, "users"), where("role", "==", "intern"), where("supervisorId", "==", user.uid));
      } else {
        q = query(collection(db, "users"), where("role", "==", "intern"));
      }
      getDocs(q).then((snap) => setInternList(snap.docs.map((d) => {
        const data = d.data();
        return { 
            id: d.id, 
            name: data.firstName ? `${data.firstName} ${data.lastName}` : data.name || "Intern",
            supervisorName: data.supervisorName
        };
      })));
    }
  }, [user, isManager]);

  // 2. Fetch Reports
  useEffect(() => {
    let q = isManager ? query(collection(db, "reports"), orderBy("createdAt", "desc")) : query(collection(db, "reports"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (isManager) setAllReports(data); else setMyReports(data);
    });
    return () => unsub();
  }, [user, isManager]);

  // 3. RELEVANT REPORTS logic
  const relevantReports = useMemo(() => {
    if (!isManager) return myReports;
    if (user.role === "admin" || user.role === "coordinator") return allReports;
    if (user.role === "supervisor") {
      const assignedInternIds = new Set(internList.map((i) => i.id));
      return allReports.filter((report) => assignedInternIds.has(report.userId));
    }
    return [];
  }, [isManager, user.role, allReports, myReports, internList]);

  // ⬇️ HELPER: RESOLVE SUPERVISOR NAME FOR PRINT
  const resolveSupervisorName = (reportUserId) => {
    if (user.role === "supervisor") return user.firstName ? `${user.firstName} ${user.lastName}` : user.name;
    if (user.role === "intern") return user.supervisorName || "Unassigned";
    const intern = internList.find(i => i.id === reportUserId);
    return intern?.supervisorName || "_______________________";
  };

  const filteredReports = relevantReports.filter((r) => r.userName?.toLowerCase().includes(searchTerm.toLowerCase()));

  // 4. BULK ACTION HANDLERS
  const toggleReportSelection = (id) => {
    setSelectedReportIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

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
            const element = reportElements[i];
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
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
    const period = form.type === "weekly" ? `${form.startDate.toISOString().slice(0, 10)} to ${form.endDate.toISOString().slice(0, 10)}` : `${form.month}/${form.year}`;
    try {
      await addDoc(collection(db, "reports"), {
        title: form.title, content: form.content, type: form.type, date: period, images: form.images.filter((i) => i),
        userId: user.uid, userName: user.firstName ? `${user.firstName} ${user.lastName}` : user.name || "Intern",
        createdAt: serverTimestamp(), status: "submitted",
      });
      toast.success("Submitted!");
      setForm({ ...form, title: "", content: "", images: [null, null, null] });
    } catch (err) { toast.error("Error submitting"); } finally { setSubmitting(false); }
  };

  return (
    // FIX: Added w-full max-w-full to prevent horizontal overflow
    <div className="w-full max-w-full space-y-6 pb-20">
      <Toaster position="top-right" />
      
      {/* HIDDEN TEMPLATE FOR BULK EXPORT */}
      <div id="accomplishment-export-template" style={{ position: "absolute", top: "-9999px", left: "-9999px", width: "210mm", zIndex: -1 }}>
        <ReportPrint reports={relevantReports.filter(r => selectedReportIds.includes(r.id)).map(r => ({ ...r, supervisorName: resolveSupervisorName(r.userId) }))} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-gray-600">Unified view for accomplishments and official time records.</p></div>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => setActiveTab("accomplishments")} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "accomplishments" ? `bg-white ${COLORS.accent} shadow-sm` : "text-gray-600 hover:text-gray-900"}`}>Accomplishment Reports</button>
          <button onClick={() => setActiveTab("attendance")} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "attendance" ? `bg-white ${COLORS.accent} shadow-sm` : "text-gray-600 hover:text-gray-900"}`}>Attendance DTR</button>
        </div>
      </div>

      {isManager && <SupervisorDashboard relevantReports={relevantReports} />}

      {activeTab === "attendance" ? (
        <AttendanceDTRSection user={user} interns={internList} isManager={isManager} />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {user.role === "intern" && <CreateReportForm user={user} form={form} setForm={setForm} handleSubmit={handleSubmit} submitting={submitting} />}
          <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <h3 className="text-xl font-bold text-gray-900">{isManager ? "Submitted Reports" : "My History"}</h3>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input type="text" placeholder="Search intern..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 shadow rounded-lg ${PRIMARY_FOCUS_RING}`} />
                </div>
                
                {isManager && selectedReportIds.length > 0 && (
                  <div className="flex gap-2 animate-in slide-in-from-right-4 fade-in">
                    <button onClick={handleBulkPDF} className="px-4 py-2 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"><Download size={16} /> PDF</button>
                    <button onClick={handleBulkPrint} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black flex items-center gap-2 shadow-sm"><Printer size={16} /> Print ({selectedReportIds.length})</button>
                  </div>
                )}
              </div>
            </div>
            
            <ReportList 
                reports={filteredReports} 
                isManager={isManager} 
                user={user} 
                selectedIds={selectedReportIds}
                onToggleSelect={toggleReportSelection}
                onSelectAll={handleSelectAll}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsTab;