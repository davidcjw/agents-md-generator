import { type ReactNode } from "react";
import { Text } from "../Text/Text";

export interface MonoLabelProps {
  children: ReactNode;
  /** Colour tone. */
  tone?: "ink" | "muted" | "accent" | "inherit";
  className?: string;
}

/**
 * MonoLabel — the small uppercase mono labels scattered across dragonfly.xyz
 * (meta, kickers, captions). Composes Text at the mono/micro step with caps.
 */
export function MonoLabel({ children, tone = "muted", className = "" }: MonoLabelProps) {
  return (
    <Text face="mono" size="micro" caps tone={tone} className={className}>
      {children}
    </Text>
  );
}
