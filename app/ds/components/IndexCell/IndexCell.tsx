import { type ReactNode } from "react";
import { Panel } from "../Panel/Panel";
import { Text } from "../Text/Text";
import "./IndexCell.css";

export interface IndexCellProps {
  /** Entry name (a portfolio company in the dense index grid). */
  children: ReactNode;
  /** Optional trailing marker (e.g. an arrow or year). */
  marker?: ReactNode;
  href?: string;
}

/**
 * IndexCell — one cell of dragonfly.xyz's dense hairline "INDEX" grid: a
 * bordered Panel holding a small sans name. Lay them out in a CSS grid with
 * negative margins so shared borders collapse into single hairlines.
 */
export function IndexCell({ children, marker, href }: IndexCellProps) {
  return (
    <Panel
      as={href ? "a" : "div"}
      href={href}
      border="all"
      interactive={href != null}
      className="df-index-cell"
    >
      <Text as="span" face="sans" size="body" tone="ink" className="df-index-cell__name">
        {children}
      </Text>
      {marker != null && (
        <Text as="span" face="mono" size="micro" tone="muted">{marker}</Text>
      )}
    </Panel>
  );
}
