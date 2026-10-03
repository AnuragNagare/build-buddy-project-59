import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const styles = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50";
const variants = { primary: "bg-primary text-primary-foreground shadow-[0_5px_0_var(--primary-deep)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_var(--primary-deep)] active:translate-y-1 active:shadow-none", secondary: "border-2 border-foreground bg-background text-foreground hover:bg-secondary", ghost: "text-foreground hover:bg-secondary", coral: "bg-coral text-foreground shadow-[0_5px_0_var(--coral-deep)] hover:-translate-y-0.5" };
export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={cn(styles, variants[variant], className)} {...props} />;
}
export function ButtonLink({ variant = "primary", className, children, ...props }: LinkProps & { variant?: keyof typeof variants; className?: string; children: ReactNode }) {
  return <Link className={cn(styles, variants[variant], className)} {...props}>{children}</Link>;
}
