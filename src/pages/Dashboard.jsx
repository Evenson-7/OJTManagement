// fileName: Dashboard.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import { Clock, Menu, X, LogOut, User } from "lucide-react"; 

// --- IMPORTS FOR REDIRECT ---
import AdminDash from "./AdminDash";
import CorDash from "./CorDash"; 

// Components
import ProfileScreen from "../components/ProfileScreen";

// Icons (Custom)
import {
  OverviewIcon,
  ReportsIcon,
  MyReportsIcon,
} from "../components/Icons";

// Tabs
import OverviewTab from "../pages/tabs/OverviewTab";
import ReportsTab from "../pages/tabs/ReportsTab";
import EvaluationTab from "../pages/tabs/EvaluationTab";

// --- ( COLOR PALETTE CLASSES ) ---
const ACCENT_COLOR = 'text-[#0094FF]'; 
const LIGHT_ACCENT_BG = 'bg-[#BDE4F7]'; 
const SUCCESS_TEXT = 'text-[#002B66]'; 
const ACTIVE_TAB_BG = `${LIGHT_ACCENT_BG} ${ACCENT_COLOR} shadow-sm`;

// INLINE Icons
const EvaluationsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const LogoutIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
const CollapseIcon = ({ isExpanded }) => (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
    </svg>
);

