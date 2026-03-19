// fileName: EvalForm.js

export const GRADE_CONVERSION_GUIDE = {
  CTE_5_POINT: {
    type: "table",
    scales: [
      { val: "5", display: "5", label: "5 – Excellent", desc: "Consistently exceeds expectations; demonstrates independence and leadership", color: "green" }, // 
      { val: "4", display: "4", label: "4 – Very Satisfactory", desc: "Meets expectations with minimal supervision.", color: "blue" }, // 
      { val: "3", display: "3", label: "3 – Satisfactory", desc: "Meets basic expectations; needs occasional guidance.", color: "yellow" }, // 
      { val: "2", display: "2", label: "2 – Poor", desc: "Below expectations; needs frequent supervision.", color: "orange" }, // 
      { val: "1", display: "1", label: "1 – Very Poor", desc: "Fails to meet expectations despite assistance.", color: "red" } // 
    ]
  },
  CSS_LETTER: {
    type: "matrix",
    scales: [
      { val: "5", display: "E", color: "green" },
      { val: "4", display: "A", color: "blue" },
      { val: "3", display: "S", color: "yellow" },
      { val: "2", display: "N", color: "orange" },
      { val: "1", display: "P", color: "red" }
    ]
  },
  CBE_100_POINT: {
    type: "info",
    text: "Please evaluate the intern by entering a rating from 75 to 100 for each criterion." // [cite: 28]
  }
};

export const translateFinalGrade = (baseScore, formatType) => {
    if (!baseScore) return "N/A";
    const score = Number(baseScore);
    
    // Shows the exact range equivalent
    if (formatType === "CSS_LETTER") {
        if (score >= 4.5) return `E (90 - 100)`; // 
        if (score >= 4.0) return `A (85 - 89)`; // 
        if (score >= 3.0) return `S (80 - 84)`; // 
        if (score >= 2.0) return `N (75 - 79)`; // 
        return `P (Below 75)`; // 
    }
    
    if (formatType === "CBE_100_POINT") {
        return `${score.toFixed(2)} / 100`;
    }
    
    if (formatType === "CTE_5_POINT") {
         if (score >= 4.5) return `${score.toFixed(2)} / 5.00 (Outstanding)`; // [cite: 141]
         if (score >= 3.5) return `${score.toFixed(2)} / 5.00 (Very Satisfactory)`; // [cite: 141]
         if (score >= 2.5) return `${score.toFixed(2)} / 5.00 (Satisfactory)`; // [cite: 141]
         if (score >= 1.5) return `${score.toFixed(2)} / 5.00 (Needs Improvement)`; // [cite: 141]
         return `${score.toFixed(2)} / 5.00 (Unsatisfactory)`; // [cite: 141]
    }
    
    return `${score.toFixed(2)} / 5.00`;
};

