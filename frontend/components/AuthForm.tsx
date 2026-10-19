"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";
import { Icon } from "@/components/ui";

type Mode = "login" | "signup";

const inputClass =
  "w-full rounded-xl border border-hairline-strong bg-ink-850 px-4 py-3 text-sm text-paper-100 " +
  "placeholder:text-paper-400 transition focus:border-amber-500/60 focus:outline-none " +
  "focus:ring-2 focus:ring-amber-500/20";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
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
      router.push("/dashboard");
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
        <span className="eyebrow">{isSignup ? "Create account" : "Sign in"}</span>
        <span className="badge badge-neutral hidden sm:inline-flex">
          <span className="dot dot-good" />
          Local · self-hosted
        </span>
      </div>

      <h1 className="mt-5 font-serif text-[2rem] leading-tight tracking-tight text-paper-50">
        {isSignup ? "Start your workspace" : "Welcome back"}
      </h1>
      <p className="mt-3 text-dense text-paper-300">
        {isSignup
          ? "No credit card, no external identity provider. Your account is stored on your own backend."
          : "Sign in to open your investigation dashboard."}
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        {isSignup && (
          <div>
            <label htmlFor="name" className="mb-2 block text-dense font-medium text-paper-200">
              Name <span className="text-paper-400">(optional)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-2 block text-dense font-medium text-paper-200">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-dense font-medium text-paper-200">
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-paper-400 transition hover:text-paper-100"
            >
              <Icon name="eye" className="size-4" />
            </button>
          </div>
        </div>

        {isSignup && (
          <div>
            <label htmlFor="confirm" className="mb-2 block text-dense font-medium text-paper-200">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-dense text-rose-200"
          >
            <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-rose-300" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-accent w-full !py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          {!pending && <Icon name="arrow" className="size-4" />}
        </button>
      </form>

      <p className="mt-6 text-center text-dense text-paper-300">
        {isSignup ? "Already have an account? " : "New to SRE Copilot? "}
        <Link
          href={isSignup ? "/login" : "/sign-up"}
          className="font-medium text-amber-400 transition hover:text-amber-300"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
