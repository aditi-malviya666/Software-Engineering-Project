export interface BenchmarkQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  explanation: string;
}

export const JEE_BENCHMARK: BenchmarkQuestion[] = [
  {
    question: "A particle moves in a straight line with a velocity given by $v(t) = 3t^2 - 6t\\text{ m/s}$. What is the net displacement of the particle between $t = 0\\text{ s}$ and $t = 3\\text{ s}$?",
    options: ["0 meters", "9 meters", "18 meters", "27 meters"],
    correctAnswer: "0 meters",
    topic: "Kinematics & Dynamics",
    explanation: "Displacement is the integral of velocity with respect to time: $$s = \\int_{0}^{3} v(t)\\,dt = \\int_{0}^{3} (3t^2 - 6t)\\,dt = \\left[ t^3 - 3t^2 \\right]_{0}^{3} = (27 - 27) - 0 = 0\\text{ m}.$$ The particle moves backward then forward, returning to its starting coordinate at $t = 3\\text{ s}$."
  },
  {
    question: "A Carnot heat engine operates between reservoirs at temperatures $T_1 = 600\\text{ K}$ and $T_2 = 300\\text{ K}$. What is its maximum theoretical thermodynamic efficiency $\\eta$?",
    options: ["25%", "40%", "50%", "75%"],
    correctAnswer: "50%",
    topic: "Thermodynamics",
    explanation: "The theoretical efficiency of a Carnot cycle operating between heat reservoirs $T_1$ (source) and $T_2$ (sink) is: $$\\eta = 1 - \\frac{T_2}{T_1} = 1 - \\frac{300}{600} = 1 - 0.5 = 0.50 = 50\\%.$$"
  },
  {
    question: "In Young's double-slit experiment, if the slit separation $d$ is halved and the screen distance $D$ is doubled, the fringe width $\\beta = \\frac{\\lambda D}{d}$ becomes:",
    options: ["Halved", "Unchanged", "Doubled", "Quadrupled"],
    correctAnswer: "Quadrupled",
    topic: "Wave Optics",
    explanation: "The fringe width formula is $\\beta = \\frac{\\lambda D}{d}$. When $D' = 2D$ and $d' = d/2$: $$\\beta' = \\frac{\\lambda (2D)}{d/2} = 4\\left(\\frac{\\lambda D}{d}\\right) = 4\\beta.$$ Therefore, the fringe width is quadrupled."
  },
  {
    question: "For a chemical reaction $A + 2B \\rightarrow C$, the rate law is experimentally determined as $\\text{Rate} = k[A][B]^2$. What is the overall order of the reaction?",
    options: ["First order", "Second order", "Third order", "Zero order"],
    correctAnswer: "Third order",
    topic: "Chemical Kinetics",
    explanation: "The overall order of a reaction is the sum of the exponents of the concentration terms in the rate equation: $$\\text{Overall Order} = 1 + 2 = 3\\text{ (Third Order)}.$$"
  },
  {
    question: "Evaluate the definite integral using properties of symmetry: $\\int_{0}^{\\pi/2} \\frac{\\sin(x)}{\\sin(x) + \\cos(x)} \\, dx$.",
    options: ["$\\pi/4$", "$\\pi/2$", "$1$", "$\\pi$"],
    correctAnswer: "$\\pi/4$",
    topic: "Calculus & Integration",
    explanation: "Let $I = \\int_{0}^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x}\\,dx$. Applying the property $\\int_{a}^{b} f(x)dx = \\int_{a}^{b} f(a+b-x)dx$, we get: $$I = \\int_{0}^{\\pi/2} \\frac{\\cos x}{\\cos x + \\sin x}\\,dx.$$ Adding both equations: $$2I = \\int_{0}^{\\pi/2} 1\\,dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}.$$"
  },
  {
    question: "A solid cylinder of mass $M$ and radius $R$ rolls down an incline of angle $\\theta$ without slipping. The acceleration of its center of mass is:",
    options: ["$g\\sin\\theta$", "$\\frac{2}{3}g\\sin\\theta$", "$\\frac{1}{2}g\\sin\\theta$", "$\\frac{3}{4}g\\sin\\theta$"],
    correctAnswer: "$\\frac{2}{3}g\\sin\\theta$",
    topic: "Rotational Mechanics",
    explanation: "For pure rolling on an incline: $a = \\frac{g\\sin\\theta}{1 + \\frac{I}{MR^2}}$. For a solid cylinder, $I = \\frac{1}{2}MR^2$, so: $$a = \\frac{g\\sin\\theta}{1 + 1/2} = \\frac{2}{3}g\\sin\\theta.$$"
  },
  {
    question: "An electric dipole of moment $\\vec{p}$ is placed in a uniform electric field $\\vec{E}$. The maximum torque experienced by the dipole is:",
    options: ["$p E$", "$\\frac{1}{2} p E$", "$2 p E$", "Zero"],
    correctAnswer: "$p E$",
    topic: "Electrostatics",
    explanation: "Torque on a dipole is given by $\\vec{\\tau} = \\vec{p} \\times \\vec{E} \\implies \\tau = pE\\sin\\theta$. Maximum torque occurs at $\\theta = 90^\\circ$ where $\\sin\\theta = 1$, giving $\\tau_{\\max} = pE$."
  },
  {
    question: "Which of the following coordination compounds exhibits optical isomerism?",
    options: ["$[Co(NH_3)_6]^{3+}$", "$cis-[Co(en)_2Cl_2]^+$", "$trans-[Co(en)_2Cl_2]^+$", "$[Pt(NH_3)_2Cl_2]$"],
    correctAnswer: "$cis-[Co(en)_2Cl_2]^+$",
    topic: "Coordination Chemistry",
    explanation: "$cis-[Co(en)_2Cl_2]^+$ lacks both a center of inversion and a plane of symmetry, making it chiral and optically active (non-superimposable on its mirror image). The trans isomer has a plane of symmetry and is optically inactive."
  },
];

