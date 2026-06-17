import nexoraAiLogo from "../assets/Nexora_AI.png";
import companyLogo from "../assets/Company_Logo.png";
import { cn } from "../utils/cn";

type BrandLogoProps = {
  variant?: "product" | "company";
  label?: string;
  className?: string;
  imageClassName?: string;
};

export function BrandLogo({
  variant = "product",
  label,
  className,
  imageClassName,
}: BrandLogoProps) {
  const logo = variant === "company" ? companyLogo : nexoraAiLogo;
  const alt = variant === "company" ? "NovaCore Tech logo" : "Nexora AI logo";

  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950">
        <img
          src={logo}
          alt={alt}
          className={cn("h-full w-full object-contain", imageClassName)}
        />
      </span>
      {label ? <span className="truncate">{label}</span> : null}
    </span>
  );
}

