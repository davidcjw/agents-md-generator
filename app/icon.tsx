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
          background: "#000000",
          border: "1px solid rgba(242,242,242,0.24)",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 600,
            fontSize: 22,
            color: "#fa4c14",
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
