import type { LucideIcon } from "lucide-react";
import { isValidElement, type ReactNode } from "react";
import { cn } from "@/utils";
import { Card } from "./Card";
import { Button } from "./Button";

export interface EmptyStateProps {
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

/** Universal empty state. Uses theme tokens (light/dark). Does not restyle pages. */
export function EmptyState({
  icon,
  title,
  description,
  button,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("text-center", className)}>
      {icon != null ? (
        <div className="mb-2 flex justify-center text-cr-muted">{renderIcon(icon, "h-6 w-6")}</div>
      ) : null}
      <p
        className={cn(
          "text-base text-cr-muted",
          (description || button) && "font-semibold text-cr-text",
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-cr-muted leading-relaxed">{description}</p>
      ) : null}
      {button && onAction ? (
        <Button className="mt-4" onClick={onAction}>
          {button}
        </Button>
      ) : null}
    </Card>
  );
}
