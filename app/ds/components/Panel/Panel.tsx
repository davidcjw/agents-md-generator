import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import "./Panel.css";

export interface PanelProps {
  children?: ReactNode;
  /** Which sides get a hairline rule. "all" | "none" | "top" | "x" | "y"… */
  border?: "all" | "none" | "top" | "bottom" | "x" | "y";
  /** Faint inset fill. */
  filled?: boolean;
  /** Inner padding in grid modules (12px each). */
  pad?: number;
  /** Hover affordance (accent border + cursor). */
  interactive?: boolean;
  /** Polymorphic tag — "div" (default), "a", "li", "button"… */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  // Pass-throughs (href, onClick, aria-*…)
  [key: string]: unknown;
}

/**
 * Panel — the container primitive of dragonfly.xyz: a region of black canvas
 * delimited by faint hairline rules. The index grid, content cards and footer
 * columns are all Panels with different borders / padding / content.
 */
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  {
    children,
    border = "all",
    filled = false,
    pad,
    interactive = false,
    as,
    className = "",
    style,
    ...rest
  },
  ref
) {
  const Tag = (as ?? "div") as ElementType;
  const classes = [
    "df-panel",
    `df-panel--border-${border}`,
    filled && "df-panel--filled",
    interactive && "df-panel--interactive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const mergedStyle = { ...(style ?? {}) } as CSSProperties & Record<string, string>;
  if (pad != null) mergedStyle["--df-panel-pad"] = `calc(${pad} * var(--df-module))`;

  return (
    <Tag ref={ref} className={classes} style={mergedStyle} {...rest}>
      {children}
    </Tag>
  );
});
