// fileName: EvalForm.js

export const EVALUATION_TEMPLATES = [
  {
    id: "eval_site_supervisor",
    title: "SITE SUPERVISOR'S EVALUATION OF STUDENT INTERN'S PERFORMANCE", // [cite: 41]
    sections: [
      {
        id: "sec_behavior", 
        title: "I. BEHAVIOR AT WORK", // 
        items: [
          { id: "q_beh_1", text: "Attention and concentration on tasks" }, // 
          { id: "q_beh_2", text: "Motivation and initiative" }, // 
          { id: "q_beh_3", text: "Sense of responsibility" }, // 
          { id: "q_beh_4", text: "Perseverance and diligence" }, // 
          { id: "q_beh_5", text: "Self-confidence" }, // 
          { id: "q_beh_6", text: "Cleanliness and orderliness of workplace" }, // 
          { id: "q_beh_7", text: "Quality of work" }, // 
          { id: "q_beh_8", text: "Relationship with others" }, // 
          { id: "q_beh_9", text: "Attendance" } // 
        ]
      },
      {
        id: "sec_academic", 
        title: "II. ACADEMIC PERFORMANCE", // 
        items: [
          { id: "q_aca_1", text: "Communication Skills: Speaking" }, // 
          { id: "q_aca_2", text: "Communication Skills: Writing" }, // 
          { id: "q_aca_3", text: "Communication Skills: Listening" }, // 
          { id: "q_aca_4", text: "Communication Skills: Reading" }, // 
          { id: "q_aca_5", text: "Knowledge of assigned tasks" }, // 
          { id: "q_aca_6", text: "Updating and research performance" }, // 
          { id: "q_aca_7", text: "Ability to learn" } // 
        ]
      },
      {
        id: "sec_social", 
        title: "III. SOCIAL BEHAVIOR", // 
        items: [
          { id: "q_soc_1", text: "Leadership potential" }, // 
          { id: "q_soc_2", text: "Maturity" }, // 
          { id: "q_soc_3", text: "Concern for others" }, // 
          { id: "q_soc_4", text: "Acceptance of criticism" }, // 
          { id: "q_soc_5", text: "Ability to express feelings" }, // 
          { id: "q_soc_6", text: "Judgment" }, // 
          { id: "q_soc_7", text: "Dependability" }, // 
          { id: "q_soc_8", text: "Respect for others" }, // 
          { id: "q_soc_9", text: "Integrity" } // 
        ]
      },
      {
        id: "sec_personality", 
        title: "IV. PERSONALITY", // [cite: 48]
        items: [
          { id: "q_per_1", text: "Grooming and appearance" }, // [cite: 50]
          { id: "q_per_2", text: "Posture" }, // [cite: 51]
          { id: "q_per_3", text: "Appropriateness of attire" }, // [cite: 52]
          { id: "q_per_4", text: "Manners and conduct" }, // [cite: 53]
          { id: "q_per_5", text: "Tact" } // [cite: 53]
        ]
      },
      {
        id: "sec_cost", 
        title: "V. COST CONSCIOUSNESS", // [cite: 54]
        items: [
          { id: "q_cst_1", text: "Time management" }, // [cite: 55]
          { id: "q_cst_2", text: "Economy on the use of materials" }, // [cite: 56]
          { id: "q_cst_3", text: "Conservation of resources" } // [cite: 57]
        ]
      }
    ],
    essays: [
      { id: "essay_1", question: "What do you think are the intern's talents or strengths?", placeholder: "Enter details..." }, // [cite: 69]
      { id: "essay_2", question: "What aspects of the intern do you think need enhancement?", placeholder: "Enter details..." }, // [cite: 70]
      { id: "essay_3", question: "What suggestions can you give to further improve the intern?", placeholder: "Enter details..." }, // [cite: 71]
      { id: "essay_4", question: "Other Remarks:", placeholder: "Enter details..." } // [cite: 72]
    ]
  },
  {
    id: "eval_cte_performance",
    title: "CTE PERFORMANCE FEEDBACK FORM", // [cite: 1, 2]
    sections: [
      {
        id: "sec_cte_conduct", 
        title: "Domain 1: Professional Conduct, Ethics, and Work Values", // [cite: 10]
        items: [
          { id: "q_cte_con_1", text: "Shows initiative and resourcefulness" }, // [cite: 10]
          { id: "q_cte_con_2", text: "Meets deadlines and completes tasks on time" }, // [cite: 10]
          { id: "q_cte_con_3", text: "Demonstrates accountability and responsibility" }, // [cite: 10]
          { id: "q_cte_con_4", text: "Displays positive attitude toward work and colleagues" }, // [cite: 10]
          { id: "q_cte_con_5", text: "Exhibits favorable behavior and professionalism" } // [cite: 10]
        ]
      },
      {
        id: "sec_cte_appearance", 
        title: "Domain 2: Personal Appearance and Deportment", // [cite: 11]
        items: [
          { id: "q_cte_app_1", text: "Presentable and well-groomed" }, // [cite: 11]
          { id: "q_cte_app_2", text: "Wears proper and complete uniform" }, // [cite: 11]
          { id: "q_cte_app_3", text: "Observes school rules and policies" } // [cite: 11]
        ]
      },
      {
        id: "sec_cte_competence", 
        title: "Domain 3: Teaching Competence and Pedagogical Skills", // [cite: 12]
        items: [
          { id: "q_cte_com_1", text: "Demonstrates mastery of subject matter" }, // [cite: 12]
          { id: "q_cte_com_2", text: "Prepares and organizes lesson plans effectively" }, // [cite: 12]
          { id: "q_cte_com_3", text: "Uses appropriate teaching strategies and methods" }, // [cite: 12]
          { id: "q_cte_com_4", text: "Manages classroom effectively" }, // [cite: 12]
          { id: "q_cte_com_5", text: "Communicates ideas clearly and confidently" }, // [cite: 12]
          { id: "q_cte_com_6", text: "Engages students in learning activities" }, // [cite: 12]
          { id: "q_cte_com_7", text: "Uses instructional materials and technology effectively" } // [cite: 12]
        ]
      },
      {
        id: "sec_cte_relationships", 
        title: "Domain 4: Professional Relationships and School Involvement", // [cite: 13]
        items: [
          { id: "q_cte_rel_1", text: "Maintains respectful relationships with learners" }, // [cite: 13]
          { id: "q_cte_rel_2", text: "Collaborates effectively with cooperating teacher and staff" }, // [cite: 13]
          { id: "q_cte_rel_3", text: "Participates in school activities and initiatives" } // [cite: 13]
        ]
      }
    ],
    essays: [
      { id: "essay_cte_1", question: "Violations (if any)", placeholder: "List any violations..." }, // [cite: 14]
      { id: "essay_cte_2", question: "Strengths:", placeholder: "Enter strengths..." }, // [cite: 17]
      { id: "essay_cte_3", question: "Areas for Improvement:", placeholder: "Enter areas for improvement..." }, // [cite: 19]
      { id: "essay_cte_4", question: "Additional Comments/Suggestions:", placeholder: "Enter comments..." } // [cite: 21]
    ]
  }
];