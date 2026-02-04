import { and, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { opportunities, volunteerHours, volunteers } from "@/db/schema";
import { requireAuth } from "@/utils/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAuth("staff");
    const { id } = await params;
    const volunteerId = Number.parseInt(id, 10);

    // Validate volunteer ID
    if (Number.isNaN(volunteerId)) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    // Extract query params for filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const verified = searchParams.get("verified");

    // Build dynamic filters
    const filters = [eq(volunteerHours.volunteerId, volunteerId)];
    if (startDate) filters.push(gte(volunteerHours.date, new Date(startDate)));
    if (endDate) filters.push(lte(volunteerHours.date, new Date(endDate)));
    if (verified === "true") filters.push(isNotNull(volunteerHours.verifiedAt));
    if (verified === "false") filters.push(isNull(volunteerHours.verifiedAt));

    // 1. Fetch the list of hour records with opportunity titles
    const hoursRecords = await db
      .select({
        id: volunteerHours.id,
        date: volunteerHours.date,
        hours: volunteerHours.hours,
        notes: volunteerHours.notes,
        verifiedAt: volunteerHours.verifiedAt,
        opportunityTitle: opportunities.title,
      })
      .from(volunteerHours)
      .leftJoin(
        opportunities,
        eq(volunteerHours.opportunityId, opportunities.id),
      )
      .where(and(...filters))
      .orderBy(volunteerHours.date);

    // 2. Fetch the total sum
    const totalResult = await db
      .select({
        total: sql<number>`sum(${volunteerHours.hours})`,
      })
      .from(volunteerHours)
      .where(and(...filters));

    return NextResponse.json({
      data: hoursRecords,
      totalHours: totalResult[0]?.total || 0,
    });
  } catch (error) {
    console.error("GET Hours Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hours" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAuth("staff");
    const { id } = await params;
    const volunteerId = Number.parseInt(id, 10);

    // Validate volunteer ID
    if (Number.isNaN(volunteerId)) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    // 2. Parse and validate basic body requirements
    const body = await req.json();
    const { opportunityId, date, hours, notes } = body;

    if (!opportunityId || !date || typeof hours !== "number" || hours <= 0) {
      return NextResponse.json(
        {
          error: "Valid opportunityId, date, and positive hours are required.",
        },
        { status: 400 },
      );
    }

    // 3. Validate existence of Volunteer and Opportunity
    // We run these in parallel to keep the API snappy
    const [volunteerExists, opportunityExists] = await Promise.all([
      db
        .select()
        .from(volunteers)
        .where(eq(volunteers.id, volunteerId))
        .limit(1),
      db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, opportunityId))
        .limit(1),
    ]);

    if (volunteerExists.length === 0) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }
    if (opportunityExists.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    // 4. Insert the record
    const newEntry = await db
      .insert(volunteerHours)
      .values({
        volunteerId,
        opportunityId,
        date: new Date(date),
        hours,
        notes,
      })
      .returning();

    return NextResponse.json(newEntry[0], { status: 201 });
  } catch (error) {
    console.error("POST Hours Error:", error);
    return NextResponse.json({ error: "Failed to log hours" }, { status: 500 });
  }
}