export const NEET_BENCHMARK: BenchmarkQuestion[] = [
  {
    question: "Which enzyme is primarily responsible for the synthesis of the RNA primer during DNA replication in prokaryotes?",
    options: ["DNA Polymerase I", "DNA Ligase", "Primase (DnaG)", "Topoisomerase"],
    correctAnswer: "Primase (DnaG)",
    topic: "Molecular Biology",
    explanation: "DNA primase (an RNA polymerase encoded by the dnaG gene in E. coli) synthesizes short RNA primers (~10-12 nucleotides) that provide the free 3'-OH group required by DNA Polymerase III to initiate DNA elongation."
  },
  {
    question: "In the human nephron, the primary site for obligatory water reabsorption under the influence of antidiuretic hormone (ADH) is:",
    options: ["Proximal Convoluted Tubule", "Loop of Henle", "Collecting Duct & Distal Tubule", "Bowman's Capsule"],
    correctAnswer: "Collecting Duct & Distal Tubule",
    topic: "Human Physiology",
    explanation: "Antidiuretic hormone (Vasopressin/ADH) acts selectively on aquaporin-2 water channels in the late distal convoluted tubule and the collecting duct to increase facultative water reabsorption, concentrating urine."
  },
  {
    question: "What is the expected phenotypic ratio in the $F_2$ generation of a standard Mendelian dihybrid cross involving two heterozygous parents ($AaBb \\times AaBb$)?",
    options: ["3:1", "1:2:1", "9:3:3:1", "9:7"],
    correctAnswer: "9:3:3:1",
    topic: "Genetics & Evolution",
    explanation: "Independent assortment of two unlinked gene pairs with complete dominance produces the classic 9 (Dominant-Dominant) : 3 (Dominant-Recessive) : 3 (Recessive-Dominant) : 1 (Recessive-Recessive) phenotypic ratio."
  },
  {
    question: "The primary carboxylating enzyme involved in the photosynthetic carbon reduction cycle ($C_3$ pathway) is:",
    options: ["PEP Carboxylase", "RuBisCO", "Carbonic Anhydrase", "Pyruvate Dehydrogenase"],
    correctAnswer: "RuBisCO",
    topic: "Plant Physiology",
    explanation: "Ribulose-1,5-bisphosphate carboxylase-oxygenase (RuBisCO) catalyzes the initial carboxylation step combining $CO_2$ with RuBP to form two molecules of 3-phosphoglycerate (3-PGA)."
  },
  {
    question: "An object is placed at a distance of $20\\text{ cm}$ in front of a concave mirror of focal length $15\\text{ cm}$. The nature and position of the image formed is:",
    options: [
      "Real, inverted, at $60\\text{ cm}$ in front of mirror",
      "Virtual, erect, at $60\\text{ cm}$ behind mirror",
      "Real, inverted, at $30\\text{ cm}$ in front of mirror",
      "Virtual, erect, at $10\\text{ cm}$ behind mirror"
    ],
    correctAnswer: "Real, inverted, at $60\\text{ cm}$ in front of mirror",
    topic: "Ray Optics",
    explanation: "Using the mirror formula $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$ with Cartesian sign convention ($f = -15\\text{ cm}$, $u = -20\\text{ cm}$): $$\\frac{1}{v} = -\\frac{1}{15} - \\left(-\\frac{1}{20}\\right) = -\\frac{1}{15} + \\frac{1}{20} = -\\frac{1}{60} \\implies v = -60\\text{ cm}.$$ Since $v < 0$, the image is real, inverted, and located $60\\text{ cm}$ in front of the mirror."
  },
  {
    question: "What is the pH of a buffer solution composed of $0.1\\text{ M } CH_3COOH$ and $0.1\\text{ M } CH_3COONa$ given that $pK_a(CH_3COOH) = 4.74$?",
    options: ["3.74", "4.74", "5.74", "7.00"],
    correctAnswer: "4.74",
    topic: "Ionic Equilibrium",
    explanation: "By the Henderson-Hasselbalch equation: $$\\text{pH} = pK_a + \\log\\frac{[\\text{Conjugate Base}]}{[\\text{Acid}]} = 4.74 + \\log\\frac{0.1}{0.1} = 4.74 + \\log 1 = 4.74.$$"
  },
];

