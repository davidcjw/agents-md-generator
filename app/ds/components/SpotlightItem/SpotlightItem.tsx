import { type ReactNode } from "react";
import { Text } from "../Text/Text";
import "./SpotlightItem.css";

export interface SpotlightItemProps {
  /** Portfolio company name (rendered large, serif). */
  name: ReactNode;
  /** Small trailing meta (sector, year, round…). */
  meta?: ReactNode;
  href?: string;
}

/**
 * SpotlightItem — one line of dragonfly.xyz's portfolio spotlight: a large
 * roman-serif company name with a small mono annotation, hover-highlighting in
 * accent. Composes Text (serif display + mono micro).
 */
export function SpotlightItem({ name, meta, href }: SpotlightItemProps) {
  const Tag = (href ? "a" : "div") as "a" | "div";
  return (
    <Tag {...(href ? { href } : {})} className="df-spotlight">
      <Text as="span" face="serif" size="display" tone="ink" className="df-spotlight__name">
        {name}
      </Text>
      {meta != null && (
        <Text as="span" face="mono" size="micro" caps tone="muted" className="df-spotlight__meta">
          {meta}
        </Text>
      )}
    </Tag>
  );
}
