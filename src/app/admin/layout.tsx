import Providers from "@/components/Providers";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <Providers>
        {children}
      </Providers>
    </div>
  );
} 