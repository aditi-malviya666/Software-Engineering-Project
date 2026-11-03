"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { RecruiterProvider } from "@/context/recruiter-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider locale="en-IN">
      <ToastProvider toastOffset={50} placement="top-center" />
      <RecruiterProvider>{children}</RecruiterProvider>
    </HeroUIProvider>
  );
}
