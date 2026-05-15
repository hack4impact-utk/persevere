import { randomUUID } from "node:crypto";
import path from "node:path";

import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";

import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

const ALLOWED_TYPES = new Set(["application/pdf", "video/mp4", "video/webm"]);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and video files (mp4, webm) are allowed" },
        { status: 400 },
      );
    }

    const key = `${randomUUID()}${path.extname(file.name).toLowerCase()}`;
    const store = getStore("onboarding-documents");
    await store.set(key, await file.arrayBuffer(), {
      metadata: { contentType: file.type, originalName: file.name },
    });

    return NextResponse.json(
      { url: `/api/files/onboarding-documents/${key}` },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return handleRouteError(error);
  }
}
