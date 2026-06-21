import { type ElementType, type ReactNode } from "react";
import { Text } from "../Text/Text";

export interface DisplayProps {
  children: ReactNode;
  /** "mega" = hero/logo scale; "display" = section/spotlight scale. */
  size?: "mega" | "display" | "h";
  /** Render in the accent orange-red (the logo treatment). */
  accent?: boolean;
  as?: ElementType;
  className?: string;
}

/**
 * Display — dragonfly.xyz's big roman-serif headline (the DRAGONFLY logo, the
 * spotlight names). Composes Text with the serif face at a large scale step.
 */
export function Display({
  children,
  size = "display",
  accent = false,
  as = "h2",
  className = "",
}: DisplayProps) {
  return (
    <Text
      as={as}
      face="serif"
      size={size}
      tone={accent ? "accent" : "ink"}
      className={className}
    >
      {children}
    </Text>
  );
}
