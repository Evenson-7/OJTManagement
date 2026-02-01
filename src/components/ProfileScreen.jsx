import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Changed updateDoc to setDoc
import { db } from "../../firebaseConfig";
import toast from "react-hot-toast";

// --- ( DATA CONSTANTS ) ---
const COLLEGES = [
  { id: 'college_ccs', code: 'CCS', name: 'College of Computer Studies' },
  { id: 'college_cbe', code: 'CBE', name: 'College of Business Education' },
  { id: 'college_cte', code: 'CTE', name: 'College of Teacher Education' }
];

const PROGRAMS = {
  college_ccs: [
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
    { code: 'ACT', name: 'Associate in Computer Technology' }
  ],
  college_cbe: [
    { code: 'BSBA-MM', name: 'BSBA Major in Marketing Management' },
    { code: 'BSBA-FM', name: 'BSBA Major in Financial Management' },
    { code: 'BSBA-OM', name: 'BSBA Major in Operations Management' },
    { code: 'BSEntrep', name: 'Bachelor of Science in Entrepreneurship' }
  ],
  college_cte: [
    { code: 'BEEd', name: 'Bachelor of Elementary Education' },
    { code: 'BSEd-Eng', name: 'BSEd Major in English' },
    { code: 'BSEd-Math', name: 'BSEd Major in Mathematics' },
    { code: 'TCP', name: 'Teacher Certificate Program' }
  ]
};

// --- ( STYLE CONSTANTS ) ---
const ACCENT_COLOR = 'text-[#0094FF]';
const BTN_PRIMARY = 'bg-[#0094FF] hover:bg-[#002B66] text-white shadow-lg shadow-blue-500/30';
const BTN_SECONDARY = 'bg-gray-100 hover:bg-gray-200 text-gray-700';
const INPUT_STYLE = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0094FF]/20 focus:border-[#0094FF] transition-all bg-gray-50 focus:bg-white';

// --- ICONS ---
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);
const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
);

// --- HELPER COMPONENT ---
const InputGroup = ({ label, error, children }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
      {label} {error && <span className="text-red-500 normal-case ml-1">- {error}</span>}
    </label>
    {children}
  </div>
);

