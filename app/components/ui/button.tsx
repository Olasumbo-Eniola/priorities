import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "icon" | "plain";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  compact?: boolean;
};

export function Button({
  variant = "plain",
  compact = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClass = variant === "icon" ? "icon-button" : variant;
  const classes = [variantClass !== "plain" ? variantClass : "", compact ? "compact" : "", className]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes || undefined} {...props} />;
}
