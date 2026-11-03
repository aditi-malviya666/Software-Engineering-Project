"use client";

import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { Button, Form, Input, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOGGEDUSER_REDIRECT } from "../../../../routes";
import { signupSchema } from "@/lib/zod/signup";
import z from "zod";
import { useState } from "react";
import {
  EyeClosedIcon,
  EyeIcon,
  LightningIcon,
  SparkleIcon,
  ArrowRightIcon,
  UserIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";

const SignupPage = () => {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof signupSchema>>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignUp: SubmitHandler<z.infer<typeof signupSchema>> = async (data) => {
    setError(null);

    if (!data.name || data.name.trim().length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
    if (!data.email || !data.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!data.password || data.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      const res = await authClient.signUp.email({
        email: data.email.trim(),
        password: data.password,
        name: data.name.trim(),
        callbackURL: "/home",
      });

      if (res?.error) {
        setError(res.error.message || "Failed to create account. User may already exist.");
      } else {
        router.push(DEFAULT_LOGGEDUSER_REDIRECT);
      }
    } catch (e: any) {
      setError(e?.message || "An unexpected error occurred during signup.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#F8F7FC] dark:bg-[#1C1F33] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Left Feature Hero — warm purple gradient */}
      <div className="bg-gradient-to-br from-[#6C5CE7] via-[#7B6FEE] to-[#4A90D9] dark:from-[#3D2F99] dark:via-[#352A80] dark:to-[#1C1F33] p-8 md:p-14 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E5E1EE] dark:border-slate-700/60 relative overflow-hidden">
        {/* Soft decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E8792B]/15 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="flex items-center gap-2.5 z-10">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shadow-md">
            <LightningIcon size={18} weight="fill" />
          </div>
          <span className="text-base font-extrabold text-white tracking-tight">
            TCAS CBT Engine
          </span>
          <Chip
            size="sm"
            variant="flat"
            className="font-mono text-[10px] bg-white/15 text-white/90"
          >
            v2.0
          </Chip>
        </div>

        <div className="py-10 z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium">
            <SparkleIcon
              size={12}
              weight="fill"
              className="text-[#FFD93D] animate-pulse"
            />
            <span>Create Your Student Account</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Start testing. <br />
            <span className="text-white/90">Master every concept.</span>
          </h1>
          <p className="text-sm text-white/80 max-w-md leading-relaxed">
            Personalized computer-based exams with real-time NTA CBT interface,
            proctoring integrity audits, and Random Forest weakness diagnostics.
          </p>

          <div className="space-y-2 pt-2 text-xs text-white/90">
            <div className="flex items-center gap-2">
              <CheckCircleIcon size={16} weight="fill" className="text-[#FFD93D]" />
              <span>Full authentic NTA question palette with mathematical KaTeX formulas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon size={16} weight="fill" className="text-[#FFD93D]" />
              <span>Model 2 qualitative coaching powered by Scikit-Learn &amp; LLaMA 3.2</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon size={16} weight="fill" className="text-[#FFD93D]" />
              <span>Persistent audit trail of scores, speeds, and topic mastery</span>
            </div>
          </div>
        </div>

        {/* Exam badges */}
        <div className="grid grid-cols-3 gap-3 z-10 pt-4 border-t border-white/20">
          {[
            { name: "JEE", sub: "Main & Advanced" },
            { name: "NEET", sub: "UG Medical" },
            { name: "GATE", sub: "CS & IT" },
          ].map((ex) => (
            <div key={ex.name} className="flex flex-col">
              <span className="font-bold text-white text-sm">{ex.name}</span>
              <span className="text-[11px] text-white/60">{ex.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Signup Form */}
      <div className="flex items-center justify-center p-8 sm:p-12 bg-white dark:bg-[#262A42] relative">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
              Create an Account
            </h2>
            <p className="text-sm text-[#6E6B7B] dark:text-slate-400">
              Register now to start practicing and tracking your exam progress
            </p>
          </div>

          <Form
            className="flex flex-col gap-3.5"
            onSubmit={handleSubmit(onSignUp)}
          >
            {/* Name Input */}
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  label="Full Name"
                  placeholder="e.g. Aditi Malviya"
                  variant="bordered"
                  isRequired
                  startContent={<UserIcon size={16} className="text-gray-400" />}
                  classNames={{
                    inputWrapper:
                      "border-[#E5E1EE] dark:border-slate-600 bg-[#F8F7FC] dark:bg-[#1C1F33] focus-within:border-[#6C5CE7]",
                    label:
                      "text-[#6E6B7B] dark:text-slate-400 text-xs",
                    input:
                      "text-slate-900 dark:text-white text-sm",
                  }}
                  {...field}
                />
              )}
            />

            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label="Email Address"
                  placeholder="name@example.com"
                  type="email"
                  variant="bordered"
                  isRequired
                  classNames={{
                    inputWrapper:
                      "border-[#E5E1EE] dark:border-slate-600 bg-[#F8F7FC] dark:bg-[#1C1F33] focus-within:border-[#6C5CE7]",
                    label:
                      "text-[#6E6B7B] dark:text-slate-400 text-xs",
                    input:
                      "text-slate-900 dark:text-white text-sm",
                  }}
                  {...field}
                />
              )}
            />

            {/* Password Input */}
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  label="Password"
                  placeholder="Min. 6 characters"
                  type={isPasswordVisible ? "text" : "password"}
                  variant="bordered"
                  isRequired
                  classNames={{
                    inputWrapper:
                      "border-[#E5E1EE] dark:border-slate-600 bg-[#F8F7FC] dark:bg-[#1C1F33] focus-within:border-[#6C5CE7]",
                    label:
                      "text-[#6E6B7B] dark:text-slate-400 text-xs",
                    input:
                      "text-slate-900 dark:text-white text-sm",
                  }}
                  endContent={
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-[#6E6B7B] dark:text-slate-400"
                      onPress={() => setIsPasswordVisible((e) => !e)}
                    >
                      {isPasswordVisible ? (
                        <EyeIcon size={16} />
                      ) : (
                        <EyeClosedIcon size={16} />
                      )}
                    </Button>
                  }
                  {...field}
                />
              )}
            />

            {/* Confirm Password Input */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  type={isConfirmVisible ? "text" : "password"}
                  variant="bordered"
                  isRequired
                  classNames={{
                    inputWrapper:
                      "border-[#E5E1EE] dark:border-slate-600 bg-[#F8F7FC] dark:bg-[#1C1F33] focus-within:border-[#6C5CE7]",
                    label:
                      "text-[#6E6B7B] dark:text-slate-400 text-xs",
                    input:
                      "text-slate-900 dark:text-white text-sm",
                  }}
                  endContent={
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-[#6E6B7B] dark:text-slate-400"
                      onPress={() => setIsConfirmVisible((e) => !e)}
                    >
                      {isConfirmVisible ? (
                        <EyeIcon size={16} />
                      ) : (
                        <EyeClosedIcon size={16} />
                      )}
                    </Button>
                  }
                  {...field}
                />
              )}
            />

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            <Button
              isLoading={isSubmitting}
              type="submit"
              className="bg-[#6C5CE7] text-white font-bold text-sm py-3 mt-1 shadow-md shadow-[#6C5CE7]/20 hover:shadow-lg hover:shadow-[#6C5CE7]/30 transition-shadow"
            >
              Create Account
            </Button>
          </Form>

          {/* Quick Demo Bypass */}
          <div className="pt-4 border-t border-[#E5E1EE] dark:border-slate-700/60 space-y-3">
            <Link href="/home" className="block">
              <Button
                variant="flat"
                className="w-full bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-slate-600 text-[#6C5CE7] dark:text-[#a99cf5] font-medium text-xs flex items-center justify-center gap-2 hover:bg-[#6C5CE7]/5 dark:hover:bg-[#6C5CE7]/10 transition-colors"
                endContent={<ArrowRightIcon size={14} />}
              >
                <span>⚡ Explore as Demo Guest</span>
              </Button>
            </Link>

            <p className="text-xs text-[#6E6B7B] dark:text-slate-400 text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#6C5CE7] dark:text-[#a99cf5] font-semibold hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
