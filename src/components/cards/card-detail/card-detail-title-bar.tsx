import { type ReactNode } from "react";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TitleBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onCopy: () => void;
  moveTrigger: ReactNode;
  onDeleteRequest: () => void;
  isPending: boolean;
}

export function TitleBar({
  title,
  onTitleChange,
  onCopy,
  moveTrigger,
  onDeleteRequest,
  isPending,
}: TitleBarProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        disabled={isPending}
        maxLength={200}
        aria-label="Card title"
        className="text-xl font-semibold"
        placeholder="Card title"
      />
      <div className="flex items-center gap-1">
        <ActionButton
          icon={<Copy className="size-4" />}
          label="Copy card"
          onClick={onCopy}
          disabled={isPending}
        />
        {moveTrigger}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDeleteRequest}
          disabled={isPending}
          aria-label="Delete card"
          title="Delete card"
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:text-foreground shrink-0"
    >
      {icon}
    </Button>
  );
}
