import { useEffect, useState } from "react";
import { cn } from "@/utils";
import { UI } from "@/constants/labels";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#fbbf24",
  trackColor = "rgba(255,255,255,0.08)",
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - (Math.min(value, 100) / 100) * circumference;
  const [offset, setOffset] = useState(circumference);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setOffset(targetOffset);
      setShowLabel(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [targetOffset]);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          className="ui-progress-ring"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className={cn("text-2xl font-bold text-cr-text", showLabel && "ui-fade")}>{label}</span>
        )}
        {sublabel && <span className="text-sm text-cr-muted mt-1">{sublabel}</span>}
      </div>
    </div>
  );
}

interface LinearProgressProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function LinearProgress({
  value,
  max = 100,
  color = "#fbbf24",
  className = "",
  showLabel = true,
}: LinearProgressProps) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-cr-muted">{UI.winrate}</span>
          <span className="text-sm font-semibold text-cr-text">{percent.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 bg-cr-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full ui-progress-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
