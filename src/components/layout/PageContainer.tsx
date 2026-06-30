import { type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  py?: "0" | "4" | "6" | "8" | "10" | "12" | "16";
};

export function PageContainer({
  children,
  as: Tag = "div",
  className,
  py = "8",
}: PageContainerProps) {
  return (
    <Tag
      className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", py !== "0" && `py-${py}`, className)}
    >
      {children}
    </Tag>
  );
}
