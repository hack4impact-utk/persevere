import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteVolunteer,
  getVolunteerDetail,
  updateVolunteerDetail,
} from "@/services/volunteer-detail.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
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
  backgroundCheckStatus: z
    .enum(["not_required", "pending", "approved", "rejected"])
    .optional(),
  mediaRelease: z.boolean().optional(),
  availability: z
    .record(
      z.string(),
      z.union([z.string(), z.array(z.string()), z.boolean(), z.number()]),
    )
    .optional(),
  notificationPreference: z.enum(["email", "sms", "both", "none"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const json = await request.json();
    const result = volunteerUpdateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const updated = await updateVolunteerDetail(volunteerId, result.data);
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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
