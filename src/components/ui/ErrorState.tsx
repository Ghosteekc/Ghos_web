import type { LucideIcon } from "lucide-react";
import { isValidElement, type ReactNode } from "react";
import { cn } from "@/utils";
import { Card } from "./Card";
import { Button } from "./Button";

export interface ErrorStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  button?: string;
  onAction?: () => void;
  className?: string;
}

function renderIcon(icon: LucideIcon | ReactNode, className: string) {
  if (isValidElement(icon)) return icon;
  const Icon = icon as LucideIcon;
  return <Icon className={className} aria-hidden />;
}

/** Universal error state. Uses theme tokens (light/dark). Does not restyle pages. */
export function ErrorState({
  icon,
  title,
  description,
  button,
  onAction,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("text-center", className)}>
      {icon != null ? (
        <div className="mb-2 flex justify-center text-cr-loss">{renderIcon(icon, "h-6 w-6")}</div>
      ) : null}
      <p
        className={cn(
          "text-sm text-cr-loss",
          (description || button) && "mb-2 font-semibold",
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="mb-4 text-xs text-cr-muted leading-relaxed">{description}</p>
      ) : null}
      {button && onAction ? <Button onClick={onAction}>{button}</Button> : null}
    </Card>
  );
}
