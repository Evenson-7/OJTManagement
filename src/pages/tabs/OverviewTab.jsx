// fileName: OverviewTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { Toaster } from 'react-hot-toast'; 
import InternManagementSection from './InternManagementSection';
import InternOver from '../../components/InternOver'; 
import LogAtt from '../components/LogAtt'; 

// --- UTILITY FUNCTIONS FOR INTERN MATH ---
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
  return { 
    daysLeft: totalWorkDays, 
    dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
  };
};

// --- COLOR PALETTE ---
const ACCENT_TEXT = 'text-[#0094FF]'; 
const LIGHT_BG = 'bg-[#BDE4F7]';
const ACCENT_BORDER = 'border-[#0094FF]';
const ACCENT_BORDER_HOVER = 'hover:border-[#0094FF]';

// --- ICONS ---
const ClockIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircleIcon = ({ className = "" }) => <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EvaluationsIcon = ({ className = "" }) => <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const ReportsIcon = ({ className = "" }) => <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

function OverviewTab({ user, setActiveTab }) {
  const [supervisorData, setSupervisorData] = useState(null);
  const [loadingSupervisor, setLoadingSupervisor] = useState(true);
  const [completedHours, setCompletedHours] = useState(0);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInternData = async () => {
      if (user?.role === 'intern') {
        try {
          if (user.supervisorId) {
            const supervisorRef = doc(db, 'users', user.supervisorId);
            const supervisorSnap = await getDoc(supervisorRef);
            if (supervisorSnap.exists() && isMounted) setSupervisorData(supervisorSnap.data());
          }
          const attendanceQuery = query(collection(db, "attendance"), where("internId", "==", user.uid || user.id));
          const attendanceSnap = await getDocs(attendanceQuery);
          let totalCompleted = 0;
          attendanceSnap.forEach(doc => { 
            const hw = doc.data().hoursWorked; 
            if (hw) totalCompleted += parseFloat(hw); 
          });
          if (isMounted) setCompletedHours(totalCompleted);
        } catch (error) {
          console.error('Error fetching intern overview data:', error);
        } finally {
          if (isMounted) setLoadingSupervisor(false);
        }
      }
    };
    fetchInternData();
    return () => { isMounted = false; };
  }, [user]);

  const totalHours = user?.requiredHours || 486; 
  const remainingHours = Math.max(totalHours - completedHours, 0);
  const progress = totalHours > 0 ? (completedHours / totalHours) : 0;
  const completionStats = useMemo(() => remainingHours <= 0 ? { daysLeft: 0, dateStr: 'Completed' } : calculateCompletionDetails(remainingHours), [remainingHours]);

  return (
    <div className="space-y-6 w-full pb-10 animate-fadeIn">
      <Toaster position="top-right" />
      
      {/* --- RENDER LOGS OR DASHBOARD BASED ON STATE --- */}
      {showLogs ? (
        <div className="animate-fadeIn">
          <LogAtt user={user} onBack={() => setShowLogs(false)} />
        </div>
      ) : (
        <>
          {/* Supervisor/Coordinator View */}
          {(user?.role === 'supervisor' || user?.role === 'coordinator') && (
            <div className="space-y-8 animate-fadeIn">
              <InternOver user={user} onShowLogs={() => setShowLogs(true)} />
              
              {user?.role === 'supervisor' && (
                <div className="pt-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Appoint Intern</h1>
                  <p className="text-gray-600 mt-1 mb-6">Manage your assigned interns and quick access tools below.</p>
                  <InternManagementSection user={user} />
                </div>
              )}
            </div>
          )}

          {/* Intern View */}
          {user?.role === 'intern' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Working Hours Card */}
              <div className="bg-[#002B66] rounded-2xl p-6 shadow-lg text-white flex flex-col justify-center relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold tracking-widest text-white/80 uppercase">Working Hours</h3>
                  
                  {/* NEW: View Logs Button for Intern */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowLogs(true)} className="text-xs font-bold text-white hover:text-[#42A5FF] transition-colors bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      View Logs &gt;
                    </button>
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm"><ClockIcon className="text-white" /></div>
                  </div>
                </div>
                
                <div className="flex items-baseline space-x-1 mb-6">
                  <span className="text-5xl xl:text-6xl font-black tracking-tighter">{formatDecimalHours(remainingHours).split('h')[0]}</span>
                  <span className="text-lg xl:text-xl font-bold text-white/90">h {formatDecimalHours(remainingHours).split('h')[1]} left</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-semibold text-white/90">
                    <span>{((progress || 0) * 100).toFixed(1)}% Complete</span>
                    <span>Goal: {formatDecimalHours(totalHours)}</span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min((progress || 0) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center text-xs font-semibold text-white/90">
                  <CheckCircleIcon className="text-[#10b981] mr-1.5" />
                  <span>{formatDecimalHours(completedHours)} completed</span>
                </div>
              </div>

              {/* Completion Estimate Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center text-center">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Completion Estimate</h3>
                <h2 className="text-2xl xl:text-3xl font-bold text-[#002B66] mb-1">{completionStats.daysLeft} working days left</h2>
                <p className="text-sm text-gray-500 mb-4">(Weekends excluded)</p>
                <div className="inline-block bg-[#BDE4F7]/30 border border-[#BDE4F7] px-4 py-2 rounded-lg mx-auto">
                  <span className="text-sm font-bold text-[#42A5FF]">Est. End: {completionStats.dateStr}</span>
                </div>
              </div>

              {/* Supervisor Information Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center h-full">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4 w-full">Your Supervisor</h3>
                {loadingSupervisor ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className={`animate-spin rounded-full h-6 w-6 border-2 ${ACCENT_BORDER} border-t-transparent mb-2`}></div> 
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : user.supervisorId && supervisorData ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-14 h-14 rounded-full bg-[#BDE4F7] flex items-center justify-center text-[#002B66] font-bold text-2xl uppercase shadow-sm mb-3">
                      {supervisorData.firstName?.[0] || supervisorData.name?.[0] || 'S'}
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <h4 className="text-base xl:text-lg font-bold text-gray-900">
                        {supervisorData.fullName || supervisorData.name || `${supervisorData.firstName || ''} ${supervisorData.lastName || ''}`.trim()}
                      </h4>
                      <p className="text-xs xl:text-sm font-medium text-gray-500 flex items-center justify-center mt-1">
                        <svg className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="truncate max-w-[200px]">{supervisorData.email}</span>
                      </p>
                      <p className="text-xs xl:text-sm font-medium text-gray-500 flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {supervisorData.phoneNumber || supervisorData.phone || 'No contact info'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic mt-4">No supervisor assigned</p>
                )}
              </div>
            </div>
          )}

          {/* Quick Access Buttons */}
          <h2 className="text-lg font-bold text-[#002B66] pt-4 border-t border-gray-200">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setActiveTab('evaluation')} className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md ${ACCENT_BORDER_HOVER} transition-all flex items-center space-x-4`}>
              <div className={`p-3 ${LIGHT_BG} rounded-xl`}><EvaluationsIcon className={`w-6 h-6 ${ACCENT_TEXT}`} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900 text-left">{user?.role === 'supervisor' ? 'Manage Evaluations' : 'My Evaluations'}</h3>
                <p className="text-xs font-medium text-gray-500 text-left mt-0.5">{user?.role === 'supervisor' ? 'Create and review intern evaluations' : 'View your performance reviews'}</p>
              </div>
            </button>
            <button onClick={() => setActiveTab('reports')} className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md ${ACCENT_BORDER_HOVER} transition-all flex items-center space-x-4`}>
              <div className={`p-3 ${LIGHT_BG} rounded-xl`}><ReportsIcon className={`w-6 h-6 ${ACCENT_TEXT}`} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900 text-left">{user?.role === 'supervisor' ? 'View Reports' : 'My Reports'}</h3>
                <p className="text-xs font-medium text-gray-500 text-left mt-0.5">{user?.role === 'supervisor' ? 'Check intern report submissions' : 'Submit your weekly/monthly reports'}</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OverviewTab;