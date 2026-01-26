import React, { useState, useEffect } from "react";
import { Clock, Menu, X } from "lucide-react"; // Bell, CheckCircle, AlertCircle, Info removed

// --- Color Utility Classes ---
const ACCENT_COLOR = 'text-[#0094FF]'; // Deep Blue Accent
const LIGHT_BG = 'bg-[#BDE4F7]'; // Light Cyan Tint
const SUCCESS_TEXT = 'text-[#002B66]'; // Navy Blue for success/primary text

function TopNav({ user, sidebarExpanded, isMobileMenuOpen, setIsMobileMenuOpen }) {
  // Notification state removed
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  // Mock icons are kept for demonstration, but hardcoded data is removed
  const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

  // Notifications state, logic, and related utilities are no longer needed here.

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Update time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <>
          <header 
            className={`bg-white border-b border-gray-200 fixed top-0 z-20 shadow-sm transition-all duration-300
              ${sidebarExpanded ? 'md:left-64 md:w-[calc(100%-16rem)]' : 'md:left-16 md:w-[calc(100%-4rem)]'}
            `}
          >
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Greeting and User Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                </h1>
                {/* Role Badge uses Navy Text (SUCCESS_TEXT) and Dot also uses Navy Text */}
                <div className={`hidden sm:flex items-center px-3 py-1 ${LIGHT_BG} ${SUCCESS_TEXT} rounded-full text-xs font-medium border border-[#42A5FF]`}>
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Employee'}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {getCurrentDate()}
              </p>
            </div>

            {/* Right Section - Status and Actions */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* Current Time - Desktop */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <Clock size={18} className="text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">{currentTime}</span>
                  <span className="text-xs text-gray-500">Current Time</span>
                </div>
              </div>

              {/* Notification Bell Button REMOVED */}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen?.(!isMobileMenuOpen)}
                className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X size={22} className="text-gray-600" />
                ) : (
                  <Menu size={22} className="text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Status Bar */}
          <div className="md:hidden mt-3 flex items-center justify-between gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <Clock size={16} className="text-gray-600" />
              <span className="text-xs font-semibold text-gray-900">{currentTime}</span>
            </div>
            {/* The location status bar was here, but has been removed */}
          </div>
        </div>
      </header>

      {/* Notifications Modal REMOVED */}
    </>
  );
}

export default TopNav;