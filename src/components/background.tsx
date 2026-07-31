import React from "react";

import { cn } from "@/lib/utils";

type BackgroundProps = {
  children: React.ReactNode;
  variant?: "top" | "bottom";
  className?: string;
};

export const Background = ({
  children,
  variant = "top",
  className,
}: BackgroundProps) => {
  return (
    <div
      className={cn(
        "relative mx-2.5 mt-2.5 lg:mx-4",
        // The template washed these in `primary/50`. Its primary was a pale cream,
        // so half-opacity read as a tint; MailKite's is a saturated blue, where the
        // same value reads as a slab. Dialled back, and weighted per mode — the
        // light accent (#6ea8fe) needs more presence on a near-black background
        // than the darker one (#2f6fe0) needs on white.
        variant === "top" &&
          "from-primary/15 via-background to-background/80 rounded-t-4xl rounded-b-2xl bg-linear-to-b via-20% dark:from-primary/25",
        variant === "bottom" &&
          "from-background via-background to-primary/15 rounded-t-2xl rounded-b-4xl bg-linear-to-b dark:to-primary/25",
        className,
      )}
    >
      {children}
    </div>
  );
};
