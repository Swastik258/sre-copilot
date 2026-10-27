"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";

type Mode = "login" | "signup";

const inputClass = "cw-input";

export function AuthForm({ mode }: { mode: Mode }) {
  const { setUser } = useAuth();
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    api.auth
      .providers()
      .then((result) => setProviders(result.providers))
      .catch(() => setProviders([]));
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_error")) {
      setError("OAuth sign-in could not be completed. Try again or use email.");
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (isSignup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (isSignup && password.length < 12) {
      setError("Choose a password of at least 12 characters.");
      return;
    }

    setPending(true);
    try {
      const result = isSignup
        ? await api.auth.signup({
            email,
            password,
            display_name: name.trim() || undefined,
          })
        : await api.auth.login({ email, password });

      if (result.verification_required) {
        setNotice(
          "Check your email to verify your address before signing in.",
        );
        setPending(false);
        return;
      }
      setUser(result.user);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="section-label">
          {isSignup ? "Create account" : "Account access"}
        </span>
      </div>

      <h1 className="mt-5 text-4xl text-[var(--text)]">
        {isSignup ? "Create an account" : "Sign in"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        {isSignup
          ? "This deployment stores your account and credentials. No hosted identity service is required."
          : "Continue to your investigation dashboard."}
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        {isSignup && (
          <div>
            <label
              htmlFor="name"
              className="form-label"
            >
              Name <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ada Lovelace"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            {!isSignup && (
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--text-muted)] transition hover:text-[var(--text)]"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignup ? "At least 12 characters" : "Your password"}
              className={`${inputClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text)]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {isSignup && (
          <div>
            <label htmlFor="confirm" className="form-label">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Repeat your password"
              className={inputClass}
            />
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3.5 py-3 text-sm leading-6 text-[var(--text-muted)]"
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="border border-[var(--signal-bad)] bg-[var(--bg-subtle)] px-3.5 py-3 text-sm leading-6 text-[var(--signal-bad)]"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Please wait…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      {providers.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 text-xs text-[var(--text-subtle)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            or
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          {providers.map((provider) => (
            <a
              key={provider}
              href={api.auth.oauthUrl(provider)}
              className="btn-ghost w-full justify-center capitalize"
            >
              Continue with {provider}
            </a>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {isSignup ? "Already have an account? " : "New to Tarn? "}
        <Link
          href={isSignup ? "/login" : "/sign-up"}
          className="link-editorial font-medium"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>

      <p className="auth-footnote">
        Passwords are hashed · HttpOnly session
      </p>
    </div>
  );
}
