import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "rounded-full border-solid border-primary/30 border-t-primary animate-spin",
  {
    variants: {
      size: {
        sm: "h-5 w-5 border-2",
        md: "h-8 w-8 border-[3px]",
        lg: "h-12 w-12 border-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <div className={spinnerVariants({ size })} />
        <span className="sr-only">Carregando</span>
      </div>
    )
  }
)

Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
