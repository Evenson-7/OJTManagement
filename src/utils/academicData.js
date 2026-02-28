export const COLLEGES = [
  { id: 'college_ccs', code: 'CCS', name: 'College of Computer Studies' },
  { id: 'college_cbe', code: 'CBE', name: 'College of Business Education' },
  { id: 'college_cte', code: 'CTE', name: 'College of Teacher Education' }
];

export const PROGRAMS = {
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

// Helper function to get readable names from codes
export const getDepartmentName = (deptId) => {
  const dept = COLLEGES.find(c => c.id === deptId);
  return dept ? dept.code : 'Unknown Dept';
};

export const getCourseName = (deptId, courseCode) => {
  if (!PROGRAMS[deptId]) return courseCode;
  const course = PROGRAMS[deptId].find(c => c.code === courseCode);
  return course ? course.name : courseCode;
};