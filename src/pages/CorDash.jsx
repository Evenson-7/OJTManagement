// fileName: CorDash.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Toaster, toast } from 'react-hot-toast';
import { Clock, Menu, X, LogOut, User } from "lucide-react"; 

// Components
import ProfileScreen from "../components/ProfileScreen";

// Import existing tabs
import ReportsTab from "./tabs/ReportsTab";
import EvaluationTab from "./tabs/EvaluationTab";

// --- ( COLOR PALETTE ) ---
const ACCENT_TEXT = 'text-[#0094FF]'; 
const LIGHT_ACCENT_BG = 'bg-[#BDE4F7]'; 
const ACTIVE_TAB_BG = `${LIGHT_ACCENT_BG} ${ACCENT_TEXT} shadow-sm`;
const SUCCESS_TEXT = 'text-[#002B66]'; 

// --- DATA CONSTANTS ---
const COLLEGES = [
  { id: 'college_ccs', code: 'CCS', name: 'College of Computer Studies' },
  { id: 'college_cbe', code: 'CBE', name: 'College of Business Education' },
  { id: 'college_cte', code: 'CTE', name: 'College of Teacher Education' }
];

// --- ICONS ---
const OverviewIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>);
const SupervisorIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const InternIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>);
const ReportsIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const EvaluationsIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);
const LogoutIcon = ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const CollapseIcon = ({ isExpanded }) => (<svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} /></svg>);
const SearchIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const FilterIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>);

