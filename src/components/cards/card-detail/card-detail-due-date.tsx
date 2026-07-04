import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DueDateFieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  isPending: boolean;
}

export function DueDateField({ value, onChange, isPending }: DueDateFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
        disabled={isPending}
        aria-label="Due date"
        className="w-44"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={isPending}
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
