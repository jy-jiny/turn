import { ImageResponse } from "next/og";
import { createElement } from "react";

export function makeAppIcon(size: number) {
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          alignItems: "center",
          background: "#f2f5f1",
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
            background: "#176047",
            color: "#ffffff",
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: size * 0.34,
            fontWeight: 900,
            height: "72%",
            justifyContent: "center",
            letterSpacing: 0,
            width: "72%",
          },
        },
        "C",
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