import type { Metadata } from "next";
import OmLoginClient from "@/components/om/OmLoginClient";

export const metadata: Metadata = {
  title: "GridSentinel Login",
  description: "Sign in to the GridSentinel solar operations and maintenance portal.",
};

export default function PortalLoginPage() {
  return <OmLoginClient />;
}
