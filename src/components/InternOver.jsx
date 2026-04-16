// fileName: components/InternOver.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// --- UTILITY FUNCTIONS ---
const formatDecimalHours = (decimalValue) => {
  if (!decimalValue && decimalValue !== 0) return "0h 0m";
  const value = parseFloat(decimalValue);
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  if (minutes === 60) return `${hours + 1}h 0m`;
  return `${hours}h ${minutes}m`;
};

const calculateCompletionDetails = (hoursLeft) => {
  if (!hoursLeft || hoursLeft <= 0) return { daysLeft: 0, dateStr: "N/A" };
  const dailyHours = 8; 
  let daysNeeded = Math.ceil(hoursLeft / dailyHours);
  const totalWorkDays = daysNeeded;
  
  let currentDate = new Date();
  let addedDays = 0;
  let workDaysCounter = daysNeeded; 
  
  while (workDaysCounter > 0) {
    currentDate.setDate(currentDate.getDate() + 1); 
    const day = currentDate.getDay(); 
    if (day !== 0 && day !== 6) workDaysCounter--;
    addedDays++;
    if (addedDays > 3000) break; 
  }
  return { daysLeft: totalWorkDays, dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
};

const ChevronDownIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const ChevronUpIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;

function InternOver({ user, onShowLogs }) {
  const [loading, setLoading] = useState(true);
  const [internDataList, setInternDataList] = useState([]);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('lastName'); 

  useEffect(() => {
    let isMounted = true;
    const fetchInternData = async () => {
      setLoading(true);
      if (!user?.uid && !user?.id) return;
      const currentUserId = user.uid || user.id;
      const todayISO = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      const defaultStatus = currentHour >= 17 ? "Absent" : "Not Clocked In";

      try {
        if (user.role === "supervisor" || user.role === "coordinator") {
          const internsQuery = user.role === "supervisor" 
            ? query(collection(db, "users"), where("supervisorId", "==", currentUserId))
            : query(collection(db, "users"), where("role", "==", "intern"), where("departmentId", "==", user.departmentId));
          
          const internsSnap = await getDocs(internsQuery);
          
          const combinedDataPromises = internsSnap.docs.map(async (internDoc) => {
            const data = internDoc.data();
            const internId = internDoc.id;
            
            const todayQuery = query(collection(db, "attendance"), where("internId", "==", internId), where("date", "==", todayISO));
            const historyQuery = query(collection(db, "attendance"), where("internId", "==", internId));

            const [todaySnap, historySnap] = await Promise.all([getDocs(todayQuery), getDocs(historyQuery)]);

            let todayStatus = defaultStatus;
            if (!todaySnap.empty) { 
              const attData = todaySnap.docs[0].data(); 
              todayStatus = attData.timeOut ? "Completed" : (attData.timeIn ? "Present" : (attData.status || defaultStatus)); 
            }

            let actualTotal = 0;
            historySnap.forEach(d => { 
              const hw = d.data().hoursWorked; 
              if (hw) actualTotal += parseFloat(hw); 
            });

            const rawName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim();
            const nameParts = rawName.split(' ');
            const extractedLastName = data.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : rawName);
            
            const reqHours = data.requiredHours || 486;
            const progressPercent = reqHours > 0 ? (actualTotal / reqHours) : 0;
            
            const ojtStatus = actualTotal >= reqHours ? 'Completed' : 'Ongoing';

            return {
              id: internId,
              name: rawName,
              lastNameForSort: extractedLastName.toLowerCase(), 
              course: data.course || data.internshipDepartment || 'Intern',
              requiredHours: reqHours,
              todayStatus,
              completedHours: actualTotal,
              progressPercent: progressPercent,
              ojtStatus: ojtStatus 
            };
          });
          
          const resolvedData = await Promise.all(combinedDataPromises);
          if (isMounted) setInternDataList(resolvedData);
        }
      } catch (error) {
        console.error("Error fetching intern overview data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInternData();
    return () => { isMounted = false; };
  }, [user]);

  const sortedInterns = [...internDataList].sort((a, b) => {
    if (sortBy === 'lastName') {
      return a.lastNameForSort.localeCompare(b.lastNameForSort);
    } else if (sortBy === 'progress') {
      return b.progressPercent - a.progressPercent; 
    }
    return 0; 
  });

  const visibleInterns = isListExpanded ? sortedInterns : sortedInterns.slice(0, 4);

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0094FF]"></div></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#002B66]">Intern Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track daily attendance and hours progression.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
             <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0094FF] appearance-none cursor-pointer shadow-sm"
              >
                <option value="lastName">Sort by Last Name (A-Z)</option>
                <option value="progress">Sort by Progress (High to Low)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
          </div>

          {onShowLogs && (
            <button onClick={onShowLogs} className="px-4 py-2 bg-[#0094FF] text-white text-sm font-semibold rounded-lg hover:bg-[#002B66] transition-colors shadow-sm">
              View Full Logs
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
              <th className="px-6 py-4">Intern Name</th>
              <th className="px-6 py-4">Program</th>
              <th className="px-6 py-4">Today's Status</th>
              <th className="px-6 py-4">Progress</th>
              <th className="px-6 py-4 text-right">Hours Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleInterns.map((intern) => {
              const safeTotal = intern.requiredHours;
              const safeCompleted = intern.completedHours;
              const prog = intern.progressPercent;
              const stats = calculateCompletionDetails(Math.max(safeTotal - safeCompleted, 0));
              
              let statusColor = 'bg-gray-100 text-gray-600 border-gray-200'; let dotColor = 'bg-gray-400';
              if (intern.todayStatus === "Present" || intern.todayStatus === "Completed") { statusColor = 'bg-[#ECFDF5] text-[#10b981] border-[#10b981]/20'; dotColor = 'bg-[#10b981]'; }
              if (intern.todayStatus === "Absent") { statusColor = 'bg-[#FEF2F2] text-[#dc3545] border-[#dc3545]/20'; dotColor = 'bg-[#dc3545]'; }
              if (intern.todayStatus === "Late") { statusColor = 'bg-[#FFFBEB] text-[#d97706] border-[#d97706]/20'; dotColor = 'bg-[#d97706]'; }

              return (
                <tr key={intern.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[#BDE4F7] flex items-center justify-center text-[#002B66] font-bold text-sm mr-3 uppercase">{intern.name[0]}</div>
                      <span className="text-sm font-bold text-gray-900">{intern.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">{intern.course}</span></td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-md border ${statusColor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-2`} /><span className="text-[10px] font-bold uppercase tracking-wider">{intern.todayStatus}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[28%]">
                    <div className="flex flex-col justify-center">
                      <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5">
                         <span>{(prog * 100).toFixed(0)}% Completed</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full ${prog >= 1 ? 'bg-[#10b981]' : 'bg-[#42A5FF]'}`} style={{ width: `${Math.min(prog * 100, 100)}%` }} />
                      </div>
                      
                      {/* FIX: Changed to flex-col and added gap for readable column layout */}
                      <div className="mt-2.5 flex flex-col items-start gap-1">
                         <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${intern.ojtStatus === 'Completed' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#E0F2FE] text-[#0284C7]'}`}>
                            {intern.ojtStatus}
                         </span>
                         <span className="text-[11px] text-gray-500 font-medium">
                            {intern.ojtStatus === 'Completed' ? 'Ready for Certificate' : `${stats.daysLeft} days left • End: ${stats.dateStr}`}
                         </span>
                      </div>
                      
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="text-sm font-bold text-gray-900">{formatDecimalHours(safeCompleted)}</div>
                     <div className="text-[10px] text-gray-500 font-medium mt-0.5">of {formatDecimalHours(safeTotal)}</div>
                  </td>
                </tr>
              );
            })}
            {internDataList.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">No assigned interns found.</td></tr>}
          </tbody>
        </table>
      </div>

      {internDataList.length > 4 && (
        <button onClick={() => setIsListExpanded(!isListExpanded)} className="w-full p-4 border-t border-gray-200 flex items-center justify-center text-sm font-bold text-[#0094FF] hover:text-[#002B66] hover:bg-gray-50 transition-colors">
          {isListExpanded ? "Show Less" : `Show All (${internDataList.length})`}
          {isListExpanded ? <ChevronUpIcon className="ml-2" /> : <ChevronDownIcon className="ml-2" />}
        </button>
      )}
    </div>
  );
}

export default InternOver;