function ProfileScreen({ user, onClose, onUpdateProfile }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Cloudinary Config
  const CLOUDINARY_CLOUD_NAME = "dnc7jxm7x";
  const CLOUDINARY_UPLOAD_PRESET = "Profile";

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    companyName: "",
    department: "",     
    departmentId: "",   
    school: "",
    course: "",
    position: "",
    profileImage: ""
  });

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";
    if (user?.uid) {
        loadProfileData();
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [user]);

  const loadProfileData = async () => {
    try {
      // Safe check: If user.uid is missing, don't fetch (prevents 400 error)
      if (!user || !user.uid) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          firstName: data.firstName || user.displayName?.split(' ')[0] || "",
          lastName: data.lastName || user.displayName?.split(' ')[1] || "",
          phoneNumber: data.phoneNumber || "",
          companyName: data.companyName || "",
          department: data.department || "",
          departmentId: data.departmentId || "", 
          school: data.school || "",
          course: data.course || "",
          position: data.position || "",
          profileImage: data.profileImage || ""
        });
      }
    } catch (error) {
      console.error("Profile Load Error:", error);
      // Don't show toast error here to avoid annoying user if doc is just missing
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  // --- 2. LOGIC HANDLERS ---
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Handle College Change (Logic from Sign Up)
  const handleCollegeChange = (e) => {
    const selectedId = e.target.value;
    const selectedCollege = COLLEGES.find(c => c.id === selectedId);
    
    setProfileData(prev => ({
      ...prev,
      departmentId: selectedId,
      department: selectedCollege ? selectedCollege.name : "", // Save readable name
      course: "" // Reset course to prevent mismatch
    }));
  };

  const handleImageUpload = () => {
    setIsUploadingImage(true);
    if (!window.cloudinary) {
        toast.error("Upload service not ready. Try again.");
        setIsUploadingImage(false);
        return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ["local", "url", "camera"],
        multiple: false,
        cropping: true,
        croppingAspectRatio: 1,
        folder: "profile_images",
        clientAllowedFormats: ["jpg", "png", "webp"],
        theme: "minimal",
      },
      (error, result) => {
        setIsUploadingImage(false);
        if (!error && result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          setProfileData(prev => ({ ...prev, profileImage: imageUrl }));
          toast.success("Photo updated!");
        }
      }
    );
    widget.open();
  };

  // --- 3. SAVE HANDLER (FIXES MISSING DOC ERROR) ---
  const handleSave = async () => {
    const newErrors = {};
    if (!profileData.firstName?.trim()) newErrors.firstName = "Required";
    if (!profileData.lastName?.trim()) newErrors.lastName = "Required";
    if (!profileData.phoneNumber?.trim()) newErrors.phoneNumber = "Required";

    if (user.role === "intern") {
      if (!profileData.school?.trim()) newErrors.school = "Required";
      if (!profileData.departmentId) newErrors.departmentId = "Required";
      if (!profileData.course) newErrors.course = "Required";
    } else if (user.role === "supervisor") {
      if (!profileData.companyName?.trim()) newErrors.companyName = "Required";
      if (!profileData.department?.trim()) newErrors.department = "Required";
      if (!profileData.position?.trim()) newErrors.position = "Required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      // KEY FIX: Use setDoc with { merge: true } instead of updateDoc
      // This creates the document if it's missing (fixing the "User document not found" error)
      await setDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      if (onUpdateProfile) onUpdateProfile(profileData);
      
      toast.success("Profile saved successfully!");
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. RENDER ---
  if (!user) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
      <div 
        className={`bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {/* --- HEADER --- */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className={`text-2xl font-bold ${ACCENT_COLOR}`}>Edit Profile</h2>
            <p className="text-gray-500 text-sm">Update your personal and professional details</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* LEFT: PROFILE IMAGE */}
            <div className="md:w-1/3 flex flex-col items-center pt-2">
              <div className="relative group">
                <div className={`w-40 h-40 rounded-full overflow-hidden border-[5px] border-white shadow-2xl ring-1 ring-gray-100 ${profileData.profileImage ? '' : 'bg-gray-100 flex items-center justify-center'}`}>
                  {profileData.profileImage ? (
                    <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl text-gray-300 font-bold">{profileData.firstName?.charAt(0)}</span>
                  )}
                </div>
                <button 
                  onClick={handleImageUpload}
                  disabled={isUploadingImage}
                  className="absolute bottom-2 right-2 p-3 bg-white text-gray-600 rounded-full shadow-lg hover:text-[#0094FF] transition-all transform hover:scale-110 border border-gray-100"
                  title="Upload Photo"
                >
                  <CameraIcon />
                </button>
              </div>
              <div className="mt-5 text-center">
                <h3 className="text-xl font-bold text-gray-800">{profileData.firstName || 'User'} {profileData.lastName}</h3>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-[#0094FF] text-xs font-bold uppercase tracking-wider rounded-full border border-blue-100">
                  {user.role}
                </span>
              </div>
            </div>

            {/* RIGHT: FORM FIELDS */}
            <div className="md:w-2/3 space-y-8">
              
              {/* Personal Info Group */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputGroup label="First Name" error={errors.firstName}>
                    <input type="text" value={profileData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} className={INPUT_STYLE} />
                  </InputGroup>
                  <InputGroup label="Last Name" error={errors.lastName}>
                    <input type="text" value={profileData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} className={INPUT_STYLE} />
                  </InputGroup>
                </div>
                <InputGroup label="Phone Number" error={errors.phoneNumber}>
                    <input type="tel" value={profileData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} className={INPUT_STYLE} />
                </InputGroup>
              </div>

              {/* Role Specific Group */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  {user.role === 'intern' ? 'Academic Details' : 'Professional Details'}
                </h4>
                
                {user.role === 'intern' ? (
                  // --- INTERN FIELDS (New Logic) ---
                  <div className="space-y-5">
                     <InputGroup label="School / University" error={errors.school}>
                      <input type="text" value={profileData.school} onChange={e => handleInputChange('school', e.target.value)} className={INPUT_STYLE} />
                    </InputGroup>

                    <div className="grid grid-cols-1 gap-5">
                      {/* 1. College Dropdown */}
                      <InputGroup label="College Department" error={errors.departmentId}>
                        <div className="relative">
                          <select 
                            value={profileData.departmentId} 
                            onChange={handleCollegeChange}
                            className={`${INPUT_STYLE} appearance-none cursor-pointer`}
                          >
                            <option value="">Select College</option>
                            {COLLEGES.map(c => <option key={c.id} value={c.id}>({c.code}) {c.name}</option>)}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </InputGroup>

                      {/* 2. Program Dropdown (Dependent) */}
                      <InputGroup label="Program / Course" error={errors.course}>
                         <div className="relative">
                          <select 
                            value={profileData.course} 
                            onChange={e => handleInputChange('course', e.target.value)}
                            disabled={!profileData.departmentId}
                            className={`${INPUT_STYLE} appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400`}
                          >
                            <option value="">{profileData.departmentId ? "Select Program" : "Select College First"}</option>
                            {profileData.departmentId && PROGRAMS[profileData.departmentId]?.map(p => (
                              <option key={p.code} value={p.code}>{p.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </InputGroup>
                    </div>
                  </div>
                ) : (
                  // --- SUPERVISOR FIELDS ---
                  <div className="space-y-5">
                    <InputGroup label="Company Name" error={errors.companyName}>
                      <input type="text" value={profileData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} className={INPUT_STYLE} />
                    </InputGroup>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputGroup label="Department" error={errors.department}>
                        <input type="text" value={profileData.department} onChange={e => handleInputChange('department', e.target.value)} className={INPUT_STYLE} />
                      </InputGroup>
                      <InputGroup label="Position" error={errors.position}>
                        <input type="text" value={profileData.position} onChange={e => handleInputChange('position', e.target.value)} className={INPUT_STYLE} />
                      </InputGroup>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={handleClose} 
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${BTN_SECONDARY}`}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`px-8 py-2.5 rounded-lg font-medium transition-transform active:scale-95 flex items-center ${BTN_PRIMARY} disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isSaving ? <span className="animate-pulse">Saving...</span> : <><SaveIcon /><span className="ml-2">Save Changes</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;