export const GATE_BENCHMARK: BenchmarkQuestion[] = [
  {
    question: "What is the tightest worst-case time complexity of Dijkstra's single-source shortest path algorithm implemented using a min-heap on a graph with $V$ vertices and $E$ edges?",
    options: ["$\\mathcal{O}(V^2)$", "$\\mathcal{O}((V + E) \\log V)$", "$\\mathcal{O}(E \\log E)$", "$\\mathcal{O}(V E)$"],
    correctAnswer: "$\\mathcal{O}((V + E) \\log V)$",
    topic: "Algorithms & Data Structures",
    explanation: "With a binary min-heap, extracting min takes $\\mathcal{O}(\\log V)$ for $V$ vertices (total $\\mathcal{O}(V \\log V)$) and decreasing key takes $\\mathcal{O}(\\log V)$ for at most $E$ edge relaxations (total $\\mathcal{O}(E \\log V)$). Hence overall time complexity is $\\mathcal{O}((V + E) \\log V)$."
  },
  {
    question: "In relational database design, a table is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency $X \\rightarrow Y$:",
    options: [
      "$X$ is a superkey of the relation",
      "$Y$ is a prime attribute",
      "$X$ is a foreign key",
      "$Y$ is functionally dependent on the primary key"
    ],
    correctAnswer: "$X$ is a superkey of the relation",
    topic: "Database Management Systems",
    explanation: "BCNF is a stricter version of 3NF: for every non-trivial functional dependency $X \\rightarrow Y$, the determinant $X$ must be a superkey of the relation. 3NF additionally allows $Y$ to be a prime attribute, which BCNF forbids."
  },
  {
    question: "Solve the recurrence relation using the Master Theorem: $T(n) = 2T(n/2) + \\Theta(n)$. The asymptotic bound is:",
    options: ["$\\Theta(n)$", "$\\Theta(n \\log n)$", "$\\Theta(n^2)$", "$\\Theta(\\log n)$"],
    correctAnswer: "$\\Theta(n \\log n)$",
    topic: "Discrete Math & Complexity",
    explanation: "Here $a = 2$, $b = 2$, and $f(n) = \\Theta(n)$. We compare $f(n)$ to $n^{\\log_b a} = n^{\\log_2 2} = n^1 = n$. Since $f(n) = \\Theta(n^{\\log_b a})$, Case 2 of the Master Theorem applies: $T(n) = \\Theta(n \\log n)$."
  },
  {
    question: "In an operating system with demand paging, a system has a page fault service time of $10\\text{ ms}$ and memory access time of $100\\text{ ns}$. What is the maximum acceptable page fault rate $p$ for less than $10\\%$ performance degradation?",
    options: ["$p \\approx 10^{-6}$", "$p \\approx 10^{-5}$", "$p \\approx 10^{-4}$", "$p \\approx 10^{-3}$"],
    correctAnswer: "$p \\approx 10^{-6}$",
    topic: "Operating Systems",
    explanation: "Effective Access Time: $\\text{EAT} = (1-p)(100) + p(10^7) = 100 + 9999900 p$. For $< 10\\%$ slowdown: $\\text{EAT} \\le 110\\text{ ns} \\implies 9999900 p \\le 10 \\implies p \\approx 10^{-6}$."
  },
  {
    question: "Which of the following formal languages over alphabet $\\Sigma = \\{0, 1\\}$ is strictly context-free but NOT regular?",
    options: [
      "$L = \\{0^n 1^n \\mid n \\ge 1\\}$",
      "$L = \\{0^n 1^m \\mid n, m \\ge 0\\}$",
      "$L = \\{w \\mid w \\text{ contains even number of 0s}\\}$",
      "$L = \\{0^n 1^n 2^n \\mid n \\ge 1\\}$"
    ],
    correctAnswer: "$L = \\{0^n 1^n \\mid n \\ge 1\\}$",
    topic: "Theory of Computation",
    explanation: "$L = \\{0^n 1^n \\mid n \\ge 1\\}$ requires unbounded memory to match the count of 0s and 1s, which cannot be recognized by a Finite Automaton (by Pumping Lemma for Regular Languages). However, it can be parsed by a single-stack Pushdown Automaton (CFL)."
  },
];

