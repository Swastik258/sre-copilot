"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";

type Mode = "login" | "signup";
type Provider = "github" | "google" | "microsoft";

const providerOrder: Provider[] = ["github", "google", "microsoft"];
const providerNames: Record<Provider, string> = {
  github: "GitHub",
  google: "Google",
  microsoft: "Microsoft",
};

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.61 1.21 3.25.92.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.62 10.62 0 0 1 5.55 0c2.11-1.43 3.04-1.14 3.04-1.14.61 1.54.23 2.68.12 2.96.71.78 1.14 1.78 1.14 3.01 0 4.29-2.61 5.23-5.1 5.51.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"
        />
      </svg>
    );
  }

  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.18-2.1H12v3.97h5.38a4.6 4.6 0 0 1-2 3.02v2.47h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.47c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H3.08v2.55A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.42 13.94A6 6 0 0 1 6.1 12c0-.67.12-1.32.32-1.94V7.5H3.08A10 10 0 0 0 2 12c0 1.62.39 3.16 1.08 4.5l3.34-2.56Z" />
        <path fill="#EA4335" d="M12 5.94c1.47 0 2.78.5 3.82 1.5l2.86-2.87C16.95 2.95 14.7 2 12 2a10 10 0 0 0-8.92 5.5l3.34 2.56C7.2 7.7 9.4 5.94 12 5.94Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M2 2h9v9H2z" />
      <path fill="#7FBA00" d="M13 2h9v9h-9z" />
      <path fill="#00A4EF" d="M2 13h9v9H2z" />
      <path fill="#FFB900" d="M13 13h9v9h-9z" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const { setUser } = useAuth();
  const router = useRouter();
  const isSignup = mode === "signup";
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
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

  const configuredProviders = providerOrder.filter((provider) =>
    providers.some((configured) => configured.toLowerCase() === provider),
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPasswordError(null);

    if (isSignup && password.length < 12) {
      setPasswordError("Choose a password of at least 12 characters.");
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
        setNotice("Check your email to verify your address before signing in.");
        setPending(false);
        return;
      }
      setUser(result.user);
      if (isSignup && result.workspace_slug) {
        // Signup lands in the new personal workspace; the URL is the source
        // of truth for the active workspace.
        router.replace(`/w/${result.workspace_slug}/dashboard`);
      } else {
        router.replace("/dashboard");
      }
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
    <div className="auth-form-content">
      <h1 className="auth-form-title">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="auth-form-subtitle">
        {isSignup
          ? "Start investigating with evidence."
          : "Sign in to your Tarn workspace."}
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        {isSignup && (
          <div className="auth-field">
            <label htmlFor="name">Full name (optional)</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ada Lovelace"
            />
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <div className="auth-field">
          <div className="auth-field-label-row">
            <label htmlFor="password">Password</label>
            {!isSignup && (
              <Link href="/forgot-password">Forgot password?</Link>
            )}
          </div>
          <div className="auth-password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(null);
              }}
              placeholder={isSignup ? "Create a password" : "Your password"}
              aria-invalid={passwordError ? "true" : undefined}
              aria-describedby={
                isSignup
                  ? `password-hint${passwordError ? " password-error" : ""}`
                  : passwordError
                    ? "password-error"
                    : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="auth-password-toggle"
            >
              {showPassword ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </div>
          {isSignup && (
            <p id="password-hint" className="auth-field-hint">
              At least 12 characters
            </p>
          )}
          <AnimatePresence initial={false}>
            {passwordError && (
              <motion.p
                id="password-error"
                role="alert"
                className="auth-field-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              >
                {passwordError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {notice && (
          <div role="status" className="auth-notice">
            {notice}
          </div>
        )}

        {error && (
          <div role="alert" className="auth-error">
            {error}
          </div>
        )}

        {isSignup && (
          <p className="auth-terms">
            By continuing you agree to the{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="auth-submit"
        >
          {pending ? (
            <>
              <LoaderCircle
                size={17}
                className="auth-spinner"
                aria-hidden="true"
              />
              <span>{isSignup ? "Creating account…" : "Signing in…"}</span>
            </>
          ) : (
            <>
              <span>{isSignup ? "Create account" : "Sign in"}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="auth-oauth">
        <div className="auth-divider">
          <span />
          <span>
            {configuredProviders.length > 0
              ? "or continue with"
              : "OAuth options"}
          </span>
          <span />
        </div>
        <div className="auth-oauth-icons">
          {providerOrder.map((provider) => {
            const label = `${isSignup ? "Sign up" : "Sign in"} with ${providerNames[provider]}`;
            const isConfigured = configuredProviders.includes(provider);
            return isConfigured ? (
              <a
                key={provider}
                href={api.auth.oauthUrl(provider)}
                className="auth-oauth-icon"
                aria-label={label}
                title={label}
              >
                <ProviderIcon provider={provider} />
              </a>
            ) : (
              <span
                key={provider}
                className="auth-oauth-icon auth-oauth-icon-disabled"
                role="img"
                aria-label={`${providerNames[provider]} sign-in is not configured`}
                title={`${providerNames[provider]} sign-in is not configured`}
              >
                <ProviderIcon provider={provider} />
              </span>
            );
          })}
        </div>
        {configuredProviders.length === 0 && (
          <p className="auth-oauth-note">
            Provider sign-in is unavailable for this deployment.
          </p>
        )}
      </div>

      <p className="auth-switch">
        {isSignup ? "Already have an account? " : "New to Tarn? "}
        <Link href={isSignup ? "/login" : "/sign-up"}>
          {isSignup ? "Sign in" : "Create account"}
        </Link>
      </p>
    </div>
  );
}
