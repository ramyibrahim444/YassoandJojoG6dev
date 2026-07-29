/* ============================================================================
 * config.js  —  Family Learning Portal
 * ----------------------------------------------------------------------------
 * EDIT THIS FILE to change usernames/passwords, and (optionally) the plan.
 *
 * The content is TARGETED per child at the exact areas each boy needs to
 * develop, taken from their May 2026 Cambridge sub-strand scores. Each child's
 * plan is DIFFERENT because their development areas are different.
 *
 * DIFFICULTY: questions are pitched at ICSE / Cambridge Lower-Secondary
 * GRADE 6 level (integers, BODMAS, algebra, ratio, %, mensuration, active/
 * passive, reported speech, tenses, states of matter, cells, forces...).
 *
 * Structure:
 *   child.subjects[subject].devAreas  = the areas to develop (with the report
 *                                        baseline score x/y that we grow from)
 *   child.subjects[subject].weeks     = an 8-week plan; each week targets one
 *                                        development area with matching practice
 *
 * SECURITY NOTE: this is a simple client-side login (passwords live in this
 * file). Fine for a private family site; for a public link add host-level
 * password protection (see README).
 * ==========================================================================*/

window.PORTAL_CONFIG = {

  planWeeks: 8,

  /* ---- LOGIN ACCOUNTS  (change the passwords!) ------------------------ */
  users: {
    youssef: { password: "youssef123", role: "child",  child: "youssef", display: "Youssef" },
    yassine: { password: "yassine123", role: "child",  child: "yassine", display: "Yassine" },
    parent:  { password: "parent123",  role: "parent",                    display: "Parent"  }
  },

  /* ---- GRADING SCALE (Cambridge, out of 50) --------------------------- */
  scale: [
    { min: 1,  max: 10, level: "Basic" },
    { min: 11, max: 20, level: "Aspiring" },
    { min: 21, max: 30, level: "Good" },
    { min: 31, max: 40, level: "High" },
    { min: 41, max: 50, level: "Outstanding" }
  ],

  /* ==========================================================================
   * CHILDREN
   * ======================================================================== */
  children: {

    /* ----------------------------- YOUSSEF ------------------------------ */
    youssef: {
      name: "Youssef", learner: "4005", grade: "Entering Grade 7",
      motto: "A little practice each day makes a huge difference. Let's go!",
      subjects: {
        math: {
          score: 44, level: "Outstanding", classAvg: 30,
          note: "Outstanding mathematician (perfect geometry). Main area to grow: reading & summarising DATA (statistics). Grade-6 stretch adds algebra, BODMAS & mensuration.",
          devAreas: [
            { id: "stats",     label: "Statistics — reading & summarising data", baseline: [3, 7] },
            { id: "frac",      label: "Fractions, decimals & percentages",       baseline: [11, 15] },
            { id: "challenge", label: "Problem-solving & reasoning (stretch)",   baseline: [44, 50] }
          ],
          weeks: [
            { week: 1, id: "yo-m-w1", area: "stats",     title: "The mean (bigger numbers)", target: [8,10], generators: ["data_mean_hard","graph_read"] },
            { week: 2, id: "yo-m-w2", area: "stats",     title: "Median, mode & range",      target: [8,10], generators: ["data_median","data_mode","data_range"] },
            { week: 3, id: "yo-m-w3", area: "stats",     title: "Reading & comparing graphs",target: [8,10], generators: ["graph_read","bar_compare","data_mean_hard"] },
            { week: 4, id: "yo-m-w4", area: "frac",      title: "Decimals & percentages",    target: [8,10], generators: ["frac_to_dec_pct","decimal_ops","percentage"] },
            { week: 5, id: "yo-m-w5", area: "stats",     title: "Solving data problems",     target: [8,10], generators: ["data_mean_hard","data_median","graph_read"] },
            { week: 6, id: "yo-m-w6", area: "challenge", title: "BODMAS, integers & algebra",target: [8,10], generators: ["order_ops_hard","integers","algebra_eval"] },
            { week: 7, id: "yo-m-w7", area: "challenge", title: "Equations & mensuration",   target: [8,10], generators: ["algebra_solve","mensuration","hcf_lcm"] },
            { week: 8, id: "yo-m-w8", area: "challenge", title: "Grand review",              target: [8,10], generators: ["percentage","data_mean_hard","order_ops_hard","ratio_share"], addresses: ["stats","frac","challenge"] }
          ]
        },
        english: {
          score: 34, level: "High", classAvg: 31,
          note: "Good reader; biggest lever is WRITING — spelling, grammar/punctuation, structure, creativity and reflection. Grade-6 stretch adds active/passive, reported speech & question tags.",
          devAreas: [
            { id: "spell",     label: "Spelling (word structure)",            baseline: [2, 6] },
            { id: "gramwrite", label: "Grammar & punctuation in writing",     baseline: [5, 14] },
            { id: "structure", label: "Structuring writing (order/paragraphs)", baseline: [5, 14] },
            { id: "creative",  label: "Creative writing (creation of texts)", baseline: [4, 10] },
            { id: "reflect",   label: "Opinion & reflection",                 baseline: [1, 6] }
          ],
          weeks: [
            { week: 1, id: "yo-e-w1", area: "spell",     title: "Spelling power",            target: [8,10], generators: ["spelling_choose","homophone","plural_form"] },
            { week: 2, id: "yo-e-w2", area: "gramwrite", title: "Punctuation & tenses",      target: [8,10], generators: ["punctuation_hard","tense_hard","subject_verb"] },
            { week: 3, id: "yo-e-w3", area: "gramwrite", title: "Active/passive & tags",     target: [8,10], generators: ["active_passive","question_tag","apostrophe"] },
            { week: 4, id: "yo-e-w4", area: "structure", title: "Reported speech & word class", target: [8,10], generators: ["sentence_order","direct_indirect","parts_of_speech"] },
            { week: 5, id: "yo-e-w5", area: "creative",  title: "Write a short story",       type: "project", generators: ["creative_prompt"] },
            { week: 6, id: "yo-e-w6", area: "spell",     title: "Word power & articles",     target: [8,10], generators: ["spelling_choose","vocab_hard","articles"] },
            { week: 7, id: "yo-e-w7", area: "reflect",   title: "Write a review (opinion)",  type: "project", generators: ["review_prompt"] },
            { week: 8, id: "yo-e-w8", area: "gramwrite", title: "Writing grand review",      target: [8,10], generators: ["punctuation_hard","tense_hard","active_passive","vocab_hard"], addresses: ["spell","gramwrite"] }
          ]
        },
        science: {
          score: 44, level: "Outstanding", classAvg: 32,
          note: "Outstanding physicist; the area to strengthen is BIOLOGY — life processes, ecosystems and the human body. Grade-6 stretch adds cells & photosynthesis.",
          devAreas: [
            { id: "life", label: "Life processes (MRS GREN)",     baseline: [4, 7] },
            { id: "eco",  label: "Ecosystems & food chains",      baseline: [3, 5] },
            { id: "body", label: "Human body & biology knowledge", baseline: [27, 50] }
          ],
          weeks: [
            { week: 1, id: "yo-s-w1", area: "life", title: "Life processes & cells",   target: [8,10], generators: ["life_processes","life_process_scenario","cells"] },
            { week: 2, id: "yo-s-w2", area: "life", title: "Photosynthesis",           target: [8,10], generators: ["life_process_scenario","photosynthesis","biology_facts"] },
            { week: 3, id: "yo-s-w3", area: "eco",  title: "Food chains",              target: [8,10], generators: ["food_chain","ecosystem_roles"] },
            { week: 4, id: "yo-s-w4", area: "eco",  title: "Food webs & roles",        target: [8,10], generators: ["ecosystem_roles","biology_facts","food_chain"] },
            { week: 5, id: "yo-s-w5", area: "body", title: "Body systems & cells",     target: [8,10], generators: ["body_systems","cells","biology_facts"] },
            { week: 6, id: "yo-s-w6", area: "body", title: "Human body knowledge",     target: [8,10], generators: ["body_systems","biology_facts"] },
            { week: 7, id: "yo-s-w7", area: "eco",  title: "Biology mix",              target: [8,10], generators: ["biology_facts","photosynthesis","food_chain"], addresses: ["life","eco","body"] },
            { week: 8, id: "yo-s-w8", area: "life", title: "Biology grand review",     target: [8,10], generators: ["life_processes","ecosystem_roles","body_systems","photosynthesis"], addresses: ["life","eco","body"] }
          ]
        }
      }
    },

    /* ----------------------------- YASSINE ------------------------------ */
    yassine: {
      name: "Yassine", learner: "4006", grade: "Entering Grade 7",
      motto: "Small steps, done often, win the race. You've got this!",
      subjects: {
        math: {
          score: 32, level: "High", classAvg: 30,
          note: "Outstanding geometry; areas to grow are FRACTIONS, STATISTICS, PROBABILITY and TIME. Grade-6 stretch adds ratio sharing, decimals & 24-hour time.",
          devAreas: [
            { id: "frac", label: "Fractions, decimals, % & ratio", baseline: [7, 15] },
            { id: "stats", label: "Statistics — reading data",     baseline: [3, 7] },
            { id: "prob",  label: "Probability (chance)",          baseline: [2, 6] },
            { id: "time",  label: "Telling the time",              baseline: [0, 1] }
          ],
          weeks: [
            { week: 1, id: "ya-m-w1", area: "frac",  title: "Fractions, decimals & %",  target: [8,10], generators: ["frac_to_dec_pct","simplify_fraction","decimal_ops"] },
            { week: 2, id: "ya-m-w2", area: "frac",  title: "Add fractions & find %",   target: [8,10], generators: ["add_sub_fraction","frac_of","percentage"] },
            { week: 3, id: "ya-m-w3", area: "frac",  title: "Ratio & sharing",          target: [8,10], generators: ["ratio_simple","ratio_share"] },
            { week: 4, id: "ya-m-w4", area: "time",  title: "24-hour time & durations", target: [8,10], generators: ["time_hard","read_clock"], addresses: ["time"] },
            { week: 5, id: "ya-m-w5", area: "stats", title: "The mean & graphs",        target: [8,10], generators: ["data_mean_hard","graph_read"] },
            { week: 6, id: "ya-m-w6", area: "stats", title: "Median, mode & range",     target: [8,10], generators: ["data_median","data_mode","data_range"] },
            { week: 7, id: "ya-m-w7", area: "prob",  title: "Probability as a fraction",target: [8,10], generators: ["prob_fraction","probability_simple"] },
            { week: 8, id: "ya-m-w8", area: "frac",  title: "Grand review",             target: [8,10], generators: ["frac_to_dec_pct","ratio_share","prob_fraction","data_mean_hard"], addresses: ["frac","stats","prob","time"] }
          ]
        },
        english: {
          score: 42, level: "Outstanding", classAvg: 31,
          note: "Outstanding reader; the growth zone is WRITING — grammar/punctuation, structure, creativity and reflection. Grade-6 stretch adds active/passive, reported speech & degrees of comparison.",
          devAreas: [
            { id: "gramwrite", label: "Grammar & punctuation in writing",     baseline: [6, 14] },
            { id: "structure", label: "Structuring writing (order/paragraphs)", baseline: [7, 14] },
            { id: "creative",  label: "Creative writing (creation of texts)", baseline: [5, 10] },
            { id: "reflect",   label: "Appreciation & reflection",            baseline: [2, 6] }
          ],
          weeks: [
            { week: 1, id: "ya-e-w1", area: "gramwrite", title: "Punctuation & tenses",   target: [8,10], generators: ["punctuation_hard","tense_hard","apostrophe"] },
            { week: 2, id: "ya-e-w2", area: "gramwrite", title: "Active/passive & tags",  target: [8,10], generators: ["active_passive","question_tag","subject_verb"] },
            { week: 3, id: "ya-e-w3", area: "structure", title: "Reported speech & word class", target: [8,10], generators: ["sentence_order","direct_indirect","parts_of_speech"] },
            { week: 4, id: "ya-e-w4", area: "creative",  title: "Write a one-page story", type: "project", generators: ["creative_prompt"] },
            { week: 5, id: "ya-e-w5", area: "reflect",   title: "Word power & comparison",target: [8,10], generators: ["vocab_hard","degrees_comparison","articles"] },
            { week: 6, id: "ya-e-w6", area: "gramwrite", title: "Grammar mix",            target: [8,10], generators: ["tense_hard","punctuation_hard","active_passive"] },
            { week: 7, id: "ya-e-w7", area: "reflect",   title: "Write a review (opinion)", type: "project", generators: ["review_prompt"] },
            { week: 8, id: "ya-e-w8", area: "gramwrite", title: "Writing grand review",   target: [8,10], generators: ["punctuation_hard","active_passive","vocab_hard","question_tag"], addresses: ["gramwrite","reflect"] }
          ]
        },
        science: {
          score: 40, level: "High", classAvg: 32,
          note: "Perfect biology; the next step is INVESTIGATOR skills — fair tests, conclusions, plus Earth-in-space and electricity. Grade-6 stretch adds measurement, physical/chemical change, elements & magnetism.",
          devAreas: [
            { id: "enquiry",  label: "Planning fair tests & investigations", baseline: [2, 5] },
            { id: "conclude", label: "Analysis & drawing conclusions",       baseline: [4, 7] },
            { id: "space",    label: "Earth in space",                       baseline: [2, 4] },
            { id: "elec",     label: "Electricity & magnetism",              baseline: [3, 5] }
          ],
          weeks: [
            { week: 1, id: "ya-s-w1", area: "enquiry",  title: "Fair tests",              target: [8,10], generators: ["fair_test","fair_test_scenario"] },
            { week: 2, id: "ya-s-w2", area: "enquiry",  title: "Measuring in experiments", target: [8,10], generators: ["fair_test_scenario","measurement"] },
            { week: 3, id: "ya-s-w3", area: "conclude", title: "Method & physical change", target: [8,10], generators: ["scientific_method","phys_chem_change"] },
            { week: 4, id: "ya-s-w4", area: "conclude", title: "Elements, compounds & mixtures", target: [8,10], generators: ["scientific_method","elements_compounds"] },
            { week: 5, id: "ya-s-w5", area: "space",    title: "The solar system",        target: [8,10], generators: ["solar_system","space_physics_facts"] },
            { week: 6, id: "ya-s-w6", area: "space",    title: "Forces & simple machines", target: [8,10], generators: ["space_physics_facts","forces_machines"] },
            { week: 7, id: "ya-s-w7", area: "elec",     title: "Magnetism & energy",      target: [8,10], generators: ["circuits","magnetism","energy_forms"] },
            { week: 8, id: "ya-s-w8", area: "enquiry",  title: "Science grand review",    target: [8,10], generators: ["fair_test_scenario","scientific_method","solar_system","circuits"], addresses: ["enquiry","conclude","space","elec"] }
          ]
        }
      }
    }
  }
};
