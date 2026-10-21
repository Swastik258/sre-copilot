"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  ApiRequestError,
  type AuthUser,
  type Diagnosis,
  type InvestigationDetail,
  type InvestigationMessage,
} from "@/lib/api";

type Phase = "loading" | "signed_out" | "ready" | "error";

export default function AssistantPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationDetail[]>([]);
  const [active, setActive] = useState<InvestigationDetail | null>(null);
  const [messages, setMessages] = useState<InvestigationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadInvestigations = useCallback(async (selectId?: string) => {
    const list = await api.investigations.list({ page_size: 50 });
    setInvestigations(list.investigations);
    const selected =
      list.investigations.find((item) => item.id === selectId) ??
      list.investigations[0] ??
      null;
    setActive(selected);
    if (selected) {
      const history = await api.investigations.messages(selected.id);
      setMessages(history.messages);
    } else {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const current = await api.auth.me();
        if (cancelled) return;
        setUser(current);
        if (!current) {
          setPhase("signed_out");
          return;
        }
        await loadInvestigations();
        if (!cancelled) setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load the assistant");
        setPhase("error");
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadInvestigations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const createInvestigation = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.investigations.create({
        title: "New investigation",
        kind: "general",
      });
      await loadInvestigations(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create investigation");
    } finally {
      setBusy(false);
    }
  }, [loadInvestigations]);

  const selectInvestigation = useCallback(async (investigation: InvestigationDetail) => {
    setActive(investigation);
    setError(null);
    try {
      const history = await api.investigations.messages(investigation.id);
      setMessages(history.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages");
    }
  }, []);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || !active || busy) return;
    setBusy(true);
    setError(null);
    setDraft("");
    try {
      const exchange = await api.investigations.send(active.id, content);
      setMessages((current) => [
        ...current,
        exchange.user_message,
        exchange.assistant_message,
      ]);
      const updated = await api.investigations.get(active.id);
      setActive(updated);
      setInvestigations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setDraft(content);
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Assistant request failed",
      );
    } finally {
      setBusy(false);
    }
  }, [active, busy, draft]);

  if (phase === "loading") {
    return <Centered>Loading assistant…</Centered>;
  }

  if (phase === "signed_out") {
    return (
      <Centered>
        <div className="max-w-md">
          <span className="label-caps">Assistant</span>
          <h1 className="mt-3 font-serif text-display-sm text-primary">
            Sign in to start an investigation
          </h1>
          <p className="mt-3 text-sm text-tertiary">
            Investigations and message history are stored against your local
            account. No third-party identity provider is involved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="btn-accent">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-ghost">
              Create account
            </Link>
          </div>
        </div>
      </Centered>
    );
  }

  if (phase === "error") {
    return (
      <Centered>
        <div className="max-w-md">
          <h1 className="font-serif text-2xl text-primary">Assistant unavailable</h1>
          <p className="mt-3 font-mono text-sm text-bad">{error}</p>
          <button type="button" className="btn-ghost mt-5" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <span className="label-caps">Evidence-backed assistant</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">Assistant</h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Ask a question, attach cited evidence through the connected
              surfaces, and keep the conversation in a persisted investigation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="font-mono text-[10.5px] text-tertiary">
                {user.display_name || user.email}
              </span>
            )}
            <button
              type="button"
              className="btn-accent text-[12px]"
              onClick={() => void createInvestigation()}
              disabled={busy}
            >
              New investigation
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] animate-fade-in">
          <aside>
            <div className="label-caps">Investigations</div>
            <div className="mt-2 space-y-2">
              {investigations.length === 0 && (
                <p className="rounded-[4px] border border-hairline p-4 font-mono text-[11px] text-tertiary">
                  No saved investigations yet. Create one to ask the first question.
                </p>
              )}
              {investigations.map((investigation) => (
                <button
                  key={investigation.id}
                  type="button"
                  onClick={() => void selectInvestigation(investigation)}
                  className={`block w-full rounded-[4px] border px-3 py-2.5 text-left transition ${
                    active?.id === investigation.id
                      ? "border-warn bg-accent-soft"
                      : "border-hairline hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <div className="truncate text-[12.5px] text-primary">
                    {investigation.title}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] text-tertiary">
                    <span>{investigation.kind}</span>
                    <span>· {investigation.status}</span>
                    <span>· {investigation.message_count} msg</span>
                  </div>
                  {investigation.summary && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-tertiary">
                      {investigation.summary}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            {!active && (
              <div className="grid min-h-72 place-items-center rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-10 text-center">
                <p className="max-w-sm font-mono text-[12px] text-tertiary">
                  Create an investigation to store messages and cite evidence.
                </p>
              </div>
            )}

            {active && (
              <div className="flex min-h-[32rem] flex-col rounded-[4px] border border-hairline bg-[var(--bg-subtle)]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-primary">{active.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-tertiary">
                      {active.kind} · {active.status} · {active.evidence_ids.length} evidence
                    </div>
                  </div>
                  <span className="tag-live">persisted</span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.length === 0 && (
                    <p className="font-mono text-[11.5px] text-tertiary">
                      Ask why a pod, pipeline, plan, or log signature is failing.
                      The assistant uses evidence already attached to this
                      investigation; when none exists it says so.
                    </p>
                  )}
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {busy && (
                    <p className="font-mono text-[11.5px] text-tertiary">
                      Assistant is thinking…
                    </p>
                  )}
                  <div ref={endRef} />
                </div>

                {error && (
                  <p className="border-t border-hairline px-4 py-2 font-mono text-[11px] text-bad">
                    {error}
                  </p>
                )}

                <div className="border-t border-hairline p-3">
                  <label className="sr-only" htmlFor="assistant-message">
                    Message
                  </label>
                  <textarea
                    id="assistant-message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    placeholder="Why did checkout start failing after the last deploy?"
                    className="w-full resize-none rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[12.5px] text-primary placeholder:text-tertiary"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] text-tertiary">
                      Enter to send · Shift+Enter for a new line
                    </span>
                    <button
                      type="button"
                      className="btn-accent text-[12px] disabled:opacity-50"
                      onClick={() => void send()}
                      disabled={busy || !draft.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: InvestigationMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "ml-auto max-w-[85%]" : "max-w-[92%]"}>
      <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">
        <span>{message.role}</span>
        <span>· {new Date(message.created_at).toLocaleTimeString()}</span>
        {message.diagnosis?.model_generated && <span className="text-warn">AI-generated</span>}
      </div>
      <div
        className={`rounded-[4px] border p-3 ${
          isUser
            ? "border-[var(--border-strong)] bg-[var(--bg)]"
            : "border-hairline bg-[var(--bg)]"
        }`}
      >
        <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-primary">
          {message.content}
        </p>
        {message.diagnosis && <DiagnosisBlocks diagnosis={message.diagnosis} />}
      </div>
    </div>
  );
}

function DiagnosisBlocks({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <div className="mt-3 space-y-3 border-t border-hairline pt-3">
      {diagnosis.confirmed_observations.length > 0 && (
        <div>
          <div className="label-caps">Observed</div>
          <ul className="mt-1 space-y-0.5 text-[11.5px] text-secondary">
            {diagnosis.confirmed_observations.slice(0, 5).map((item, index) => (
              <li key={index}>· {item}</li>
            ))}
          </ul>
        </div>
      )}
      {diagnosis.hypotheses.length > 0 && (
        <div>
          <div className="label-caps">Hypotheses</div>
          <div className="mt-1 space-y-1.5">
            {diagnosis.hypotheses.map((hypothesis, index) => (
              <p key={index} className="text-[11.5px] text-primary">
                {hypothesis.statement}{" "}
                <span className="font-mono text-[10px] text-tertiary">
                  {Math.round(hypothesis.confidence * 100)}%
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
      {diagnosis.next_steps.length > 0 && (
        <div>
          <div className="label-caps">Next read-only steps</div>
          <ul className="mt-1 space-y-0.5 text-[11.5px] text-tertiary">
            {diagnosis.next_steps.map((step, index) => (
              <li key={index}>· {step.action}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-tertiary">
        <span>{Math.round(diagnosis.confidence * 100)}% confidence</span>
        {diagnosis.model_provider && <span>· {diagnosis.model_provider}</span>}
        {diagnosis.evidence_ids.length > 0 && (
          <span>· {diagnosis.evidence_ids.length} citation(s)</span>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative grid min-h-[60vh] place-items-center py-12">
        <div className="w-full text-center">{children}</div>
      </div>
    </div>
  );
}
