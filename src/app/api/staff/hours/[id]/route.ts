import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { volunteerHours } from "@/db/schema";
import { requireAuth } from "@/utils/auth";

// PUT: Update or Verify hours
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth("staff");
    const { id } = await params;
    const hourId = Number.parseInt(id, 10);
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
    const updateData: Partial<typeof volunteerHours.$inferInsert> = {};

    if (body.verify) {
      // Allow verification logic
      updateData.verifiedBy = Number.parseInt(session.user.id, 10);
      updateData.verifiedAt = new Date();
    } else {
      if (currentRecord.verifiedAt !== null) {
        return NextResponse.json(
          { error: "Cannot edit hours that have already been verified." },
          { status: 403 }, // Forbidden
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
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // 1. Authenticate
    await requireAuth("staff");

    // 2. Await the params promise to get the ID
    const { id } = await params;
    const hourId = Number.parseInt(id, 10);

    // 3. Validate the ID parsed correctly
    if (Number.isNaN(hourId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 4. Execute the delete
    await db.delete(volunteerHours).where(eq(volunteerHours.id, hourId));

    // 5. Return 204 No Content (standard for successful DELETE)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
