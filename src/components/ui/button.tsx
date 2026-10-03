import * as React from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-primary text-primary-foreground", primary: "bg-primary text-primary-foreground", secondary: "border-2 border-foreground bg-background text-foreground", outline: "border-2 border-foreground bg-background text-foreground", ghost: "text-foreground hover:bg-secondary", link: "text-primary underline-offset-4 hover:underline", destructive: "bg-destructive text-destructive-foreground", coral: "bg-coral text-foreground" }, size: { default: "h-11 px-5", sm: "h-9 px-3", lg: "h-12 px-7", icon: "size-11 p-0", "icon-sm": "size-9 p-0", "icon-lg": "size-12 p-0" } }, defaultVariants: { variant: "default", size: "default" } });
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild=false, ...props }, ref) => { const Comp=asChild?Slot:"button"; return <Comp ref={ref} className={cn(buttonVariants({variant,size}),className)} {...props}/>; });
Button.displayName="Button";
export function ButtonLink({ variant="primary", className, children, ...props }: LinkProps & { variant?: VariantProps<typeof buttonVariants>["variant"]; className?: string; children: React.ReactNode }) { return <Link className={cn(buttonVariants({variant}),className)} {...props}>{children}</Link>; }