function Dashboard() {
  const { user, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  
  // --- MERGED TOPNAV STATE ---
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  // ---------------------------

  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(user.profileImage);
    } else if (user?.profileImageUrl) {
      setProfileImage(user.profileImageUrl);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  if (user?.role === 'admin') return <AdminDash />;
  if (user?.role === 'coordinator') return <CorDash />;

  const handleProfileClick = () => {
    setShowProfile(true);
    setIsMobileMenuOpen(false); // Close mobile menu if open
    document.body.style.overflow = "hidden";
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    document.body.style.overflow = "unset";
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(true);
  };
  const confirmLogout = () => { setShowLogoutConfirm(false); logout(); };
  const cancelLogout = () => setShowLogoutConfirm(false);

  const getAvailableTabs = () => {
    const baseTabs = [
      { id: "overview", name: "Overview", icon: OverviewIcon },
      { id: "evaluation", name: "Evaluation", icon: EvaluationsIcon },
    ];

    if (user?.role === "supervisor") {
      baseTabs.push({ id: "reports", name: "Reports", icon: ReportsIcon });
    } else if (user?.role === "intern") {
      baseTabs.push({ id: "reports", name: "My Reports", icon: MyReportsIcon });
    }
    return baseTabs;
  };

  const renderTabContent = () => {
    const commonProps = { user, setActiveTab };
    switch (activeTab) {
      case "overview": return <OverviewTab {...commonProps} />;
      case "reports": return <ReportsTab {...commonProps} />;
      case "evaluation": return <EvaluationTab {...commonProps} />;
      default: return <OverviewTab {...commonProps} />;
    }
  };
  
  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden w-full max-w-[100vw]">
      <Toaster position="top-right" />
      
      {/* --- DESKTOP SIDEBAR --- */}
      <div className={`hidden md:flex bg-white shadow-lg flex-col fixed h-full z-30 transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-16'}`}>
        <div className={`px-4 py-5 flex items-center transition-all duration-300 ${sidebarExpanded ? 'justify-between border-b border-gray-200' : 'justify-center'}`}>
          {sidebarExpanded && <h1 className="text-xl pb-5.5 font-bold text-gray-900">OJT System</h1>}
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <CollapseIcon isExpanded={sidebarExpanded} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {getAvailableTabs().map((tab) => (
              <li key={tab.id}>
                <button onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeTab === tab.id ? ACTIVE_TAB_BG : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`} title={!sidebarExpanded ? tab.name : ""}>
                  <tab.icon className={`w-5 h-5 ${sidebarExpanded ? 'mr-3' : 'mx-auto'}`} />{sidebarExpanded && <span className="font-medium">{tab.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-2 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={handleProfileClick} className={`w-full flex items-center px-3 py-3 rounded-lg hover:bg-white transition-colors ${!sidebarExpanded ? 'justify-center' : ''}`}>
            <div className={`w-10 h-10 rounded-full ${LIGHT_ACCENT_BG} flex items-center justify-center flex-shrink-0`}>
              {profileImage ? <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" /> : <span className={`${ACCENT_COLOR} font-semibold`}>{user?.name?.charAt(0) || 'U'}</span>}
            </div>
            {sidebarExpanded && <div className="text-left flex-1 ml-3"><p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p><p className="text-xs text-gray-500">{user?.role || 'Employee'}</p></div>}
          </button>
          <button onClick={handleLogoutClick} className={`w-full flex items-center px-3 py-3 mt-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${!sidebarExpanded ? 'justify-center' : ''}`}>
            <LogoutIcon className="w-5 h-5 flex-shrink-0" />{sidebarExpanded && <span className="font-medium ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* --- MOBILE NAV (Bottom Bar) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center px-2 py-2 w-full">
          {getAvailableTabs().slice(0, 4).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center px-2 py-3 rounded-lg transition-colors ${activeTab === tab.id ? ACTIVE_TAB_BG : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <tab.icon className="w-5 h-5 mb-1" /><span className="text-xs font-medium truncate w-full text-center">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarExpanded ? 'md:ml-64' : 'md:ml-16'} pb-20 md:pb-0 h-screen overflow-hidden`}>
        
        {/* MERGED HEADER (Sticky Top for Mobile) */}
        <header className="bg-white border-b border-gray-200 shadow-sm w-full sticky top-0 z-40">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left Section - Greeting */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 whitespace-nowrap">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                  </h1>
                  
                  {/* Role Badge */}
                  <div className={`flex items-center px-3 py-0.5 sm:py-1 ${LIGHT_ACCENT_BG} ${SUCCESS_TEXT} rounded-full text-xs font-medium border border-[#42A5FF]`}>
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Employee'}
                  </div>

                  {/* FIX: Time Badge moved here for mobile only (beside role) */}
                  <div className="md:hidden flex items-center px-3 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                    <Clock size={12} className="mr-1.5" />
                    {currentTime}
                  </div>

                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                  {getCurrentDate()}
                </p>
              </div>

              {/* Right Section - Time & Actions */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Desktop Clock - Hidden on mobile */}
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Clock size={18} className="text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{currentTime}</span>
                    <span className="text-xs text-gray-500">Current Time</span>
                  </div>
                </div>
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {isMobileMenuOpen ? <X size={22} className="text-gray-600" /> : <Menu size={22} className="text-gray-600" />}
                </button>
              </div>
            </div>

            {/* FIX: Removed the separate bottom row for time since it's now moved up */}
          </div>
          
          {/* --- MOBILE MENU DROPDOWN --- */}
          <div className={`md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl transition-all duration-300 origin-top ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0 overflow-hidden'}`}>
            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</div>
              
              {/* Profile Button */}
              <button 
                onClick={handleProfileClick}
                className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-full ${LIGHT_ACCENT_BG} flex items-center justify-center flex-shrink-0`}>
                  {profileImage ? <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" /> : <span className={`${ACCENT_COLOR} font-semibold`}>{user?.name?.charAt(0) || 'U'}</span>}
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'Employee'}</p>
                </div>
              </button>

              {/* Logout Button */}
              <button 
                onClick={handleLogoutClick}
                className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
              >
                <LogOut size={20} />
                <span className="ml-3 font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </div>

        </header>
        
        {/* SCROLLABLE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 w-full relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
            <div className="space-y-6 md:space-y-8 w-full">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {showProfile && <ProfileScreen user={user} onClose={handleCloseProfile} onUpdateProfile={updateUserProfile} />}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Logout</h3><p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex space-x-4"><button onClick={cancelLogout} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium">Cancel</button><button onClick={confirmLogout} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Logout</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;