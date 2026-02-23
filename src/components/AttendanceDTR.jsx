// fileName: AttendanceDTR.jsx
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Double check your import path here
import toast from "react-hot-toast";
import { Calendar, Filter, Loader2, Printer, BarChart2, Download } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

const COLORS = {
  primary: "text-[#42A5FF]",
  accent: "text-[#0094FF]",
  navy: "text-[#002B66]",
  bgLight: "bg-[#BDE4F7]",
  bgNavy: "bg-[#002B66]",
  btnPrimary: "bg-[#0094FF] hover:bg-[#002B66]",
};

const PRIMARY_FOCUS_RING = "focus:ring-[#0094FF] focus:border-[#0094FF]";

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
                    @page { size: A4 portrait; margin: 10mm; } 
                    body { font-family: 'Arial', sans-serif; -webkit-print-color-adjust: exact; color: #000; margin: 0; padding: 0; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .title { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; }
                    .sub-title { font-size: 12px; color: #444; margin-top: 5px; font-style: italic; }
                    .header-line { border-bottom: 2px solid #000; margin-top: 10px; margin-bottom: 15px; }
                    .meta-box { width: 100%; border: 1px solid #000; padding: 8px; margin-bottom: 10px; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; background-color: #f3f4f6; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
                    th { background-color: #d1d5db !important; color: #000 !important; font-weight: 900; text-transform: uppercase; border: 1px solid #000; height: 30px; padding: 0; -webkit-print-color-adjust: exact; }
                    td { border: 1px solid #000; padding: 0 5px; text-align: center; vertical-align: middle; height: 26px; white-space: nowrap; overflow: hidden; }
                    .weekend { background-color: #f9fafb; color: #9ca3af; font-style: italic; }
                    .absent { color: #dc2626; background-color: #fee2e2; font-weight: bold; }
                    .time-text { font-family: 'Courier New', monospace; font-size: 10px; font-weight: 600; }
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
                    <div class="sign-box">I certify the above report is true and correct.<div class="sign-line">${internName}</div><div>Intern Signature</div></div>
                    <div class="sign-box">Certified Correct:<div class="sign-line">${finalSupervisor}</div><div>Supervisor / Certifier</div></div>
                </div>
                <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
            </body>
        </html>
    `);
    printWindow.document.close();
};

const AttendanceDTR = ({ user, interns, isManager }) => {
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

  const handleExportPDF = () => {
    const element = document.createElement("div");
    
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
                  `;
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
      const today = new Date();
      today.setHours(0, 0, 0, 0); 

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
          
          let statusText = isWeekend ? "Weekend" : "Absent";
          if (d > today && !isWeekend) {
              statusText = "--";
          }

          filteredLogs.push({ date: dateKey, hoursWorked: 0, status: statusText });
        }
      }
      setLogs(filteredLogs);
      if (filteredLogs.length > 0) toast.success("Records loaded!");
    } catch (error) { console.error(error); toast.error("Failed to load attendance."); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm animate-fadeIn relative">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#002B66] flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#0094FF]" /> Attendance Record
          </h3>
          <p className="text-sm text-gray-500 mt-1">Official time logs and calculated hours.</p>
        </div>
        {logs.length > 0 && (
          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm text-sm font-medium">
              <Download size={16} /> PDF
            </button>
            <button onClick={handlePrint} className="px-4 py-2 bg-[#002B66] text-white rounded-lg hover:bg-blue-900 flex items-center gap-2 shadow-sm text-sm font-medium">
              <Printer size={16} /> Print
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {isManager && (
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Intern</label>
                <select className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#0094FF]`} value={selectedInternId} onChange={(e) => setSelectedInternId(e.target.value)}>
                {interns.length === 0 && <option value="">Loading...</option>}
                {interns.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                </select>
            </div>
            )}
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label><DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="MMM d, yyyy" className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#0094FF]`} /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label><DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="MMM d, yyyy" className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#0094FF]`} /></div>
            <div className="flex items-end"><button onClick={generateReport} disabled={loading} className={`w-full py-2.5 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 ${COLORS.btnPrimary}`}>{loading ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />} Load Records</button></div>
        </div>

        {logs.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 w-16">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 w-32">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">Time Log</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase text-gray-500">Total Hours</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase text-gray-500">Status</th>
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
                        <td className="px-6 py-4 font-bold text-gray-900">{dateObj.getDate()}</td>
                        <td className="px-6 py-4 text-gray-500">{dateObj.toLocaleDateString("en-US", { weekday: "long" })}</td>
                        <td className="px-6 py-4">
                            {(isWeekend || isAbsent || log.status === "--") ? (
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
                        <td className="px-6 py-4 text-center font-mono font-bold text-[#0094FF]">{log.hoursWorked > 0 ? log.hoursWorked : "-"}</td>
                        <td className="px-6 py-4 text-right"><span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${log.status === "Present" ? "bg-green-100 text-green-700" : log.status === "Absent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{log.status}</span></td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Calendar size={48} className="mb-4 text-gray-300 opacity-50" />
                <p>Select dates and click "Load Records" to view attendance.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDTR;