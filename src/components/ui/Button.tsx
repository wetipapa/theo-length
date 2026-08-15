import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "soft" | "ghost";
type Size = "xl" | "lg" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/** 형제 서비스와 같은 버튼 감각 — 두툼한 아래 그림자 + 눌리는 반응 */
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-[var(--color-sunset)] text-white border-2 border-[var(--color-sunset-soft)] shadow-[0_6px_0_var(--color-sunset-deep)] active:shadow-[0_2px_0_var(--color-sunset-deep)] active:translate-y-1",
  secondary:
    "bg-[var(--color-sky)] text-[#1f4a57] border-2 border-[#bfe6f2] shadow-[0_6px_0_var(--color-sky-deep)] active:shadow-[0_2px_0_var(--color-sky-deep)] active:translate-y-1",
  soft: "bg-[var(--color-card)] text-[var(--color-ink)] border-2 border-[var(--color-line)] shadow-[0_4px_0_var(--color-line-deep)] active:shadow-[0_1px_0_var(--color-line-deep)] active:translate-y-1",
  ghost: "bg-transparent text-[var(--color-ink-soft)] hover:bg-[#ffffff77]",
};

const SIZE_CLASSES: Record<Size, string> = {
  xl: "min-h-20 px-8 text-2xl rounded-[28px] gap-3",
  lg: "min-h-16 px-8 text-xl rounded-3xl gap-2.5",
  md: "min-h-14 px-6 text-lg rounded-2xl gap-2",
  sm: "min-h-11 px-4 text-sm rounded-xl gap-1.5",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center font-extrabold transition-transform duration-150 disabled:opacity-40 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
