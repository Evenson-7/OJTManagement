import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import toast from "react-hot-toast";

// --- Color Utility Classes ---
const ACCENT_COLOR = 'text-[#0094FF]'; // Deep Blue Accent
const ACCENT_BG = 'bg-[#0094FF]';
const ACCENT_HOVER_BG = 'hover:bg-[#002B66]';
const ACCENT_RING = 'focus:ring-[#0094FF]';
const LIGHT_ACCENT_BG = 'bg-[#BDE4F7]'; // Light Cyan Tint
const TEXT_NAVY = 'text-[#002B66]'; // Navy Blue Text


// --- HELPER COMPONENTS (MOVED OUTSIDE) ---

// Error display component
const ErrorMessage = ({ error }) => {
  if (!error) return null;
  return (
    <p className="text-red-500 text-sm mt-1 flex items-center">
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {error}
    </p>
  );
};

// Input component with error styling
const InputField = ({ label, error, required, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className={`${error ? "border-red-300" : "border-gray-300"}`}>
      {children}
    </div>
    <ErrorMessage error={error} />
  </div>
);

// Profile Image Section
const ProfileImageSection = ({ profileData, handleImageUpload, isUploadingImage, handleRemoveImage }) => (
  <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
    <div className="relative">
      {profileData.profileImage ? (
        <div className="relative group">
          <img
            src={profileData.profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}
    </div>
    <div className="text-center">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">
        Profile Picture
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        {profileData.profileImage
          ? "Update your profile picture"
          : "Add a profile picture to personalize your account"}
      </p>

      <div className="flex space-x-3">
        <button
          onClick={handleImageUpload}
          disabled={isUploadingImage}
          // Updated button BG and hover
          className={`${ACCENT_BG} text-white px-4 py-2 rounded-lg ${ACCENT_HOVER_BG} transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isUploadingImage ? (
            <div className="flex items-center space-x-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {profileData.profileImage ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </button>

        {profileData.profileImage && (
          <button
            onClick={handleRemoveImage}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  </div>
);


// --- MAIN COMPONENT ---

function ProfileScreen({ user, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Cloudinary configuration - Replace with your actual values
  // NOTE: CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET are kept as variables
  const CLOUDINARY_CLOUD_NAME = "dnc7jxm7x"; // Replace with your Cloudinary cloud name
  const CLOUDINARY_UPLOAD_PRESET = "Profile"; // Replace with your upload preset

  // Profile data limited to sign-up fields
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phoneNumber: user?.phoneNumber || "",
    companyName: user?.companyName || "",
    department: user?.department || "",
    profileImage: user?.profileImage || "",
    ...(user?.role === "intern" && { school: user?.school || "", course: user?.course || "" }),
    ...(user?.role === "supervisor" && { position: user?.position || "" }),
  });

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";
    // Load the data from Firestore *once* when the component mounts
    loadProfileData(); 
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []); // <-- Empty dependency array. Only run on mount.

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData((prev) => ({
          ...prev,
          ...userData,
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Error loading profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Cloudinary image upload function
  const handleImageUpload = () => {
    setIsUploadingImage(true);
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ["local", "url", "camera"],
        multiple: false,
        maxFileSize: 10000000, // 10MB
        cropping: true,
        croppingAspectRatio: 1, // Square aspect ratio
        folder: "profile_images",
        publicId: `profile_${user.uid}_${Date.now()}`,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        theme: "white",
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            // Updated Palette Colors (Teal -> Deep Blue/Navy/Sky Blue)
            tabIcon: "#0094FF", // Deep Blue Accent
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0094FF", // Deep Blue Accent
            action: "#0094FF", // Deep Blue Accent
            inactiveTabIcon: "#002B66", // Navy Blue
            error: "#F44235",
            inProgress: "#42A5FF", // Sky Blue
            complete: "#002B66", // Navy Blue
            sourceBg: "#E4EBF1",
          },
        },
      },
      (error, result) => {
        setIsUploadingImage(false);

        if (error) {
          console.error("Upload error:", error);
          toast.error("Error uploading image. Please try again.");
          return;
        }

        if (result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          setProfileData((prev) => ({
            ...prev,
            profileImage: imageUrl,
          }));
          toast.success("Profile image uploaded successfully!");
        }
      }
    );

    widget.open();
  };

  // Remove profile image
  const handleRemoveImage = () => {
    setProfileData((prev) => ({
      ...prev,
      profileImage: "",
    }));
    toast.success("Profile image removed");
  };

  // Load Cloudinary script
  useEffect(() => {
    if (!window.cloudinary) {
      const script = document.createElement("script");
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Handle input changes with basic validation
  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    // Basic validation (e.g., required fields)
    const newErrors = {};
    if (!profileData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!profileData.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!profileData.phoneNumber?.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!profileData.companyName?.trim()) newErrors.companyName = "Company name is required";
    if (!profileData.department?.trim()) newErrors.department = "Department is required";

    if (user?.role === "intern") {
      if (!profileData.school?.trim()) newErrors.school = "School is required";
      if (!profileData.course?.trim()) newErrors.course = "Course is required";
    } else if (user?.role === "supervisor") {
      if (!profileData.position?.trim()) newErrors.position = "Position is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Profile updated successfully!");
      handleClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render simplified step content
  const renderStepContent = () => {
    return (
      <div className="space-y-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Basic Information
        </h3>

        {/* Profile Image Section */}
        <ProfileImageSection 
          profileData={profileData}
          handleImageUpload={handleImageUpload}
          isUploadingImage={isUploadingImage}
          handleRemoveImage={handleRemoveImage}
        />

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="First Name" error={errors.firstName} required>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              // Updated focus ring
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                errors.firstName
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
          </InputField>

          <InputField label="Last Name" error={errors.lastName} required>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              // Updated focus ring
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                errors.lastName
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
          </InputField>

          <InputField label="Phone Number" error={errors.phoneNumber} required>
            <input
              type="tel"
              value={profileData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              // Updated focus ring
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                errors.phoneNumber
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
          </InputField>

          <InputField label="Company Name" error={errors.companyName} required>
            <input
              type="text"
              value={profileData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              // Updated focus ring
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                errors.companyName
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
          </InputField>

          <InputField label="Department" error={errors.department} required>
            <input
              type="text"
              value={profileData.department}
              onChange={(e) => handleInputChange("department", e.target.value)}
              // Updated focus ring
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                errors.department
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
          </InputField>

          {user?.role === "intern" && (
            <>
              <InputField label="School" error={errors.school} required>
                <input
                  type="text"
                  value={profileData.school}
                  onChange={(e) => handleInputChange("school", e.target.value)}
                  // Updated focus ring
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                    errors.school
                      ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
              </InputField>

              <InputField label="Course" error={errors.course} required>
                <input
                  type="text"
                  value={profileData.course}
                  onChange={(e) => handleInputChange("course", e.target.value)}
                  // Updated focus ring
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                    errors.course
                      ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
              </InputField>
            </>
          )}

          {user?.role === "supervisor" && (
            <InputField label="Position" error={errors.position} required>
              <input
                type="text"
                value={profileData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                // Updated focus ring
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${ACCENT_RING} ${
                  errors.position
                    ? "border-red-300 focus:border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
            </InputField>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <svg
              className={`animate-spin h-6 w-6 ${ACCENT_COLOR}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-700 font-medium">
              Loading profile...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 ${
        isVisible ? "bg-opacity-60" : "bg-opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Main Content (no stepper since single step) */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50"> 
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${ACCENT_BG} rounded-full flex items-center justify-center`}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Profile Settings
                </h2>
                <p className="text-sm text-gray-600">
                  Edit your basic information
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {renderStepContent()}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              // Updated button BG and hover
              className={`px-6 py-2 ${ACCENT_BG} text-white rounded-lg ${ACCENT_HOVER_BG} transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;