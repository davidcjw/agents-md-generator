import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#ffffff",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 20,
            color: "#000000",
            lineHeight: 1,
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size }
  );
}
