import React, { Suspense } from "react";
import MainHeader from "./_components/main-header";
import MainSidebar from "./_components/main-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    // Graceful fallback for offline PostgreSQL / local evaluation mode
    console.warn("DB session lookup bypassed for offline/guest mode:", err);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBFBFE] dark:bg-[#15161E] text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-semibold">Loading TCAS Workspace...</div>}>
      <section className="flex flex-col h-screen bg-[#FBFBFE] dark:bg-[#15161E] text-[#2B283A] dark:text-[#F1EFF8] overflow-hidden">
        <MainHeader />
        <section className="flex-1 overflow-hidden flex flex-col-reverse md:flex-row w-full h-full">
          <MainSidebar />
          <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#FBFBFE] dark:bg-[#15161E]">
            {children}
          </main>
        </section>
      </section>
    </Suspense>
  );
};

export default MainLayout;
