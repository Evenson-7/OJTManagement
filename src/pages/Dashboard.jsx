// fileName: Dashboard.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';

// --- IMPORTS FOR REDIRECT ---
import AdminDash from "./AdminDash";
import CorDash from "./CorDash";

// --- LAYOUT ---
import DashboardLayout from "../components/DashboardLayout";

// --- TABS ---
import OverviewTab from "../pages/tabs/OverviewTab";
import ReportsTab from "../pages/tabs/ReportsTab";
import EvaluationTab from "../pages/tabs/EvaluationTab";

// --- ICONS ---
import { OverviewIcon, ReportsIcon, MyReportsIcon } from "../components/Icons";

const EvaluationsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) setIsLoading(false);
  }, [user]);

  // 1. Role-Based Routing
  if (user?.role === 'admin')       return <AdminDash />;
  if (user?.role === 'coordinator') return <CorDash />;

  // 2. Loading State
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-pastel to-sidebar-active shadow-[0_4px_24px_rgba(66,165,255,0.22)]">
            <span className="font-extrabold text-brand-dark text-xl">OJT</span>
          </div>
          <p className="text-sm font-bold text-sidebar-muted animate-pulse">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  // 3. Define Tabs based on Role (Intern vs Supervisor)
  const getAvailableTabs = () => {
    const base = [
      { id: "overview",   name: "Overview",   icon: OverviewIcon },
      { id: "evaluation", name: "Evaluation", icon: EvaluationsIcon },
    ];
    if (user?.role === "supervisor")  base.push({ id: "reports", name: "Reports",    icon: ReportsIcon });
    else if (user?.role === "intern") base.push({ id: "reports", name: "My Reports", icon: MyReportsIcon });
    return base;
  };

  const tabs = getAvailableTabs();

  // 4. Render Specific Tab Content
  const renderTabContent = () => {
    const props = { user, setActiveTab };
    switch (activeTab) {
      case "overview":   return <OverviewTab   {...props} />;
      case "reports":    return <ReportsTab    {...props} />;
      case "evaluation": return <EvaluationTab {...props} />;
      default:           return <OverviewTab   {...props} />;
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '16px', fontSize: '14px', fontWeight: 'bold', color: '#002B66' } }} />
      <DashboardLayout tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="animate-fadeIn w-full">
          {renderTabContent()}
        </div>
      </DashboardLayout>
    </>
  );
}

export default Dashboard;