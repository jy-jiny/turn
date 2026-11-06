import type { ShareCardContent } from "@/lib/share-card";

// Coral "B" card design chosen from the Higgsfield mockups, redrawn in code so
// names and times can change without generating images.
const WIDTH = 1200;
const HEIGHT = 800;
const FONT_FAMILY = '"Noto Sans KR Variable", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const CREAM = "#FFF8EF";
const CORAL = "#E8643D";
const COCOA = "#3B2417";

const CONFETTI: Array<[number, number, number, string]> = [
  [150, 120, 9, CREAM],
  [1040, 160, 7, CREAM],
  [1110, 250, 6, COCOA],
  [1000, 330, 11, CREAM],
  [110, 360, 6, CREAM],
  [170, 560, 8, CREAM],
  [210, 650, 6, COCOA],
  [1090, 560, 8, COCOA],
  [80, 700, 5, CREAM],
];

function font(weight: number, size: number) {
  return `${weight} ${size}px ${FONT_FAMILY}`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Shortens text with "…" until it fits the width at the current font. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let shortened = text;
  while (shortened.length > 1 && ctx.measureText(`${shortened}…`).width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened}…`;
}

async function loadFonts(content: ShareCardContent) {
  if (typeof document === "undefined" || !document.fonts) return;
  // The Korean font is split into many files; asking with the real text loads only what is needed.
  const text = [content.badge, content.subline, content.headline, content.timeLabel, ...content.chips.map((c) => c.label)].join("");
  try {
    await Promise.all([900, 800, 700, 500].map((weight) => document.fonts.load(font(weight, 40), text)));
  } catch {
    // Falls back to the system font if loading fails.
  }
}

export async function renderShareCard(content: ShareCardContent): Promise<Blob> {
  await loadFonts(content);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, "#F28A62");
  background.addColorStop(0.45, CORAL);
  background.addColorStop(1, "#DD5732");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(120, 80, 0, 120, 80, 560);
  glow.addColorStop(0, "rgba(255, 214, 190, 0.38)");
  glow.addColorStop(1, "rgba(255, 214, 190, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const [x, y, r, color] of CONFETTI) {
    ctx.globalAlpha = color === CREAM ? 0.75 : 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Room badge
  ctx.font = font(800, 34);
  const badge = fitText(ctx, content.badge, 820);
  const badgeWidth = ctx.measureText(badge).width + 72;
  ctx.fillStyle = CREAM;
  roundedRect(ctx, (WIDTH - badgeWidth) / 2, 70, badgeWidth, 68, 34);
  ctx.fill();
  ctx.fillStyle = CORAL;
  ctx.fillText(badge, WIDTH / 2, 105);

  // "○○님이 샀어요 ✓"
  ctx.font = font(600, 46);
  const subline = fitText(ctx, content.subline, 900);
  const sublineWidth = ctx.measureText(subline).width;
  const hasCheck = content.subline.endsWith("샀어요");
  const checkGap = hasCheck ? 56 : 0;
  ctx.fillStyle = CREAM;
  ctx.fillText(subline, WIDTH / 2 - checkGap / 2, 262);
  if (hasCheck) {
    const cx = WIDTH / 2 + sublineWidth / 2 - checkGap / 2 + 36;
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 13, 262);
    ctx.lineTo(cx - 3, 274);
    ctx.lineTo(cx + 17, 246);
    ctx.stroke();
  }

  // Big "○○님 차례!" shrinks to fit long names
  let headlineSize = 150;
  ctx.font = font(900, headlineSize);
  while (ctx.measureText(content.headline).width > 1060 && headlineSize > 72) {
    headlineSize -= 4;
    ctx.font = font(900, headlineSize);
  }
  ctx.fillStyle = CREAM;
  ctx.fillText(fitText(ctx, content.headline, 1060), WIDTH / 2, 430);

  // Queue chips
  ctx.font = font(700, 36);
  const chipHeight = 72;
  const chipGap = 18;
  const chips = content.chips.map((chip) => ({ ...chip, label: fitText(ctx, chip.label, 260) }));
  // Drop chips from the end until the row fits; hidden people are added to "+N".
  const buildRow = (shown: number) => {
    const row = chips.slice(0, shown);
    const more = content.moreCount + (chips.length - shown);
    if (more > 0) row.push({ label: `+${more}`, current: false });
    return row;
  };
  const rowWidths = (row: typeof chips) => row.map((chip) => ctx.measureText(chip.label).width + 60);
  const rowTotal = (w: number[]) => w.reduce((sum, value) => sum + value, 0) + chipGap * (w.length - 1);
  let shown = chips.length;
  let labels = buildRow(shown);
  let widths = rowWidths(labels);
  while (rowTotal(widths) > 1080 && shown > 1) {
    shown -= 1;
    labels = buildRow(shown);
    widths = rowWidths(labels);
  }
  let x = (WIDTH - rowTotal(widths)) / 2;
  labels.forEach((chip, index) => {
    const w = widths[index];
    ctx.fillStyle = chip.current ? CREAM : "rgba(255, 248, 239, 0.18)";
    roundedRect(ctx, x, 580, w, chipHeight, chipHeight / 2);
    ctx.fill();
    ctx.fillStyle = chip.current ? CORAL : CREAM;
    ctx.fillText(chip.label, x + w / 2, 580 + chipHeight / 2 + 1);
    x += w + chipGap;
  });

  // Time
  ctx.font = font(500, 32);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 248, 239, 0.88)";
  ctx.fillText(content.timeLabel, WIDTH - 64, HEIGHT - 58);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create the card image"))), "image/jpeg", 0.9);
  });
}
