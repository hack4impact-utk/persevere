import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";

const KEY_PATTERN = /^[a-f0-9-]+(?:\.[a-z0-9]+)?$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
): Promise<Response> {
  const { key } = await params;

  if (!KEY_PATTERN.test(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const store = getStore("onboarding-documents");
  const blob = await store.getWithMetadata(key, { type: "stream" });

  if (!blob) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType =
    typeof blob.metadata.contentType === "string"
      ? blob.metadata.contentType
      : "application/octet-stream";

  return new Response(blob.data, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
