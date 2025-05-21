import type React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-muted/50 to-muted">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
