"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, type User } from "@/lib/auth";
import { Loader2 } from "lucide-react";

/**
 * Client-side guard for the portal. Redirects to /d3/login when no
 * session is present, otherwise renders children with the resolved user.
 */
export default function AuthGuard({
  children,
  onUser,
}: {
  children: React.ReactNode;
  onUser?: (u: User) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const user = getSession();
    if (!user) {
      router.replace("/d3/login");
      return;
    }
    onUser?.(user);
    setStatus("ready");
  }, [router, onUser]);

  if (status !== "ready") {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
          <span className="text-white/60 text-sm">Loading portal…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
