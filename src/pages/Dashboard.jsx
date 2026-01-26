// fileName: Dashboard.jsx (UPDATED - Blue Palette Applied)

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../../firebaseConfig"; 
import { Toaster } from 'react-hot-toast'; // Toaster is now used here or in OverviewTab

// Components
import TopNav from "../components/TopNav";
import ProfileScreen from "../components/ProfileScreen";

// Icons
import {
  OverviewIcon,
  // ManageIcon, // NO LONGER NEEDED
  ReportsIcon,
  MyReportsIcon,
} from "../components/Icons";

// Tabs
import OverviewTab from "../pages/tabs/OverviewTab";
// import ManageTab from "../pages/tabs/ManageTab"; // NO LONGER NEEDED
import ReportsTab from "../pages/tabs/ReportsTab";
import EvaluationTab from "../pages/tabs/EvaluationTab";

// --- ( COLOR PALETTE CLASSES ) ---
const PRIMARY_COLOR = 'bg-[#42A5FF]'; // Sky Blue
const ACCENT_COLOR = 'text-[#0094FF]'; // Deep Blue Accent (For text/active state)
const NAVY_COLOR = 'text-[#002B66]'; // Navy Blue (For text/hover)
const LIGHT_ACCENT_BG = 'bg-[#BDE4F7]'; // Light Cyan Tint (For light background/hover)
const ACTIVE_TAB_BG = `${LIGHT_ACCENT_BG} ${ACCENT_COLOR} shadow-sm`;

// INLINE EvaluationsIcon
const EvaluationsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
// INLINE LogoutIcon
const LogoutIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
// INLINE CollapseIcon
const CollapseIcon = ({ isExpanded }) => (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d={isExpanded ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} 
      />
    </svg>
);

function Dashboard() {
  const { user, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile image states
  const [profileImage, setProfileImage] = useState(null);
  
  // Load user profile image
  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(user.profileImage);
    } else if (user?.profileImageUrl) {
      setProfileImage(user.profileImageUrl);
    }
  }, [user]);

  // Simplified initial load
  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);


  const handleProfileClick = () => {
    setShowProfile(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    document.body.style.overflow = "unset";
  };

  // Logout confirmation handlers
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Tab configuration - 'manage' is removed for supervisors
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: "overview", name: "Overview", icon: OverviewIcon },
      { id: "evaluation", name: "Evaluation", icon: EvaluationsIcon },
    ];

    if (user?.role === "supervisor") {
      baseTabs.push(
        { id: "reports", name: "Reports", icon: ReportsIcon }
      );
    } else if (user?.role === "intern") {
      baseTabs.push({
        id: "reports", name: "My Reports", icon: MyReportsIcon,
      });
    }
    return baseTabs;
  };

  // Render tab content - 'manage' case removed
  const renderTabContent = () => {
    const commonProps = {
      user,
      setActiveTab,
    };

    switch (activeTab) {
      case "overview":
        return <OverviewTab {...commonProps} />;
      case "reports":
        return <ReportsTab {...commonProps} />;
      case "evaluation":
        return <EvaluationTab {...commonProps} />;
      default:
        return <OverviewTab {...commonProps} />;
    }
  };
  
  // Loading check
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* You can put a loading spinner here */}
        <div>Loading...</div> 
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      {/* --- DESKTOP SIDEBAR --- */}
      <div 
        className={`hidden md:flex bg-white shadow-lg flex-col fixed h-full z-30 transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-16'
        }`}
      >
        {/* === Sidebar Header === */}
        <div 
          className={`px-4 py-5 flex items-center transition-all duration-300 ${
            sidebarExpanded ? 'justify-between border-b border-gray-200' : 'justify-center'
          }`}
        >
          {sidebarExpanded && (
            <h1 className="text-xl pb-5.5 font-bold text-gray-900">OJT System</h1>
          )}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <CollapseIcon isExpanded={sidebarExpanded} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {getAvailableTabs().map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeTab === tab.id
                      ? ACTIVE_TAB_BG // Replaced bg-teal-50 text-teal-600
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                  }`}
                  title={!sidebarExpanded ? tab.name : ""}
                >
                  <tab.icon className={`w-5 h-5 ${sidebarExpanded ? 'mr-3' : 'mx-auto'}`} />
                  {sidebarExpanded && (
                    <span className="font-medium">{tab.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop User Profile Section */}
        <div className="px-2 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleProfileClick}
            className={`w-full flex items-center px-3 py-3 rounded-lg hover:bg-white transition-colors ${
              !sidebarExpanded ? 'justify-center' : ''
            }`}
            title={!sidebarExpanded ? `${user?.name || 'User'} - ${user?.role || 'Employee'}` : ""}
          >
            {/* Profile image background updated */}
            <div className={`w-10 h-10 rounded-full ${LIGHT_ACCENT_BG} flex items-center justify-center flex-shrink-0`}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className={`${ACCENT_COLOR} font-semibold`}>
                  {user?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            {sidebarExpanded && (
              <div className="text-left flex-1 ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Employee'}</p>
              </div>
            )}
          </button>

          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center px-3 py-3 mt-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
              !sidebarExpanded ? 'justify-center' : ''
            }`}
            title={!sidebarExpanded ? "Logout" : ""}
          >
            <LogoutIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarExpanded && (
              <span className="font-medium ml-3">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-lg">
        {/* ... (Mobile nav) ... */}
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {getAvailableTabs().slice(0, 4).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center px-2 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? ACTIVE_TAB_BG // Replaced bg-teal-50 text-teal-600
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate w-full text-center">
                {tab.name}
              </span>
            </button>
          ))}
        </div>
        {/* ... (Rest of mobile nav) ... */}
      </div>

      {/* --- MAIN CONTENT & TOPNAV --- */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarExpanded ? 'md:ml-64' : 'md:ml-16'
        } pb-20 md:pb-0`}
      >
        <TopNav
          user={user}
          onProfileClick={handleProfileClick}
          onLogoutClick={handleLogoutClick}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          sidebarExpanded={sidebarExpanded} 
        />
        
        <main className="flex-1 overflow-auto bg-gray-50 mt-16 md:mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="space-y-6 md:space-y-8">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showProfile && (
        <ProfileScreen
          user={user}
          onClose={handleCloseProfile}
          onUpdateProfile={updateUserProfile} 
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You will need to sign in again to access the dashboard.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                // Kept red for destructive action (Logout)
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;