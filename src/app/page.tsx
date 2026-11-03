"use client";

import React from "react";
import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import {
  LightningIcon,
  AtomIcon,
  HeartbeatIcon,
  GraduationCapIcon,
  FileCodeIcon,
  ArrowRightIcon,
  SparkleIcon,
  DatabaseIcon,
  VideoCameraIcon,
  FileTextIcon,
  ChatCircleDotsIcon,
  MedalIcon,
  ChartLineUpIcon,
  ShieldCheckIcon,
  CpuIcon,
  BrainIcon,
} from "@phosphor-icons/react";
import { useRecruiter } from "@/context/recruiter-context";

export default function LandingPage() {
  const { openSchemaModal } = useRecruiter();

  return (
    <div className="min-h-screen bg-[#FBFBFE] dark:bg-[#15161E] text-[#2B283A] dark:text-[#F1EFF8] transition-colors flex flex-col">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Header (PW Style)                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#E8E6F0] dark:border-[#323447] bg-white/95 dark:bg-[#20212E]/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-[#6C5CE7]/20 group-hover:scale-105 transition-transform">
              <LightningIcon size={22} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-[#2B283A] dark:text-white">
                  TCAS <span className="text-[#6C5CE7]">CBT</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#271E3A] text-[#8B5CF6] border border-[#8B5CF6]/20">
                  NTA Engine
                </span>
              </div>
              <p className="text-[10px] text-[#6B677F] dark:text-[#9B98AE] hidden sm:block">Adaptive Testing &amp; ML Coach</p>
            </div>
          </Link>

          {/* Quick Nav Pills */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold text-[#6B677F] dark:text-[#9B98AE]">
            <Link href="/test-generator" className="px-3 py-1.5 rounded-full hover:bg-[#F2EFFF] dark:hover:bg-[#282447] hover:text-[#6C5CE7] transition-colors">
              All Exams
            </Link>
            <Link href="/analysis" className="px-3 py-1.5 rounded-full hover:bg-[#F2EFFF] dark:hover:bg-[#282447] hover:text-[#6C5CE7] transition-colors">
              AI Coach
            </Link>
            <Link href="/history" className="px-3 py-1.5 rounded-full hover:bg-[#F2EFFF] dark:hover:bg-[#282447] hover:text-[#6C5CE7] transition-colors">
              Past Papers
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="flat"
            className="text-xs font-semibold hidden sm:flex items-center gap-1.5 border border-[#E8E6F0] dark:border-[#323447] bg-white dark:bg-[#20212E] text-[#6B677F] dark:text-[#9B98AE] hover:text-[#6C5CE7]"
            onPress={openSchemaModal}
            startContent={<DatabaseIcon size={14} />}
          >
            System Architecture
          </Button>

          <Link href="/login">
            <Button
              size="sm"
              variant="bordered"
              className="text-xs font-semibold border-[#E8E6F0] dark:border-[#323447] text-[#2B283A] dark:text-white hover:border-[#6C5CE7]"
            >
              Login / Guest
            </Button>
          </Link>

          <Link href="/test-generator">
            <Button
              size="sm"
              className="text-xs font-bold bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-xl shadow-md shadow-[#6C5CE7]/25 px-4"
              endContent={<ArrowRightIcon size={14} />}
            >
              Generate Test
            </Button>
          </Link>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. Hero Section                                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5FF] dark:bg-[#271E3A] border border-[#8B5CF6]/30 text-[#8B5CF6] dark:text-[#C4B5FD] text-xs font-semibold">
            <SparkleIcon size={14} weight="fill" className="text-[#F97316] animate-pulse" />
            <span>NTA-Compliant Online CBT Platform with Real-Time Proctoring</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#2B283A] dark:text-white leading-tight">
            Crack Your Dream Exam with{" "}
            <span className="text-[#6C5CE7] underline decoration-[#F97316]/40 underline-offset-8">
              Personalized AI Tests
            </span>
          </h1>

          <p className="text-[#6B677F] dark:text-[#9B98AE] text-sm sm:text-base leading-relaxed">
            Practice JEE, NEET, GATE, and CUET under actual NTA high-stakes exam conditions. Get instantaneous scoring, latency breakdown, and LLaMA 3.2 AI coaching.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/test-generator">
              <Button
                size="lg"
                className="font-bold text-sm sm:text-base px-8 h-12 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-xl shadow-md shadow-[#6C5CE7]/30"
                endContent={<ArrowRightIcon size={16} />}
              >
                Start Free Mock Test
              </Button>
            </Link>
            <Link href="/home">
              <Button
                size="lg"
                variant="bordered"
                className="font-semibold text-sm sm:text-base px-6 h-12 border-[#E8E6F0] dark:border-[#323447] text-[#2B283A] dark:text-white bg-white dark:bg-[#20212E] hover:border-[#6C5CE7]"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. PW Trust / Stat Banner (Exact match to screenshot)         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E8E6F0] dark:divide-[#323447]">
            {/* Item 1: Live Classes */}
            <div className="flex flex-col items-center text-center px-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] dark:bg-[#331A24] text-[#F43F5E] dark:text-[#FB7185] flex items-center justify-center mb-3 shadow-xs">
                <VideoCameraIcon size={24} weight="duotone" />
              </div>
              <span className="text-xs font-bold text-[#F43F5E] dark:text-[#FB7185] uppercase tracking-wider mb-0.5">
                Daily Live
              </span>
              <p className="text-xs font-semibold text-[#6B677F] dark:text-[#9B98AE]">
                Interactive practice &amp; mocks
              </p>
            </div>

            {/* Item 2: 10 Million+ Tests */}
            <div className="flex flex-col items-center text-center px-4 py-2 pt-4 md:pt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] dark:bg-[#182438] text-[#3B82F6] dark:text-[#60A5FA] flex items-center justify-center mb-3 shadow-xs">
                <FileTextIcon size={24} weight="duotone" />
              </div>
              <span className="text-sm font-extrabold text-[#2B283A] dark:text-white mb-0.5">
                10 Million +
              </span>
              <p className="text-xs font-semibold text-[#6B677F] dark:text-[#9B98AE]">
                Tests, sample papers &amp; notes
              </p>
            </div>

            {/* Item 3: 24x7 AI Doubt Sessions */}
            <div className="flex flex-col items-center text-center px-4 py-2 pt-4 md:pt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5FF] dark:bg-[#271E3A] text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center mb-3 shadow-xs">
                <ChatCircleDotsIcon size={24} weight="duotone" />
              </div>
              <span className="text-sm font-extrabold text-[#2B283A] dark:text-white mb-0.5">
                24 x 7
              </span>
              <p className="text-xs font-semibold text-[#6B677F] dark:text-[#9B98AE]">
                AI Doubt &amp; Coaching sessions
              </p>
            </div>

            {/* Item 4: 100+ Centers */}
            <div className="flex flex-col items-center text-center px-4 py-2 pt-4 md:pt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] dark:bg-[#332B16] text-[#F59E0B] dark:text-[#FBBF24] flex items-center justify-center mb-3 shadow-xs">
                <MedalIcon size={24} weight="duotone" />
              </div>
              <span className="text-sm font-extrabold text-[#2B283A] dark:text-white mb-0.5">
                100 +
              </span>
              <p className="text-xs font-semibold text-[#6B677F] dark:text-[#9B98AE]">
                NTA &amp; Online exam centres
              </p>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 4. PW Signature "Exam Categories" Section                     */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B283A] dark:text-white tracking-tight">
              Exam Categories
            </h2>
            <p className="text-xs sm:text-sm text-[#6B677F] dark:text-[#9B98AE]">
              TCAS CBT is preparing students for 35+ exam categories. Select your goal to launch the adaptive generator:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CARD 1: NEET (UG) */}
            <Link
              href="/test-generator"
              className="group p-5 rounded-3xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-sm hover:shadow-md hover:border-[#F43F5E]/40 dark:hover:border-[#F43F5E]/40 transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#2B283A] dark:text-white mb-2 group-hover:text-[#F43F5E] transition-colors">
                    NEET
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Class 11
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Class 12
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Dropper
                    </span>
                  </div>
                </div>

                {/* Pastel Peach Illustration Blob */}
                <div className="w-16 h-16 rounded-full bg-[#FFF1F2] dark:bg-[#331A24] text-[#F43F5E] dark:text-[#FB7185] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                  <HeartbeatIcon size={32} weight="duotone" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E6F0]/60 dark:border-[#323447]/60 flex items-center justify-between text-xs font-bold text-[#F43F5E] dark:text-[#FB7185]">
                <span>Explore Category</span>
                <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* CARD 2: IIT JEE */}
            <Link
              href="/test-generator"
              className="group p-5 rounded-3xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-sm hover:shadow-md hover:border-[#F59E0B]/40 dark:hover:border-[#F59E0B]/40 transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#2B283A] dark:text-white mb-2 group-hover:text-[#F59E0B] transition-colors">
                    IIT JEE
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Class 11
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Class 12
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Dropper
                    </span>
                  </div>
                </div>

                {/* Pastel Amber Illustration Blob */}
                <div className="w-16 h-16 rounded-full bg-[#FFFBEB] dark:bg-[#332B16] text-[#F59E0B] dark:text-[#FBBF24] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                  <AtomIcon size={32} weight="duotone" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E6F0]/60 dark:border-[#323447]/60 flex items-center justify-between text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24]">
                <span>Explore Category</span>
                <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* CARD 3: GATE */}
            <Link
              href="/test-generator"
              className="group p-5 rounded-3xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-sm hover:shadow-md hover:border-[#3B82F6]/40 dark:hover:border-[#3B82F6]/40 transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#2B283A] dark:text-white mb-2 group-hover:text-[#3B82F6] transition-colors">
                    GATE
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      CS &amp; IT
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Engineering
                    </span>
                  </div>
                </div>

                {/* Pastel Blue Illustration Blob */}
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] dark:bg-[#182438] text-[#3B82F6] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                  <FileCodeIcon size={32} weight="duotone" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E6F0]/60 dark:border-[#323447]/60 flex items-center justify-between text-xs font-bold text-[#3B82F6] dark:text-[#60A5FA]">
                <span>Explore Category</span>
                <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* CARD 4: CUET */}
            <Link
              href="/test-generator"
              className="group p-5 rounded-3xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-sm hover:shadow-md hover:border-[#8B5CF6]/40 dark:hover:border-[#8B5CF6]/40 transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#2B283A] dark:text-white mb-2 group-hover:text-[#8B5CF6] transition-colors">
                    CUET (UG)
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      Domain Tests
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7FD] dark:bg-[#292A3C] text-[#6B677F] dark:text-[#9B98AE] border border-[#E8E6F0] dark:border-[#323447]">
                      General Aptitude
                    </span>
                  </div>
                </div>

                {/* Pastel Purple Illustration Blob */}
                <div className="w-16 h-16 rounded-full bg-[#FAF5FF] dark:bg-[#271E3A] text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                  <GraduationCapIcon size={32} weight="duotone" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E6F0]/60 dark:border-[#323447]/60 flex items-center justify-between text-xs font-bold text-[#8B5CF6] dark:text-[#A78BFA]">
                <span>Explore Category</span>
                <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 5. Core Platform Features Grid                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="space-y-6 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B283A] dark:text-white tracking-tight">
              Built for Candidate Success
            </h2>
            <p className="text-xs sm:text-sm text-[#6B677F] dark:text-[#9B98AE]">
              Every module is designed to simulate authentic competitive exam environments:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] dark:bg-[#331A24] text-[#F43F5E] flex items-center justify-center mb-3">
                <LightningIcon size={20} weight="duotone" />
              </div>
              <h4 className="font-bold text-sm text-[#2B283A] dark:text-white mb-1">Adaptive Test Generator</h4>
              <p className="text-xs text-[#6B677F] dark:text-[#9B98AE] leading-relaxed">
                Choose between topic drills, subject tests, or full curriculum mocks with instant LaTeX KaTeX equations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] dark:bg-[#332219] text-[#F97316] flex items-center justify-center mb-3">
                <ShieldCheckIcon size={20} weight="duotone" />
              </div>
              <h4 className="font-bold text-sm text-[#2B283A] dark:text-white mb-1">Live AI Proctoring</h4>
              <p className="text-xs text-[#6B677F] dark:text-[#9B98AE] leading-relaxed">
                Automatic fullscreen lock and 3-second grace warning to prevent tab switching and unauthorized exits.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-[#182438] text-[#3B82F6] flex items-center justify-center mb-3">
                <CpuIcon size={20} weight="duotone" />
              </div>
              <h4 className="font-bold text-sm text-[#2B283A] dark:text-white mb-1">Random Forest ML</h4>
              <p className="text-xs text-[#6B677F] dark:text-[#9B98AE] leading-relaxed">
                Evaluates response latency and accuracy patterns to classify proficiency into Needs Improvement, Stable, or Excellent.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] dark:bg-[#271E3A] text-[#8B5CF6] flex items-center justify-center mb-3">
                <BrainIcon size={20} weight="duotone" />
              </div>
              <h4 className="font-bold text-sm text-[#2B283A] dark:text-white mb-1">LLaMA 3.2 AI Coach</h4>
              <p className="text-xs text-[#6B677F] dark:text-[#9B98AE] leading-relaxed">
                Generates actionable study plans and highlights weak chapters directly from your past responses history.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. Footer                                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E8E6F0] dark:border-[#323447] py-6 text-center text-xs text-[#6B677F] dark:text-[#9B98AE]">
        TCAS Engine • Physics Wallah-Inspired Student CBT Experience • Next.js 16 + PostgreSQL + FastAPI
      </footer>
    </div>
  );
}
