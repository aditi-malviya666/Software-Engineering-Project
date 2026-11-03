"use client";

import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { Button, Form, Input, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOGGEDUSER_REDIRECT } from "../../../../routes";
import { loginSchema } from "@/lib/zod/login";
import z from "zod";
import { useState } from "react";
import {
  EyeClosedIcon,
  EyeIcon,
  LightningIcon,
  SparkleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import Link from "next/link";

const LoginPage = () => {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn: SubmitHandler<z.infer<typeof loginSchema>> = async (data) => {
    await authClient.signIn
      .email({
        email: data.email,
        password: data.password,
        callbackURL: "/home",
      })
      .then((e) => {
        if (e.error) {
          setError(e.error.message ?? "Error encountered");
        } else {
          router.push(DEFAULT_LOGGEDUSER_REDIRECT);
        }
      })
      .catch((e) => {
        setError(String(e));
      });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#F8F7FC] dark:bg-[#1C1F33] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Left Feature Hero — warm purple gradient */}
      <div className="bg-gradient-to-br from-[#6C5CE7] via-[#7B6FEE] to-[#4A90D9] dark:from-[#3D2F99] dark:via-[#352A80] dark:to-[#1C1F33] p-8 md:p-14 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E5E1EE] dark:border-slate-700/60 relative overflow-hidden">
        {/* Soft decorative circle */}
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

        <div className="py-12 z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium">
            <SparkleIcon
              size={12}
              weight="fill"
              className="text-[#FFD93D] animate-pulse"
            />
            <span>AI Adaptive Testing &amp; Qualitative Analytics</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Practice smarter. <br />
            <span className="text-white/90">Perform with precision.</span>
          </h1>
          <p className="text-sm text-white/70 max-w-md leading-relaxed">
            High-fidelity Computer Based Tests for JEE, NEET, GATE, and CUET.
            Live browser visibility proctoring combined with Random Forest ML
            diagnostics.
          </p>
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

      {/* Right Login Form */}
      <div className="flex items-center justify-center p-8 sm:p-12 bg-white dark:bg-[#262A42] relative">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
              Sign In to TCAS
            </h2>
            <p className="text-sm text-[#6E6B7B] dark:text-slate-400">
              Access your test simulations and historical performance data
            </p>
          </div>

          <Form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSignIn)}
          >
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label="Email Address"
                  type="email"
                  variant="bordered"
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

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  label="Password"
                  type={isPasswordVisible ? "text" : "password"}
                  variant="bordered"
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

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                {error}
              </p>
            )}

            <Button
              isLoading={isSubmitting}
              type="submit"
              className="bg-[#6C5CE7] text-white font-bold text-sm py-3 shadow-md shadow-[#6C5CE7]/20 hover:shadow-lg hover:shadow-[#6C5CE7]/30 transition-shadow"
            >
              Sign In
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
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-[#6C5CE7] dark:text-[#a99cf5] font-semibold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
