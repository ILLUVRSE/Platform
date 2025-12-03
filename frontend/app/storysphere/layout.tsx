"use client";

export default function StorySphereLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen px-4 sm:px-8 lg:px-12 xl:px-16">
      {children}
    </div>
  );
}
