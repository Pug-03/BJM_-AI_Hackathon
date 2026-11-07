import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  [
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full",
    "transition-[transform,background-color,color] duration-200 ease-smooth active:scale-[0.94]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-5 [&_svg]:stroke-[1.75]",
  ],
  {
    variants: {
      variant: {
        ghost: "text-ink hover:bg-mist",
        soft: "bg-mist text-ink hover:bg-cloud",
        solid: "bg-ink text-paper hover:opacity-90",
        outline: "border border-line bg-paper text-ink hover:bg-mist",
        brand: "bg-brand text-white",
      },
    },
    defaultVariants: { variant: "ghost" },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
  /** Required: icon buttons must always be named for screen readers. */
  "aria-label": string;
  asChild?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, asChild, type, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(iconButtonVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
IconButton.displayName = "IconButton";
