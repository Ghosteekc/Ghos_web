interface LoaderProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
}

const Loader = ({ compact = false, showLabel = true, className = "" }: LoaderProps) => (
  <div
    className={`flex flex-col items-center justify-center ${compact ? "py-2" : "py-12"} ${className}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <img
      src="/pekka-butterfly.gif"
      alt=""
      aria-hidden
      className={`object-contain ${compact ? "w-10 h-10" : "w-36 h-36"}`}
    />
    {showLabel && (
      <p className={`text-cr-muted animate-pulse ${compact ? "mt-2 text-xs" : "mt-4 text-sm"}`}>
        Загрузка...
      </p>
    )}
  </div>
);

export { Loader };
export default Loader;
