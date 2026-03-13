// fileName: components/LogAtt.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const ChevronLeftIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const ArrowLeftIcon = () => <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const FilterIcon = () => <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;

function LogAtt({ user, onBack }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // SELECTION MODE & STATES
  const [selectionMode, setSelectionMode] = useState('single'); // 'single' | 'range'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(null);
  
  // FILTER STATES (NEW: Dropdown logic)
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [selectedInternFilter, setSelectedInternFilter] = useState(""); // "" means All Interns
  
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calendar Math
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Handle Mode Toggle
  const handleModeChange = (mode) => {
    setSelectionMode(mode);
    setEndDate(null); 
  };

  // Handle Smart Date Click
  const handleDateClick = (formattedDate) => {
    if (selectionMode === 'single') {
      setStartDate(formattedDate);
      setEndDate(null);
    } else {
      if (!startDate || (startDate && endDate)) {
        setStartDate(formattedDate);
        setEndDate(null);
      } else {
        if (formattedDate < startDate) {
          setEndDate(startDate);
          setStartDate(formattedDate);
        } else if (formattedDate > startDate) {
          setEndDate(formattedDate);
        } else {
          setEndDate(null); 
        }
      }
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      if (!user?.uid && !user?.id) return;
      const currentUserId = user.uid || user.id;

      try {
        let internsMap = {};
        let internsList = []; // Array to populate the dropdown
        
        // 1. Fetch relevant intern data based on role
        if (user.role === 'intern') {
          internsMap[currentUserId] = user;
        } else {
          const internsQuery = user.role === "supervisor" 
            ? query(collection(db, "users"), where("supervisorId", "==", currentUserId))
            : query(collection(db, "users"), where("role", "==", "intern"), where("departmentId", "==", user.departmentId));
          
          const internsSnap = await getDocs(internsQuery);
          internsSnap.forEach(doc => { 
            const data = doc.data();
            internsMap[doc.id] = data; 
            internsList.push({
               id: doc.id,
               name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()
            });
          });

          // Sort dropdown names alphabetically
          internsList.sort((a, b) => a.name.localeCompare(b.name));
          setAssignedInterns(internsList);
        }

        // 2. Query Attendance Logs
        let attQuery;
        if (selectionMode === 'range' && endDate) {
           attQuery = query(
             collection(db, "attendance"), 
             where("date", ">=", startDate),
             where("date", "<=", endDate)
           );
        } else {
           attQuery = query(collection(db, "attendance"), where("date", "==", startDate));
        }
        
        const attSnap = await getDocs(attQuery);
        const logsFound = [];
        
        attSnap.forEach(doc => {
          const attData = doc.data();
          if (internsMap[attData.internId]) {
            const mappedIntern = internsMap[attData.internId];
            logsFound.push({
              id: doc.id,
              internName: mappedIntern.name || `${mappedIntern.firstName || ''} ${mappedIntern.lastName || ''}`.trim(),
              course: mappedIntern.course || mappedIntern.internshipDepartment || 'Intern',
              ...attData
            });
          }
        });

        // Sort by newest date first, then by name alphabetically
        logsFound.sort((a, b) => {
           if (a.date === b.date) {
               return a.internName.localeCompare(b.internName);
           }
           return new Date(b.date) - new Date(a.date);
        });
        
        setDailyLogs(logsFound);

      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user, startDate, endDate, selectionMode]);

  // Filter logs by the dropdown selection
  const filteredLogs = dailyLogs.filter(log => 
    selectedInternFilter === "" || log.internName === selectedInternFilter
  );

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const formatDisplayDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
  const dateDisplayStr = (selectionMode === 'range' && endDate) ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}` : formatDisplayDate(startDate);

  return (
    <div className="w-full space-y-4 pb-10">
      
      {onBack && (
        <button onClick={onBack} className="flex items-center text-[#0094FF] hover:text-[#002B66] font-bold transition-colors">
          <ArrowLeftIcon /> Back to Overview
        </button>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        
        {/* HEADER & TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#002B66] mb-1">Attendance Logs</h2>
            <p className="text-sm text-gray-500">Track and review attendance history.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => handleModeChange('single')} 
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${selectionMode === 'single' ? 'bg-white shadow text-[#0094FF]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Single Day
              </button>
              <button 
                onClick={() => handleModeChange('range')} 
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${selectionMode === 'range' ? 'bg-white shadow text-[#0094FF]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Date Range
              </button>
            </div>
            
            {/* NEW: Dropdown Filter for Interns */}
            {user?.role !== 'intern' && (
              <div className="relative">
                <FilterIcon />
                <select 
                  value={selectedInternFilter}
                  onChange={(e) => setSelectedInternFilter(e.target.value)}
                  className="pl-9 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0094FF] w-full sm:w-56 appearance-none cursor-pointer" 
                >
                  <option value="">All Interns</option>
                  {assignedInterns.map(intern => (
                    <option key={intern.id} value={intern.name}>{intern.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: CALENDAR */}
          <div className="lg:col-span-1 border border-gray-200 rounded-xl p-5 shadow-sm bg-gray-50/50">
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 text-gray-500 hover:text-[#0094FF] hover:bg-white rounded-lg transition-colors"><ChevronLeftIcon /></button>
              <h3 className="font-bold text-gray-800 text-lg">{monthNames[currentMonth]} {currentYear}</h3>
              <button onClick={nextMonth} className="p-2 text-gray-500 hover:text-[#0094FF] hover:bg-white rounded-lg transition-colors"><ChevronRightIcon /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="h-10"></div>;
                
                const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isStart = startDate === formattedDate;
                const isEnd = endDate === formattedDate;
                const isInRange = selectionMode === 'range' && endDate && formattedDate > startDate && formattedDate < endDate;
                const isToday = formattedDate === new Date().toISOString().split('T')[0];

                let baseClasses = "h-10 w-full flex items-center justify-center text-sm font-semibold transition-all relative ";
                let colorClasses = "text-gray-700 hover:bg-gray-200 rounded-lg";

                // Styles for Range & Selection
                if (isStart && !endDate) {
                  colorClasses = "bg-[#0094FF] text-white shadow-md rounded-lg transform scale-105 z-10";
                } else if (isStart && endDate) {
                  colorClasses = "bg-[#0094FF] text-white shadow-md rounded-l-lg transform scale-105 z-10";
                } else if (isEnd) {
                  colorClasses = "bg-[#0094FF] text-white shadow-md rounded-r-lg transform scale-105 z-10";
                } else if (isInRange) {
                  colorClasses = "bg-[#BDE4F7] text-[#002B66] bg-opacity-60 rounded-none";
                } else if (isToday) {
                  colorClasses = "bg-gray-100 text-[#0094FF] font-bold rounded-lg border border-[#0094FF]/30";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(formattedDate)}
                    className={baseClasses + colorClasses}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: DAILY LOGS LIST */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3 flex justify-between items-center flex-wrap gap-2">
              <span>Logs for <span className="text-[#0094FF]">{dateDisplayStr}</span></span>
              <span className="text-xs font-bold text-[#0094FF] bg-[#BDE4F7]/50 px-3 py-1.5 rounded-lg border border-[#BDE4F7]">{filteredLogs.length} Records</span>
            </h3>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0094FF]"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-gray-500 font-medium">No attendance records found.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                        {user?.role !== 'intern' && <th className="px-5 py-4">Intern Name</th>}
                        <th className="px-4 py-4">Date</th>
                        <th className="px-4 py-4">Time In</th>
                        <th className="px-4 py-4">Time Out</th>
                        <th className="px-4 py-4 text-center">Status</th>
                        <th className="px-5 py-4 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                          {user?.role !== 'intern' && (
                            <td className="px-5 py-3">
                              <p className="font-bold text-gray-900">{log.internName}</p>
                              <p className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">{log.course}</p>
                            </td>
                          )}
                          <td className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                            {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{log.timeIn || '--:--'}</td>
                          <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{log.timeOut || '--:--'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border
                              ${log.status === 'Absent' ? 'bg-red-50 text-red-600 border-red-100' : 
                                log.status === 'Late' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {log.status || 'Present'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-[#002B66]">
                            {log.hoursWorked ? `${log.hoursWorked}h` : '0h'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default LogAtt;