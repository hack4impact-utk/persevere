import db from "@/db";
import { volunteerHours } from "@/db/schema";
import { requireAuth } from "@/utils/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// PUT: Update or Verify hours
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Standardize Next.js 15 async params
) {
  try {
    const session = await requireAuth("staff");
    const { id } = await params;
    const hourId = parseInt(id);
    const body = await req.json();

    // 1. Fetch current record to check status
    const existingRecord = await db
      .select()
      .from(volunteerHours)
      .where(eq(volunteerHours.id, hourId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const currentRecord = existingRecord[0];
    const updateData: any = {};

    if (body.verify) {
      // Allow verification logic
      updateData.verifiedBy = session.user.id;
      updateData.verifiedAt = new Date();
    } else {
      // 2. CRITICAL FIX: Block edits if already verified
      if (currentRecord.verifiedAt !== null) {
        return NextResponse.json(
          { error: "Cannot edit hours that have already been verified." },
          { status: 403 } // Forbidden
        );
      }
      
      // Only update provided fields
      if (body.hours !== undefined) updateData.hours = body.hours;
      if (body.notes !== undefined) updateData.notes = body.notes;
    }

    const updated = await db
      .update(volunteerHours)
      .set(updateData)
      .where(eq(volunteerHours.id, hourId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: Remove hours record
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("staff");
    const hourId = parseInt(params.id);

    await db.delete(volunteerHours).where(eq(volunteerHours.id, hourId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}