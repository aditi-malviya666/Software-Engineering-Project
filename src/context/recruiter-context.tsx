"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Chip,
} from "@heroui/react";
import {
  CpuIcon,
  DatabaseIcon,
  LightningIcon,
  SparkleIcon,
  GraphIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

interface RecruiterContextType {
  isRecruiterMode: boolean;
  toggleRecruiterMode: () => void;
  openSchemaModal: () => void;
}

const RecruiterContext = createContext<RecruiterContextType>({
  isRecruiterMode: false,
  toggleRecruiterMode: () => {},
  openSchemaModal: () => {},
});

export const useRecruiter = () => useContext(RecruiterContext);

export function RecruiterProvider({ children }: { children: React.ReactNode }) {
  const [isRecruiterMode, setIsRecruiterMode] = useState<boolean>(true); // default to true so recruiters see it immediately
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tcas_recruiter_mode");
    if (saved !== null) {
      setIsRecruiterMode(saved === "true");
    }
  }, []);

  const toggleRecruiterMode = () => {
    setIsRecruiterMode((prev) => {
      const next = !prev;
      localStorage.setItem("tcas_recruiter_mode", String(next));
      return next;
    });
  };

  const openSchemaModal = () => setIsSchemaModalOpen(true);

  return (
    <RecruiterContext.Provider
      value={{
        isRecruiterMode,
        toggleRecruiterMode,
        openSchemaModal,
      }}
    >
      {children}

      {/* Recruiter Architecture & Schema Modal */}
      <Modal
        isOpen={isSchemaModalOpen}
        onOpenChange={setIsSchemaModalOpen}
        size="4xl"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-800 dark:text-gray-100 shadow-2xl rounded-2xl",
          header: "border-b border-[#E5E1EE] dark:border-[#3a3f5c] pb-3",
          body: "py-4",
          footer: "border-t border-[#E5E1EE] dark:border-[#3a3f5c] pt-3",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20">
                  <CpuIcon size={24} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    System Architecture &amp; Database Schema
                    <Chip size="sm" className="bg-[#6C5CE7]/10 text-[#6C5CE7] dark:bg-[#6C5CE7]/20 dark:text-[#a99cf5] font-semibold">
                      Under the Hood
                    </Chip>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                    Distributed CBT microservices: Next.js 16 + Drizzle ORM + PostgreSQL + FastAPI (Random Forest &amp; Ollama)
                  </p>
                </div>
              </ModalHeader>

              <ModalBody>
                <Tabs
                  aria-label="Architecture Views"
                  variant="underlined"
                  classNames={{
                    tabList: "gap-6 border-b border-[#E5E1EE] dark:border-[#3a3f5c] w-full",
                    cursor: "w-full bg-[#6C5CE7]",
                    tab: "max-w-fit px-1 h-10 text-gray-500 dark:text-gray-400 data-[selected=true]:text-[#6C5CE7] dark:data-[selected=true]:text-[#a99cf5] font-semibold",
                  }}
                >
                  {/* TAB 1: Microservices Pipeline */}
                  <Tab
                    key="pipeline"
                    title={
                      <div className="flex items-center gap-2">
                        <LightningIcon size={18} />
                        <span>Microservice Pipeline</span>
                      </div>
                    }
                  >
                    <div className="space-y-4 py-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] hover:border-[#6C5CE7]/50 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#6C5CE7] dark:text-[#a99cf5]">Layer 1</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Next.js 16</span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-1">Frontend &amp; CBT Runner</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            React 19 App Router with HeroUI, KaTeX LaTeX rendering, anti-cheating proctoring triggers, and keyboard accelerators.
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] hover:border-[#4A90D9]/50 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#4A90D9]">Layer 2</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">PostgreSQL 16</span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-1">Drizzle ORM &amp; State</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            Type-safe relational schema capturing question papers, taxonomical tags, millisecond response latency, and audit histories.
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] hover:border-[#E8792B]/50 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#E8792B]">Layer 3</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">FastAPI + AI</span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-1">ML &amp; Qualitative Engine</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            Random Forest proficiency classification + Ollama LLaMA 3.2 qualitative inference producing personalized coaching summaries.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#181B2B] border border-[#E5E1EE] dark:border-[#3a3f5c] font-mono text-xs text-gray-700 dark:text-gray-300">
                        <div className="text-[#6C5CE7] dark:text-[#a99cf5] font-semibold mb-2 flex items-center gap-1.5">
                          <GraphIcon size={16} />
                          <span>Data Flow Diagram:</span>
                        </div>
                        <pre className="text-gray-700 dark:text-gray-300 overflow-x-auto p-3 bg-white dark:bg-[#121420] border border-[#E5E1EE] dark:border-[#3a3f5c] rounded-lg">
{`[Student Browser]
       │
       ▼ (Proctored CBT Events)
[Next.js Server Actions / API Routes]
       ├──> [PostgreSQL via Drizzle ORM] (Store responses_history & latency)
       └──> [FastAPI Container /analyze]
                 ├──> [Stats Engine] (Weak topic calculation, polyfit slope)
                 ├──> [Random Forest Model] (Proficiency: Needs Improvement / Stable / Excellent)
                 └──> [Ollama LLaMA 3.2:1b] (Actionable 2-sentence coaching synthesis)`}
                        </pre>
                      </div>
                    </div>
                  </Tab>

                  {/* TAB 2: PostgreSQL Schema */}
                  <Tab
                    key="schema"
                    title={
                      <div className="flex items-center gap-2">
                        <DatabaseIcon size={18} />
                        <span>PostgreSQL Schema (Drizzle)</span>
                      </div>
                    }
                  >
                    <div className="space-y-3 py-2 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c]">
                          <div className="font-bold text-[#6C5CE7] dark:text-[#a99cf5] mb-1 flex items-center justify-between">
                            <span>question_papers</span>
                            <span className="text-[10px] text-gray-400">Table</span>
                          </div>
                          <ul className="text-gray-600 dark:text-gray-400 space-y-1 font-mono text-[11px]">
                            <li>• id: <span className="text-[#4A90D9]">uuid</span> [PK]</li>
                            <li>• name: <span className="text-[#4A90D9]">text</span></li>
                            <li>• user_id: <span className="text-[#4A90D9]">text</span> [FK -&gt; users.id]</li>
                            <li>• time_limit: <span className="text-[#4A90D9]">integer</span></li>
                            <li>• created_at: <span className="text-[#4A90D9]">timestamp</span></li>
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c]">
                          <div className="font-bold text-[#6C5CE7] dark:text-[#a99cf5] mb-1 flex items-center justify-between">
                            <span>questions</span>
                            <span className="text-[10px] text-gray-400">Table</span>
                          </div>
                          <ul className="text-gray-600 dark:text-gray-400 space-y-1 font-mono text-[11px]">
                            <li>• id: <span className="text-[#4A90D9]">uuid</span> [PK]</li>
                            <li>• qp_id: <span className="text-[#4A90D9]">uuid</span> [FK -&gt; question_papers.id]</li>
                            <li>• question_text: <span className="text-[#4A90D9]">text (LaTeX)</span></li>
                            <li>• question_type: <span className="text-[#4A90D9]">integer</span> (SCQ/MCQ/NAT)</li>
                            <li>• marks_correct / marks_incorrect: <span className="text-[#4A90D9]">integer</span></li>
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-emerald-500/30">
                          <div className="font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center justify-between">
                            <span>responses_history (Audit Trail)</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Audit Table</span>
                          </div>
                          <ul className="text-gray-600 dark:text-gray-400 space-y-1 font-mono text-[11px]">
                            <li>• id: <span className="text-[#4A90D9]">uuid</span> [PK]</li>
                            <li>• test_session_id: <span className="text-[#4A90D9]">uuid</span></li>
                            <li>• question_id: <span className="text-[#4A90D9]">uuid</span></li>
                            <li>• is_correct: <span className="text-[#4A90D9]">boolean (0|1)</span></li>
                            <li>• time_taken_seconds: <span className="text-[#4A90D9]">float</span></li>
                            <li>• selected_options: <span className="text-[#4A90D9]">json</span></li>
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c]">
                          <div className="font-bold text-[#6C5CE7] dark:text-[#a99cf5] mb-1 flex items-center justify-between">
                            <span>results &amp; tags</span>
                            <span className="text-[10px] text-gray-400">Analytics</span>
                          </div>
                          <ul className="text-gray-600 dark:text-gray-400 space-y-1 font-mono text-[11px]">
                            <li>• total_score: <span className="text-[#4A90D9]">float</span></li>
                            <li>• accuracy_percentage: <span className="text-[#4A90D9]">float</span></li>
                            <li>• tags_question: <span className="text-[#4A90D9]">hierarchical taxonomy</span></li>
                            <li>• weak_topic_flags: <span className="text-[#4A90D9]">json</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Tab>

                  {/* TAB 3: Anti-Cheating & Security */}
                  <Tab
                    key="security"
                    title={
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon size={18} />
                        <span>Anti-Cheating Proctoring</span>
                      </div>
                    }
                  >
                    <div className="space-y-3 py-2 text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                      <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c]">
                        <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                          Visibility &amp; Fullscreen Enforcement Hook
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          Tracks browser visibility state transitions and viewport containment during live test sessions:
                        </p>
                        <ul className="list-disc list-inside space-y-1 font-mono text-gray-700 dark:text-gray-300">
                          <li><span className="text-[#E8792B] font-semibold">document.addEventListener(&apos;visibilitychange&apos;)</span>: Fires immediately if student switches tabs or minimizes browser.</li>
                          <li><span className="text-[#E8792B] font-semibold">document.addEventListener(&apos;fullscreenchange&apos;)</span>: Fires if student exits fullscreen mode (e.g. via Escape or multi-monitor drag).</li>
                          <li><span className="text-[#6C5CE7] dark:text-[#a99cf5] font-semibold">3-Second Grace Interceptor</span>: Warns user with dynamic visual countdown before automatic sheet commit.</li>
                        </ul>
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>

              <ModalFooter>
                <Button className="bg-[#6C5CE7] text-white font-medium" onPress={onClose}>
                  Done
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </RecruiterContext.Provider>
  );
}

/**
 * Architecture badge shown over UI components when Recruiter Mode is ON.
 */
export function RecruiterBadge({
  service,
  tech,
  endpoint,
}: {
  service: string;
  tech: string;
  endpoint?: string;
}) {
  const { isRecruiterMode } = useRecruiter();
  if (!isRecruiterMode) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/20 text-[#6C5CE7] dark:text-[#a99cf5] border border-[#6C5CE7]/30 shadow-sm mb-2 transition-all">
      <SparkleIcon size={12} weight="fill" className="text-[#6C5CE7] animate-pulse" />
      <span className="font-semibold text-gray-800 dark:text-white">{service}</span>
      <span className="text-gray-400">•</span>
      <span className="text-[#4A90D9]">{tech}</span>
      {endpoint && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-emerald-600 dark:text-emerald-400">{endpoint}</span>
        </>
      )}
    </div>
  );
}
