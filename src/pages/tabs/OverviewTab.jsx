// fileName: OverviewTab.jsx (UPDATED - Blue Palette Applied)

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { Toaster } from 'react-hot-toast'; 
import InternManagementSection from './InternManagementSection';

// --- ( COLOR PALETTE CLASSES ) ---
// PRIMARY: "#42A5FF" // Sky Blue
// ACCENT: "#0094FF" // Deep Blue Accent
// LIGHT_ACCENT: "#BDE4F7" // Light Cyan Tint

const ACCENT_TEXT = 'text-[#0094FF]'; 
const LIGHT_BG = 'bg-[#BDE4F7]';
const ACCENT_BORDER = 'border-[#0094FF]';
const ACCENT_BORDER_HOVER = 'hover:border-[#0094FF]';


// --- ICONS for new buttons ---
const EvaluationsIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ReportsIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
// --- End Icons ---

function OverviewTab({ 
  user, 
  setActiveTab,
}) {
  const [supervisorData, setSupervisorData] = useState(null);
  const [loadingSupervisor, setLoadingSupervisor] = useState(true);

  // Fetch supervisor information for interns
  useEffect(() => {
    const fetchSupervisorInfo = async () => {
      if (user && user.role === 'intern' && user.supervisorId) {
        setLoadingSupervisor(true);
        try {
          const supervisorRef = doc(db, 'users', user.supervisorId);
          const supervisorSnap = await getDoc(supervisorRef);
          
          if (supervisorSnap.exists()) {
            setSupervisorData(supervisorSnap.data());
          }
        } catch (error) {
          console.error('Error fetching supervisor data:', error);
        } finally {
          setLoadingSupervisor(false);
        }
      } else {
        setLoadingSupervisor(false);
      }
    };

    fetchSupervisorInfo();
  }, [user]);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Supervisor: Intern Management Section */}
      {user?.role === 'supervisor' && (
        <>
          <h1 className="text-2xl font-semibold text-gray-900">
            Appoint Intern
          </h1>
          <p className="text-gray-500 mt-1 mb-6">Manage your assigned interns and quick access tools below.</p>
          <InternManagementSection user={user} />
        </>
      )}

      {/* Intern: Supervisor Information Card */}
      {user?.role === 'intern' && (
        <>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👨‍💼 Supervisor Information</h3>
            
            {loadingSupervisor ? (
              <div className="flex items-center justify-center py-4">
                {/* Updated spinner border to Deep Blue Accent */}
                <div className={`animate-spin rounded-full h-6 w-6 border-2 ${ACCENT_BORDER} border-t-transparent`}></div> 
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : user.supervisorId && supervisorData ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <span className="text-sm text-gray-900">
    {supervisorData.fullName || supervisorData.name || 
    `${supervisorData.firstName || ''} ${supervisorData.lastName || ''}`.trim() || 'N/A'}
  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <span className="text-sm text-gray-900">{supervisorData.email || 'N/A'}</span>
                </div>
                {supervisorData.department && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Department:</span>
                    <span className="text-sm text-gray-900">{supervisorData.department}</span>
                  </div>
                )}
  <div className="flex justify-between">
    <span className="text-sm font-medium text-gray-500">Contact:</span>
    <span className="text-sm text-gray-900">
      {supervisorData.phoneNumber || supervisorData.phone || 'N/A'}
    </span>
  </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No supervisor assigned</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Big Navigation Buttons */}
      <h2 className="text-2xl font-semibold text-gray-800 pt-4 border-t border-gray-200">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setActiveTab('evaluation')}
          // Updated hover border color
          className={`bg-white p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg ${ACCENT_BORDER_HOVER} transition-all flex items-center space-x-4`}
        >
          {/* Updated icon background and text color */}
          <div className={`p-4 ${LIGHT_BG} rounded-lg`}>
            <EvaluationsIcon className={`w-8 h-8 ${ACCENT_TEXT}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 text-left">
              {user?.role === 'supervisor' ? 'Manage Evaluations' : 'My Evaluations'}
            </h3>
            <p className="text-gray-500 text-left">
              {user?.role === 'supervisor' ? 'Create and review intern evaluations' : 'View your performance reviews'}
            </p>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('reports')}
          // Updated hover border color
          className={`bg-white p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg ${ACCENT_BORDER_HOVER} transition-all flex items-center space-x-4`}
        >
          {/* Updated icon background and text color */}
          <div className={`p-4 ${LIGHT_BG} rounded-lg`}>
            <ReportsIcon className={`w-8 h-8 ${ACCENT_TEXT}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 text-left">
              {user?.role === 'supervisor' ? 'View Reports' : 'My Reports'}
            </h3>
            <p className="text-gray-500 text-left">
              {user?.role === 'supervisor' ? 'Check intern report submissions' : 'Submit your weekly/monthly reports'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default OverviewTab;