import { type ReactNode } from "react";
import { Text } from "../Text/Text";
import { Rule } from "../Rule/Rule";
import "./SectionMarker.css";

export interface SectionMarkerProps {
  /** Two-digit section number, e.g. "01". */
  number: string;
  /** Section name, e.g. "ABOUT". */
  children: ReactNode;
  /** Draw a hairline above the marker (the section divider). */
  ruled?: boolean;
}

/**
 * SectionMarker — dragonfly.xyz's centered section header: an accent mono
 * number above an uppercase label ("01 / ABOUT"), optionally preceded by a
 * full-width rule. Composes Rule + Text.
 */
export function SectionMarker({ number, children, ruled = true }: SectionMarkerProps) {
  return (
    <div className="df-section">
      {ruled && <Rule />}
      <div className="df-section__inner">
        <Text face="mono" size="micro" caps tone="accent" className="df-section__num">
          {number}
        </Text>
        <Text face="mono" size="micro" caps tone="ink" className="df-section__label">
          {children}
        </Text>
      </div>
    </div>
  );
}
