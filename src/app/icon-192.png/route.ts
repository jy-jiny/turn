import { makeAppIcon } from "@/lib/server/app-icon";

export const dynamic = "force-static";

export function GET() {
  return makeAppIcon(192);
}