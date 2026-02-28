// fileName: CorDash.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../../firebaseConfig"; 
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth"; 
import { initializeApp, deleteApp } from "firebase/app"; 
import { toast } from 'react-hot-toast';
import { Loader } from "lucide-react"; 

// Layout & Tabs
import DashboardLayout from "../components/DashboardLayout";
import ReportsTab from "./tabs/ReportsTab";
import EvaluationTab from "./tabs/EvaluationTab";

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
const SearchIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const FilterIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>);
const PlusIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const XIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);

function CorDash() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data & Filter States
  const [stats, setStats] = useState({ supervisors: 0, interns: 0 });
  const [supervisors, setSupervisors] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  // Add Supervisor State
  const [isAddSupModalOpen, setIsAddSupModalOpen] = useState(false);
  const [isCreatingSup, setIsCreatingSup] = useState(false);
  const [supForm, setSupForm] = useState({
    firstName: '', lastName: '', email: '', password: '', 
    phoneNumber: '', companyName: '', department: '', position: ''
  });

  const tabs = [
    { id: "overview", name: "Overview", icon: OverviewIcon },
    { id: "supervisors", name: "Supervisors", icon: SupervisorIcon },
    { id: "interns", name: "Interns", icon: InternIcon },
    { id: "evaluations", name: "Evaluations", icon: EvaluationsIcon },
    { id: "reports", name: "Reports", icon: ReportsIcon },
  ];

  useEffect(() => {
    if (user?.departmentId) {
      setFilterDept(user.departmentId);
    }
  }, [user]);

  // Fetch Data Function
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
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // --- LOGIC: CREATE SUPERVISOR ---
  const handleCreateSupervisor = async (e) => {
    e.preventDefault();
    setIsCreatingSup(true);

    let secondaryApp;
    let secondaryAuth;
    let newSupUid = null;

    try {
        const config = auth.app.options; 
        secondaryApp = initializeApp(config, "Secondary");
        secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, supForm.email, supForm.password);
        newSupUid = userCredential.user.uid;

        await setDoc(doc(db, "users", newSupUid), {
            uid: newSupUid, firstName: supForm.firstName, lastName: supForm.lastName,
            name: `${supForm.firstName} ${supForm.lastName}`, email: supForm.email,
            phoneNumber: supForm.phoneNumber, companyName: supForm.companyName,
            department: supForm.department, position: supForm.position,
            role: 'supervisor', createdAt: new Date()
        });

        toast.success("Supervisor account created successfully!");
        
        setSupForm({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', companyName: '', department: '', position: '' });
        setIsAddSupModalOpen(false);
        fetchData(); 
    } catch (error) {
        if (newSupUid && secondaryAuth && secondaryAuth.currentUser) {
             try { await secondaryAuth.currentUser.delete(); } catch (err) { console.error(err); }
        }
        let msg = "Failed to create account.";
        if (error.code === 'auth/email-already-in-use') msg = "Email is already in use.";
        if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        toast.error(msg);
    } finally {
        if (secondaryAuth) await signOut(secondaryAuth).catch(err => console.error(err));
        if (secondaryApp) await deleteApp(secondaryApp).catch(err => console.error(err));
        setIsCreatingSup(false);
    }
  };

  const handleSupChange = (e) => setSupForm({ ...supForm, [e.target.name]: e.target.value });

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
  const FilterHeader = ({ title, showDeptFilter = true, rightAction = null }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <h3 className="text-xl font-bold text-sidebar-text">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-muted" />
          <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none w-full sm:w-64 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {showDeptFilter && (
          <div className="relative">
            <FilterIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-muted" />
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="pl-10 pr-8 py-2 border-[1.5px] border-sidebar-border rounded-xl focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none appearance-none bg-white cursor-pointer hover:border-brand-pastel transition-all w-full sm:w-auto font-medium text-sidebar-text">
              <option value="all">All Departments</option>
              {COLLEGES.map((col) => (<option key={col.id} value={col.id}>{col.code} - {col.name}</option>))}
            </select>
          </div>
        )}
        {rightAction}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return <div className="text-sidebar-muted animate-pulse font-semibold">Loading data...</div>;

    switch (activeTab) {
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
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
      case "supervisors":
        const filteredSupervisors = supervisors.filter(s => (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (s.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()));
        return (
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border animate-fadeIn">
            <FilterHeader 
                title="All Supervisors" showDeptFilter={false}
                rightAction={
                    <button onClick={() => setIsAddSupModalOpen(true)} className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl transition-colors font-bold shadow-sm whitespace-nowrap">
                        <PlusIcon className="w-5 h-5" /><span className="hidden sm:inline">Add Supervisor</span>
                    </button>
                }
            />
            <div className="overflow-hidden border border-sidebar-border rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-sidebar-bg border-b border-sidebar-border text-[11px] uppercase tracking-wider text-sidebar-muted font-bold">
                      <th className="px-6 py-4">Name</th><th className="px-6 py-4">Company</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sidebar-border/50">
                    {filteredSupervisors.map((sup) => (
                      <tr key={sup.id} className="hover:bg-sidebar-bg/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-sidebar-text">{sup.name || `${sup.firstName} ${sup.lastName}`}</td>
                        <td className="px-6 py-4 text-sidebar-muted font-medium">{sup.companyName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sidebar-muted font-medium">{sup.department || 'N/A'}</td>
                        <td className="px-6 py-4 text-sidebar-muted font-medium">{sup.email}</td>
                      </tr>
                    ))}
                    {filteredSupervisors.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-sidebar-muted font-medium">No supervisors match your search.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "interns":
        const displayedInterns = getFilteredInterns();
        return (
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(66,165,255,0.08)] border-[1.5px] border-sidebar-border animate-fadeIn">
            <FilterHeader title="Managed Interns" showDeptFilter={true} />
            {filterDept !== 'all' && (<div className="mb-4"><span className="text-xs font-bold bg-brand-light text-brand-dark px-3 py-1.5 rounded-lg border border-brand-pastel">Filtering by: {getCollegeName(filterDept)}</span></div>)}
            <div className="overflow-hidden border border-sidebar-border rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-sidebar-bg border-b border-sidebar-border text-[11px] uppercase tracking-wider text-sidebar-muted font-bold">
                      <th className="px-6 py-4">Name</th><th className="px-6 py-4">College</th><th className="px-6 py-4">Course</th><th className="px-6 py-4">Supervisor</th><th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sidebar-border/50">
                    {displayedInterns.map((intern) => {
                      const supervisorName = getSupervisorName(intern.supervisorId);
                      const isUnassigned = supervisorName === "Unassigned";
                      return (
                        <tr key={intern.id} className="hover:bg-sidebar-bg/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-sidebar-text">{intern.name || `${intern.firstName} ${intern.lastName}`}</td>
                          <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200">{getCollegeName(intern.departmentId)}</span></td>
                          <td className="px-6 py-4 text-sidebar-muted font-medium">{intern.course || 'N/A'}</td>
                          <td className={`px-6 py-4 font-bold ${isUnassigned ? 'text-red-400' : 'text-brand-dark'}`}>{supervisorName}</td>
                          <td className="px-6 py-4"><span className="bg-status-mint-bg text-status-mint-text text-xs font-bold px-2.5 py-1 rounded-lg">Active</span></td>
                        </tr>
                      );
                    })}
                     {displayedInterns.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-sidebar-muted font-medium">No interns found matching filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "evaluations": return <EvaluationTab user={user} setActiveTab={setActiveTab} />;
      case "reports": return <ReportsTab user={user} setActiveTab={setActiveTab} />;
      default: return null;
    }
  };

  return (
    <DashboardLayout tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}

      {/* --- ADD SUPERVISOR MODAL --- */}
      {isAddSupModalOpen && (
        <div className="fixed inset-0 bg-[#002B66]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-[0_20px_60px_rgba(66,165,255,0.16)] overflow-hidden animate-fadeIn">
            <div className="px-6 py-5 border-b border-sidebar-border flex justify-between items-center bg-sidebar-bg">
              <h3 className="text-lg font-bold text-sidebar-text">Add New Supervisor</h3>
              <button onClick={() => setIsAddSupModalOpen(false)} className="text-sidebar-muted hover:text-sidebar-text bg-white p-1 rounded-xl shadow-sm border border-sidebar-border transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSupervisor} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-sidebar-text mb-1.5">First Name</label>
                  <input type="text" name="firstName" value={supForm.firstName} onChange={handleSupChange} required className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-sidebar-text mb-1.5">Last Name</label>
                  <input type="text" name="lastName" value={supForm.lastName} onChange={handleSupChange} required className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="Doe" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-sidebar-text mb-1.5">Email</label>
                  <input type="email" name="email" value={supForm.email} onChange={handleSupChange} required className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="john.doe@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-sidebar-text mb-1.5">Phone Number</label>
                  <input type="tel" name="phoneNumber" value={supForm.phoneNumber} onChange={handleSupChange} required className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="09123456789" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-sidebar-text mb-1.5">Company Name</label>
                  <input type="text" name="companyName" value={supForm.companyName} onChange={handleSupChange} required className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="Tech Solutions Inc." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-sidebar-text mb-1.5">Department</label>
                  <input type="text" name="department" value={supForm.department} onChange={handleSupChange} required className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="IT Dept" />
                </div>
              </div>

              <div className="mb-4">
                 <label className="block text-sm font-bold text-sidebar-text mb-1.5">Position / Title</label>
                 <input type="text" name="position" value={supForm.position} onChange={handleSupChange} required className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="Senior Developer" />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-sidebar-text mb-1.5">Initial Password</label>
                <input type="password" name="password" value={supForm.password} onChange={handleSupChange} required minLength={6} className="w-full border-[1.5px] border-sidebar-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-pastel focus:border-brand-primary outline-none font-medium text-sidebar-text" placeholder="******" />
                <p className="text-xs text-sidebar-muted mt-2 font-medium">Supervisor can change this later.</p>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-sidebar-border">
                <button type="button" onClick={() => setIsAddSupModalOpen(false)} className="px-5 py-2.5 text-sidebar-muted bg-white border-2 border-sidebar-border rounded-xl hover:bg-sidebar-bg transition-colors font-bold">Cancel</button>
                <button type="submit" disabled={isCreatingSup} className="px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-dark transition-colors font-bold flex items-center disabled:opacity-50 shadow-md">
                   {isCreatingSup && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                   {isCreatingSup ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default CorDash;