function CorDash() {
  const { user, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Header State
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));

  // Data & Filter States
  const [stats, setStats] = useState({ supervisors: 0, interns: 0 });
  const [supervisors, setSupervisors] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (user?.departmentId) {
      setFilterDept(user.departmentId);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, "users");
        
        const supQuery = query(usersRef, where("role", "==", "supervisor"));
        const supSnap = await getDocs(supQuery);
        const supList = supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSupervisors(supList);

        const internQuery = query(usersRef, where("role", "==", "intern")); 
        const internSnap = await getDocs(internQuery); 
        const internList = internSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInterns(internList);

        setStats({ supervisors: supSnap.size, interns: internSnap.size });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Helpers
  const getSupervisorName = (id) => {
    if (!id) return "Unassigned";
    const sup = supervisors.find(s => s.id === id);
    return sup ? sup.name || `${sup.firstName} ${sup.lastName}` : "Unknown ID";
  };

  const getCollegeName = (id) => {
    const college = COLLEGES.find(c => c.id === id);
    return college ? college.code : "N/A";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --- FILTERING LOGIC ---
  const getFilteredInterns = () => {
    return interns.filter(intern => {
      const matchesDept = filterDept === "all" || intern.departmentId === filterDept;
      const searchLower = searchTerm.toLowerCase();
      const fullName = (intern.name || `${intern.firstName} ${intern.lastName}`).toLowerCase();
      const matchesSearch = fullName.includes(searchLower) || (intern.school || "").toLowerCase().includes(searchLower);
      return matchesDept && matchesSearch;
    });
  };

  // --- REUSABLE HEADER COMPONENT ---
  const FilterHeader = ({ title, showDeptFilter = true }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showDeptFilter && (
          <div className="relative">
            <FilterIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white cursor-pointer hover:border-blue-400 transition-all w-full sm:w-auto font-medium text-gray-700"
            >
              <option value="all">All Departments</option>
              {COLLEGES.map((col) => (
                <option key={col.id} value={col.id}>{col.code} - {col.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", name: "Overview", icon: OverviewIcon },
    { id: "supervisors", name: "Supervisors", icon: SupervisorIcon },
    { id: "interns", name: "Interns", icon: InternIcon },
    { id: "evaluations", name: "Evaluations", icon: EvaluationsIcon },
    { id: "reports", name: "Reports", icon: ReportsIcon },
  ];

  const renderContent = () => {
    const commonProps = { user, setActiveTab };

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">Coordinator Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => setActiveTab('supervisors')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between cursor-pointer hover:shadow-md transition-all group">
                <div><p className="text-sm text-gray-500 font-medium">Total Supervisors</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.supervisors}</h3></div>
                <div className="p-3 rounded-full bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors"><SupervisorIcon className="w-8 h-8" /></div>
              </div>
              <div onClick={() => setActiveTab('interns')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between cursor-pointer hover:shadow-md transition-all group">
                <div><p className="text-sm text-gray-500 font-medium">Active Interns</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.interns}</h3></div>
                <div className="p-3 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors"><InternIcon className="w-8 h-8" /></div>
              </div>
            </div>
          </div>
        );
      case "supervisors":
        const filteredSupervisors = supervisors.filter(s => (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (s.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()));
        return (
          <div className="space-y-6 animate-fadeIn">
            <FilterHeader title="All Supervisors" showDeptFilter={false} />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                      <th className="px-6 py-4">Name</th><th className="px-6 py-4">Company</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSupervisors.map((sup) => (
                      <tr key={sup.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{sup.name || `${sup.firstName} ${sup.lastName}`}</td>
                        <td className="px-6 py-4 text-gray-600">{sup.companyName || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{sup.department || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-500">{sup.email}</td>
                      </tr>
                    ))}
                    {filteredSupervisors.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">No supervisors match your search.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "interns":
        const displayedInterns = getFilteredInterns();
        return (
          <div className="space-y-6 animate-fadeIn">
            <FilterHeader title="Managed Interns" showDeptFilter={true} />
            {filterDept !== 'all' && (
              <div className="mb-2"><span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">Filtering by: {getCollegeName(filterDept)}</span></div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                      <th className="px-6 py-4">Name</th><th className="px-6 py-4">College</th><th className="px-6 py-4">Course</th><th className="px-6 py-4">Supervisor</th><th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedInterns.map((intern) => {
                      // Logic to check if unassigned
                      const supervisorName = getSupervisorName(intern.supervisorId);
                      const isUnassigned = supervisorName === "Unassigned";
                      return (
                        <tr key={intern.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{intern.name || `${intern.firstName} ${intern.lastName}`}</td>
                          <td className="px-6 py-4 text-gray-600"><span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full border border-gray-200">{getCollegeName(intern.departmentId)}</span></td>
                          <td className="px-6 py-4 text-gray-600">{intern.course || 'N/A'}</td>
                          
                          {/* UPDATED: Red text if Unassigned */}
                          <td className={`px-6 py-4 font-medium ${isUnassigned ? 'text-red-500' : 'text-blue-600'}`}>
                            {supervisorName}
                          </td>
                          
                          <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span></td>
                        </tr>
                      );
                    })}
                     {displayedInterns.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No interns found matching filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "evaluations": return <EvaluationTab {...commonProps} />;
      case "reports": return <ReportsTab {...commonProps} />;
      default: return null;
    }
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setIsMobileMenuOpen(false);
    document.body.style.overflow = "hidden";
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden w-full max-w-[100vw]">
      <Toaster position="top-right" />
      
      {/* --- DESKTOP SIDEBAR --- */}
      <div className={`hidden md:flex bg-white shadow-lg flex-col fixed h-full z-30 transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-16'}`}>
        <div className={`px-4 py-5 flex items-center transition-all duration-300 ${sidebarExpanded ? 'justify-between border-b border-gray-200' : 'justify-center'}`}>
          {sidebarExpanded && <h1 className="text-xl pb-5.5 font-bold text-gray-900">Coord<span className={ACCENT_TEXT}>Panel</span></h1>}
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-2 rounded-lg hover:bg-gray-100"><CollapseIcon isExpanded={sidebarExpanded} /></button>
        </div>
        <nav className="flex-1 px-2 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {tabs.map((tab) => (
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
            <div className={`w-10 h-10 rounded-full ${LIGHT_ACCENT_BG} flex items-center justify-center flex-shrink-0`}><span className={`${ACCENT_TEXT} font-semibold`}>C</span></div>
            {sidebarExpanded && <div className="text-left flex-1 ml-3"><p className="text-sm font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-500">Coordinator</p></div>}
          </button>
          <button onClick={handleLogoutClick} className={`w-full flex items-center px-3 py-3 mt-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${!sidebarExpanded ? 'justify-center' : ''}`}>
            <LogoutIcon className="w-5 h-5 flex-shrink-0" />{sidebarExpanded && <span className="font-medium ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* --- MOBILE NAV (Bottom Bar) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center px-2 py-2 w-full">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center px-2 py-3 rounded-lg transition-colors ${activeTab === tab.id ? ACTIVE_TAB_BG : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <tab.icon className="w-5 h-5 mb-1" /><span className="text-[10px] font-medium truncate w-full text-center">{tab.name}</span>
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
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'Coordinator'}!
                  </h1>
                  
                  {/* Role Badge */}
                  <div className={`flex items-center px-3 py-0.5 sm:py-1 ${LIGHT_ACCENT_BG} ${SUCCESS_TEXT} rounded-full text-xs font-medium border border-[#42A5FF]`}>
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Coordinator
                  </div>

                  {/* Time Badge (Mobile Only - Beside Role) */}
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
                {/* Desktop Clock */}
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
          </div>
          
          {/* --- MOBILE MENU DROPDOWN (Profile/Logout) --- */}
          <div className={`md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl transition-all duration-300 origin-top ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0 overflow-hidden'}`}>
            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</div>
              
              {/* Profile Button */}
              <button 
                onClick={handleProfileClick}
                className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-full ${LIGHT_ACCENT_BG} flex items-center justify-center flex-shrink-0`}>
                  <span className={`${ACCENT_TEXT} font-semibold`}>C</span>
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">Coordinator</p>
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

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 w-full relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
                {renderContent()}
            </div>
        </main>
      </div>

      {showProfile && <ProfileScreen user={user} onClose={() => setShowProfile(false)} onUpdateProfile={updateUserProfile} />}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Logout</h3><p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex space-x-4"><button onClick={() => setShowLogoutConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Logout</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorDash;