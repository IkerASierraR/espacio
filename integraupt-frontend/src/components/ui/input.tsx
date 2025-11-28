import * as React from "react";

import { cn } from "./utils";
import "./../../styles/others/input.css";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "input",
        className,
      )}
      {...props}
    />
  );
}

export { Input };