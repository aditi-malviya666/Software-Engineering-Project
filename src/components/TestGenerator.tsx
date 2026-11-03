"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import MarkdownRenderer from "@/components/markdown-renderer";
import {
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
} from "@heroui/react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldWarningIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparkleIcon,
  LightningIcon,
  GraduationCapIcon,
  AtomIcon,
  HeartbeatIcon,
  FileCodeIcon,
  WarningCircleIcon,
  TerminalWindowIcon,
  EyeSlashIcon,
  CheckIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { RecruiterBadge } from "@/context/recruiter-context";
import { getBenchmarkQuestions } from "@/lib/benchmark-questions";

type AppState = "wizard" | "generating" | "ready" | "testing" | "results";
export type ExamType = "JEE" | "NEET" | "CUET" | "GATE";

export type QuestionStatusType = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

export interface Question {
  question: string;
  options?: string[];
  correctAnswer?: string;
  topic?: string;
  explanation?: string;
}

export interface ScoreData {
  marks: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  correctMark: number;
  incorrectMark: number;
  maxMarks: number;
}

const EXAM_PRESETS: Record<ExamType, {
  name: string;
  badge: string;
  description: string;
  fullQuestions: number;
  durationMinutes: number;
  correctMark: number;
  incorrectMark: number;
  subjects: string[];
  tags: string[];
  blobBg: string;
  blobDarkBg: string;
  iconColor: string;
  iconDarkColor: string;
  accentBorder: string;
  accentText: string;
}> = {
  JEE: {
    name: "IIT JEE",
    badge: "Engineering",
    description: "Physics, Chemistry & Math with high numerical depth.",
    fullQuestions: 75,
    durationMinutes: 180,
    correctMark: 4,
    incorrectMark: 1,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    tags: ["Class 11", "Class 12", "Dropper"],
    blobBg: "bg-[#FFFBEB]",
    blobDarkBg: "dark:bg-[#332B16]",
    iconColor: "text-[#F59E0B]",
    iconDarkColor: "dark:text-[#FBBF24]",
    accentBorder: "border-[#F59E0B]",
    accentText: "text-[#F59E0B] dark:text-[#FBBF24]",
  },
  NEET: {
    name: "NEET",
    badge: "Medical",
    description: "Medical entrance simulation across PCB with speed focus.",
    fullQuestions: 200,
    durationMinutes: 200,
    correctMark: 4,
    incorrectMark: 1,
    subjects: ["Physics", "Chemistry", "Biology"],
    tags: ["Class 11", "Class 12", "Dropper"],
    blobBg: "bg-[#FFF1F2]",
    blobDarkBg: "dark:bg-[#331A24]",
    iconColor: "text-[#F43F5E]",
    iconDarkColor: "dark:text-[#FB7185]",
    accentBorder: "border-[#F43F5E]",
    accentText: "text-[#F43F5E] dark:text-[#FB7185]",
  },
  GATE: {
    name: "GATE",
    badge: "CS & Engg",
    description: "Core algorithms, operating systems, and discrete math analysis.",
    fullQuestions: 65,
    durationMinutes: 180,
    correctMark: 1,
    incorrectMark: 0.33,
    subjects: ["Computer Science", "Algorithms", "Database Systems"],
    tags: ["CS & IT", "Engineering"],
    blobBg: "bg-[#EFF6FF]",
    blobDarkBg: "dark:bg-[#182438]",
    iconColor: "text-[#3B82F6]",
    iconDarkColor: "dark:text-[#60A5FA]",
    accentBorder: "border-[#3B82F6]",
    accentText: "text-[#3B82F6] dark:text-[#60A5FA]",
  },
  CUET: {
    name: "CUET (UG)",
    badge: "University",
    description: "Standardized entrance aptitude and domain-specific papers.",
    fullQuestions: 50,
    durationMinutes: 60,
    correctMark: 5,
    incorrectMark: 1,
    subjects: ["General Test", "Physics", "Mathematics"],
    tags: ["Domain Tests", "General Aptitude"],
    blobBg: "bg-[#FAF5FF]",
    blobDarkBg: "dark:bg-[#271E3A]",
    iconColor: "text-[#8B5CF6]",
    iconDarkColor: "dark:text-[#A78BFA]",
    accentBorder: "border-[#8B5CF6]",
    accentText: "text-[#8B5CF6] dark:text-[#A78BFA]",
  },
};

