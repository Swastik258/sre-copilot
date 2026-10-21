"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";

type Mode = "login" | "signup";

const inputClass =
  "w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] transition focus:border-[var(--accent)] focus:outline-none";

export function AuthForm({ mode }: { mode: Mode }) {
  const { setUser } = useAuth();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isSignup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (isSignup && password.length < 8) {
      setError("Choose a password of at least 8 characters.");
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

      setUser(result.user);
      window.location.href = "/dashboard";
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
        <span className="label-caps">
          {isSignup ? "Create account" : "Sign in"}
        </span>
        <span className="badge badge-neutral">
          <span className="dot dot-good" />
          Local
        </span>
      </div>

      <h1 className="heading-display mt-5 text-4xl text-[var(--text)]">
        {isSignup ? "Create an account" : "Sign in"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        {isSignup
          ? "No external identity provider. Your account is stored on your own backend."
          : "Open your investigation dashboard with your local account."}
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        {isSignup && (
          <div>
            <label
              htmlFor="name"
              className="label-caps mb-2 block"
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
          <label htmlFor="email" className="label-caps mb-2 block">
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
          <label htmlFor="password" className="label-caps mb-2 block">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
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
            <label htmlFor="confirm" className="label-caps mb-2 block">
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

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {isSignup ? "Already have an account? " : "New to SRE Copilot? "}
        <Link
          href={isSignup ? "/login" : "/sign-up"}
          className="link-editorial font-medium"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>

      <p className="mt-6 text-center label-caps">
        Passwords are hashed · HttpOnly session
      </p>
    </div>
  );
}
