"use client";

import { useState } from "react";
import AuthGuard from "@/components/d3/AuthGuard";
import PortalShell from "@/components/d3/PortalShell";
import type { User } from "@/lib/auth";

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthGuard onUser={setUser}>
      {user ? <PortalShell user={user} /> : null}
    </AuthGuard>
  );
}
