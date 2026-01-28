export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages handle their own full-screen layout
  // This layout removes the container wrapper from the root layout
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-auto">
      {children}
    </div>
  );
}
