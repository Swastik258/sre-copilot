type PlaceholderProps = {
  children: React.ReactNode;
};

export function Placeholder({ children }: PlaceholderProps) {
  return <section className="rounded-lg border border-slate-700 p-6">{children}</section>;
}
