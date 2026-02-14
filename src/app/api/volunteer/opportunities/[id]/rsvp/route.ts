import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { volunteers } from "@/db/schema";
import { opportunities, volunteerRsvps } from "@/db/schema/opportunities";
import handleError from "@/utils/handle-error";
import { requireAuth } from "@/utils/server/auth";

/**
 * POST /api/volunteer/opportunities/[id]/rsvp
 * RSVP to an opportunity
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    // Only volunteers can RSVP
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const opportunityId = Number.parseInt(id, 10);

    if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
      return NextResponse.json(
        { message: "Invalid opportunity ID" },
        { status: 400 },
      );
    }

    // Get volunteer record for current user
    const userId = Number.parseInt(session.user.id, 10);
    const volunteer = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.userId, userId));

    if (volunteer.length === 0) {
      return NextResponse.json(
        { message: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const volunteerId = volunteer[0].id;

    // Check if opportunity exists and is open
    const opportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId));

    if (opportunity.length === 0) {
      return NextResponse.json(
        { message: "Opportunity not found" },
        { status: 404 },
      );
    }

    if (opportunity[0].status !== "open") {
      return NextResponse.json(
        { message: "Opportunity is not open for RSVPs" },
        { status: 400 },
      );
    }

    // Check if opportunity is in the future
    if (new Date(opportunity[0].startDate) <= new Date()) {
      return NextResponse.json(
        { message: "Cannot RSVP to past opportunities" },
        { status: 400 },
      );
    }

    // Check if already RSVP'd
    const existingRsvp = await db
      .select()
      .from(volunteerRsvps)
      .where(
        and(
          eq(volunteerRsvps.volunteerId, volunteerId),
          eq(volunteerRsvps.opportunityId, opportunityId),
        ),
      );

    if (existingRsvp.length > 0) {
      return NextResponse.json(
        { message: "You have already RSVP'd to this opportunity" },
        { status: 400 },
      );
    }

    // Check if opportunity is full
    if (opportunity[0].maxVolunteers !== null) {
      const rsvpCount = await db
        .select({ count: count() })
        .from(volunteerRsvps)
        .where(eq(volunteerRsvps.opportunityId, opportunityId));

      if (rsvpCount[0].count >= opportunity[0].maxVolunteers) {
        return NextResponse.json(
          { message: "This opportunity is full" },
          { status: 400 },
        );
      }
    }

    // Create RSVP
    await db.insert(volunteerRsvps).values({
      volunteerId,
      opportunityId,
      status: "pending",
    });

    return NextResponse.json(
      {
        message: "RSVP created successfully",
        data: { volunteerId, opportunityId, status: "pending" },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/volunteer/opportunities/[id]/rsvp
 * Cancel RSVP to an opportunity
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    // Only volunteers can cancel RSVPs
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const opportunityId = Number.parseInt(id, 10);

    if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
      return NextResponse.json(
        { message: "Invalid opportunity ID" },
        { status: 400 },
      );
    }

    // Get volunteer record for current user
    const userId = Number.parseInt(session.user.id, 10);
    const volunteer = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.userId, userId));

    if (volunteer.length === 0) {
      return NextResponse.json(
        { message: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const volunteerId = volunteer[0].id;

    // Check if RSVP exists
    const existingRsvp = await db
      .select()
      .from(volunteerRsvps)
      .where(
        and(
          eq(volunteerRsvps.volunteerId, volunteerId),
          eq(volunteerRsvps.opportunityId, opportunityId),
        ),
      );

    if (existingRsvp.length === 0) {
      return NextResponse.json({ message: "RSVP not found" }, { status: 404 });
    }

    // Delete RSVP
    await db
      .delete(volunteerRsvps)
      .where(
        and(
          eq(volunteerRsvps.volunteerId, volunteerId),
          eq(volunteerRsvps.opportunityId, opportunityId),
        ),
      );

    return NextResponse.json({
      message: "RSVP cancelled successfully",
      data: { volunteerId, opportunityId },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
