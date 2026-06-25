import type { Metadata } from "next";
import OmLoginClient from "@/components/om/OmLoginClient";

export const metadata: Metadata = {
  title: "Solar O&M Portal Login — Datafy Associate",
  description: "Sign in to the Datafy Solar Operations & Maintenance portal.",
};

export default function PortalLoginPage() {
  return <OmLoginClient />;
}
