import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import "./Text.css";

export type TextFace = "serif" | "sans" | "mono";
export type TextSize = "mega" | "display" | "h" | "lead" | "body" | "micro";
export type TextTone = "ink" | "muted" | "accent" | "inherit";

export interface TextProps {
  children?: ReactNode;
  /** Type family. serif = roman display, sans = grotesque body, mono = labels. */
  face?: TextFace;
  /** Scale step. */
  size?: TextSize;
  /** Colour tone. */
  tone?: TextTone;
  /** Uppercase (used for mono labels / section names). */
  caps?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

/**
 * Text — the typography primitive. dragonfly.xyz runs three faces (a roman
 * serif for display, a grotesque for body, a mono for labels); every textual
 * element is a Text with a face + scale step. Composites set the right pairing.
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    children,
    face = "sans",
    size = "body",
    tone = "ink",
    caps = false,
    as,
    className = "",
    style,
    ...rest
  },
  ref
) {
  const Tag = (as ?? "span") as ElementType;
  const classes = [
    "df-text",
    `df-text--${face}`,
    `df-text--${size}`,
    `df-text--${tone}`,
    caps && "df-text--caps",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} className={classes} style={style} {...rest}>
      {children}
    </Tag>
  );
});
