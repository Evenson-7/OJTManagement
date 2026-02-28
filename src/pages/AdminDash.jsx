// fileName: AdminDash.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../../firebaseConfig";
import { firebaseConfig } from "../../firebaseConfig"; 
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from 'react-hot-toast';

// Layout
import DashboardLayout from "../components/DashboardLayout";

// --- DATA CONSTANTS ---
const COLLEGES = [
  { id: 'college_ccs', code: 'CCS', name: 'College of Computer Studies' },
  { id: 'college_cbe', code: 'CBE', name: 'College of Business Education' },
  { id: 'college_cte', code: 'CTE', name: 'College of Teacher Education' }
];

// --- ICONS ---
const OverviewIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>);
const UsersIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const SupervisorIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const InternIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>);
const PlusIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const SearchIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const FilterIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>);
const EyeIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>);
const XIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);

function AdminDash() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Data States
  const [stats, setStats] = useState({ coordinators: 0, supervisors: 0, interns: 0 });
  const [coordinators, setCoordinators] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [interns, setInterns] = useState([]);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoord, setNewCoord] = useState({ name: "", email: "", password: "", departmentId: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: "overview", name: "Overview", icon: OverviewIcon },
    { id: "coordinators", name: "Coordinators", icon: UsersIcon },
    { id: "supervisors", name: "Supervisors", icon: SupervisorIcon },
    { id: "interns", name: "Interns", icon: InternIcon },
  ];

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, "users");
        
        const coordQuery = query(usersRef, where("role", "==", "coordinator"));
        const coordSnap = await getDocs(coordQuery);
        const coordList = coordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoordinators(coordList);
        
        const supQuery = query(usersRef, where("role", "==", "supervisor"));
        const supSnap = await getDocs(supQuery);
        const supList = supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSupervisors(supList);

        const internQuery = query(usersRef, where("role", "==", "intern")); 
        const internSnap = await getDocs(internQuery); 
        const internList = internSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInterns(internList);

        setStats({
          coordinators: coordSnap.size,
          supervisors: supSnap.size,
          interns: internSnap.size
        });
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  // --- Helpers ---
  const getCollegeName = (id) => {
    const college = COLLEGES.find(c => c.id === id);
    return college ? `(${college.code}) ${college.name}` : id || "Unassigned";
  };
  
  const getCollegeCode = (id) => {
    const college = COLLEGES.find(c => c.id === id);
    return college ? college.code : "N/A";
  };

  const getSupervisorName = (id) => {
    if (!id) return "Unassigned";
    const sup = supervisors.find(s => s.id === id);
    return sup ? sup.name || sup.firstName + " " + sup.lastName : "Unknown ID";
  };

  // --- FILTERING LOGIC ---
  const getFilteredData = (dataList, isSupervisor = false) => {
    return dataList.filter(item => {
      const matchesDept = isSupervisor || filterDept === "all" || item.departmentId === filterDept;
      const searchLower = searchTerm.toLowerCase();
      const name = (item.name || item.firstName + " " + item.lastName || "").toLowerCase();
      const matchesSearch = name.includes(searchLower) || (item.email || "").toLowerCase().includes(searchLower);
      return matchesDept && matchesSearch;
    });
  };

  // --- REUSABLE HEADER COMPONENT ---
  const FilterHeader = ({ title, showDeptFilter = true, actionButton }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <h3 className="text-xl font-bold text-sidebar-text">{title}</h3>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div className="relative flex-grow md:flex-grow-0">
          <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-muted" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none w-full sm:w-64 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showDeptFilter && (
          <div className="relative">
            <FilterIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-muted" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="pl-10 pr-8 py-2 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none appearance-none bg-white cursor-pointer hover:border-brand-pastel transition-all w-full sm:w-auto font-medium text-sidebar-text"
            >
              <option value="all">All Departments</option>
              {COLLEGES.map((col) => (
                <option key={col.id} value={col.id}>{col.code}</option>
              ))}
            </select>
          </div>
        )}

        {actionButton && actionButton}
      </div>
    </div>
  );

  // --- 2. HANDLE ADD COORDINATOR ---
  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    let secondaryApp = null;
    try {
      const selectedCollege = COLLEGES.find(c => c.id === newCoord.departmentId);
      const collegeName = selectedCollege ? `(${selectedCollege.code}) ${selectedCollege.name}` : "Unknown Department";

      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newCoord.email, newCoord.password);
      const newUserId = userCredential.user.uid;

      await setDoc(doc(db, "users", newUserId), {
        name: newCoord.name, email: newCoord.email, role: "coordinator",
        departmentId: newCoord.departmentId, department: collegeName, createdAt: serverTimestamp(),
      });
      await signOut(secondaryAuth);
      toast.success("Coordinator account created successfully!");
      setCoordinators([...coordinators, { id: newUserId, ...newCoord, department: collegeName, role: 'coordinator' }]);
      setStats(prev => ({...prev, coordinators: prev.coordinators + 1}));
      setShowAddModal(false); setNewCoord({ name: "", email: "", password: "", departmentId: "" }); setShowPassword(false);
    } catch (error) {
      toast.error(error.code === 'auth/email-already-in-use' ? "That email is already in use." : "Failed to create account: " + error.message);
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsCreating(false);
    }
  };

  const renderContent = () => {
    if (loading) return <div className="text-sidebar-muted animate-pulse font-semibold">Loading dashboard data...</div>;

    switch (activeTab) {
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div onClick={() => setActiveTab('coordinators')} className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border flex justify-between cursor-pointer hover:shadow-[0_4px_20px_rgba(66,165,255,0.15)] hover:border-brand-pastel transition-all group">
              <div><p className="text-sm text-sidebar-muted font-bold">Total Coordinators</p><h3 className="text-3xl font-extrabold text-sidebar-text mt-1">{stats.coordinators}</h3></div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-pastel to-sidebar-active text-brand-dark group-hover:scale-105 transition-transform"><UsersIcon className="w-8 h-8" /></div>
            </div>
            <div onClick={() => setActiveTab('supervisors')} className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border flex justify-between cursor-pointer hover:shadow-[0_4px_20px_rgba(66,165,255,0.15)] hover:border-yellow-200 transition-all group">
              <div><p className="text-sm text-sidebar-muted font-bold">Total Supervisors</p><h3 className="text-3xl font-extrabold text-sidebar-text mt-1">{stats.supervisors}</h3></div>
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600 group-hover:scale-105 transition-transform"><SupervisorIcon className="w-8 h-8" /></div>
            </div>
            <div onClick={() => setActiveTab('interns')} className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border flex justify-between cursor-pointer hover:shadow-[0_4px_20px_rgba(66,165,255,0.15)] hover:border-emerald-200 transition-all group">
              <div><p className="text-sm text-sidebar-muted font-bold">Active Interns</p><h3 className="text-3xl font-extrabold text-sidebar-text mt-1">{stats.interns}</h3></div>
              <div className="p-3 rounded-2xl bg-status-mint-bg text-status-mint-text group-hover:scale-105 transition-transform"><InternIcon className="w-8 h-8" /></div>
            </div>
          </div>
        );

      case "coordinators":
        const filteredCoords = getFilteredData(coordinators);
        return (
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border animate-fadeIn">
            <FilterHeader 
              title="Manage Coordinators" 
              showDeptFilter={true}
              actionButton={
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-brand-primary hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform transform active:scale-95 whitespace-nowrap font-bold"
                >
                  <PlusIcon className="w-5 h-5" /><span>Add Coordinator</span>
                </button>
              }
            />
            <div className="overflow-hidden border border-sidebar-border rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-sidebar-bg border-b border-sidebar-border text-[11px] uppercase tracking-wider text-sidebar-muted font-bold">
                      <th className="px-6 py-4">Name</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sidebar-border/50">
                    {filteredCoords.map((coord) => (
                      <tr key={coord.id} className="hover:bg-sidebar-bg/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-sidebar-text">{coord.name}</td>
                        <td className="px-6 py-4">
                          <span className="bg-brand-light text-brand-dark text-xs font-semibold px-2.5 py-1 rounded-lg border border-brand-pastel">
                            {coord.departmentId ? getCollegeName(coord.departmentId) : (coord.department || 'General')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sidebar-muted font-medium">{coord.email}</td>
                        <td className="px-6 py-4"><span className="bg-status-mint-bg text-status-mint-text text-xs font-bold px-2.5 py-1 rounded-lg">Active</span></td>
                      </tr>
                    ))}
                    {filteredCoords.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-sidebar-muted font-medium">No coordinators found matching filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "supervisors":
        const filteredSups = getFilteredData(supervisors, true); 
        return (
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border animate-fadeIn">
            <FilterHeader title="All Supervisors" showDeptFilter={false} />
            <div className="overflow-hidden border border-sidebar-border rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-sidebar-bg border-b border-sidebar-border text-[11px] uppercase tracking-wider text-sidebar-muted font-bold">
                      <th className="px-6 py-4">Name</th><th className="px-6 py-4">Company</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sidebar-border/50">
                    {filteredSups.map((sup) => (
                      <tr key={sup.id} className="hover:bg-sidebar-bg/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-sidebar-text">{sup.name || `${sup.firstName} ${sup.lastName}`}</td>
                        <td className="px-6 py-4 text-sidebar-muted font-medium">{sup.companyName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sidebar-muted font-medium">{sup.department || 'N/A'}</td>
                        <td className="px-6 py-4 text-sidebar-muted font-medium">{sup.email}</td>
                      </tr>
                    ))}
                    {filteredSups.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-sidebar-muted font-medium">No supervisors found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "interns":
        const filteredInterns = getFilteredData(interns);
        return (
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border animate-fadeIn">
            <FilterHeader title="All Interns" showDeptFilter={true} />
            <div className="overflow-hidden border border-sidebar-border rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-sidebar-bg border-b border-sidebar-border text-[11px] uppercase tracking-wider text-sidebar-muted font-bold">
                      <th className="px-6 py-4">Name</th><th className="px-6 py-4">College</th><th className="px-6 py-4">Supervisor</th><th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sidebar-border/50">
                    {filteredInterns.map((intern) => {
                      const supervisorName = getSupervisorName(intern.supervisorId);
                      const isUnassigned = supervisorName === "Unassigned";
                      return (
                        <tr key={intern.id} className="hover:bg-sidebar-bg/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-sidebar-text">{intern.name || `${intern.firstName} ${intern.lastName}`}</td>
                          <td className="px-6 py-4">
                             <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200">
                              {getCollegeCode(intern.departmentId)}
                            </span>
                          </td>
                          <td className={`px-6 py-4 font-bold ${isUnassigned ? 'text-red-400' : 'text-brand-dark'}`}>
                            {supervisorName}
                          </td>
                          <td className="px-6 py-4"><span className="bg-status-mint-bg text-status-mint-text text-xs font-bold px-2.5 py-1 rounded-lg">Active</span></td>
                        </tr>
                      );
                    })}
                    {filteredInterns.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-sidebar-muted font-medium">No interns found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <DashboardLayout tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}

      {/* --- ADD COORDINATOR MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002B66]/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(66,165,255,0.16)] w-full max-w-md overflow-hidden">
            <div className="bg-sidebar-bg px-6 py-5 border-b border-sidebar-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-sidebar-text">Add New Coordinator</h3>
              <button onClick={() => setShowAddModal(false)} className="text-sidebar-muted hover:text-sidebar-text bg-white p-1 rounded-xl shadow-sm border border-sidebar-border transition-colors">
                 <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCoordinator} className="p-6 space-y-4">
              <div>
                 <label className="block text-sm font-bold text-sidebar-text mb-1.5">Full Name</label>
                 <input required type="text" className="w-full px-4 py-2.5 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="e.g. John Doe" value={newCoord.name} onChange={e => setNewCoord({...newCoord, name: e.target.value})} />
              </div>
              <div>
                 <label className="block text-sm font-bold text-sidebar-text mb-1.5">Department</label>
                 <select required className="w-full px-4 py-2.5 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text bg-white" value={newCoord.departmentId} onChange={e => setNewCoord({...newCoord, departmentId: e.target.value})}>
                    <option value="">Select College</option>
                    {COLLEGES.map((college) => (<option key={college.id} value={college.id}>({college.code}) {college.name}</option>))}
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-bold text-sidebar-text mb-1.5">Email</label>
                 <input required type="email" className="w-full px-4 py-2.5 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="coordinator@school.edu" value={newCoord.email} onChange={e => setNewCoord({...newCoord, email: e.target.value})} />
              </div>
              <div>
                 <label className="block text-sm font-bold text-sidebar-text mb-1.5">Password</label>
                 <div className="relative">
                    <input required type={showPassword ? "text" : "password"} className="w-full px-4 py-2.5 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text pr-12" placeholder="Default Password" value={newCoord.password} onChange={e => setNewCoord({...newCoord, password: e.target.value})} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sidebar-muted hover:text-sidebar-text focus:outline-none">
                       {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                 </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isCreating} className="w-full py-3 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-dark transition-colors font-bold disabled:opacity-50">
                  {isCreating ? 'Adding Coordinator...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminDash;