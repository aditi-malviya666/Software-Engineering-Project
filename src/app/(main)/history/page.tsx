"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import {
  ClockCounterClockwiseIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  DatabaseIcon,
  CalendarBlankIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import { RecruiterBadge, useRecruiter } from "@/context/recruiter-context";

interface HistoryRecord {
  id: string;
  exam: string;
  scope: string;
  date: string;
  score: number;
  maxMarks: number;
  accuracy: number;
  timeSpent: string;
  status: "Clean" | "Flagged";
}

const PAST_RECORDS: HistoryRecord[] = [
  {
    id: "TS-2026-005",
    exam: "JEE (Main)",
    scope: "Kinematics & Dynamics",
    date: "Nov 3, 2026 • 10:15 AM",
    score: 16,
    maxMarks: 20,
    accuracy: 92,
    timeSpent: "7m 32s",
    status: "Clean",
  },
  {
    id: "TS-2026-004",
    exam: "NEET (UG)",
    scope: "Thermodynamics",
    date: "Nov 2, 2026 • 04:45 PM",
    score: 18,
    maxMarks: 20,
    accuracy: 88,
    timeSpent: "8m 10s",
    status: "Clean",
  },
  {
    id: "TS-2026-003",
    exam: "GATE (CS)",
    scope: "Calculus & Integration",
    date: "Oct 30, 2026 • 02:20 PM",
    score: 4.0,
    maxMarks: 5.0,
    accuracy: 78,
    timeSpent: "11m 45s",
    status: "Clean",
  },
  {
    id: "TS-2026-002",
    exam: "JEE (Advanced)",
    scope: "Electrostatics",
    date: "Oct 28, 2026 • 11:00 AM",
    score: 7,
    maxMarks: 20,
    accuracy: 44,
    timeSpent: "14m 05s",
    status: "Clean",
  },
  {
    id: "TS-2026-001",
    exam: "CUET (UG)",
    scope: "Organic Chemistry",
    date: "Oct 25, 2026 • 09:30 AM",
    score: 21,
    maxMarks: 25,
    accuracy: 85,
    timeSpent: "6m 18s",
    status: "Clean",
  },
];

export default function HistoryPage() {
  const { openSchemaModal } = useRecruiter();
  const [filter, setFilter] = useState<string>("ALL");
  const [records, setRecords] = useState<HistoryRecord[]>(PAST_RECORDS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tcas_past_sessions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords([...parsed, ...PAST_RECORDS]);
        }
      }
    } catch (e) {
      console.warn("Could not load stored history", e);
    }
  }, []);

  const filteredRecords = records.filter((r) => {
    if (filter === "ALL") return true;
    return r.exam.toUpperCase().includes(filter);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1EE] dark:border-[#3a3f5c] pb-4">
        <div>
          <RecruiterBadge
            service="Session Audit Logs"
            tech="PostgreSQL 16 via Drizzle ORM (testSession & responsesHistory)"
            endpoint="SELECT * FROM responses_history"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
            Test History
            <Chip size="sm" className="bg-[#6C5CE7]/10 text-[#6C5CE7] dark:bg-[#6C5CE7]/20 dark:text-[#a99cf5] font-semibold">
              {PAST_RECORDS.length} Sessions
            </Chip>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review your past test sessions, scores, and detailed performance breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/test-generator">
            <Button size="sm" className="bg-[#6C5CE7] hover:bg-[#5A4BD6] text-white font-semibold text-xs shadow-sm">
              New Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "JEE", "NEET", "GATE", "CUET"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === tab
                ? "bg-[#6C5CE7] text-white shadow-sm"
                : "bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-500 dark:text-gray-400 hover:text-[#6C5CE7] dark:hover:text-[#a99cf5] hover:border-[#6C5CE7]/30"
            }`}
          >
            {tab === "ALL" ? "All Exams" : `${tab} Papers`}
          </button>
        ))}
      </div>

      {/* History Table Card */}
      <div className="rounded-xl bg-white dark:bg-[#262A42] shadow-sm border border-[#E5E1EE] dark:border-[#3a3f5c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7FC] dark:bg-[#1C1F33] border-b border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Exam / ID</th>
                <th className="py-3.5 px-4">Topic</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Accuracy</th>
                <th className="py-3.5 px-4">Time Spent</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1EE] dark:divide-[#3a3f5c] text-gray-600 dark:text-gray-300">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#F8F7FC] dark:hover:bg-[#1C1F33]/60 transition-colors">
                  <td className="py-4 px-4">
                    <span className="block font-semibold text-gray-800 dark:text-white">{rec.exam}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{rec.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{rec.scope}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400 text-[11px]">
                    {rec.date}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-gray-800 dark:text-white">{rec.score}</span>
                    <span className="text-gray-400 dark:text-gray-500"> / {rec.maxMarks}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.accuracy >= 75
                          ? "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                          : rec.accuracy >= 50
                          ? "bg-[#E8792B]/10 text-[#E8792B] dark:bg-[#E8792B]/20 dark:text-[#f0a06a]"
                          : "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                      }`}
                    >
                      {rec.accuracy}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#4A90D9]">
                    {rec.timeSpent}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-medium">
                      <ShieldCheckIcon size={14} weight="fill" />
                      Clean
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link href="/analysis">
                      <Button
                        size="sm"
                        variant="flat"
                        className="text-[11px] text-[#6C5CE7] dark:text-[#a99cf5] bg-[#6C5CE7]/5 dark:bg-[#6C5CE7]/10 border border-[#6C5CE7]/15 dark:border-[#6C5CE7]/25 font-semibold"
                        endContent={<ArrowRightIcon size={12} />}
                      >
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#F8F7FC] dark:bg-[#1C1F33] border-t border-[#E5E1EE] dark:border-[#3a3f5c] text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Showing {filteredRecords.length} of {PAST_RECORDS.length} sessions</span>
          <span className="text-[#6C5CE7] dark:text-[#a99cf5] font-medium">All records synced ✓</span>
        </div>
      </div>
    </div>
  );
}
