import Link from "next/link";
import Image from "next/image";

export function AuthHeader() {
  return (
    <header className="auth-header border-b border-[var(--border)]">
      <div className="shell flex h-16 items-center justify-between">
        <Link
          href="/"
          className="site-brand flex items-center text-sm font-semibold text-[var(--text)]"
        >
          <Image className="wordmark-paper" src="/tarn-wordmark.svg" alt="Tarn" width={118} height={36} />
          <Image className="wordmark-ink" src="/tarn-wordmark-ink.svg" alt="" width={118} height={36} />
        </Link>
        <Link href="/" className="link-editorial text-sm">
          Back to home
        </Link>
      </div>
    </header>
  );
}
