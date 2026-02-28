// fileName: components/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Clock, Menu, X, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import ProfileScreen from "./ProfileScreen";

// --- AVATAR COMPONENT ---
const Avatar = ({ profileImage, name, size = "md" }) => {
  const dims = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  return (
    <div className={`${dims} rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-brand-pastel to-sidebar-active shadow-[0_2px_8px_rgba(66,165,255,0.18)]`}>
      {profileImage 
        ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
        : <span className="font-semibold text-sidebar-text">{name?.charAt(0)?.toUpperCase() || 'U'}</span>}
    </div>
  );
};

// --- ROLE BADGE ---
const RoleBadge = ({ role }) => {
  const isIntern = role === 'intern';
  const isSup = role === 'supervisor';
  
  const bgClass = isIntern ? 'bg-status-mint-bg' : isSup ? 'bg-yellow-100' : 'bg-brand-light';
  const textClass = isIntern ? 'text-status-mint-text' : isSup ? 'text-yellow-800' : 'text-brand-dark';
  const dotClass = isIntern ? 'bg-emerald-500' : isSup ? 'bg-yellow-500' : 'bg-brand-primary';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bgClass} ${textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {role?.charAt(0).toUpperCase() + role?.slice(1) || 'Employee'}
    </span>
  );
};

export default function DashboardLayout({ children, tabs, activeTab, setActiveTab }) {
  const { user, logout, updateUserProfile } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })), 1000);
    return () => clearInterval(id);
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const activeTabDef = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen flex overflow-hidden w-full max-w-[100vw] bg-page-bg font-poppins text-sidebar-text">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`hidden md:flex flex-col fixed h-full z-30 transition-all duration-300 ease-in-out border-r-2 border-sidebar-border bg-gradient-to-b from-sidebar-bg to-[#EDE9FE] ${sidebarExpanded ? 'w-60' : 'w-[72px]'}`}>
        <div className={`flex items-center h-16 px-4 border-b-2 border-sidebar-border ${sidebarExpanded ? 'justify-between' : 'justify-center'}`}>
          {sidebarExpanded && (
            <div className="flex items-center gap-2.5">
              {/* Inserted Official Logo Here */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-pastel to-sidebar-active">
                <img src="/src/assets/logo.png" alt="OJT System Logo" className="w-full h-full object-contain p-1" />
              </div>
              {/* Reduced font weight to semibold */}
              <p className="font-['Poppins'] font-black text-lg leading-none">
  OJT System
</p>
            </div>
          )}
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/60 text-sidebar-muted">
            {sidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          {/* Reduced label weight to semibold */}
          {sidebarExpanded && <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 px-3 text-sidebar-muted">Menu</p>}
          <ul className="space-y-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className={!sidebarExpanded ? 'flex justify-center' : ''}>
                  {/* Reduced link weight to medium */}
                  <button onClick={() => setActiveTab(tab.id)} title={!sidebarExpanded ? tab.name : undefined} className={`flex items-center gap-3 text-sm font-medium transition-all duration-200 group ${sidebarExpanded ? 'w-full px-3 py-2.5 rounded-2xl' : 'p-2 rounded-2xl'} ${isActive ? 'bg-white text-sidebar-text shadow-[0_2px_12px_rgba(66,165,255,0.15)]' : 'text-sidebar-muted'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isActive ? 'bg-gradient-to-br from-sidebar-active to-brand-pastel' : ''}`}>
                      <tab.icon className="w-4 h-4" />
                    </div>
                    {sidebarExpanded && <span className="leading-none flex-1 text-left">{tab.name}</span>}
                    {isActive && sidebarExpanded && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-sidebar-text" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-4 space-y-1.5 border-t-2 border-sidebar-border">
          {sidebarExpanded ? (
            <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 w-full px-3 py-3 rounded-2xl transition-all bg-white shadow-[0_1px_8px_rgba(66,165,255,0.08)] hover:shadow-[0_3px_16px_rgba(66,165,255,0.16)]">
              <Avatar profileImage={user?.profileImage} name={user?.name} size="sm" />
              <div className="flex-1 text-left min-w-0">
                {/* Reduced name weight to medium */}
                <p className="font-medium text-xs truncate">{user?.name || 'User'}</p>
              </div>
            </button>
          ) : (
            <div className="flex justify-center py-1"><button onClick={() => setShowProfile(true)}><Avatar profileImage={user?.profileImage} name={user?.name} size="sm" /></button></div>
          )}
          {/* Reduced logout button weight to medium */}
          <button onClick={() => setShowLogoutConfirm(true)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors text-red-500 hover:bg-status-peach ${!sidebarExpanded ? 'justify-center' : ''}`}>
            <LogOut size={17} className="flex-shrink-0" />
            {sidebarExpanded && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar-bg/95 backdrop-blur-md border-t-2 border-sidebar-border">
        <div className="flex justify-around items-center px-3 py-2">
          {tabs.slice(0, 4).map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-2xl transition-all duration-200 ${active ? 'text-sidebar-text' : 'text-sidebar-muted'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${active ? 'bg-sidebar-active shadow-[0_2px_8px_rgba(66,165,255,0.2)]' : ''}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                {/* Reduced mobile label weight to medium */}
                <span className="text-[10px] font-medium truncate w-full text-center">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarExpanded ? 'md:ml-60' : 'md:ml-[72px]'} pb-20 md:pb-0 h-screen overflow-hidden`}>
        
        <header className="sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center justify-between bg-white/95 backdrop-blur-md border-b-2 border-sidebar-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Reduced greeting weight to semibold */}
              <h1 className="text-base sm:text-lg font-semibold leading-none whitespace-nowrap text-sidebar-text">
                {getGreeting()}, <span className="text-brand-dark">{user?.name?.split(' ')[0] || 'User'}</span>!
              </h1>
              <RoleBadge role={user?.role} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Reduced time chip weight to medium */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl font-medium bg-brand-light text-brand-dark border-2 border-brand-pastel text-[11px] whitespace-nowrap">
              <Clock size={12} className="text-brand-primary flex-shrink-0" />
              <span>{currentTime}</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden w-9 h-9 rounded-2xl flex items-center justify-center bg-white border-2 border-sidebar-border text-sidebar-muted">
              {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* --- MODALS --- */}
      {showProfile && <ProfileScreen user={user} onClose={() => setShowProfile(false)} onUpdateProfile={updateUserProfile} />}
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002B66]/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-[0_20px_60px_rgba(66,165,255,0.16)]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-status-peach">
              <LogOut size={24} className="text-red-500" />
            </div>
            {/* Reduced modal title to semibold */}
            <h3 className="text-xl font-semibold text-center mb-1">Sign out?</h3>
            <p className="text-sm text-center mb-7 text-sidebar-muted">You'll need to log back in to access your workspace.</p>
            <div className="flex gap-3">
              {/* Reduced modal buttons to medium */}
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium transition-colors border-2 border-sidebar-border text-sidebar-muted hover:bg-sidebar-bg">Cancel</button>
              <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium text-white bg-gradient-to-br from-red-400 to-red-500 hover:opacity-90">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}