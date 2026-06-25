"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOmSession, type User } from "@/lib/auth";
import { Loader2 } from "lucide-react";

/** Role-aware guard for the O&M portal. */
export default function OmAuthGuard({
  children,
  onUser,
}: {
  children: React.ReactNode;
  onUser: (u: User) => void;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getOmSession();
    if (!user) {
      router.replace("/portal/login");
      return;
    }
    onUser(user);
    setReady(true);
  }, [router, onUser]);

  if (!ready) {
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
