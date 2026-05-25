export default async function RestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-primary/5 flex min-h-screen flex-col">{children}</div>
  );
}
