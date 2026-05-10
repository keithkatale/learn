export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="studio-discovery flex flex-1 flex-col bg-lum-background text-lum-on-background">
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-12">
        {children}
      </div>
    </div>
  );
}
