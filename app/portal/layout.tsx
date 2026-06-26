import OmThemeProvider from "@/components/om/OmThemeProvider";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <OmThemeProvider>{children}</OmThemeProvider>;
}