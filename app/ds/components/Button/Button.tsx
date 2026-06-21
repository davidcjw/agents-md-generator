import { type ElementType, type ReactNode } from "react";
import { Panel } from "../Panel/Panel";
import { Text } from "../Text/Text";
import "./Button.css";

export interface ButtonProps {
  children: ReactNode;
  /** "outline" hairline (default), "accent" filled, or "ghost" borderless. */
  variant?: "outline" | "accent" | "ghost";
  href?: string;
  as?: ElementType;
  onClick?: () => void;
  className?: string;
  [key: string]: unknown;
}

/**
 * Button — dragonfly.xyz's mono pill control ("LOAD MORE", "VIEW"). A
 * hairline-bordered Panel + uppercase mono label, or an accent fill.
 */
export function Button({
  children,
  variant = "outline",
  href,
  as,
  className = "",
  ...rest
}: ButtonProps) {
  const Tag = as ?? (href ? "a" : "button");
  const accent = variant === "accent";
  return (
    <Panel
      as={Tag}
      href={href}
      border={variant === "ghost" ? "none" : "all"}
      interactive
      className={[
        "df-button",
        `df-button--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <Text face="mono" size="micro" caps tone={accent ? "inherit" : "ink"}>
        {children}
      </Text>
    </Panel>
  );
}
