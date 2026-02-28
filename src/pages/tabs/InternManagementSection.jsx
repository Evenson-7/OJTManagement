// fileName: InternManagementSection.jsx (UPDATED: Responsive Layout & Text Truncation Fix)

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import toast from "react-hot-toast";
import { Users, UserPlus, Plus, CheckCircle, X } from "lucide-react"; 
import { COLLEGES, PROGRAMS, getDepartmentName, getCourseName } from "../../utils/academicData";

// --- Color Utility Classes ---
const ACCENT_TEXT = 'text-[#0094FF]'; 
const ACCENT_BG_BUTTON = 'bg-[#0094FF]';
const ACCENT_BG_HOVER = 'hover:bg-[#002B66]';
const LIGHT_BG = 'bg-[#BDE4F7]'; 
const TEXT_SECONDARY = 'text-gray-500';

const MY_INTERNS_COLOR = ACCENT_TEXT; 
const AVAILABLE_INTERNS_COLOR = 'text-[#42A5FF]'; 
const AVAILABLE_ICON_BG = 'bg-[#BDE4F7]'; 
const MY_INTERNS_ICON_BG = 'bg-[#BDE4F7]'; 

// --- Helper Components ---

const ProfileImage = ({ intern, size = "w-10 h-10" }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = intern.profileImage || intern.profileImageUrl;

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  if (imageUrl && !imgError) {
    return (
      <img 
        src={imageUrl} 
        alt="Profile" 
        className={`${size} rounded-full object-cover flex-shrink-0`}
        onError={() => setImgError(true)} 
      />
    );
  }
  
  const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
  const nameOrEmail = internName || intern.fullName || intern.name || intern.email || 'U';
  
  const initials = nameOrEmail
    .split(' ')
    .map(n => n[0])
    .filter(Boolean) 
    .join('')
    .toUpperCase()
    .slice(0, 2);
    
  const finalInitials = (nameOrEmail === intern.email && initials.length === 1) 
    ? nameOrEmail.slice(0, 2).toUpperCase() 
    : initials;
    
  return (
    <div className={`${size} rounded-full ${LIGHT_BG} flex items-center justify-center flex-shrink-0`}>
      <span className={`${MY_INTERNS_COLOR} font-semibold text-sm`}>{finalInitials}</span>
    </div>
  );
};