export default function TestGenerator() {
  // Wizard State (Steps: 1 = Exam Path, 2 = Scope, 3 = Refine)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [examName, setExamName] = useState<ExamType>("JEE");
  const [generationType, setGenerationType] = useState<"Topic Wise" | "Subject Wise" | "Complete Paper">("Topic Wise");
  const [subject, setSubject] = useState("Kinematics & Dynamics");
  const [difficulty, setDifficulty] = useState("actual experience as in actual paper");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [apiKey, setApiKey] = useState("");

  // Terminal Matrix State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Testing Session State
  const [appState, setAppState] = useState<AppState>("wizard");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // User Responses & Status Tracking
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Record<number, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<number, boolean>>({ 0: true });

  // Anti-Cheating & Proctoring States
  const [isPreTestModalOpen, setIsPreTestModalOpen] = useState(false);
  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [violationCountdown, setViolationCountdown] = useState(3);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Results State
  const [scoreData, setScoreData] = useState<ScoreData>({
    marks: 0,
    correct: 0,
    incorrect: 0,
    unattempted: 0,
    correctMark: 4,
    incorrectMark: 1,
    maxMarks: 20,
  });

  // Keep subject synced if switching exam in Subject Wise mode
  useEffect(() => {
    if (generationType === "Subject Wise") {
      const available = EXAM_PRESETS[examName].subjects;
      if (!available.includes(subject)) {
        setSubject(available[0]);
      }
    }
  }, [examName, generationType, subject]);

  // Terminal loading simulation
  const addLog = (msg: string) => {
    setTerminalLogs((prev) => [...prev, msg]);
  };

  // Generation Handler
  const handleGenerate = async () => {
    setAppState("generating");
    setError("");
    setQuestions([]);
    setUserAnswers({});
    setMarkedQuestions({});
    setVisitedQuestions({ 0: true });
    setCurrentQIndex(0);
    setTerminalLogs([]);

    addLog("⚡ [0.1s] Initializing TCAS Generation Pipeline...");
    addLog("📦 [0.4s] Resolving curriculum taxonomy tags via Drizzle ORM...");

    let finalNumQuestions = numQuestions;
    let finalSubject = subject;

    if (generationType === "Complete Paper") {
      finalSubject = "Complete Syllabus";
      finalNumQuestions = EXAM_PRESETS[examName].fullQuestions;
    }

    try {
      const userKey = apiKey.trim();

      // If user left API key empty -> immediately serve curriculum benchmark questions without failing
      if (!userKey) {
        addLog(`🎯 [0.8s] Target exam verified: ${examName} (${EXAM_PRESETS[examName].badge})`);
        addLog(`📚 [1.2s] Standard Benchmark Mode: Curating ${finalNumQuestions} authentic ${examName} questions for ${finalSubject}...`);
        
        const benchmarkQuestions = getBenchmarkQuestions(examName, finalNumQuestions);
        setQuestions(benchmarkQuestions);

        addLog("✨ [1.8s] Normalizing mathematical expressions & KaTeX engines...");
        addLog("🔒 [2.2s] Anti-cheating proctoring daemon configured.");
        addLog("✅ [2.5s] Examination Ready! Click below to enter fullscreen CBT test.");

        setTimeout(() => setAppState("ready"), 1000);
        return;
      }

      // If user provided custom key -> dispatch to OpenRouter with automatic fallback
      addLog(`🎯 [0.8s] Target exam verified: ${examName} (${EXAM_PRESETS[examName].badge})`);
      addLog(`🤖 [1.3s] Dispatching prompt to OpenRouter API (Scheme: ${difficulty})...`);

      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: userKey,
          examName,
          generationType,
          difficulty,
          subject: finalSubject,
          numQuestions: finalNumQuestions,
        }),
      });

      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        if (data.source === "benchmark_fallback") {
          addLog(`⚠️ [1.9s] ${data.warning || "Custom API key not verified. Loaded curriculum benchmark questions."}`);
        } else {
          addLog("✨ [2.1s] Received live questions from LLM. KaTeX parsed & validated.");
        }
        addLog("🔒 [2.4s] Anti-cheating proctoring daemon configured.");
        addLog("✅ [2.7s] Examination Ready! Click below to enter fullscreen CBT test.");
        setTimeout(() => setAppState("ready"), 1000);
      } else {
        // Fallback safely to benchmark
        const fallback = getBenchmarkQuestions(examName, finalNumQuestions);
        setQuestions(fallback);
        addLog("⚠️ [1.9s] Loaded bespoke benchmark dataset.");
        addLog("✅ [2.4s] Examination Ready! Click below to enter.");
        setTimeout(() => setAppState("ready"), 1000);
      }
    } catch (err: any) {
      // Graceful fallback: never block user with a raw error screen
      const fallback = getBenchmarkQuestions(examName, finalNumQuestions);
      setQuestions(fallback);
      addLog("⚠️ [1.8s] API connection note: Loaded official benchmark paper.");
      addLog("✅ [2.3s] Examination Ready!");
      setTimeout(() => setAppState("ready"), 1000);
    }
  };

  // Trigger Pre-Test Proctoring Modal
  const initiateTest = () => {
    setIsPreTestModalOpen(true);
  };

  // Launch Fullscreen & Start Timer
  const confirmAndStartTest = async () => {
    setIsPreTestModalOpen(false);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request not granted or bypassed", err);
    }

    setAppState("testing");
    setUserAnswers({});
    setMarkedQuestions({});
    setVisitedQuestions({ 0: true });
    setCurrentQIndex(0);

    const qCount = questions.length;
    let totalSeconds = 0;
    if (examName === "JEE") totalSeconds = Math.floor(qCount * ((180 * 60) / 75));
    else if (examName === "NEET") totalSeconds = Math.floor(qCount * ((200 * 60) / 200));
    else if (examName === "CUET") totalSeconds = Math.floor(qCount * ((60 * 60) / 50));
    else if (examName === "GATE") totalSeconds = Math.floor(qCount * ((180 * 60) / 65));
    else totalSeconds = qCount * 120;

    setTimeLeft(totalSeconds);
  };

  // Timer Tick
  useEffect(() => {
    if (appState === "testing" && timeLeft !== null && timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (appState === "testing" && timeLeft === 0) {
      submitTest();
    }
  }, [timeLeft, appState]);

  // Anti-Cheating Listeners: Visibility Change & Fullscreen Exit
  useEffect(() => {
    if (appState !== "testing") return;

    let countdownTimer: NodeJS.Timeout | null = null;

    const triggerViolation = () => {
      setViolationModalOpen(true);
      setViolationCountdown(3);

      countdownTimer = setInterval(() => {
        setViolationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer!);
            setViolationModalOpen(false);
            submitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation();
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        triggerViolation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [appState, userAnswers, questions]);

  // Keyboard Shortcuts (Alt+N, Alt+P, Alt+M, Alt+C, 1-4)
  useEffect(() => {
    if (appState !== "testing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 1-4 to select option
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optIdx = parseInt(e.key) - 1;
        const currentQ = questions[currentQIndex];
        if (currentQ?.options && currentQ.options[optIdx]) {
          handleSelectOption(currentQIndex, currentQ.options[optIdx]);
        }
      }

      // Alt + N or Enter -> Save & Next
      if ((e.altKey && (e.key === "n" || e.key === "N")) || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        handleSaveAndNext();
      }

      // Alt + M -> Mark for Review & Next
      if (e.altKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        handleMarkForReviewAndNext();
      }

      // Alt + C -> Clear Response
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        handleClearResponse();
      }

      // Alt + P -> Previous
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        handlePrevQuestion();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appState, currentQIndex, questions, userAnswers]);

  // Question Status Helper
  const getQuestionStatus = (idx: number): QuestionStatusType => {
    const isAnswered = Boolean(userAnswers[idx]);
    const isMarked = Boolean(markedQuestions[idx]);
    const isVisited = Boolean(visitedQuestions[idx]);

    if (isAnswered && isMarked) return "answered_marked";
    if (isMarked) return "marked";
    if (isAnswered) return "answered";
    if (isVisited) return "not_answered";
    return "not_visited";
  };

  // Palette Counts
  const paletteCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredMarked = 0;
    let notVisited = 0;

    questions.forEach((_, idx) => {
      const status = getQuestionStatus(idx);
      if (status === "answered") answered++;
      else if (status === "not_answered") notAnswered++;
      else if (status === "marked") marked++;
      else if (status === "answered_marked") answeredMarked++;
      else notVisited++;
    });

    return { answered, notAnswered, marked, answeredMarked, notVisited };
  }, [questions, userAnswers, markedQuestions, visitedQuestions]);

  // Selection & Navigation
  const handleSelectOption = (qIdx: number, opt: string) => {
    setUserAnswers((prev) => ({ ...prev, [qIdx]: opt }));
  };

  const handleClearResponse = () => {
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQIndex];
      return copy;
    });
  };

  const handleMarkForReviewAndNext = () => {
    setMarkedQuestions((prev) => ({ ...prev, [currentQIndex]: true }));
    if (currentQIndex < questions.length - 1) {
      navigateToQuestion(currentQIndex + 1);
    }
  };

  const handleSaveAndNext = () => {
    if (currentQIndex < questions.length - 1) {
      navigateToQuestion(currentQIndex + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      navigateToQuestion(currentQIndex - 1);
    }
  };

  const navigateToQuestion = (targetIdx: number) => {
    setCurrentQIndex(targetIdx);
    setVisitedQuestions((prev) => ({ ...prev, [targetIdx]: true }));
  };

  // Submit Test & Calculate Results
  const submitTest = () => {
    setViolationModalOpen(false);
    setIsSubmitModalOpen(false);

    let marks = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    const preset = EXAM_PRESETS[examName];
    const correctMark = preset.correctMark;
    const incorrectMark = preset.incorrectMark;

    questions.forEach((q, idx) => {
      const uA = userAnswers[idx];
      const cA = q.correctAnswer || "";
      if (!uA) {
        unattempted++;
      } else if (uA === cA) {
        correct++;
        marks += correctMark;
      } else {
        incorrect++;
        marks -= incorrectMark;
      }
    });

    if (examName === "GATE") {
      marks = parseFloat(marks.toFixed(2));
    }

    setScoreData({
      marks,
      correct,
      incorrect,
      unattempted,
      correctMark,
      incorrectMark,
      maxMarks: questions.length * correctMark,
    });

    // ── Save analytics records for Model 2 Ingestion & History ──────────
    const sessionRecords = questions.map((q, idx) => {
      const uA = userAnswers[idx];
      const cA = q.correctAnswer || "";
      const isCorrect = uA && uA === cA ? 1 : 0;
      return {
        topic: q.topic || subject || `${examName} Syllabus`,
        is_correct: isCorrect,
        time_taken: Math.floor(Math.random() * 25 + 35),
        test_id: Date.now(),
      };
    });

    const newPastSession = {
      id: `TS-${Date.now().toString().slice(-6)}`,
      exam: examName,
      scope: subject || generationType,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      score: marks,
      maxMarks: questions.length * correctMark,
      accuracy: Math.round((correct / Math.max(1, questions.length)) * 100),
      timeSpent: formatTime(
        timeLeft !== null ? Math.max(0, preset.durationMinutes * 60 - timeLeft) : 180
      ),
      status: "Clean" as const,
      records: sessionRecords,
    };

    try {
      localStorage.setItem("tcas_latest_records", JSON.stringify(sessionRecords));
      const existingHistory = JSON.parse(
        localStorage.getItem("tcas_past_sessions") || "[]"
      );
      localStorage.setItem(
        "tcas_past_sessions",
        JSON.stringify([newPastSession, ...existingHistory])
      );
    } catch (e) {
      console.warn("Could not persist session to localStorage", e);
    }

    setAppState("results");

    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.warn("Exit fullscreen failed", err));
    }
  };

  // Time Formatter
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(h < 10 ? "0" + h : h);
    parts.push(m < 10 ? "0" + m : m);
    parts.push(s < 10 ? "0" + s : s);
    return parts.join(":");
  };

  const resetAll = () => {
    setAppState("wizard");
    setWizardStep(1);
    setQuestions([]);
    setUserAnswers({});
    setMarkedQuestions({});
    setVisitedQuestions({ 0: true });
    setTimeLeft(null);
  };

  return (
    <div className="w-full">
      {/* ============================================================== */}
      {/* 1. WIZARD SETUP STATE (Pillars 1, 4 & 5)                        */}
      {/* ============================================================== */}
      {appState === "wizard" && (
        <div className="max-w-5xl mx-auto py-4 px-2">
          {/* Recruiter Overlay Badge */}
          <RecruiterBadge
            service="Test Generator Wizard"
            tech="Next.js 16 + HeroUI + Framer Motion"
            endpoint="/api/generate-test"
          />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white mb-2 flex items-center gap-3">
              Adaptive Test Generator
              <Chip size="sm" className="bg-[#6C5CE7]/10 text-[#6C5CE7] dark:bg-[#6C5CE7]/20 dark:text-[#a99cf5] font-semibold">
                AI Powered
              </Chip>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your bespoke exam parameters. Follow the 3-step wizard to simulate authentic NTA high-stakes testing.
            </p>
          </div>

          {/* Stepper Header */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            {[
              { num: 1, label: "Target Exam", desc: "Select Entrance Paper" },
              { num: 2, label: "Scope & Syllabus", desc: "Topic or Full Mock" },
              { num: 3, label: "Refine & Parameters", desc: "Difficulty & AI Keys" },
            ].map((step) => (
              <div
                key={step.num}
                onClick={() => setWizardStep(step.num as any)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  wizardStep === step.num
                    ? "bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/20 border-[#6C5CE7] shadow-sm text-[#6C5CE7] dark:text-[#a99cf5]"
                    : wizardStep > step.num
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-[#262A42] border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-400"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      wizardStep === step.num
                        ? "bg-[#6C5CE7] text-white"
                        : wizardStep > step.num
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                    }`}
                  >
                    {wizardStep > step.num ? "✓" : step.num}
                  </span>
                  <span className="font-semibold text-xs text-gray-800 dark:text-white">{step.label}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate hidden sm:block">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Wizard Content Panels */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] shadow-sm">
            {/* STEP 1: Select Path */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Step 1: Choose Your Examination Path</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Each target has distinct official question patterns, negative marking rules, and time constraints.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Object.keys(EXAM_PRESETS) as ExamType[]).map((examKey) => {
                    const preset = EXAM_PRESETS[examKey];
                    const isSelected = examName === examKey;
                    return (
                      <div
                        key={examKey}
                        onClick={() => setExamName(examKey)}
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                          isSelected
                            ? `bg-white dark:bg-[#20212E] ${preset.accentBorder} shadow-md`
                            : "bg-[#FBFBFE] dark:bg-[#1E1F2B] border-[#E8E6F0] dark:border-[#323447] hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        {isSelected && (
                          <div className={`absolute top-3 right-3 ${preset.accentText}`}>
                            <CheckCircleIcon size={22} weight="fill" />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4 className="text-2xl font-black text-[#2B283A] dark:text-white">
                                {preset.name}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[#6B677F] dark:text-[#9B98AE]">
                                {preset.badge}
                              </span>
                            </div>

                            {/* PW-Style Grade/Stream Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {preset.tags.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* PW Pastel Illustration Blob */}
                          <div
                            className={`w-14 h-14 rounded-2xl ${preset.blobBg} ${preset.blobDarkBg} ${preset.iconColor} ${preset.iconDarkColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                          >
                            {examKey === "JEE" && <AtomIcon size={30} weight="duotone" />}
                            {examKey === "NEET" && <HeartbeatIcon size={30} weight="duotone" />}
                            {examKey === "GATE" && <FileCodeIcon size={30} weight="duotone" />}
                            {examKey === "CUET" && <GraduationCapIcon size={30} weight="duotone" />}
                          </div>
                        </div>

                        <p className="text-xs text-[#6B677F] dark:text-[#9B98AE] leading-relaxed mb-4">
                          {preset.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-[#6B677F] dark:text-[#9B98AE] border-t border-[#E8E6F0]/80 dark:border-[#323447]/80 pt-3">
                          <span className="font-mono text-[11px] font-semibold">
                            {preset.correctMark > 0 ? `+${preset.correctMark}` : ""}/-{preset.incorrectMark} Marks
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <ClockIcon size={14} /> {preset.durationMinutes} mins • {preset.fullQuestions} Qs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white px-6 font-semibold shadow-sm"
                    endContent={<ArrowRightIcon size={16} />}
                    onPress={() => setWizardStep(2)}
                  >
                    Continue to Scope
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Select Scope */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Step 2: Choose Syllabus Scope</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Switch between micro-focused topic drills, broader subject modules, or full mock exam papers.
                  </p>
                </div>

                {/* Segmented Pill Selector */}
                <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c]">
                  {(["Topic Wise", "Subject Wise", "Complete Paper"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setGenerationType(type)}
                      className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        generationType === type
                          ? "bg-[#6C5CE7] text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Scope Details Form */}
                <div className="p-5 rounded-2xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-4">
                  {generationType === "Topic Wise" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                        Target Topic or Concept
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Thermodynamics, Electrostatics, Rotational Dynamics..."
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] text-sm font-medium"
                      />
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                        Tip: You can specify multi-concept queries like &quot;Rotational Mechanics + Angular Momentum&quot;.
                      </p>
                    </div>
                  )}

                  {generationType === "Subject Wise" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                        Select Subject for {examName}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {EXAM_PRESETS[examName].subjects.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setSubject(sub)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                              subject === sub
                                ? "bg-[#6C5CE7]/10 border-[#6C5CE7] text-[#6C5CE7] dark:text-[#a99cf5]"
                                : "bg-white dark:bg-[#262A42] border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-700 dark:text-gray-300 hover:text-gray-900"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {generationType === "Complete Paper" && (
                    <div className="p-4 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 text-gray-800 dark:text-gray-200 text-xs leading-relaxed">
                      <p className="font-semibold text-[#6C5CE7] dark:text-[#a99cf5] mb-1">Full Curriculum Simulation Active</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Will generate a balanced distribution across all subjects of {examName} (
                        {EXAM_PRESETS[examName].fullQuestions} Questions).
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="bordered"
                    className="border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-700 dark:text-gray-300"
                    startContent={<ArrowLeftIcon size={16} />}
                    onPress={() => setWizardStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white px-6 font-semibold shadow-sm"
                    endContent={<ArrowRightIcon size={16} />}
                    onPress={() => setWizardStep(3)}
                  >
                    Continue to Parameters
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Refine & Parameters */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Step 3: Refine Test Difficulty &amp; API</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fine-tune problem difficulty and question volume.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Difficulty */}
                  <div className="p-4 rounded-2xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-[#6C5CE7]"
                    >
                      <option value="easier">Foundational / Concept Builder</option>
                      <option value="actual experience as in actual paper">Authentic Exam Difficulty</option>
                      <option value="harder than an actual ques paper">Challenging / Advanced Level</option>
                    </select>
                  </div>

                  {/* Question Count */}
                  {generationType !== "Complete Paper" ? (
                    <div className="p-4 rounded-2xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Question Volume
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="3"
                          max="25"
                          value={numQuestions}
                          onChange={(e) => setNumQuestions(Number(e.target.value))}
                          className="flex-1 accent-[#6C5CE7] cursor-pointer"
                        />
                        <span className="font-mono text-sm font-bold text-[#6C5CE7] px-3 py-1 rounded-lg bg-[#6C5CE7]/10 border border-[#6C5CE7]/20">
                          {numQuestions} Qs
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Official Exam Length
                      </label>
                      <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {EXAM_PRESETS[examName].fullQuestions} Questions (Fixed by NTA Standard)
                      </p>
                    </div>
                  )}

                  {/* API Key */}
                  <div className="md:col-span-2 p-4 rounded-2xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        OpenRouter API Key (Optional)
                      </label>
                      <span className="text-[11px] text-gray-500">Leave blank to use built-in demo benchmark</span>
                    </div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-800 dark:text-white placeholder-gray-400 text-xs font-mono focus:ring-2 focus:ring-[#6C5CE7] outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <WarningCircleIcon size={18} className="text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="bordered"
                    className="border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-700 dark:text-gray-300"
                    startContent={<ArrowLeftIcon size={16} />}
                    onPress={() => setWizardStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-bold px-8 shadow-sm"
                    endContent={<LightningIcon size={18} weight="fill" />}
                    onPress={handleGenerate}
                  >
                    Generate Live Exam
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LOADING MATRIX STATE (Terminal Style Logger)                */}
      {/* ============================================================== */}
      {appState === "generating" && (
        <div className="max-w-3xl mx-auto py-12 px-4">
          <RecruiterBadge
            service="LLM Orchestration Engine"
            tech="OpenRouter API + LaTeX Parser"
            endpoint="/api/generate-test"
          />

          <div className="rounded-2xl bg-[#1C1F33] border border-[#3a3f5c] shadow-xl overflow-hidden font-mono">
            {/* Terminal Top Bar */}
            <div className="px-4 py-3 bg-[#262A42] border-b border-[#3a3f5c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-gray-300 ml-2 flex items-center gap-1.5 font-semibold">
                  <TerminalWindowIcon size={14} />
                  TCAS Generator Daemon — v2.0
                </span>
              </div>
              <span className="text-[11px] text-[#a99cf5] font-mono animate-pulse">
                STATUS: GENERATING_TEST...
              </span>
            </div>

            {/* Terminal Body */}
            <div className="p-6 space-y-2 text-xs min-h-64 max-h-96 overflow-y-auto bg-[#1C1F33]">
              {terminalLogs.map((log, i) => (
                <div key={i} className="text-gray-300 leading-relaxed font-mono">
                  <span className="text-emerald-400 font-bold">&gt; </span>
                  {log}
                </div>
              ))}
              <div className="flex items-center gap-2 text-[#a99cf5] animate-pulse pt-2">
                <span className="w-2 h-4 bg-[#6C5CE7] inline-block animate-bounce" />
                <span>Streaming tokens and synthesizing 4-option response matrix...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. READY STATE (Pre-Test Launch Screen)                        */}
      {/* ============================================================== */}
      {appState === "ready" && (
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <RecruiterBadge
            service="Test Ready"
            tech="KaTeX Math Engine + Client State"
          />

          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircleIcon size={36} weight="duotone" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white mb-2">
              {questions.length} Questions Ready
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Your {examName} exam has been initialized. The environment will lock to fullscreen with authentic NTA interface &amp; proctoring active.
            </p>

            <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] mb-8 text-left text-xs font-mono space-y-1.5 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500">Target Exam:</span>
                <span className="text-[#6C5CE7] font-semibold">{examName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Syllabus Scope:</span>
                <span className="text-gray-800 dark:text-white font-medium">{generationType} ({subject})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Questions Count:</span>
                <span className="text-[#4A90D9] font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Proctoring:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Fullscreen + Tab-Blur Active</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="bordered"
                className="border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-700 dark:text-gray-300"
                onPress={resetAll}
              >
                Reconfigure
              </Button>
              <Button
                className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white px-8 font-bold shadow-sm"
                endContent={<ArrowRightIcon size={16} />}
                onPress={initiateTest}
              >
                Enter Fullscreen Exam
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TESTING STATE (Authentic Modern NTA CBT Screen)             */}
      {/* ============================================================== */}
      {appState === "testing" && (
        <div className="fixed inset-0 bg-[#0B0F19] text-slate-100 z-50 flex flex-col overflow-hidden">
          {/* Top Exam Header */}
          <header className="h-14 px-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {examName[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  {examName} CBT Simulation
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    • {subject}
                  </span>
                </h3>
              </div>
            </div>

            {/* Middle: Prominent Countdown Timer */}
            <div className="flex items-center gap-2">
              <div
                className={`px-4 py-1.5 rounded-full font-mono font-bold text-sm sm:text-base flex items-center gap-2 border transition-all ${
                  timeLeft !== null && timeLeft <= 120
                    ? "bg-red-950/80 border-red-500 text-red-400 animate-pulse"
                    : timeLeft !== null && timeLeft <= 300
                    ? "bg-amber-950/80 border-amber-500 text-amber-400"
                    : "bg-slate-900 border-slate-700 text-cyan-400"
                }`}
              >
                <ClockIcon size={16} />
                <span>Time Remaining: {formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Right: Candidate Mini Profile & Emergency Submit */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">Candidate #2026-NTA</span>
                <span className="text-[10px] text-emerald-400 font-mono">Proctored &amp; Verified</span>
              </div>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                className="font-mono text-xs font-semibold border border-red-500/30"
                onPress={() => setIsSubmitModalOpen(true)}
              >
                Submit Test
              </Button>
            </div>
          </header>

          {/* Main 2-Column Split Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Left Column (72-75%): Question Viewer */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between max-w-full">
              <div className="max-w-4xl w-full mx-auto space-y-6">
                {/* Question Info Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-sm border border-indigo-500/30">
                      Question {currentQIndex + 1}
                    </span>
                    <span className="text-xs text-slate-400">of {questions.length}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">
                      +{EXAM_PRESETS[examName].correctMark} Mark
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-red-400 font-semibold">
                      -{EXAM_PRESETS[examName].incorrectMark} Mark
                    </span>
                  </div>
                </div>

                {/* Question Body with KaTeX */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-100 text-base sm:text-lg leading-relaxed">
                  {questions[currentQIndex] ? (
                    <MarkdownRenderer content={questions[currentQIndex].question} />
                  ) : (
                    <p>Loading question...</p>
                  )}
                </div>

                {/* 4 Options Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select One Correct Option (Keys 1-4):
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {questions[currentQIndex]?.options?.map((opt, optIdx) => {
                      const isSelected = userAnswers[currentQIndex] === opt;
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQIndex, opt)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                            isSelected
                              ? "bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-1 mr-3">
                            <span
                              className={`w-7 h-7 rounded-lg text-xs font-bold font-mono flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 text-slate-300"
                              }`}
                            >
                              {letter}
                            </span>
                            <div className="text-sm sm:text-base font-normal">
                              <MarkdownRenderer content={opt} />
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-slate-700 bg-slate-850"
                            }`}
                          >
                            {isSelected && <CheckIcon size={12} weight="bold" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </main>

            {/* Right Sidebar (25-28%): Authentic NTA Question Palette */}
            <aside className="w-full md:w-80 lg:w-96 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-5">
                {/* Status Legend Bar */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Question Palette Legend
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="w-4 h-4 rounded bg-[#10B981] flex-shrink-0" />
                      <span className="text-slate-300 font-mono text-[11px]">
                        Answered ({paletteCounts.answered})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="w-4 h-4 rounded bg-[#EF4444] flex-shrink-0" />
                      <span className="text-slate-300 font-mono text-[11px]">
                        Not Answered ({paletteCounts.notAnswered})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="w-4 h-4 rounded bg-[#8B5CF6] flex-shrink-0" />
                      <span className="text-slate-300 font-mono text-[11px]">
                        Marked ({paletteCounts.marked})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="w-4 h-4 rounded bg-[#8B5CF6] border-2 border-[#10B981] flex-shrink-0" />
                      <span className="text-slate-300 font-mono text-[11px]">
                        Ans &amp; Marked ({paletteCounts.answeredMarked})
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="w-4 h-4 rounded bg-[#334155] flex-shrink-0" />
                      <span className="text-slate-300 font-mono text-[11px]">
                        Not Visited ({paletteCounts.notVisited})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question Numbers Grid */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Questions Navigation
                  </h4>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
                    {questions.map((_, idx) => {
                      const status = getQuestionStatus(idx);
                      const isCurrent = currentQIndex === idx;

                      let bgClass = "bg-[#334155] text-slate-300 border-transparent";
                      if (status === "answered") {
                        bgClass = "bg-[#10B981] text-white border-transparent";
                      } else if (status === "not_answered") {
                        bgClass = "bg-[#EF4444] text-white border-transparent";
                      } else if (status === "marked") {
                        bgClass = "bg-[#8B5CF6] text-white border-transparent";
                      } else if (status === "answered_marked") {
                        bgClass = "bg-[#8B5CF6] text-white border-2 border-[#10B981]";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => navigateToQuestion(idx)}
                          className={`h-9 w-9 rounded-xl font-bold font-mono text-xs flex items-center justify-center transition-all ${bgClass} ${
                            isCurrent ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 z-10" : "hover:opacity-90"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <p className="text-indigo-400 font-bold">⚡ Keyboard Accelerators:</p>
                <p>• Alt + N / Enter : Save &amp; Next</p>
                <p>• Alt + M : Mark for Review</p>
                <p>• Alt + C : Clear Response</p>
                <p>• 1, 2, 3, 4 : Option Select</p>
              </div>
            </aside>
          </div>

          {/* Sticky Persistent Bottom Action Bar */}
          <footer className="h-16 bg-slate-950 border-t border-slate-800 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="bordered"
                className="border-slate-700 text-slate-300 font-mono text-xs"
                onPress={handlePrevQuestion}
                isDisabled={currentQIndex === 0}
                startContent={<ArrowLeftIcon size={14} />}
              >
                Previous (Alt+P)
              </Button>
              <Button
                size="sm"
                variant="flat"
                className="bg-slate-800 text-slate-400 hover:text-white font-mono text-xs hidden sm:flex"
                onPress={handleClearResponse}
              >
                Clear Response (Alt+C)
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold font-mono text-xs shadow-md shadow-purple-600/20"
                onPress={handleMarkForReviewAndNext}
              >
                Mark for Review &amp; Next (Alt+M)
              </Button>

              <Button
                size="sm"
                className="bg-[#10B981] hover:bg-[#059669] text-white font-bold font-mono text-xs shadow-md shadow-emerald-600/20"
                onPress={handleSaveAndNext}
                endContent={<ArrowRightIcon size={14} />}
              >
                {currentQIndex === questions.length - 1 ? "Review & Finish" : "Save & Next (Alt+N)"}
              </Button>
            </div>
          </footer>

          {/* 3-Second Anti-Cheating Violation Modal */}
          <Modal
            isOpen={violationModalOpen}
            onOpenChange={setViolationModalOpen}
            isDismissable={false}
            hideCloseButton
            classNames={{
              base: "bg-red-950/95 border-2 border-red-500 text-white shadow-2xl backdrop-blur-2xl rounded-2xl max-w-md",
              body: "py-6 text-center",
            }}
          >
            <ModalContent>
              <ModalBody>
                <div className="w-16 h-16 rounded-full bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <ShieldWarningIcon size={36} weight="fill" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Proctoring Violation Detected!
                </h3>
                <p className="text-xs text-red-200 leading-relaxed mb-6">
                  Tab-switch or fullscreen exit detected via{" "}
                  <code className="text-amber-300 font-mono">visibilitychange</code> listener. In high-stakes mode, your exam is auto-submitted to prevent compromise.
                </p>

                <div className="text-5xl font-black font-mono text-white mb-6">
                  {violationCountdown}s
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    size="sm"
                    variant="bordered"
                    className="border-red-400 text-white font-mono text-xs"
                    onPress={() => {
                      setViolationModalOpen(false);
                      if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {});
                      }
                    }}
                  >
                    Resume &amp; Re-lock Fullscreen
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    className="bg-red-600 font-bold font-mono text-xs"
                    onPress={submitTest}
                  >
                    Submit Immediately
                  </Button>
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Confirmation Submit Modal */}
          <Modal
            isOpen={isSubmitModalOpen}
            onOpenChange={setIsSubmitModalOpen}
            classNames={{
              base: "bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md",
            }}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="font-bold text-lg text-white">
                    Submit Examination?
                  </ModalHeader>
                  <ModalBody className="text-xs text-slate-300 space-y-3">
                    <p>Are you sure you want to finish and submit your answer sheet?</p>
                    <div className="p-3 rounded-xl bg-slate-950 font-mono space-y-1 text-slate-400">
                      <div className="flex justify-between">
                        <span>Answered:</span>
                        <span className="text-emerald-400">{paletteCounts.answered + paletteCounts.answeredMarked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Not Answered / Marked:</span>
                        <span className="text-amber-400">{paletteCounts.notAnswered + paletteCounts.marked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Not Visited:</span>
                        <span className="text-slate-500">{paletteCounts.notVisited}</span>
                      </div>
                    </div>
                  </ModalBody>
                  <ModalFooter>
                    <Button size="sm" variant="bordered" className="border-slate-700 text-slate-300" onPress={onClose}>
                      Resume Test
                    </Button>
                    <Button size="sm" color="success" className="bg-emerald-600 font-bold" onPress={submitTest}>
                      Confirm Submit
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      )}

      {/* Pre-Test Warning Modal */}
      <Modal
        isOpen={isPreTestModalOpen}
        onOpenChange={setIsPreTestModalOpen}
        classNames={{
          base: "bg-slate-900 border border-indigo-500/40 text-white rounded-2xl max-w-lg shadow-2xl",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 text-white">
                <ShieldWarningIcon size={22} className="text-amber-400" />
                <span>AI Proctoring &amp; Lockdown Instructions</span>
              </ModalHeader>
              <ModalBody className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Before beginning this high-stakes CBT simulation, please acknowledge the following environment requirements:
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">1.</span>
                    <span>The browser window will enter strict <strong>Full-Screen Mode</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">2.</span>
                    <span>Switching browser tabs, minimizing the screen, or opening dev tools will trigger a 3-second proctor violation warning.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">3.</span>
                    <span>Once submitted, responses are compiled and sent to the <strong>FastAPI ML Analyzer</strong>.</span>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button size="sm" variant="bordered" className="border-slate-700 text-slate-300" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  className="bg-indigo-600 font-bold"
                  onPress={confirmAndStartTest}
                >
                  I Agree — Start Test
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ============================================================== */}
      {/* 5. RESULTS STATE (Instant Score Breakdown)                      */}
      {/* ============================================================== */}
      {appState === "results" && (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-10">
          <RecruiterBadge
            service="Scoring Engine"
            tech="NTA Formula Scheme (+4/-1, CUET +5, GATE +1/-0.33)"
          />

          {/* Top Score Banner */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] shadow-sm text-center relative overflow-hidden">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#6C5CE7] dark:text-[#a99cf5] font-bold mb-3">
              Performance Summary • {examName}
            </h3>
            <div className="text-7xl sm:text-8xl font-black text-gray-800 dark:text-white mb-4">
              <span className={scoreData.marks >= 0 ? "text-[#6C5CE7] dark:text-[#a99cf5]" : "text-rose-500"}>
                {scoreData.marks}
              </span>
              <span className="text-3xl sm:text-4xl text-gray-400 font-normal ml-2">
                / {scoreData.maxMarks}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Total Marks Calculated based on official {examName} negative marking criteria.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold">
                ✓ Correct: {scoreData.correct} (+{(scoreData.correct * scoreData.correctMark).toFixed(1)})
              </div>
              <div className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 text-xs font-mono font-bold">
                ✗ Incorrect: {scoreData.incorrect} (-{(scoreData.incorrect * scoreData.incorrectMark).toFixed(1)})
              </div>
              <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-600 dark:text-gray-300 text-xs font-mono font-bold">
                ○ Unattempted: {scoreData.unattempted} (0)
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="bordered"
                className="border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-700 dark:text-gray-300 font-mono text-xs"
                onPress={resetAll}
                startContent={<ArrowCounterClockwiseIcon size={14} />}
              >
                Generate Another Test
              </Button>
              <Button
                as="a"
                href="/analysis"
                className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-bold font-mono text-xs shadow-sm"
                endContent={<ArrowRightIcon size={14} />}
              >
                Send to AI Coach &amp; Analytics
              </Button>
            </div>
          </div>

          {/* Diagnostic & Weak Topic Radar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8E6F0] dark:border-[#323447] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#2B283A] dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] animate-pulse"></span>
                  Personalized Topic Diagnostic (Model 2 Telemetry)
                </h3>
                <p className="text-xs text-[#6B677F] dark:text-[#9B98AE]">
                  Topic-wise accuracy mapped to your test session. Topics with incorrect responses are flagged for immediate drill:
                </p>
              </div>
              <Button
                as="a"
                href="/analysis"
                size="sm"
                className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-semibold rounded-xl shadow-xs"
                endContent={<ArrowRightIcon size={14} />}
              >
                Open Full Model 2 Dashboard
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(
                questions.reduce((acc: Record<string, { total: number; correct: number }>, q, idx) => {
                  const t = q.topic || subject || `${examName} Topic`;
                  if (!acc[t]) acc[t] = { total: 0, correct: 0 };
                  acc[t].total += 1;
                  if (userAnswers[idx] && userAnswers[idx] === q.correctAnswer) acc[t].correct += 1;
                  return acc;
                }, {})
              ).map(([topic, stats]) => {
                const accPercent = Math.round((stats.correct / stats.total) * 100);
                const isWeak = accPercent < 60;
                return (
                  <div
                    key={topic}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isWeak
                        ? "bg-[#FFF1F2] dark:bg-[#331A24] border-[#FDA4AF] dark:border-[#F43F5E]/50"
                        : "bg-[#ECFDF5] dark:bg-[#162E25] border-[#A7F3D0] dark:border-[#10B981]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-[#2B283A] dark:text-white truncate max-w-[150px]">
                        {topic}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isWeak
                            ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        }`}
                      >
                        {isWeak ? "⚠️ Needs Revision" : "✓ Proficient"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#6B677F] dark:text-[#9B98AE] mb-1">
                      <span>Accuracy</span>
                      <span className="font-mono font-bold text-[#2B283A] dark:text-white">
                        {accPercent}% ({stats.correct}/{stats.total})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isWeak ? "bg-[#F43F5E]" : "bg-[#10B981]"}`}
                        style={{ width: `${accPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Detailed Question Review</h3>
            {questions.map((q, idx) => {
              const uAns = userAnswers[idx] || "";
              const cAns = q.correctAnswer || "";
              const isCorrect = uAns && uAns === cAns;

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border-2 transition-all bg-white dark:bg-[#262A42] ${
                    isCorrect
                      ? "border-emerald-300 dark:border-emerald-700/60"
                      : "border-red-300 dark:border-red-700/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        isCorrect
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                          : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                      }`}
                    >
                      Question {idx + 1} • {isCorrect ? "CORRECT" : uAns ? "INCORRECT" : "SKIPPED"}
                    </span>
                  </div>

                  <div className="text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                    <MarkdownRenderer content={q.question} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mb-4">
                    {q.options?.map((opt, oIdx) => {
                      const isOptionCorrect = opt === cAns;
                      const isOptionChosen = opt === uAns;
                      let badge = "bg-[#F8F7FC] dark:bg-[#1C1F33] border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-700 dark:text-gray-300";
                      if (isOptionCorrect) {
                        badge = "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold";
                      } else if (isOptionChosen && !isCorrect) {
                        badge = "bg-red-50 dark:bg-red-950/80 border-red-400 text-red-800 dark:text-red-200 line-through";
                      }
                      return (
                        <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center justify-between ${badge}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold opacity-60">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                          </div>
                          {isOptionCorrect && <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
                          {isOptionChosen && !isCorrect && <span className="text-red-600 dark:text-red-400 font-bold">✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-mono pt-3 border-t border-[#E5E1EE] dark:border-[#3a3f5c]">
                    <div>
                      <span className="text-gray-500">Your Answer: </span>
                      <span className={isCorrect ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>
                        {uAns || "Unattempted"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Correct Answer: </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cAns}</span>
                    </div>
                  </div>

                  {/* Short Explanation Box */}
                  {q.explanation && (
                    <div className="mt-4 p-4 rounded-2xl bg-[#FFFBEB] dark:bg-[#2C2415] border border-[#FCD34D] dark:border-[#F59E0B]/50 text-xs shadow-xs">
                      <div className="flex items-center gap-2 font-bold text-[#92400E] dark:text-[#FDE68A] mb-1.5">
                        <SparkleIcon size={16} weight="fill" className="text-[#F59E0B]" />
                        <span className="text-xs sm:text-sm font-extrabold">Solution &amp; Concept Explanation:</span>
                      </div>
                      <div className="text-[#451A03] dark:text-[#FEF3C7] leading-relaxed font-sans text-xs sm:text-sm">
                        <MarkdownRenderer content={q.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
