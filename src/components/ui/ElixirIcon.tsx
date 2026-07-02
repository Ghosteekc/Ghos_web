import { cn } from "@/utils";

interface ElixirIconProps {
  className?: string;
  size?: number;
}

/** Pink elixir drop — как в Clash Royale */
export function ElixirIcon({ className, size = 16 }: ElixirIconProps) {
  return (
    <svg
      viewBox="0 0 20 24"
      width={size}
      height={size}
      className={cn("inline-block shrink-0 text-[#e040fb]", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M10 1.2C7.1 5.5 4.2 8.8 4.2 12.2a5.8 5.8 0 1 0 11.6 0c0-3.4-2.9-6.7-5.8-11z"
      />
    </svg>
  );
}
