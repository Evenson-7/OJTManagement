// fileName: InternManagementSection.jsx (FIXED Naming Fallback and Blue Palette Applied)

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import toast from "react-hot-toast";
import { Users, UserPlus, Plus, CheckCircle, X, Eye } from "lucide-react"; // Removed Trash2

// --- Color Utility Classes ---
const ACCENT_TEXT = 'text-[#0094FF]'; // Deep Blue Accent
const ACCENT_BG_BUTTON = 'bg-[#0094FF]';
const ACCENT_BG_HOVER = 'hover:bg-[#002B66]';
const LIGHT_BG = 'bg-[#BDE4F7]'; // Light Cyan Tint
const TEXT_SECONDARY = 'text-gray-500';

// Colors for the specific sections
const MY_INTERNS_COLOR = ACCENT_TEXT; // Deep Blue
const AVAILABLE_INTERNS_COLOR = 'text-[#42A5FF]'; // Sky Blue
const AVAILABLE_ICON_BG = 'bg-[#BDE4F7]'; // Light Cyan Tint
const MY_INTERNS_ICON_BG = 'bg-[#BDE4F7]'; // Light Cyan Tint


// --- Helper Components ---

// Profile Image Component (Updated Fallback)
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
  
  // FIX: Use firstName/lastName, then fall back.
  const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
  const nameOrEmail = internName || intern.fullName || intern.name || intern.email || 'U';
  
  const initials = nameOrEmail
    .split(' ')
    .map(n => n[0])
    .filter(Boolean) // Handle potential empty strings
    .join('')
    .toUpperCase()
    .slice(0, 2);
    
  const finalInitials = (nameOrEmail === intern.email && initials.length === 1) 
    ? nameOrEmail.slice(0, 2).toUpperCase() 
    : initials;
    
  return (
    // Updated background and text color for initials fallback
    <div className={`${size} rounded-full ${LIGHT_BG} flex items-center justify-center flex-shrink-0`}>
      <span className={`${MY_INTERNS_COLOR} font-semibold text-sm`}>{finalInitials}</span>
    </div>
  );
};

