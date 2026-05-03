import { NextResponse } from "next/server";
import { z } from "zod";

import {
  backgroundCheckStatusSchema,
  notificationPreferenceSchema,
} from "@/lib/status-enums";
import {
  deleteVolunteer,
  getVolunteerDetail,
  updateVolunteerDetail,
} from "@/services/volunteer-detail.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const volunteerUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.email("Invalid email address").optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
  isActive: z.boolean().optional(),
  volunteerType: z.string().optional(),
  isAlumni: z.boolean().optional(),
  backgroundCheckStatus: backgroundCheckStatusSchema.optional(),
  availability: z
    .record(
      z.string(),
      z.union([z.string(), z.array(z.string()), z.boolean(), z.number()]),
    )
    .optional(),
  notificationPreference: notificationPreferenceSchema.optional(),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  referralSource: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const data = await getVolunteerDetail(volunteerId);
    if (!data) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(request, volunteerUpdateSchema);
    if ("response" in parsed) return parsed.response;

    const updated = await updateVolunteerDetail(volunteerId, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Volunteer updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer id" },
        { status: 400 },
      );
    }

    const deleted = await deleteVolunteer(volunteerId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Volunteer deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
