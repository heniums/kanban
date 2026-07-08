"use client";

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TrashSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("q", search);
      } else {
        params.delete("q");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(newValue), 300);
  };

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="text"
        placeholder="Search deleted boards..."
        value={value}
        onChange={handleChange}
        className="pl-8"
        aria-busy={isPending}
      />
    </div>
  );
}