// Confirmation Modal Component (Updated Fallback)
const ConfirmationModal = ({ intern, onConfirm, onCancel, isProcessing }) => {
  // FIX: Use firstName/lastName, then fall back to email
  const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
  const internDisplayName = internName || intern.fullName || intern.name || intern.email;
  
  return (
    <div className="fixed inset-0  bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 m-4 animate-scale-in">
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

// --- FIX: Intern Profile Display Modal (Styled to match mobile) ---
const InternProfileModal = ({ intern, onClose }) => {
  const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
  const internDisplayName = internName || intern.fullName || intern.name || intern.email || 'Unnamed Intern';

  // Re-usable detail row component to match mobile
  const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex text-sm">
        {/* Matched mobile style: w-24 (100) and gray-500 (TEXT_SECONDARY) */}
        <strong className={`${TEXT_SECONDARY} w-24 flex-shrink-0 font-semibold`}>{label}:</strong>
        {/* Matched mobile style: gray-900 (NAVY_BLUE) */}
        <span className="text-gray-900 break-words">{value}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4 animate-scale-in">
        <div className="flex justify-between items-start border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Intern Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        {/* Centered Profile Info */}
        <div className="text-center mb-6">
          <ProfileImage intern={intern} size="w-24 h-24 mx-auto" />
          <h4 className="text-xl font-bold text-gray-900 mt-4">{internDisplayName}</h4>
          <p className="text-gray-600">{intern.email}</p>
        </div>
        
        {/* Details Container (matches mobile) */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-3">
            <DetailRow label="Name" value={internDisplayName} />
            <DetailRow label="Email" value={intern.email} />
            <DetailRow label="Phone" value={intern.phoneNumber} />
            <DetailRow label="Address" value={intern.address} />
            <DetailRow label="Role" value={intern.role ? intern.role.charAt(0).toUpperCase() + intern.role.slice(1) : null} />
            <DetailRow label="Supervisor" value={intern.supervisorName} />
            <DetailRow label="Assigned On" value={formatTimestamp(intern.assignedAt)} />
          </div>
        </div>
        
        {/* Footer with "Close" button (matches mobile) */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// Helper function to format Firebase Timestamps
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

  // Helper function for consistent name sorting
  const getSortableName = (intern) => {
    const internName = `${intern.firstName || ''} ${intern.lastName || ''}`.trim();
    return internName || intern.fullName || intern.name || intern.email || "";
  };

  // Fetch interns on component mount
  useEffect(() => {
    async function fetchInterns() {
      setIsLoading(true);
      try {
        // ... (fetch logic unchanged) ...
        const internsQuery = query(
          collection(db, "users"),
          where("role", "==", "intern")
        );
        const querySnapshot = await getDocs(internsQuery);
        const fetchedInterns = [];
        
        querySnapshot.forEach((doc) => {
          fetchedInterns.push({ uid: doc.id, ...doc.data() });
        });
        
        const sortedInterns = fetchedInterns.sort((a, b) => 
          getSortableName(a).localeCompare(getSortableName(b))
        );
        
        const myInternsList = sortedInterns.filter(intern => 
          intern.supervisorId === user.uid
        );
        const availableInternsList = sortedInterns.filter(intern => 
          !intern.supervisorId || intern.supervisorId === ""
        );
        
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
      // ... (add logic unchanged) ...
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      
      const supervisorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
                             userData.fullName || 
                             userData.name || 
                             "Supervisor";

      const updateData = {
        supervisorId: user.uid,
        supervisorName: supervisorName,
        assignedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, "users", internUid), updateData);
      
      const internToMove = availableInterns.find(intern => intern.uid === internUid);
      if (internToMove) {
        const updatedIntern = { ...internToMove, ...updateData };
        setMyInterns(prev => 
          [...prev, updatedIntern].sort((a, b) => 
            getSortableName(a).localeCompare(getSortableName(b))
          )
        );
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

  const startRemoveIntern = (intern) => {
    setInternToUnassign(intern);
  };
  
  const confirmRemoveIntern = async () => {
    const internUid = internToUnassign.uid;
    setRemovingIntern(internUid);
    setInternToUnassign(null);

    try {
      // ... (remove logic unchanged) ...
      const updateData = {
        supervisorId: "",
        supervisorName: "",
        removedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, "users", internUid), updateData);
      
      const internToMove = myInterns.find(intern => intern.uid === internUid);
      if (internToMove) {
        const resetIntern = { ...internToMove, supervisorId: "", supervisorName: "" };
        setAvailableInterns(prev => 
          [...prev, resetIntern].sort((a, b) => 
            getSortableName(a).localeCompare(getSortableName(b))
          )
        );
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

  const visibleAvailableInterns = availableInterns.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      
      {/* Confirmation Modal Render */}
      {internToUnassign && (
        <ConfirmationModal 
          intern={internToUnassign}
          onConfirm={confirmRemoveIntern}
          onCancel={() => setInternToUnassign(null)}
          isProcessing={removingIntern === internToUnassign.uid}
        />
      )}

      {/* Intern Profile Modal Render */}
      {internToView && (
        <InternProfileModal 
          intern={internToView}
          onClose={() => setInternToView(null)}
        />
      )}
      
      {/* Main Content Grid - 2 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
        {/* Column 1: My Interns Section */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            {/* ... (Header) ... */}
            <div className="flex items-center gap-3">
              {/* Updated icon BG and color */}
              <div className={`w-10 h-10 ${MY_INTERNS_ICON_BG} rounded-lg flex items-center justify-center`}>
                <Users size={20} className={MY_INTERNS_COLOR} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Assigned Interns</h2>
                <p className="text-sm text-gray-500">Currently supervising ({myInterns.length})</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              // Updated loading spinner border color
              <div className="text-center py-12">
                <div className={`w-8 h-8 border-4 ${ACCENT_TEXT} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
                <p className="text-gray-500 font-medium">Loading assigned interns...</p>
              </div>
            ) : myInterns.length === 0 ? (
              // ... (Empty state unchanged) ...
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">No interns assigned</p>
                <p className="text-gray-400 text-sm">
                  Assign interns from the available list to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {myInterns.map((intern) => (
                  <div key={intern.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* ... (Profile info unchanged) ... */}
                      <ProfileImage intern={intern} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {`${intern.firstName || ''} ${intern.lastName || ''}`.trim() || intern.fullName || intern.name || intern.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{intern.email}</p>
                      </div>
                    </div>
                    
                    {/* --- FIX: UPDATED BUTTONS --- */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setInternToView(intern)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        title="View intern profile"
                      >
                        View
                      </button>
                      <button
                        onClick={() => startRemoveIntern(intern)}
                        disabled={removingIntern === intern.uid}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        title="Unassign intern"
                      >
                        {removingIntern === intern.uid ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Unassign'
                        )}
                      </button>
                    </div>
                    {/* --- END FIX --- */}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Available Interns Section */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
             {/* ... (Header) ... */}
            <div className="flex items-center gap-3">
              {/* Updated icon BG and color */}
              <div className={`w-10 h-10 ${AVAILABLE_ICON_BG} rounded-lg flex items-center justify-center`}>
                <UserPlus size={20} className={AVAILABLE_INTERNS_COLOR} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Available Interns</h2>
                <p className="text-sm text-gray-500">Ready for assignment ({availableInterns.length})</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
                // Updated loading spinner border color
                <div className="text-center py-12">
                  <div className={`w-8 h-8 border-4 ${AVAILABLE_INTERNS_COLOR} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
                  <p className="text-gray-500 font-medium">Loading available interns...</p>
                </div>
            ) : availableInterns.length === 0 ? (
              // ... (Empty state unchanged) ...
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">All interns assigned</p>
                <p className="text-gray-400 text-sm">
                  All available interns are currently assigned to supervisors
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {visibleAvailableInterns.map((intern) => (
                    <div key={intern.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                         {/* ... (Profile info unchanged) ... */}
                        <ProfileImage intern={intern} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {`${intern.firstName || ''} ${intern.lastName || ''}`.trim() || intern.fullName || intern.name || intern.email}
                          </p>
                          <p className="text-sm text-gray-500">{intern.email}</p>
                        </div>
                      </div>
                      
                      {/* --- FIX: UPDATED VIEW BUTTON --- */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                         <button
                            onClick={() => setInternToView(intern)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            title="View intern profile"
                          >
                            View
                          </button>
                        {/* --- END FIX --- */}
                        <button
                          onClick={() => handleAddIntern(intern.uid)}
                          disabled={addingIntern === intern.uid}
                          // Updated button BG and hover
                          className={`${ACCENT_BG_BUTTON} ${ACCENT_BG_HOVER} px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2`}
                          title="Assign intern to my supervision"
                        >
                          {addingIntern === intern.uid ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Assigning...</span>
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
                
                {availableInterns.length > visibleCount && (
                  // Updated "Show More" button text/hover color
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      className={`${ACCENT_TEXT} hover:text-[#002B66] hover:${LIGHT_BG} px-4 py-2 text-sm font-medium rounded-lg transition-colors`}
                    >
                      Show More ({availableInterns.length - visibleCount} remaining)
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