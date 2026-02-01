import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- ( COLOR PALETTE ) ---
const BRAND_COLOR = 'bg-gradient-to-r from-[#42A5FF] to-[#0094FF]'; 
const BRAND_HOVER_FOCUS = 'hover:from-[#0094FF] hover:to-[#002B66] focus:ring-[#42A5FF]';
const ACCENT_TEXT_BORDER = 'text-[#0094FF] border-[#0094FF] focus:ring-[#0094FF] focus:border-[#0094FF]';
const ICON_BG = 'bg-[#42A5FF]'; 
const PROGRESS_BAR_GRADIENT = 'bg-gradient-to-r from-[#0094FF] to-[#42A5FF]';

// --- ( DATA: COLLEGES & PROGRAMS ) ---
// This matches the AdminDash IDs to ensure Coordinators see the right students.
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

// --- ( SVG ICONS ) ---
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const AcademicIcon = () => (
  <svg className="w-5 h-5 text-[#0094FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);
const OfficeIcon = () => (
  <svg className="w-5 h-5 text-[#0094FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg className="w-5 h-5 text-[#0094FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);
const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const InternHeaderIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const SupervisorHeaderIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
// --- ( END ICONS ) ---

// --- ( REUSABLE COMPONENTS ) ---
const ProgressBar = ({ currentStep, totalSteps }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progress)}% complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ease-out ${PROGRESS_BAR_GRADIENT}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Generic Input Field
const InputField = ({ name, value, onChange, placeholder, type = "text", icon, disabled, showToggle, onToggle }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ACCENT_TEXT_BORDER} bg-white/50 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
      placeholder={placeholder}
      required
    />
    {showToggle && (
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
        onClick={onToggle}
        disabled={disabled}
      >
        {type === 'password' ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    )}
  </div>
);

// New Select Field Component
const SelectField = ({ name, value, onChange, options, placeholder, icon, disabled }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ACCENT_TEXT_BORDER} bg-white/50 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none`}
      required
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {/* Custom Dropdown Arrow */}
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
    </div>
  </div>
);
// --- ( END REUSABLE COMPONENTS ) ---


const Auth = () => {
  const navigate = useNavigate();
  
  // Form modes
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSupervisorMode, setIsSupervisorMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // State
  const initialState = {
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phoneNumber: '',
    school: '', // This will serve as University Name
    departmentId: '', // NEW: To link with College
    course: '', // This will hold the Program Code
    companyName: '',
    department: '', // For Supervisor/Intern Company Dept
    position: ''
  };
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Logic: If Department changes, clear the course to prevent mismatches
    if (name === 'departmentId') {
      setFormData(prev => ({ ...prev, course: '' }));
    }
  };

  const internSteps = [
    { title: 'Account Setup', icon: <LockIcon />, fields: ['email', 'password', 'confirmPassword'] },
    { title: 'Personal Information', icon: <UserIcon />, fields: ['firstName', 'lastName', 'phoneNumber'] },
    { title: 'Educational Background', icon: <AcademicIcon />, fields: ['school', 'departmentId', 'course'] },
    { title: 'Internship Details', icon: <OfficeIcon />, fields: ['companyName', 'department'] }
  ];

  const supervisorSteps = [
    { title: 'Account Setup', icon: <LockIcon />, fields: ['email', 'password', 'confirmPassword'] },
    { title: 'Personal Information', icon: <UserIcon />, fields: ['firstName', 'lastName', 'phoneNumber'] },
    { title: 'Professional Details', icon: <BriefcaseIcon />, fields: ['companyName', 'department', 'position'] }
  ];

  const getCurrentSteps = () => {
    return isSupervisorMode ? supervisorSteps : internSteps;
  };

  const validateCurrentStep = () => {
    const currentFields = getCurrentSteps()[currentStep].fields;
    return currentFields.every(field => formData[field]?.trim());
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 0) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }
      }
      setError('');
      setCurrentStep(prev => Math.min(prev + 1, getCurrentSteps().length - 1));
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success('Successfully signed in!');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      let errorMessage = 'Failed to sign in';
      switch (error.code) {
        case 'auth/user-not-found': errorMessage = 'No account found with this email'; break;
        case 'auth/wrong-password': errorMessage = 'Incorrect password'; break;
        case 'auth/invalid-credential': errorMessage = 'Invalid email or password'; break;
        default: errorMessage = 'Invalid email or password';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    const { email, password, confirmPassword, ...profileData } = formData;

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSigningUp(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, {
        displayName: `${profileData.firstName} ${profileData.lastName}`
      });
      
      const userData = {
        ...profileData,
        email: email,
        createdAt: new Date(),
        role: isSupervisorMode ? 'supervisor' : 'intern'
      };
      
      // Clean up fields based on role
      delete userData.confirmPassword;
      if (isSupervisorMode) {
        delete userData.school;
        delete userData.course;
        delete userData.departmentId; // Supervisor uses 'department' text, not ID
      } else {
        delete userData.position;
      }
      
      await setDoc(doc(db, 'users', user.uid), userData);
      toast.success(`${isSupervisorMode ? 'Supervisor' : 'Intern'} account created successfully!`);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      let errorMessage = 'Failed to create account';
      switch (error.code) {
        case 'auth/email-already-in-use': errorMessage = 'An account with this email already exists'; break;
        case 'auth/invalid-email': errorMessage = 'Invalid email address'; break;
        case 'auth/weak-password': errorMessage = 'Password is too weak'; break;
        default: errorMessage = 'An error occurred. Please try again.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setIsLogin(true);
    } catch (error) {
      let errorMessage = 'Failed to send reset email';
      switch (error.code) {
        case 'auth/user-not-found': errorMessage = 'No account found with this email'; break;
        default: errorMessage = 'Failed to send reset email.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSendingReset(false);
    }
  };

  const resetForm = () => {
    setFormData(initialState);
    setCurrentStep(0);
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
    setIsSupervisorMode(false);
    resetForm();
  };

  const toggleSupervisorMode = () => {
    setIsSupervisorMode(!isSupervisorMode);
    resetForm();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: { style: { background: '#002B66', color: 'white' } }, 
          error: { style: { background: '#EF4444', color: 'white' } },
        }}
      />
      
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 flex flex-col">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${BRAND_COLOR} rounded-2xl mb-4 shadow-lg`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSupervisorMode ? 'supervisor' : 'intern'}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {isSupervisorMode ? <SupervisorHeaderIcon /> : <InternHeaderIcon />}
                </motion.div>
              </AnimatePresence>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              OJT Management System
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {isSupervisorMode ? 'Supervisor Portal' : 'Student Portal'}
            </p>
          </div>

          <AnimatePresence>
            {!isLogin && !showForgotPassword && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={containerVariants}
                className="mb-6"
              >
                {/* Account Type Toggle */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setIsSupervisorMode(false)}
                      disabled={isSigningUp}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        !isSupervisorMode
                          ? 'bg-white text-[#0094FF] shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      } ${isSigningUp ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Intern
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSupervisorMode()}
                      disabled={isSigningUp}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        isSupervisorMode
                          ? 'bg-white text-[#0094FF] shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      } ${isSigningUp ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Supervisor
                    </button>
                  </div>
                </div>

                <ProgressBar 
                  currentStep={currentStep} 
                  totalSteps={getCurrentSteps().length}
                />

                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-2 rounded-full ${ICON_BG} text-white`}> 
                      {getCurrentSteps()[currentStep].icon}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {getCurrentSteps()[currentStep].title}
                    </h2>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="flex-grow flex flex-col" onSubmit={showForgotPassword ? handleForgotPassword : isLogin ? handleSignIn : handleSignUp}>
            
            <div className="flex-grow">
              <AnimatePresence mode="wait">
                {/* Login Form */}
                {isLogin && !showForgotPassword && (
                  <motion.div
                    key="login"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="space-y-4">
                      <InputField
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email address"
                        type="email"
                        icon={<UserIcon />}
                        disabled={isLoading}
                      />
                      <InputField
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        icon={<LockIcon />}
                        disabled={isLoading}
                        showToggle={true}
                        onToggle={() => setShowPassword(!showPassword)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full mt-6 ${BRAND_COLOR} text-white py-3 px-4 rounded-lg font-medium ${BRAND_HOVER_FOCUS} focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center`}
                    >
                      {isLoading ? (<><LoadingSpinner /><span className="ml-2">Signing In...</span></>) : 'Sign In'}
                    </button>
                  </motion.div>
                )}

                {/* Registration Form */}
                {!isLogin && !showForgotPassword && (
                  <motion.div
                    key="register"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="space-y-4">
                      {/* Step 0: Account Setup */}
                      {currentStep === 0 && (
                        <>
                          <InputField name="email" value={formData.email} onChange={handleChange} placeholder="Email address" type="email" icon={<UserIcon />} disabled={isSigningUp} />
                          <InputField name="password" value={formData.password} onChange={handleChange} placeholder="Password" type={showPassword ? "text" : "password"} icon={<LockIcon />} disabled={isSigningUp} showToggle={true} onToggle={() => setShowPassword(!showPassword)} />
                          <InputField name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" type={showConfirmPassword ? "text" : "password"} icon={<LockIcon />} disabled={isSigningUp} showToggle={true} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                        </>
                      )}
                      
                      {/* Step 1: Personal Info */}
                      {currentStep === 1 && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" icon={<></>} disabled={isSigningUp} />
                            <InputField name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" icon={<></>} disabled={isSigningUp} />
                          </div>
                          <InputField name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone number" type="tel" icon={<></>} disabled={isSigningUp} />
                        </>
                      )}

                      {/* Step 2: Intern vs Supervisor */}
                      {!isSupervisorMode && currentStep === 2 && (
                        <>
                          {/* UNIVERSITY NAME */}
                          <InputField 
                            name="school" 
                            value={formData.school} 
                            onChange={handleChange} 
                            placeholder="University/School Name" 
                            icon={<AcademicIcon />} 
                            disabled={isSigningUp} 
                          />

                          {/* COLLEGE / DEPARTMENT DROPDOWN */}
                          <SelectField
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            options={COLLEGES.map(c => ({ value: c.id, label: `(${c.code}) ${c.name}` }))}
                            placeholder="Select College / Department"
                            icon={<AcademicIcon />}
                            disabled={isSigningUp}
                          />

                          {/* COURSE DROPDOWN (Filtered by College) */}
                          <SelectField
                            name="course"
                            value={formData.course}
                            onChange={handleChange}
                            options={formData.departmentId && PROGRAMS[formData.departmentId] 
                              ? PROGRAMS[formData.departmentId].map(p => ({ value: p.code, label: p.name })) 
                              : []
                            }
                            placeholder={formData.departmentId ? "Select Program / Course" : "Select College First"}
                            icon={<AcademicIcon />}
                            disabled={!formData.departmentId || isSigningUp}
                          />
                        </>
                      )}

                      {isSupervisorMode && currentStep === 2 && (
                        <>
                          <InputField name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company name" icon={<OfficeIcon />} disabled={isSigningUp} />
                          <InputField name="department" value={formData.department} onChange={handleChange} placeholder="Department" icon={<OfficeIcon />} disabled={isSigningUp} />
                          <InputField name="position" value={formData.position} onChange={handleChange} placeholder="Position/Title" icon={<BriefcaseIcon />} disabled={isSigningUp} />
                        </>
                      )}

                      {/* Step 3: Intern (Company) */}
                      {!isSupervisorMode && currentStep === 3 && (
                         <>
                          <InputField name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company name" icon={<OfficeIcon />} disabled={isSigningUp} />
                          <InputField name="department" value={formData.department} onChange={handleChange} placeholder="Department (Intern)" icon={<OfficeIcon />} disabled={isSigningUp} />
                        </>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      {currentStep > 0 ? (
                        <button 
                          type="button" 
                          onClick={handleBack} 
                          disabled={isSigningUp} 
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0094FF] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowLeftIcon />
                          <span>Back</span>
                        </button>
                      ) : ( <div></div> )}
                      
                      {currentStep < getCurrentSteps().length - 1 ? (
                        <button 
                          type="button" 
                          onClick={handleNext} 
                          disabled={isSigningUp} 
                          className={`flex items-center space-x-2 px-6 py-2 ${BRAND_COLOR} ${BRAND_HOVER_FOCUS} text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ml-auto`}
                        >
                          <span>Next</span>
                          <ArrowRightIcon />
                        </button>
                      ) : (
                        <button 
                          type="submit" 
                          disabled={isSigningUp} 
                          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#0094FF] to-[#002B66] text-white rounded-lg font-medium hover:from-[#002B66] hover:to-[#002B66] focus:outline-none focus:ring-2 focus:ring-[#42A5FF] focus:ring-offset-2 transition-all duration-200 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSigningUp ? (<><LoadingSpinner /><span>Creating...</span></>) : (<><CheckIcon /><span>Create Account</span></>)}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Forgot Password Form */}
                {showForgotPassword && (
                  <motion.div
                    key="forgot"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="space-y-4">
                      <InputField name="email" value={formData.email} onChange={handleChange} placeholder="Email address" type="email" icon={<UserIcon />} disabled={isSendingReset} />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSendingReset} 
                      className={`w-full mt-6 ${BRAND_COLOR} text-white py-3 px-4 rounded-lg font-medium ${BRAND_HOVER_FOCUS} focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center`}
                    >
                      {isSendingReset ? (<><LoadingSpinner /><span className="ml-2">Sending Link...</span></>) : 'Send Reset Link'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 text-center">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={showForgotPassword ? () => {setShowForgotPassword(false); setIsLogin(true); resetForm();} : toggleMode}
                  disabled={isLoading || isSigningUp || isSendingReset}
                  className="text-[#0094FF] hover:text-[#002B66] font-medium text-sm underline focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showForgotPassword 
                    ? 'Remember your password?' 
                    : isLogin 
                      ? "Don't have an account?" 
                      : "Already have an account?"
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;