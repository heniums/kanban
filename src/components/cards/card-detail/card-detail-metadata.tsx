import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MetadataBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-x-8 gap-y-4">{children}</div>;
}

export function MetadataField({
  label,
  icon,
  className,
  children,
}: {
  label?: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {icon}
        {label && <span>{label}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}
