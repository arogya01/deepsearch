"use client";

import { usePathname } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide header on chat routes
  const isChatRoute = pathname?.startsWith("/chat");

  return (
    <>
      {!isChatRoute && (
        <header className="flex justify-end items-center p-4 gap-4 h-16">
          <SignedOut>
            <SignInButton forceRedirectUrl="/chat" />
            <SignUpButton forceRedirectUrl="/chat">
              <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
      )}
      <main className={isChatRoute ? "h-screen" : "h-[calc(100vh-64px)]"}>
        {children}
      </main>
    </>
  );
}
