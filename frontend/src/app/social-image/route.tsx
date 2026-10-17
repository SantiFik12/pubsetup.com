import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export async function GET() {
  const logo = await readFile(join(process.cwd(), "public/assets/logo.png"));
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", background: "#f6f8fb", color: "#101b2b", padding: 80 }}>
      <img src={`data:image/png;base64,${logo.toString("base64")}`} alt="pubsetup.com" width={600} />
      <div style={{ display: "flex", marginTop: 52, fontSize: 42, textAlign: "center" }}>Magento 2 extensions & expert services</div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#687386" }}>Discover. Compare. Install.</div>
    </div>,
    { width: 1200, height: 630, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=86400" } },
  );
}
