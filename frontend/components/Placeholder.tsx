type PlaceholderProps = {
  children: React.ReactNode;
};

export function Placeholder({ children }: PlaceholderProps) {
  return <section className="rounded-[4px] border border-[var(--border-strong)] p-6">{children}</section>;
}
