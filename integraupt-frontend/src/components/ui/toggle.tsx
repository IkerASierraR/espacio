"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";
import "./../../styles/others/toggle.css";

const toggleVariants = cva(
  "toggle",
  {
    variants: {
      variant: {
        default: "toggle-default",
        outline: "toggle-outline",
      },
      size: {
        default: "toggle-default-size",
        sm: "toggle-sm-size",
        lg: "toggle-lg-size",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };