"use client";

import { useState, useEffect } from "react";

type AppState = "setup" | "generating" | "ready" | "testing" | "results";

export interface Question {
  question: string;
  options?: string[];
  correctAnswer?: string;
}

export default function TestGenerator() {
  const [apiKey, setApiKey] = useState("");
  const [examName, setExamName] = useState("JEE");
  const [generationType, setGenerationType] = useState("Topic Wise");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("actual experience as in actual paper");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Ensure default subject is correctly mapped when switching to Subject Wise dropdowns
  useEffect(() => {
    if (generationType === "Subject Wise") {
      if (examName === "JEE" && !["Physics", "Chemistry", "Mathematics"].includes(subject)) {
        setSubject("Physics");
      } else if (examName === "NEET" && !["Physics", "Chemistry", "Biology"].includes(subject)) {
        setSubject("Physics");
      }
    }
  }, [examName, generationType, subject]);

  const [appState, setAppState] = useState<AppState>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [scoreData, setScoreData] = useState({ marks: 0, correct: 0, incorrect: 0, unattempted: 0, correctMark: 4, incorrectMark: 1, maxMarks: 20 });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppState("generating");
    setError("");
    setQuestions([]);
    setUserAnswers({});

    let finalNumQuestions = numQuestions;
    let finalSubject = subject;

    if (generationType === "Complete Paper") {
      finalSubject = "Complete Syllabus";
      if (examName === "JEE") finalNumQuestions = 75;
      else if (examName === "NEET") finalNumQuestions = 200;
      else if (examName === "CUET") finalNumQuestions = 50;
      else if (examName === "GATE") finalNumQuestions = 65;
    }

    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, examName, generationType, difficulty, subject: finalSubject, numQuestions: finalNumQuestions }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (generationType === "Complete Paper" && res.status === 500) {
          throw new Error("Free tier limit exceeded for generating a complete paper. The AI model output was too large and cut off. Try a smaller 'Topic Wise' test or use a different model.");
        }
        throw new Error(data.error || "Generation failed.");
      }

      setQuestions(data.questions || []);
      setAppState("ready");
    } catch (err: any) {
      setError(err.message);
      setAppState("setup");
    }
  };

  const startTest = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed", err);
    }

    setAppState("testing");
    setUserAnswers({});

    let totalSeconds = 0;
    const qCount = questions.length;

    // Time logic per actual exam proportional to questions generated:
    if (examName === "JEE") {
      totalSeconds = Math.floor(qCount * ((180 * 60) / 75));
    } else if (examName === "NEET") {
      totalSeconds = Math.floor(qCount * ((200 * 60) / 200));
    } else if (examName === "CUET") {
      totalSeconds = Math.floor(qCount * ((60 * 60) / 50));
    } else if (examName === "GATE") {
      totalSeconds = Math.floor(qCount * ((180 * 60) / 65));
    } else {
      totalSeconds = qCount * 120; // fallback 2 mins per question
    }

    setTimeLeft(totalSeconds);
  };

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

  useEffect(() => {
    if (appState !== "testing") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        submitTest();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        submitTest();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [appState, userAnswers, questions]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (h > 0) parts.push(h < 10 ? "0" + h : h);
    parts.push(m < 10 ? "0" + m : m);
    parts.push(s < 10 ? "0" + s : s);
    return parts.join(":");
  };

  const handleSelectOption = (qIndex: number, optionValue: string) => {
    setUserAnswers(prev => ({ ...prev, [qIndex]: optionValue }));
  };

  const submitTest = () => {
    let marks = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    let correctMark = 4;
    let incorrectMark = 1;

    if (examName === "CUET") {
      correctMark = 5;
      incorrectMark = 1;
    } else if (examName === "GATE") {
      // Currently, all generated questions are strictly 1-option MCQs. 
      // Mapping GATE to standard 1-mark MCQ scheme: +1 / -1/3
      correctMark = 1;
      incorrectMark = 0.33;
    }

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
      maxMarks: questions.length * correctMark
    });
    setAppState("results");

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn("Exit fullscreen failed", err));
    }
  };

  const resetGenerator = () => {
    setAppState("setup");
    setQuestions([]);
    setUserAnswers({});
    setTimeLeft(null);
  };

  return (
    <div className="max-w-5xl mx-auto my-12 p-8 sm:p-12 bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl shadow-indigo-500/10 border border-white/50 dark:border-slate-700/50 transition-all min-h-[500px] relative overflow-hidden transform-gpu">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white sm:text-5xl mb-4">
          Dynamic Test Generation
        </h2>
        {appState === "setup" || appState === "generating" ? (
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Configure your paramaters and insert your OpenRouter key to generate a live, bespoke test.
          </p>
        ) : appState === "ready" ? (
          <p className="text-lg text-emerald-600 dark:text-emerald-400 font-bold max-w-2xl mx-auto">
            Test Ready! Your {examName} questions have been securely loaded.
          </p>
        ) : appState === "testing" ? (
          <p className="text-lg text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer">
            Test In Progress... Good Luck!
          </p>
        ) : (
          <p className="text-lg text-slate-700 dark:text-slate-300 font-bold">
            Test Completed! Check your results below.
          </p>
        )}
      </div>

      {(appState === "setup" || appState === "generating") && (
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 transition-all opacity-100">
          <div className="space-y-6 md:col-span-2 p-8 bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">OpenRouter API Key</label>
              <input type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Your key is kept safe in your browser and is never saved permanently.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Target Exam</label>
            <select value={examName} onChange={(e) => setExamName(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
              <option value="CUET">CUET</option>
              <option value="GATE">GATE</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Generation Type</label>
            <select value={generationType} onChange={(e) => setGenerationType(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
              <option value="Topic Wise">Topic Wise</option>
              <option value="Subject Wise">Subject Wise</option>
              <option value="Complete Paper">Complete Paper</option>
            </select>
          </div>

          {generationType !== "Complete Paper" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {generationType === "Subject Wise" ? "Select Subject" : "Subject / Topic Focus"}
              </label>
              {(generationType === "Subject Wise" && examName === "JEE") ? (
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              ) : (generationType === "Subject Wise" && examName === "NEET") ? (
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
              ) : (
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g Thermodynamics, Kinematics..." className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              )}
            </div>
          )}

          <div className="space-y-2 flex gap-4">
            <div className={`${generationType === "Complete Paper" ? "w-full" : "flex-1"}`}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value="easier">easier</option>
                <option value="actual experience as in actual paper">actual experience as in actual paper</option>
                <option value="harder than an actual ques paper">harder than an actual ques paper</option>
              </select>
            </div>
            {generationType !== "Complete Paper" && (
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Number of Questions</label>
                <input type="number" min="1" max="50" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 mt-8">
            <button type="submit" disabled={appState === "generating"} className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-right text-white text-xl font-black shadow-xl shadow-indigo-500/30 transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
              {appState === "generating" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  Generating {numQuestions} Questions via OpenRouter/free...
                </span>
              ) : "Generate Live Test"}
            </button>
            <p className="text-center text-sm text-slate-400 mt-3">Note: Requesting a "Complete Paper" (e.g. 50 questions) might be slow or hit token limits on free AI models.</p>
          </div>
        </form>
      )}

      {error && (
        <div className="p-5 mb-8 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 font-medium">
          <strong className="font-bold block mb-1">Retrieval Failed</strong>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Ready Phase */}
      {appState === "ready" && (
        <div className="flex flex-col items-center justify-center py-10 px-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700 transition-all opacity-100">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">{questions.length} Questions Ready!</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center">Your personalized test has been generated. Ready to test your knowledge?</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={resetGenerator} className="py-4 px-8 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold transition-all w-full sm:w-auto">Cancel</button>
            <button onClick={startTest} className="py-4 px-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] w-full sm:w-auto">Attempt Test Now</button>
          </div>
        </div>
      )}

      {/* Testing Phase */}
      {appState === "testing" && (
        <div className="space-y-10 transition-all opacity-100 relative">
          <div className="sticky top-6 z-50 flex justify-center mb-10">
            <div className={`px-8 py-4 rounded-[2rem] shadow-2xl border backdrop-blur-2xl flex items-center gap-4 font-mono text-3xl font-black transition-all duration-300 ${timeLeft !== null && timeLeft <= 60 ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400 animate-pulse shadow-rose-500/20' : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 text-indigo-900 dark:text-indigo-100 shadow-indigo-500/10'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {formatTime(timeLeft)}
            </div>
          </div>
          {questions.map((q, idx) => (
            <div key={idx} className="p-8 sm:p-10 rounded-[2.5rem] bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl transition-all duration-500">
              <p className="text-xl font-medium text-slate-900 dark:text-white mb-6 leading-relaxed flex items-start">
                <span className="text-indigo-600 dark:text-indigo-400 mr-4 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 rounded-full px-4 py-1 text-sm font-extrabold flex-shrink-0 mt-1 shadow-sm">Q{idx + 1}</span>
                {q.question}
              </p>
              <div className="grid grid-cols-1 gap-3 ml-2 sm:ml-12">
                {q.options?.map((opt: string, optIdx: number) => {
                  const isSelected = userAnswers[idx] === opt;
                  return (
                    <button key={optIdx} onClick={() => handleSelectOption(idx, opt)}
                      className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-300 ease-out transform group hover:-translate-y-1 hover:shadow-xl ${isSelected ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-100 shadow-lg shadow-indigo-500/20' : 'border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600'}`}>
                      <span className={`font-black text-lg mr-5 tracking-wide transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500'}`}>{String.fromCharCode(65 + optIdx)}</span>
                      <span className={`${isSelected ? 'font-semibold' : 'font-medium'}`}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="pt-8 mt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col items-end">
            <button onClick={submitTest}
              className="py-4 px-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-lg font-extrabold shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
              Submit Test & View Score
            </button>
          </div>
        </div>
      )}

      {/* Results Phase */}
      {appState === "results" && (
        <div className="space-y-16 transition-all opacity-100">
          <div className="bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950/30 p-12 sm:p-16 rounded-[3.5rem] text-center border border-white/60 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/10 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-white/[0.02]"></div>

            <h3 className="text-2xl text-slate-500 dark:text-slate-400 font-bold mb-4 uppercase tracking-widest relative z-10">Test Completed</h3>
            <div className="text-8xl font-black text-slate-800 dark:text-white mb-6 relative z-10">
              <span className={scoreData.marks >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}>{scoreData.marks}</span>
              <span className="text-4xl text-slate-400 dark:text-slate-600 font-bold ml-2">/ {scoreData.maxMarks}</span>
            </div>
            <p className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-6 relative z-10">
              Total Marks Scored
            </p>
            <div className="flex justify-center gap-6 mb-10 text-lg relative z-10 flex-wrap">
              <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-4 py-2 rounded-xl font-bold">
                Correct: {scoreData.correct} (+{parseFloat((scoreData.correct * scoreData.correctMark).toFixed(2))})
              </div>
              <div className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 px-4 py-2 rounded-xl font-bold">
                Incorrect: {scoreData.incorrect} (-{parseFloat((scoreData.incorrect * scoreData.incorrectMark).toFixed(2))})
              </div>
              <div className="bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 px-4 py-2 rounded-xl font-bold">
                Unattempted: {scoreData.unattempted} (0)
              </div>
            </div>
            <button onClick={resetGenerator} className="relative z-10 py-4 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]">
              Generate A New Test
            </button>
          </div>

          <div className="space-y-8">
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-4 pl-2">Detailed Answer Review</h3>
            {questions.map((q, idx) => {
              const uAns = userAnswers[idx] || "";
              const cAns = q.correctAnswer || "";

              const isCorrect = uAns && uAns === cAns;

              return (
                <div key={idx} className={`p-8 rounded-3xl border-2 shadow-sm transition-all ${isCorrect ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-900/10' : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-900/10'}`}>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white mb-6 leading-relaxed flex items-start">
                    <span className={`mr-4 border rounded-full px-4 py-1 text-sm font-black flex-shrink-0 mt-1 shadow-sm ${isCorrect ? 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-900/50 dark:border-emerald-800' : 'text-rose-700 bg-rose-100 border-rose-300 dark:text-rose-400 dark:bg-rose-900/50 dark:border-rose-800'}`}>Q{idx + 1}</span>
                    {q.question}
                  </p>
                  <div className="grid grid-cols-1 gap-3 ml-2 sm:ml-12 mb-6">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const isSelected = uAns === opt;
                      const isActualCorrect = cAns === opt;

                      let optStyle = 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400';
                      if (isActualCorrect) optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm';
                      else if (isSelected && !isCorrect) optStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 opacity-90 line-through decoration-rose-400/50 decoration-2';

                      return (
                        <div key={optIdx} className={`px-5 py-4 rounded-xl border-2 transition-all ${optStyle}`}>
                          <span className="font-bold text-sm mr-4 tracking-wide opacity-50">{String.fromCharCode(65 + optIdx)}</span>
                          <span>{opt}</span>
                          {isActualCorrect && isSelected && <span className="float-right text-emerald-500 font-extrabold pr-2">✓</span>}
                          {!isCorrect && isSelected && <span className="float-right text-rose-500 font-extrabold pr-2">✗</span>}
                        </div>
                      );
                    })}
                  </div>
                  {!isCorrect && (
                    <div className="ml-2 sm:ml-12 mt-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-12">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Your Answer</p>
                        <p className="text-base font-bold text-rose-600 dark:text-rose-500">{uAns || 'Skipped'}</p>
                      </div>
                      <div className="hidden sm:block w-px bg-slate-200 dark:bg-slate-800"></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Correct Answer</p>
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-500">{cAns}</p>
                      </div>
                    </div>
                  )}
                </div>
              );

              function isPatternMatched(c: string, o: string) {
                return c === o;
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
