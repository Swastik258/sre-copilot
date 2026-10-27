"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiRequestError, api } from "@/lib/api";

const inputClass = "cw-input";

function Message({
  kind,
  children,
}: {
  kind: "error" | "notice";
  children: React.ReactNode;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`border bg-[var(--bg-subtle)] px-3.5 py-3 text-sm leading-6 ${
        kind === "error"
          ? "border-[var(--signal-bad)] text-[var(--signal-bad)]"
          : "border-[var(--border-strong)] text-[var(--text-muted)]"
      }`}
    >
      {children}
    </div>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await api.auth.forgotPassword(email);
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <span className="section-label">Account recovery</span>
      <h1 className="mt-5 text-4xl">Reset your password</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        Enter your account email and we will send a single-use reset link if the
        account exists.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>
        {message && <Message kind="notice">{message}</Message>}
        {error && <Message kind="error">{error}</Message>}
        <button
          type="submit"
          disabled={pending}
          className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        <Link href="/login" className="link-editorial font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token");
    if (value) setToken(value);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Choose a password of at least 12 characters.");
      return;
    }
    setPending(true);
    try {
      await api.auth.resetPassword(token, password);
      setComplete(true);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (complete) {
    return (
      <div>
        <span className="section-label">Account recovery</span>
        <h1 className="mt-5 text-4xl">Password updated</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          All previous sessions were signed out. Use your new password to sign in.
        </p>
        <Link href="/login" className="btn-accent mt-8 w-full justify-center">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <span className="section-label">Account recovery</span>
      <h1 className="mt-5 text-4xl">Choose a new password</h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="password" className="form-label">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 12 characters"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="form-label">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={inputClass}
          />
        </div>
        {error && <Message kind="error">{error}</Message>}
        <button
          type="submit"
          disabled={pending}
          className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        <Link href="/login" className="link-editorial font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function VerifyEmailStatus() {
  const [status, setStatus] = useState<"checking" | "success" | "error">(
    "checking",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setError("This verification link is missing its token.");
      return;
    }
    api.auth
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setStatus("error");
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "The verification link could not be used.",
        );
      });
  }, []);

  return (
    <div>
      <span className="section-label">Email verification</span>
      <h1 className="mt-5 text-4xl">
        {status === "checking"
          ? "Verifying your email"
          : status === "success"
            ? "Email verified"
            : "Verification failed"}
      </h1>
      <div className="mt-6 space-y-4">
        {error && <Message kind="error">{error}</Message>}
        {status === "checking" && (
          <Message kind="notice">Checking your single-use link…</Message>
        )}
        {status === "success" && (
          <Message kind="notice">
            Your address is confirmed. You can sign in now.
          </Message>
        )}
      </div>
      <Link href="/login" className="btn-accent mt-8 w-full justify-center">
        Go to sign in
      </Link>
    </div>
  );
}
