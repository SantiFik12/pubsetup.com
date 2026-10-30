// Nginx serves originals publicly. Next's image optimizer resolves local URLs internally,
// so it needs this route to read the same files through the existing media gateway.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-f0-9]{40}\.(?:jpg|png|webp)$/.test(filename)) return new Response(null, { status: 404 });
  try {
    const origin = process.env.API_INTERNAL_URL ?? "http://gateway:8082";
    const response = await fetch(`${origin}/media/modules/${filename}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return new Response(null, { status: response.status === 404 ? 404 : 502 });
    const type = response.headers.get("content-type")?.split(";")[0];
    if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type)) return new Response(null, { status: 502 });
    return new Response(response.body, { headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
