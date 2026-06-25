import type { Metadata } from "next";
import LoginClient from "@/components/d3/LoginClient";

export const metadata: Metadata = {
  title: "D³ Portal Login — Datafy Associate",
  description: "Sign in to the Datafy D³ digital dashboard for solar asset management.",
};

export default function LoginPage() {
  return <LoginClient />;
}
