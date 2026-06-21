import { type CSSProperties } from "react";
import "./Rule.css";

export interface RuleProps {
  /** Orientation. */
  vertical?: boolean;
  /** Use the stronger 24%-white line instead of the default 10%. */
  strong?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Rule — the faint hairline that draws dragonfly.xyz's grid. Horizontal by
 * default; `vertical` for column dividers.
 */
export function Rule({ vertical = false, strong = false, className = "", style }: RuleProps) {
  const classes = [
    "df-rule",
    vertical ? "df-rule--v" : "df-rule--h",
    strong && "df-rule--strong",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <span role="separator" className={classes} style={style} />;
}
