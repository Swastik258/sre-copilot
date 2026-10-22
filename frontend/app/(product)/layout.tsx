"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { useAuth } from "@/lib/auth-client";

const WORKSPACE_PATHS = ["/dashboard", "/settings", "/history"];

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isWorkspacePath = WORKSPACE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isWorkspace = isWorkspacePath || (!loading && Boolean(user));

  return (
    <div
      data-theme="ink"
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      {isWorkspace ? (
        <WorkspaceLayout>{children}</WorkspaceLayout>
      ) : (
        <>
          <TopNav />
          <main className="pt-16">{children}</main>
        </>
      )}
    </div>
  );
}
