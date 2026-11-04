import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-pill bg-primary text-primary-foreground hover:opacity-90 shadow-card",
        secondary:
          "rounded-pill bg-secondary text-secondary-foreground hover:opacity-90 shadow-card",
        outline:
          "rounded-pill border border-border bg-transparent text-foreground hover:bg-surface",
        ghost: "rounded-pill bg-transparent text-foreground hover:bg-surface",
        soft: "rounded-pill bg-surface text-foreground hover:bg-surface-muted",
        destructive:
          "rounded-pill bg-destructive text-destructive-foreground hover:opacity-90",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