export const CUET_BENCHMARK: BenchmarkQuestion[] = [
  {
    question: "If a sum of money doubles itself in 5 years at simple interest, in how many years will it become 4 times of itself at the same rate?",
    options: ["10 years", "12 years", "15 years", "20 years"],
    correctAnswer: "15 years",
    topic: "Quantitative Aptitude",
    explanation: "If principal $P$ doubles in 5 years, the simple interest earned is $I_1 = P$ in $T_1 = 5$ years. To become 4 times of itself, the interest required is $I_2 = 4P - P = 3P$. Since simple interest is directly proportional to time: $$T_2 = 3 \\times T_1 = 3 \\times 5 = 15\\text{ years}.$$"
  },
  {
    question: "Select the word that is most nearly opposite in meaning (Antonym) to: **METICULOUS**",
    options: ["Careless", "Thorough", "Painstaking", "Accurate"],
    correctAnswer: "Careless",
    topic: "Verbal Ability",
    explanation: "'Meticulous' means showing great attention to detail, very careful and precise. Its direct antonym is 'Careless' or negligent."
  },
  {
    question: "In a code language, if 'SYSTEM' is coded as 'SYSMET' and 'NEARER' is coded as 'AENRER', how is 'FRACTION' coded?",
    options: ["CARFNOIT", "NOITCARF", "CRAFFNOIT", "CARFTION"],
    correctAnswer: "CARFNOIT",
    topic: "Logical Reasoning",
    explanation: "The pattern splits the word into two equal halves and reverses each half: 'FRAC' reversed is 'CARF', and 'TION' reversed is 'NOIT'. Concatenating gives 'CARFNOIT'."
  },
  {
    question: "Who among the following presided over the historic 1929 Lahore Session of the Indian National Congress where 'Poorna Swaraj' was declared?",
    options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Subhas Chandra Bose", "Sardar Vallabhbhai Patel"],
    correctAnswer: "Jawaharlal Nehru",
    topic: "General Awareness",
    explanation: "Jawaharlal Nehru was elected president of the Indian National Congress for the December 1929 Lahore session where the historic resolution for Poorna Swaraj (Complete Independence) was passed and the tricolor was unfurled on the banks of river Ravi."
  },
  {
    question: "The value of $\\lim_{x \\to 0} \\frac{\\tan(3x)}{\\sin(5x)}$ is:",
    options: ["$3/5$", "$5/3$", "$1$", "$0$"],
    correctAnswer: "$3/5$",
    topic: "General Mathematics",
    explanation: "Rewrite as $\\lim_{x \\to 0} \\frac{\\frac{\\tan(3x)}{3x} \\cdot 3x}{\\frac{\\sin(5x)}{5x} \\cdot 5x} = \\frac{1 \\cdot 3}{1 \\cdot 5} = \\frac{3}{5}$."
  },
];

export function getBenchmarkQuestions(
  examName: "JEE" | "NEET" | "CUET" | "GATE",
  count: number = 5
): BenchmarkQuestion[] {
  let bank: BenchmarkQuestion[] = JEE_BENCHMARK;
  if (examName === "NEET") bank = NEET_BENCHMARK;
  else if (examName === "GATE") bank = GATE_BENCHMARK;
  else if (examName === "CUET") bank = CUET_BENCHMARK;

  const results: BenchmarkQuestion[] = [];
  for (let i = 0; i < count; i++) {
    results.push(bank[i % bank.length]);
  }
  return results;
}
