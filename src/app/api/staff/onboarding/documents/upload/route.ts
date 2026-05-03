import { put } from "@vercel/blob";
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

    const blob = await put(file.name, file, { access: "public" });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return handleRouteError(error);
  }
}
