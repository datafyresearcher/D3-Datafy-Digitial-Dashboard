"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOmSession, type User } from "@/lib/auth";
import { supabase } from "@/lib/supabase/browser";
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
    let active = true;
    // Resolve once on mount, then react to sign-in/out events.
    const init = async () => {
      const user = await getOmSession();
      if (!active) return;
      if (!user) {
        router.replace("/portal/login");
        return;
      }
      onUser(user);
      setReady(true);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) return;
      const user = await getOmSession();
      if (!user) router.replace("/portal/login");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
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
