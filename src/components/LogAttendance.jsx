// fileName: components/LogAtt.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import toast from 'react-hot-toast';

// --- UTILITY FUNCTION FOR DECIMAL HOURS ---
const formatDecimalHours = (decimalValue) => {
  if (!decimalValue && decimalValue !== 0) return "0h 0m";
  const value = parseFloat(decimalValue);
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  if (minutes === 60) return `${hours + 1}h 0m`;
  return `${hours}h ${minutes}m`;
};

const ChevronLeftIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const ArrowLeftIcon = () => <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const FilterIcon = () => <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const CalendarIcon = () => <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

function LogAtt({ user, onBack }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectionMode, setSelectionMode] = useState('single'); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(null);
  
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [selectedInternFilter, setSelectedInternFilter] = useState(""); 
  
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showEventModal, setShowEventModal] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
      date: new Date().toISOString().split('T')[0],
      reason: "SUSPENDED",
      targetIntern: "ALL"
  });

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const handleModeChange = (mode) => {
    setSelectionMode(mode);
    setEndDate(null); 
  };

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

  const fetchLogs = async () => {
    setLoading(true);
    if (!user?.uid && !user?.id) return;
    const currentUserId = user.uid || user.id;

    try {
      let internsMap = {};
      let internsList = []; 
      
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

        internsList.sort((a, b) => a.name.localeCompare(b.name));
        setAssignedInterns(internsList);
      }

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

  useEffect(() => {
    fetchLogs();
  }, [user, startDate, endDate, selectionMode]);

  const handleDeclareEvent = async (e) => {
      e.preventDefault();
      setIsSubmittingEvent(true);
      try {
          const targetInterns = eventForm.targetIntern === "ALL" 
              ? assignedInterns 
              : assignedInterns.filter(i => i.id === eventForm.targetIntern);

          if (targetInterns.length === 0) {
              toast.error("No interns found to apply this event to.");
              setIsSubmittingEvent(false);
              return;
          }

          for (const intern of targetInterns) {
              const q = query(collection(db, "attendance"), 
                  where("internId", "==", intern.id), 
                  where("date", "==", eventForm.date)
              );
              const snapshot = await getDocs(q);

              const eventData = {
                  date: eventForm.date,
                  internId: intern.id,
                  timeIn: "--:--",
                  timeOut: "--:--",
                  status: eventForm.reason,
                  hoursWorked: 0,
                  reason: eventForm.reason,
                  updatedBy: user.uid
              };

              if (!snapshot.empty) {
                  const docId = snapshot.docs[0].id;
                  await updateDoc(doc(db, "attendance", docId), eventData);
              } else {
                  await addDoc(collection(db, "attendance"), eventData);
              }
          }

          toast.success(`${eventForm.reason} successfully recorded.`);
          setShowEventModal(false);
          fetchLogs(); 
      } catch (error) {
          console.error("Error applying event:", error);
          toast.error("Failed to record event.");
      } finally {
          setIsSubmittingEvent(false);
      }
  };

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
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#002B66] mb-1">Attendance Logs</h2>
            <p className="text-sm text-gray-500">Track and review attendance history.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            
            {/* FIX: Only Coordinator can log special events like Suspensions */}
            {user?.role === 'coordinator' && (
                <button 
                    onClick={() => setShowEventModal(true)}
                    className="flex items-center bg-[#002B66] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#0094FF] transition-colors shadow-sm"
                >
                    <CalendarIcon /> Log Special Event
                </button>
            )}

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
                        <th className="px-4 py-4 text-center">Status / Reason</th>
                        <th className="px-5 py-4 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLogs.map((log) => {
                        const isSpecialEvent = ["SUSPENDED", "LAC Session", "Holiday"].includes(log.status);
                        
                        let badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100"; 
                        if (log.status === 'Absent') badgeColor = "bg-red-50 text-red-600 border-red-100";
                        else if (log.status === 'Late') badgeColor = "bg-yellow-50 text-yellow-700 border-yellow-100";
                        else if (isSpecialEvent) badgeColor = "bg-purple-50 text-purple-700 border-purple-200";

                        return (
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
                            <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{isSpecialEvent ? '--' : log.timeIn || '--:--'}</td>
                            <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{isSpecialEvent ? '--' : log.timeOut || '--:--'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${badgeColor}`}>
                                {log.status || 'Present'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-[#002B66]">
                              {isSpecialEvent ? '--' : formatDecimalHours(log.hoursWorked)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-lg font-bold text-[#002B66]">Log Special Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <form onSubmit={handleDeclareEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Date of Event</label>
                <input 
                  type="date" 
                  required
                  value={eventForm.date}
                  onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#0094FF]" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Reason / Event Type</label>
                <select 
                  required
                  value={eventForm.reason}
                  onChange={(e) => setEventForm({...eventForm, reason: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#0094FF] cursor-pointer"
                >
                  <option value="SUSPENDED">Suspended (Weather / School Level)</option>
                  <option value="LAC Session">LAC Session</option>
                  <option value="Holiday">Official Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Apply To</label>
                <select 
                  required
                  value={eventForm.targetIntern}
                  onChange={(e) => setEventForm({...eventForm, targetIntern: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#0094FF] cursor-pointer"
                >
                  <option value="ALL">All My Assigned Interns</option>
                  {assignedInterns.map(intern => (
                    <option key={intern.id} value={intern.id}>{intern.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">This will automatically write an official attendance record for the selected date, preventing interns from being marked as absent.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmittingEvent} className="flex-1 py-2 bg-[#0094FF] text-white rounded-lg font-bold shadow hover:bg-[#002B66] transition-colors disabled:opacity-50">
                  {isSubmittingEvent ? 'Saving...' : 'Confirm Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default LogAtt;