const ConfirmationModal = ({ intern, onConfirm, onCancel, isProcessing }) => {
  const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
  const internDisplayName = internName || intern.fullName || intern.name || intern.email;
  
  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-scale-in">
        <div className="flex justify-between items-start border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Unassign Intern</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to **unassign** <span className="font-bold text-red-600">{internDisplayName}</span> from your supervision?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This action will make the intern available for other supervisors.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Removing...</span>
              </>
            ) : (
              'Confirm Unassign'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const InternProfileModal = ({ intern, onClose }) => {
  const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
  const internDisplayName = internName || intern.fullName || intern.name || intern.email || 'Unnamed Intern';

  const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex text-sm flex-col sm:flex-row sm:items-start gap-1 sm:gap-0">
        <strong className={`${TEXT_SECONDARY} w-24 flex-shrink-0 font-semibold`}>{label}:</strong>
        <span className="text-gray-900 break-words flex-1">{value}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b pb-3 mb-4 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">Intern Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <ProfileImage intern={intern} size="w-24 h-24 mx-auto" />
          <h4 className="text-xl font-bold text-gray-900 mt-4">{internDisplayName}</h4>
          <p className="text-gray-600">{intern.email}</p>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-4 sm:space-y-3">
            <DetailRow label="Name" value={internDisplayName} />
            <DetailRow label="Email" value={intern.email} />
            <DetailRow label="Phone" value={intern.phoneNumber} />
            <DetailRow label="College" value={intern.departmentId ? getDepartmentName(intern.departmentId) : null} />
            <DetailRow label="Course" value={intern.course ? getCourseName(intern.departmentId, intern.course) : null} />
            <DetailRow label="Company" value={intern.companyName} />
            <DetailRow label="Address" value={intern.address} />
            <DetailRow label="Supervisor" value={intern.supervisorName} />
            <DetailRow label="Assigned On" value={formatTimestamp(intern.assignedAt)} />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

// --- Main Management Component ---
function InternManagementSection({ user }) {
  const [myInterns, setMyInterns] = useState([]);
  const [availableInterns, setAvailableInterns] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [addingIntern, setAddingIntern] = useState(null);
  const [removingIntern, setRemovingIntern] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internToUnassign, setInternToUnassign] = useState(null);
  const [internToView, setInternToView] = useState(null);

  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const getSortableName = (intern) => {
    const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
    return internName || intern.fullName || intern.name || intern.email || "";
  };

  useEffect(() => {
    async function fetchInterns() {
      setIsLoading(true);
      try {
        const internsQuery = query(collection(db, "users"), where("role", "==", "intern"));
        const querySnapshot = await getDocs(internsQuery);
        const fetchedInterns = [];
        
        querySnapshot.forEach((doc) => {
          fetchedInterns.push({ uid: doc.id, ...doc.data() });
        });
        
        const sortedInterns = fetchedInterns.sort((a, b) => 
          getSortableName(a).localeCompare(getSortableName(b))
        );
        
        const myInternsList = sortedInterns.filter(intern => intern.supervisorId === user.uid);
        const availableInternsList = sortedInterns.filter(intern => !intern.supervisorId || intern.supervisorId === "");
        
        setMyInterns(myInternsList);
        setAvailableInterns(availableInternsList);
      } catch (error) {
        console.error("Error fetching interns:", error);
        toast.error("Failed to load interns.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInterns();
  }, [user.uid]);

  const handleAddIntern = async (internUid) => {
    setAddingIntern(internUid);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      
      const supervisorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
                             userData.fullName || userData.name || "Supervisor";

      const updateData = {
        supervisorId: user.uid, supervisorName: supervisorName, assignedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, "users", internUid), updateData);
      
      const internToMove = availableInterns.find(intern => intern.uid === internUid);
      if (internToMove) {
        const updatedIntern = { ...internToMove, ...updateData };
        setMyInterns(prev => [...prev, updatedIntern].sort((a, b) => getSortableName(a).localeCompare(getSortableName(b))));
        setAvailableInterns(prev => prev.filter(intern => intern.uid !== internUid));
      }
      toast.success("Intern assigned successfully!");
    } catch (error) {
      console.error("Error adding intern:", error);
      toast.error("Failed to assign intern.");
    } finally {
      setAddingIntern(null);
    }
  };

  const confirmRemoveIntern = async () => {
    const internUid = internToUnassign.uid;
    setRemovingIntern(internUid);
    setInternToUnassign(null);

    try {
      const updateData = { supervisorId: "", supervisorName: "", removedAt: serverTimestamp() };
      await updateDoc(doc(db, "users", internUid), updateData);
      
      const internToMove = myInterns.find(intern => intern.uid === internUid);
      if (internToMove) {
        const resetIntern = { ...internToMove, supervisorId: "", supervisorName: "" };
        setAvailableInterns(prev => [...prev, resetIntern].sort((a, b) => getSortableName(a).localeCompare(getSortableName(b))));
        setMyInterns(prev => prev.filter(intern => intern.uid !== internUid));
      }
      toast.success("Intern unassigned successfully.");
    } catch (error) {
      console.error("Error removing intern:", error);
      toast.error("Failed to unassign intern.");
    } finally {
      setRemovingIntern(null);
    }
  };

  const handleDeptChange = (e) => {
    setFilterDept(e.target.value);
    setFilterCourse(''); 
  };

  const applyFilters = (internsList) => {
    return internsList.filter(intern => {
      const matchDept = filterDept ? intern.departmentId === filterDept : true;
      const matchCourse = filterCourse ? intern.course === filterCourse : true;
      return matchDept && matchCourse;
    });
  };

  const filteredMyInterns = applyFilters(myInterns);
  const filteredAvailableInterns = applyFilters(availableInterns);
  const visibleFilteredAvailableInterns = filteredAvailableInterns.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      
      {internToUnassign && (
        <ConfirmationModal 
          intern={internToUnassign} onConfirm={confirmRemoveIntern}
          onCancel={() => setInternToUnassign(null)} isProcessing={removingIntern === internToUnassign.uid}
        />
      )}

      {internToView && (
        <InternProfileModal intern={internToView} onClose={() => setInternToView(null)} />
      )}

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 truncate">College/Department</label>
          <select 
            value={filterDept} 
            onChange={handleDeptChange}
            className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0094FF] focus:border-[#0094FF] outline-none transition-all text-sm`}
          >
            <option value="">All Departments</option>
            {COLLEGES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 truncate">Program/Course</label>
          <select 
            value={filterCourse} 
            onChange={(e) => setFilterCourse(e.target.value)}
            disabled={!filterDept}
            className={`w-full p-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:bg-gray-100 focus:ring-2 focus:ring-[#0094FF] focus:border-[#0094FF] outline-none transition-all text-sm`}
          >
            <option value="">All Courses</option>
            {filterDept && PROGRAMS[filterDept]?.map(p => (
              <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
        {/* Column 1: My Interns Section */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${MY_INTERNS_ICON_BG} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Users size={20} className={MY_INTERNS_COLOR} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 truncate">My Assigned Interns</h2>
                <p className="text-sm text-gray-500 truncate">Currently supervising ({filteredMyInterns.length})</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <div className={`w-8 h-8 border-4 ${ACCENT_TEXT} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
                <p className="text-gray-500 font-medium">Loading assigned interns...</p>
              </div>
            ) : filteredMyInterns.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">No interns found</p>
                <p className="text-gray-400 text-sm">
                  {myInterns.length > 0 ? "Adjust your filters to see assigned interns." : "Assign interns from the available list to get started."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredMyInterns.map((intern) => (
                  <div key={intern.uid} className="flex flex-col xl:flex-row xl:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4 border border-transparent hover:border-gray-200">
                    
                    {/* User Info Section - FIX APPLIED HERE */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <ProfileImage intern={intern} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate" title={`${intern.firstName || ''} ${intern.lastName || ''}`.trim() || intern.email}>
                          {`${intern.firstName || ''} ${intern.lastName || ''}`.trim() || intern.fullName || intern.name || intern.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate" title={intern.email}>{intern.email}</p>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {intern.departmentId && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${LIGHT_BG} text-[#002B66] whitespace-nowrap`}>
                              {getDepartmentName(intern.departmentId)}
                            </span>
                          )}
                          {intern.course && (
                            <span 
                              className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-200 text-gray-700 inline-block truncate max-w-[130px] sm:max-w-[180px] align-bottom"
                              title={getCourseName(intern.departmentId, intern.course)}
                            >
                              {getCourseName(intern.departmentId, intern.course)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Buttons Section */}
                    <div className="flex items-center gap-2 flex-shrink-0 w-full xl:w-auto justify-end mt-2 xl:mt-0 pt-3 xl:pt-0 border-t border-gray-200 xl:border-none">
                      <button
                        onClick={() => setInternToView(intern)}
                        className="flex-1 xl:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center shadow-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => startRemoveIntern(intern)}
                        disabled={removingIntern === intern.uid}
                        className="flex-1 xl:flex-none px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-center flex justify-center items-center shadow-sm min-w-[90px]"
                      >
                        {removingIntern === intern.uid ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Unassign'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Available Interns Section */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${AVAILABLE_ICON_BG} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <UserPlus size={20} className={AVAILABLE_INTERNS_COLOR} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 truncate">Available Interns</h2>
                <p className="text-sm text-gray-500 truncate">Ready for assignment ({filteredAvailableInterns.length})</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-1">
            {isLoading ? (
                <div className="text-center py-12">
                  <div className={`w-8 h-8 border-4 ${AVAILABLE_INTERNS_COLOR} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
                  <p className="text-gray-500 font-medium">Loading available interns...</p>
                </div>
            ) : filteredAvailableInterns.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">No available interns found</p>
                <p className="text-gray-400 text-sm">
                  {availableInterns.length > 0 ? "Adjust your filters to see more interns." : "All available interns are currently assigned."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {visibleFilteredAvailableInterns.map((intern) => (
                    <div key={intern.uid} className="flex flex-col xl:flex-row xl:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4 border border-transparent hover:border-gray-200">
                      
                      {/* User Info Section - FIX APPLIED HERE */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <ProfileImage intern={intern} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate" title={`${intern.firstName || ''} ${intern.lastName || ''}`.trim() || intern.email}>
                            {`${intern.firstName || ''} ${intern.lastName || ''}`.trim() || intern.fullName || intern.name || intern.email}
                          </p>
                          <p className="text-sm text-gray-500 truncate" title={intern.email}>{intern.email}</p>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {intern.departmentId && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${LIGHT_BG} text-[#002B66] whitespace-nowrap`}>
                                {getDepartmentName(intern.departmentId)}
                              </span>
                            )}
                            {intern.course && (
                              <span 
                                className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-200 text-gray-700 inline-block truncate max-w-[130px] sm:max-w-[180px] align-bottom"
                                title={getCourseName(intern.departmentId, intern.course)}
                              >
                                {getCourseName(intern.departmentId, intern.course)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Buttons Section */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-full xl:w-auto justify-end mt-2 xl:mt-0 pt-3 xl:pt-0 border-t border-gray-200 xl:border-none">
                        <button
                          onClick={() => setInternToView(intern)}
                          className="flex-1 xl:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center shadow-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAddIntern(intern.uid)}
                          disabled={addingIntern === intern.uid}
                          className={`flex-1 xl:flex-none ${ACCENT_BG_BUTTON} ${ACCENT_BG_HOVER} px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm min-w-[90px]`}
                        >
                          {addingIntern === intern.uid ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              <span>Assign</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredAvailableInterns.length > visibleCount && (
                  <div className="mt-6 text-center border-t border-gray-100 pt-4">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      className={`${ACCENT_TEXT} hover:text-[#002B66] hover:${LIGHT_BG} px-6 py-2.5 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto`}
                    >
                      Load More Interns ({filteredAvailableInterns.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InternManagementSection;