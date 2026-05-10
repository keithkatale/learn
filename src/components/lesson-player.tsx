import { isAllowedEmbedUrl, isDirectVideoUrl } from "@/lib/video";

export function LessonPlayer({
  embedUrl,
  title,
}: {
  embedUrl: string;
  title: string;
}) {
  if (isDirectVideoUrl(embedUrl)) {
    return (
      <div className="w-full overflow-hidden rounded-2xl bg-black shadow-lum-card ring-1 ring-white/10">
        <video className="w-full" controls preload="metadata" src={embedUrl}>
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (!isAllowedEmbedUrl(embedUrl)) {
    return (
      <p className="rounded-lg border border-amber-500/35 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
        This lesson&apos;s video URL is not an allowed source.
      </p>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lum-card ring-1 ring-white/10">
      <iframe
        title={title}
        src={embedUrl}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
