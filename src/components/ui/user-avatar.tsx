import { getAvatarUrl } from "@/lib/cloudinary/client-safe";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-5 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-32 text-2xl",
};

export function UserAvatar({ avatarUrl, name, size = "sm", className = "" }: UserAvatarProps) {
  const sizeClass = sizeMap[size];

  if (avatarUrl) {
    return (
      <img
        src={getAvatarUrl(avatarUrl) || avatarUrl}
        alt={name}
        className={`inline-flex items-center justify-center rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      className={`bg-muted text-foreground inline-flex items-center justify-center rounded-full font-semibold ${sizeClass} ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
