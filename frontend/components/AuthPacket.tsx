import type { ReactNode } from "react";

export function AuthPacket({ children }: { children: ReactNode }) {
  return (
    <div className="auth-packet">
      <section className="auth-form-panel">{children}</section>

      <aside className="auth-story" aria-labelledby="auth-story-title">
        <div>
          <h2 id="auth-story-title">Evidence, kept in context.</h2>
          <p>
            Review source records, separate observed facts from ranked
            hypotheses, and follow findings back to their evidence.
          </p>
        </div>

        <ol className="auth-evidence-list">
          <li>
            <span>01</span>
            <div>
              <strong>Source records</strong>
              <small>From configured systems</small>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Observed facts</strong>
              <small>Kept distinct from interpretation</small>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Ranked hypotheses</strong>
              <small>Possible explanations to review</small>
            </div>
          </li>
        </ol>

        <p className="auth-readonly-note">
          <span aria-hidden="true" />
          Read-only by default. Infrastructure changes stay with the operator.
        </p>
      </aside>
    </div>
  );
}
