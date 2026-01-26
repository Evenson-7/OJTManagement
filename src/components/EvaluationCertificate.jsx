// src/components/EvaluationCertificate.jsx (UPDATED - Blue Palette Applied)

import React from 'react';
// Icon is no longer used, but we'll leave the import just in case
import { HiOutlineCheckBadge } from "react-icons/hi2"; 

// You can find and add your company logo here
// import companyLogo from '../assets/logo.png'; 

const EvaluationCertificate = ({ evaluation, intern }) => { // <-- MODIFIED to accept 'intern'
  if (!evaluation) return null;

  const evaluationDate = new Date(
    evaluation.submittedAt?.toDate() || evaluation.evaluationDate || Date.now()
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // **** MODIFICATION: Logic to find the correct name ****
  // This ensures that even old evaluations will show the correct full name
  const displayName = (intern && intern.firstName && intern.lastName) 
    ? `${intern.firstName} ${intern.lastName}`
    : evaluation.internName || 'Intern Name'; // Fallback to the (potentially wrong) saved name

  return (
    // We target this ID for the PDF export
    <div 
      id="certificate-to-export" 
      className="w-[800px] h-[600px] p-4 bg-white relative flex flex-col items-center justify-center text-center font-serif"
      // Updated outer border to Deep Blue Accent (#0094FF)
      style={{ border: '10px solid #0094FF' }} 
    >
      {/* Inner border */}
      <div 
        className="w-full h-full flex flex-col items-center justify-center p-8"
        // Updated inner border to Sky Blue Primary (#42A5FF) and background to Light Cyan Tint (#BDE4F7)
        style={{ border: '3px solid #42A5FF', backgroundColor: '#BDE4F7' }} 
      >
        
        {/* Optional: Company Logo */}
        {/* <img src={companyLogo} alt="Company Logo" className="w-20 h-20 mb-2" /> */}

        <h1 
          className="text-4xl font-bold mb-4" 
          // Updated header color to Navy Blue for professionalism (#002B66)
          style={{ color: '#002B66' }} 
        >
          CERTIFICATE OF COMPLETION
        </h1>

        <p 
          className="text-lg mb-4"
          style={{ color: '#4b5563' }} // Gray-600
        >
          This certificate is proudly presented to
        </p>

        <h2 
          className="text-5xl font-extrabold mb-6"
          style={{ color: '#111827' }} // Gray-900
        >
          {displayName} {/* <-- MODIFIED to use the correct name */}
        </h2>

        <p 
          className="text-base mb-6 max-w-lg"
          style={{ color: '#4b5563' }} // Gray-600
        >
          In recognition of the successful completion of the On-the-Job Training (OJT) program and for rendering the required hours.
        </p>

        {/* Decorative Divider */}
        <div 
          className="w-48 h-px my-4"
          // Updated divider color to Sky Blue Primary (#42A5FF)
          style={{ backgroundColor: '#42A5FF' }} 
        ></div>

        <div className="flex justify-between w-full max-w-md mt-8">
          <div className="text-center">
            <p 
              className="text-lg font-medium pb-1 px-8"
              style={{ borderBottom: '1px solid #374151', color: '#1f2937' }} // Solid Gray-700 line
            >
              {evaluation.supervisorName || 'Supervisor Name'}
            </p>
            <p 
              className="text-sm mt-2"
              style={{ color: '#6b7280' }} // Gray-500
            >
              OJT Supervisor
            </p>
          </div>
          <div className="text-center">
            <p 
              className="text-lg font-medium pb-1 px-8"
              style={{ borderBottom: '1px solid #374151', color: '#1f2937' }} // Solid Gray-700 line
            >
              {evaluationDate}
            </p>
            <p 
              className="text-sm mt-2"
              style={{ color: '#6b7280' }} // Gray-500
            >
              Date of Completion
            </p>
          </div>
        </div>
        
        {/* --- SEAL / BADGE HAS BEEN REMOVED FROM HERE --- */}

      </div>
    </div>
  );
};

export default EvaluationCertificate;