export const EVALUATION_TEMPLATES = [
  {
    id: "eval_site_supervisor",
    title: "CCS INTERNSHIP RATING FORM", 
    gradingFormat: "CSS_LETTER", 
    sections: [
      {
        id: "sec_behavior", title: "I. BEHAVIOR AT WORK", 
        items: [
          { id: "q_beh_1", text: "Attention and concentration on tasks" }, 
          { id: "q_beh_2", text: "Motivation and initiative" }, 
          { id: "q_beh_3", text: "Sense of responsibility" }, 
          { id: "q_beh_4", text: "Perseverance and diligence" }, 
          { id: "q_beh_5", text: "Self-confidence" }, 
          { id: "q_beh_6", text: "Cleanliness and orderliness of workplace" }, 
          { id: "q_beh_7", text: "Quality of work" }, 
          { id: "q_beh_8", text: "Relationship with others" }, 
          { id: "q_beh_9", text: "Attendance" } 
        ]
      },
      {
        id: "sec_academic", title: "II. ACADEMIC PERFORMANCE", 
        items: [
          { id: "q_aca_1", text: "Communication Skills: Speaking" }, 
          { id: "q_aca_2", text: "Communication Skills: Writing" }, 
          { id: "q_aca_3", text: "Communication Skills: Listening" }, 
          { id: "q_aca_4", text: "Communication Skills: Reading" }, 
          { id: "q_aca_5", text: "Knowledge of assigned tasks" }, 
          { id: "q_aca_6", text: "Updating and research performance" }, 
          { id: "q_aca_7", text: "Ability to learn" } 
        ]
      },
      {
        id: "sec_social", title: "III. SOCIAL BEHAVIOR", 
        items: [
          { id: "q_soc_1", text: "Leadership potential" }, 
          { id: "q_soc_2", text: "Maturity" }, 
          { id: "q_soc_3", text: "Concern for others" }, 
          { id: "q_soc_4", text: "Acceptance of criticism" }, 
          { id: "q_soc_5", text: "Ability to express feelings" }, 
          { id: "q_soc_6", text: "Judgment" }, 
          { id: "q_soc_7", text: "Dependability" }, 
          { id: "q_soc_8", text: "Respect for others" }, 
          { id: "q_soc_9", text: "Integrity" } 
        ]
      },
      {
        id: "sec_personality", title: "IV. PERSONALITY", 
        items: [
          { id: "q_per_1", text: "Grooming and appearance" }, 
          { id: "q_per_2", text: "Posture" }, 
          { id: "q_per_3", text: "Appropriateness of attire" }, 
          { id: "q_per_4", text: "Manners and conduct" }, 
          { id: "q_per_5", text: "Tact" } 
        ]
      },
      {
        id: "sec_cost", title: "V. COST CONSCIOUSNESS", 
        items: [
          { id: "q_cst_1", text: "Time management" }, 
          { id: "q_cst_2", text: "Economy on the use of materials" }, 
          { id: "q_cst_3", text: "Conservation of resources" } 
        ]
      }
    ],
    essays: [
      { id: "essay_1", question: "1. What do you think are the intern's talents or strengths?", placeholder: "Enter details..." }, 
      { id: "essay_2", question: "2. What aspects of the intern do you think need enhancement?", placeholder: "Enter details..." }, 
      { id: "essay_3", question: "3. What suggestions can you give to further improve the intern?", placeholder: "Enter details..." }, 
      { id: "essay_4", question: "4. Other Remarks:", placeholder: "Enter details..." } 
    ]
  },
  {
    id: "eval_cte_performance",
    title: "CTE INTERNSHIP RATING FORM", 
    gradingFormat: "CTE_5_POINT", 
    sections: [
      {
        id: "sec_cte_conduct", title: "Domain 1: Professional Conduct, Ethics, and Work Values", 
        items: [
          { id: "q_cte_con_1", text: "Shows initiative and resourcefulness" }, 
          { id: "q_cte_con_2", text: "Meets deadlines and completes tasks on time" }, 
          { id: "q_cte_con_3", text: "Demonstrates accountability and responsibility" }, 
          { id: "q_cte_con_4", text: "Displays positive attitude toward work and colleagues" }, 
          { id: "q_cte_con_5", text: "Exhibits favorable behavior and professionalism" } 
        ]
      },
      {
        id: "sec_cte_appearance", title: "Domain 2: Personal Appearance and Deportment", 
        items: [
          { id: "q_cte_app_1", text: "Presentable and well-groomed" }, 
          { id: "q_cte_app_2", text: "Wears proper and complete uniform" }, 
          { id: "q_cte_app_3", text: "Observes school rules and policies" } 
        ]
      },
      {
        id: "sec_cte_competence", title: "Domain 3: Teaching Competence and Pedagogical Skills", 
        items: [
          { id: "q_cte_com_1", text: "Demonstrates mastery of subject matter" }, 
          { id: "q_cte_com_2", text: "Prepares and organizes lesson plans effectively" }, 
          { id: "q_cte_com_3", text: "Uses appropriate teaching strategies and methods" }, 
          { id: "q_cte_com_4", text: "Manages classroom effectively" }, 
          { id: "q_cte_com_5", text: "Communicates ideas clearly and confidently" }, 
          { id: "q_cte_com_6", text: "Engages students in learning activities" }, 
          { id: "q_cte_com_7", text: "Uses instructional materials and technology effectively" } 
        ]
      },
      {
        id: "sec_cte_relationships", title: "Domain 4: Professional Relationships and School Involvement", 
        items: [
          { id: "q_cte_rel_1", text: "Maintains respectful relationships with learners" }, 
          { id: "q_cte_rel_2", text: "Collaborates effectively with cooperating teacher and staff" }, 
          { id: "q_cte_rel_3", text: "Participates in school activities and initiatives" } 
        ]
      }
    ],
    essays: [
      { id: "essay_cte_1", question: "Violations (if any):", placeholder: "List any violations..." }, 
      { id: "essay_cte_2", question: "Strengths:", placeholder: "Enter strengths..." }, 
      { id: "essay_cte_3", question: "Areas for Improvement:", placeholder: "Enter areas for improvement..." }, 
      { id: "essay_cte_4", question: "Additional Comments/Suggestions:", placeholder: "Enter comments..." } 
    ]
  },
  {
    id: "eval_cbe_rating",
    title: "CBE INTERNSHIP RATING FORM", 
    gradingFormat: "CBE_100_POINT", 
    sections: [
      {
        id: "sec_cbe_prof", title: "Professionalism of Student Intern", 
        items: [
          { id: "q_cbe_prof_1", text: "Attendance and punctuality" }, 
          { id: "q_cbe_prof_2", text: "Adherence to workplace dress code, ethical guidelines, company policies and procedures" }, 
          { id: "q_cbe_prof_3", text: "Communication of anticipated absences or lateness" }, 
          { id: "q_cbe_prof_4", text: "Demonstrated politeness and respect towards colleagues, supervisors and others" } 
        ]
      },
      {
        id: "sec_cbe_comm", title: "Communication Skills of Student Intern", 
        items: [
          { id: "q_cbe_comm_1", text: "Clear and concise written communication (emails, reports and documentation)" }, 
          { id: "q_cbe_comm_2", text: "Active listening and understanding of instructions or feedback" } 
        ]
      },
      {
        id: "sec_cbe_team", title: "Teamwork and Collaboration", 
        items: [
          { id: "q_cbe_team_1", text: "Worked effectively with team members to achieve common goals" }, 
          { id: "q_cbe_team_2", text: "Shared information and ideas with team members" }, 
          { id: "q_cbe_team_3", text: "Supported team members and offered assistance when needed" }, 
          { id: "q_cbe_team_4", text: "Received and responded to feedback or suggestions from team members" } 
        ]
      },
      {
        id: "sec_cbe_prob", title: "Problem Solving & Task Performance", 
        items: [
          { id: "q_cbe_prob_1", text: "Demonstrated initiative in seeking out tasks, improving processes, or contributing" }, 
          { id: "q_cbe_prob_2", text: "Resourcefulness in finding solutions to problems or seeking information" }, 
          { id: "q_cbe_prob_3", text: "Evaluated different options and chose best alternative to complete task" }, 
          { id: "q_cbe_prob_4", text: "Quality of output in terms of accuracy and attention to detail" } 
        ]
      },
      {
        id: "sec_cbe_adapt", title: "Adaptability & Learning", 
        items: [
          { id: "q_cbe_adapt_1", text: "Quickly learned new tasks, procedures, or tools/software" }, 
          { id: "q_cbe_adapt_2", text: "Receptive to feedback and constructive criticism" }, 
          { id: "q_cbe_adapt_3", text: "Flexible in handling new situations or challenges" } 
        ]
      }
    ],
    essays: [
      { id: "essay_cbe_1", question: "What are the intern's strengths observed during the internship?", placeholder: "Detail observed strengths..." }, 
      { id: "essay_cbe_2", question: "What are the intern's areas for improvement?", placeholder: "Detail areas for improvement..." }, 
      { id: "essay_cbe_3", question: "Would you consider hiring this intern in the future?", placeholder: "Yes / No / Maybe (Please explain why)" } 
    ]
  }
];