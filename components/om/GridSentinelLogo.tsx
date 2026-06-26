import Image from "next/image";

type GridSentinelLogoProps = {
  variant?: "sidebar" | "sidebar-collapsed" | "login" | "header";
  className?: string;
};

const LOGO_SRC = "/gridsentinel-logo.png";

export default function GridSentinelLogo({
  variant = "sidebar",
  className = "",
}: GridSentinelLogoProps) {
  if (variant === "sidebar-collapsed") {
    return (
      <div
        className={`relative h-11 w-11 overflow-hidden rounded-xl om-bg ring-1 ring-amber-400/25 shadow-lg shadow-amber-500/10 ${className}`}
        title="GridSentinel"
      >
        <Image
          src={LOGO_SRC}
          alt="GridSentinel"
          width={88}
          height={88}
          className="absolute left-1/2 top-0 h-[5.5rem] w-[5.5rem] -translate-x-1/2 object-cover object-top"
          priority
        />
      </div>
    );
  }

  if (variant === "login") {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="relative mb-2">
          <div className="absolute inset-0 blur-3xl bg-amber-400/20 scale-110 rounded-full" aria-hidden />
          <Image
            src={LOGO_SRC}
            alt="GridSentinel"
            width={320}
            height={320}
            className="relative h-40 w-40 sm:h-48 sm:w-48 object-contain drop-shadow-[0_8px_32px_rgba(251,191,36,0.25)]"
            priority
          />
        </div>
        <span className="sr-only">GridSentinel</span>
      </div>
    );
  }

  if (variant === "header") {
    return (
      <Image
        src={LOGO_SRC}
        alt="GridSentinel"
        width={120}
        height={40}
        className={`h-9 w-auto object-contain object-left ${className}`}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative w-full px-1">
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-16 blur-2xl bg-amber-400/15 rounded-full" aria-hidden />
        <Image
          src={LOGO_SRC}
          alt="GridSentinel"
          width={280}
          height={280}
          className="relative mx-auto h-28 w-full max-w-[15.5rem] object-contain drop-shadow-[0_6px_24px_rgba(251,191,36,0.2)]"
          priority
        />
      </div>
      <span className="sr-only">GridSentinel</span>
    </div>
  );
}