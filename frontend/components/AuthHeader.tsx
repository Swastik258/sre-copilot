import Link from "next/link";
import Image from "next/image";

export function AuthHeader({
  variant = "shell",
}: {
  variant?: "shell" | "panel";
}) {
  if (variant === "panel") {
    return (
      <header className="auth-local-header">
        <Link href="/" className="auth-brand" aria-label="Tarn home">
          <Image
            src="/tarn-wordmark-ink.svg"
            alt="Tarn"
            width={118}
            height={35}
            unoptimized
            priority
          />
        </Link>
      </header>
    );
  }

  return (
    <header className="auth-header border-b border-[var(--border)]">
      <div className="shell flex h-16 items-center justify-between">
        <Link
          href="/"
          className="site-brand flex items-center text-sm font-semibold text-[var(--text)]"
        >
          <Image className="wordmark-paper" src="/tarn-wordmark.svg" alt="Tarn" width={118} height={35} />
          <Image className="wordmark-ink" src="/tarn-wordmark-ink.svg" alt="" width={118} height={35} />
        </Link>
        <Link href="/" className="link-editorial text-sm">
          Back to home
        </Link>
      </div>
    </header>
  );
}
