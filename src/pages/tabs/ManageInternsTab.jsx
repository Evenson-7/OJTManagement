// fileName: ManageInternsTab.jsx

import React from 'react';
// Make sure this import path matches where your component actually lives
import InternManagementSection from '../tabs/InternManagementSection'; 

function ManageInternsTab({ user }) {
  return (
    <div className="space-y-6 w-full pb-10 animate-fadeIn">
      <div className="pt-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Interns</h1>
        <p className="text-gray-600 mt-1 mb-6">Build your team, appoint available interns, and manage current assignments.</p>
      </div>
      
      {/* The management UI is now safely isolated here */}
      <InternManagementSection user={user} />
    </div>
  );
}

export default ManageInternsTab;