import Link from "next/link";
import { StudioGate } from "@/components/studio-gate";
import { StudioNav } from "@/components/studio-nav";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioGate>
      <div className="studio-discovery mx-auto w-full max-w-[1280px] flex-1 px-4 py-10 text-lum-on-background sm:px-6 lg:px-12">
        <div className="mb-10 flex flex-col gap-5 border-b border-lum-outline/25 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:overflow-visible sm:pb-0">
            <StudioNav />
          </div>
          <Link
            href="/studio/lessons/new"
            className="lum-btn-secondary shrink-0 px-5 py-2.5 text-center sm:text-left"
          >
            + Add lesson
          </Link>
        </div>
        {children}
      </div>
    </StudioGate>
  );
}
