"use client";

import { useState } from "react";
import OmAuthGuard from "@/components/om/OmAuthGuard";
import OmPortalShell from "@/components/om/OmPortalShell";
import type { User } from "@/lib/auth";

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <OmAuthGuard onUser={setUser}>
      {user ? <OmPortalShell user={user} /> : null}
    </OmAuthGuard>
  );
}
