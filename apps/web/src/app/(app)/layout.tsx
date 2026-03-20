export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth-gated shell — will add auth provider in Task 2
  return <div>{children}</div>;
}
