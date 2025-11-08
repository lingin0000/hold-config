import * as React from "react";

export function Title({ level = 3, children, className }: { level?: 1 | 2 | 3 | 4 | 5; children?: React.ReactNode; className?: string }) {
  const Tag = (`h${level}` as keyof JSX.IntrinsicElements);
  const sizes: Record<number, string> = {
    1: "text-3xl",
    2: "text-2xl",
    3: "text-xl",
    4: "text-lg",
    5: "text-base",
  };
  return <Tag className={(sizes[level] || "text-xl") + " font-semibold " + (className ?? "")}>{children}</Tag>;
}

export function Text({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <p className={(className ?? "") + " text-sm text-muted-foreground"}>{children}</p>;
}

export default { Title, Text };