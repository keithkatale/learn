type SpinnerSize = "sm" | "md" | "lg";
type SpinnerVariant = "default" | "onPrimary" | "zinc";

const sizeClass: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-2",
};

const variantClass: Record<SpinnerVariant, string> = {
  default: "border-lum-outline/30 border-t-lum-primary",
  onPrimary: "border-white/35 border-t-white",
  zinc: "border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-200",
};

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className = "",
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
}: {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
}) {
  return (
    <span
      role={ariaHidden ? undefined : "status"}
      aria-live={ariaHidden ? undefined : "polite"}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : (ariaLabel ?? "Loading")}
      className={`inline-block shrink-0 rounded-full animate-spin motion-reduce:animate-none ${sizeClass[size]} ${variantClass[variant]} ${className}`}
    />
  );
}

/** Centered spinner for page or section loading. */
export function LoadingBlock({
  label = "Loading",
  size = "md",
  variant = "default",
  className = "",
}: {
  label?: string;
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <LoadingSpinner size={size} variant={variant} aria-hidden />
    </div>
  );
}
