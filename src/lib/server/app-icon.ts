import { ImageResponse } from "next/og";
import { createElement } from "react";

export function makeAppIcon(size: number) {
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          alignItems: "center",
          background: "#FFF8EF",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        },
      },
      createElement(
        "div",
        {
          style: {
            alignItems: "center",
            background: "#E8643D",
            color: "#ffffff",
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: size * 0.34,
            fontWeight: 900,
            borderRadius: "22%",
            height: "72%",
            justifyContent: "center",
            letterSpacing: 0,
            width: "72%",
          },
        },
        "T",
      ),
    ),
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}