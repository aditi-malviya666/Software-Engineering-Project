"use client";

import React from "react";
import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import {
  LightningIcon,
  BrainIcon,
  ChartLineUpIcon,
  ClockCounterClockwiseIcon,
  ArrowRightIcon,
  SparkleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CpuIcon,
  DatabaseIcon,
  TargetIcon,
  AtomIcon,
  HeartbeatIcon,
  FileCodeIcon,
  GraduationCapIcon,
} from "@phosphor-icons/react";
import { RecruiterBadge, useRecruiter } from "@/context/recruiter-context";

export default function HomePage() {
  const { openSchemaModal } = useRecruiter();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E5E1EE] dark:border-[#3a3f5c] pb-6">
        <div>
          <RecruiterBadge
            service="Dashboard Telemetry"
            tech="Next.js 16 + Better-Auth + Drizzle ORM"
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
            Welcome Back! 👋
            <Chip size="sm" className="bg-[#6C5CE7]/10 text-[#6C5CE7] dark:bg-[#6C5CE7]/20 dark:text-[#a99cf5] font-semibold">
              Active
            </Chip>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ready for your next practice session? Pick up where you left off or start a fresh test.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/test-generator">
            <Button
              size="sm"
              className="bg-[#6C5CE7] hover:bg-[#5A4BD6] text-white font-semibold text-xs shadow-md shadow-[#6C5CE7]/20"
              endContent={<LightningIcon size={14} weight="fill" />}
            >
              New Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tests Completed */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-[#6C5CE7]/15 text-[#6C5CE7] flex-shrink-0">
            <CheckCircleIcon size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tests Completed</span>
            <div className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">14</div>
            <span className="text-xs text-green-600 dark:text-green-400 mt-0.5 block">
              +3 this week
            </span>
          </div>
        </div>

        {/* Avg. Accuracy */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400 flex-shrink-0">
            <TargetIcon size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg. Accuracy</span>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5">82.5%</div>
            <span className="text-xs text-green-600 dark:text-green-400 mt-0.5 block">
              +4.2% improvement
            </span>
          </div>
        </div>

        {/* Proficiency */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-[#E8792B]/15 text-[#E8792B] flex-shrink-0">
            <BrainIcon size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Proficiency</span>
            <div className="text-2xl font-bold text-[#E8792B] mt-0.5">Excellent</div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
              94.2% confidence score
            </span>
          </div>
        </div>

        {/* Proctoring */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-[#4A90D9]/15 text-[#4A90D9] flex-shrink-0">
            <ShieldCheckIcon size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Proctoring</span>
            <div className="text-2xl font-bold text-[#4A90D9] mt-0.5">0 Flags</div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
              Full compliance ✓
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Launch Exams (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
              <LightningIcon size={20} className="text-[#E8792B]" weight="fill" />
              Quick Start Exam
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choose an exam preset to instantly start practicing with AI-generated questions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: "JEE",
                name: "IIT JEE",
                badge: "Engineering",
                questions: 5,
                time: "12m",
                blobBg: "bg-[#FFFBEB] dark:bg-[#332B16]",
                iconColor: "text-[#F59E0B] dark:text-[#FBBF24]",
                icon: <AtomIcon size={24} weight="duotone" />,
                tags: ["Class 11", "Class 12", "Dropper"],
              },
              {
                id: "NEET",
                name: "NEET",
                badge: "Medical",
                questions: 5,
                time: "10m",
                blobBg: "bg-[#FFF1F2] dark:bg-[#331A24]",
                iconColor: "text-[#F43F5E] dark:text-[#FB7185]",
                icon: <HeartbeatIcon size={24} weight="duotone" />,
                tags: ["Class 11", "Class 12", "Dropper"],
              },
              {
                id: "GATE",
                name: "GATE",
                badge: "CS & Engg",
                questions: 5,
                time: "15m",
                blobBg: "bg-[#EFF6FF] dark:bg-[#182438]",
                iconColor: "text-[#3B82F6] dark:text-[#60A5FA]",
                icon: <FileCodeIcon size={24} weight="duotone" />,
                tags: ["CS & IT", "Engineering"],
              },
              {
                id: "CUET",
                name: "CUET (UG)",
                badge: "University",
                questions: 5,
                time: "8m",
                blobBg: "bg-[#FAF5FF] dark:bg-[#271E3A]",
                iconColor: "text-[#8B5CF6] dark:text-[#A78BFA]",
                icon: <GraduationCapIcon size={24} weight="duotone" />,
                tags: ["Domain Tests", "General Aptitude"],
              },
            ].map((preset) => (
              <div
                key={preset.name}
                className="p-4 rounded-2xl bg-[#FBFBFE] dark:bg-[#1E1F2B] border border-[#E8E6F0] dark:border-[#323447] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-base text-[#2B283A] dark:text-white">
                          {preset.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[#6B677F] dark:text-[#9B98AE]">
                          {preset.badge}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {preset.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`w-11 h-11 rounded-xl ${preset.blobBg} ${preset.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      {preset.icon}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E8E6F0] dark:border-[#323447] flex items-center justify-between">
                  <span className="text-xs text-[#6B677F] dark:text-[#9B98AE]">
                    {preset.questions} Qs • ~{preset.time}
                  </span>
                  <Link href="/test-generator">
                    <Button
                      size="sm"
                      className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-xl shadow-xs"
                    >
                      Start Mock
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#6C5CE7]/5 dark:bg-[#6C5CE7]/10 border border-[#6C5CE7]/15 dark:border-[#6C5CE7]/25 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-gray-800 dark:text-white block">Want a custom topic or full-length paper?</span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">Use the step-by-step wizard with difficulty controls.</span>
            </div>
            <Link href="/test-generator">
              <Button size="sm" variant="bordered" className="border-[#6C5CE7]/40 text-[#6C5CE7] dark:text-[#a99cf5] text-xs font-semibold">
                Open Wizard →
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: AI Coach & Recent History (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Coach Card */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-[#6C5CE7]/15 text-[#6C5CE7]">
                  <BrainIcon size={22} weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-white">AI Study Coach</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Personalized insights</p>
                </div>
              </div>
              <Link href="/analysis">
                <Button size="sm" variant="light" className="text-[#6C5CE7] dark:text-[#a99cf5] text-xs font-semibold">
                  View All →
                </Button>
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c]">
              <div className="flex items-start gap-2">
                <SparkleIcon size={16} className="text-[#E8792B] mt-0.5 flex-shrink-0" weight="fill" />
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Strong mastery in <strong className="text-gray-800 dark:text-white">Kinematics (92%)</strong>. Focus on <strong className="text-gray-800 dark:text-white">Electrostatics</strong> — try boundary value integrals before your next session.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Weekly Target Progress</span>
                <span className="text-[#6C5CE7] dark:text-[#a99cf5] font-semibold">85% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E5E1EE] dark:bg-[#3a3f5c] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#4A90D9] rounded-full w-[85%]" />
              </div>
            </div>
          </div>

          {/* Recent History Mini-List */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockCounterClockwiseIcon size={18} className="text-[#4A90D9]" />
                <h3 className="font-bold text-sm text-gray-800 dark:text-white">Recent Attempts</h3>
              </div>
              <Link href="/history" className="text-xs text-[#6C5CE7] dark:text-[#a99cf5] hover:underline font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { exam: "JEE Advanced", topic: "Thermodynamics", score: "16 / 20", date: "Today, 10:15 AM", status: "80%" },
                { exam: "NEET Simulation", topic: "Cell Biology", score: "18 / 20", date: "Yesterday", status: "90%" },
                { exam: "GATE CS", topic: "Algorithms & DS", score: "4.33 / 5", date: "2 days ago", status: "86%" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-white block">{item.exam}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{item.topic} • {item.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-800 dark:text-white block">{item.score}</span>
                    <span
                      className={`text-[10px] font-semibold inline-block px-1.5 py-0.5 rounded-full ${
                        parseFloat(item.status) >= 85
                          ? "bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-[#E8792B]/10 text-[#E8792B] dark:bg-[#E8792B]/20 dark:text-[#f0a06a]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
