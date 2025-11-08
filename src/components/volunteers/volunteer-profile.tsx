import { Card, CardContent, Typography, Stack, Box, Chip, Avatar, Button } from "@mui/material";
import { volunteers, users } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Volunteer = InferSelectModel<typeof volunteers>;
type User = InferSelectModel<typeof users>;

interface VolunteerProfileProps {
  volunteer: {
    volunteers: Volunteer;
    users: User | null;
  };
}

export default function VolunteerProfile({ volunteer }: VolunteerProfileProps) {
  const { volunteers: vol, users: user } = volunteer;

  // Safety check for user data
  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">User information not found</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Personal Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                alt={`${user.firstName} ${user.lastName}`}
                sx={{ width: 80, height: 80 }}
              >
                {user.firstName[0]}
                {user.lastName[0]}
              </Avatar>
              <Box>
                <Typography variant="h5">{`${user.firstName} ${user.lastName}`}</Typography>
                <Typography color="textSecondary">{user.email}</Typography>
                {user.phone && (
                  <Typography color="textSecondary">{user.phone}</Typography>
                )}
              </Box>
            </Box>
            {user.bio && (
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Bio
                </Typography>
                <Typography>{user.bio}</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Volunteer Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Volunteer Status
          </Typography>
          <Stack spacing={2}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={`Type: ${vol.volunteerType || "Not specified"}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={vol.isAlumni ? "Alumni" : "Current Volunteer"}
                color={vol.isAlumni ? "secondary" : "success"}
                variant="outlined"
              />
              <Chip
                label={`Background Check: ${vol.backgroundCheckStatus}`}
                color={
                  vol.backgroundCheckStatus === "approved"
                    ? "success"
                    : vol.backgroundCheckStatus === "pending"
                    ? "warning"
                    : "error"
                }
                variant="outlined"
              />
              <Chip
                label={vol.mediaRelease ? "Media Release: Approved" : "Media Release: Not Approved"}
                color={vol.mediaRelease ? "success" : "warning"}
                variant="outlined"
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Availability
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {vol.availability && Array.isArray(vol.availability) ? (
              (vol.availability as string[]).map((time: string) => (
                <Chip key={time} label={time} variant="outlined" />
              ))
            ) : (
              <Typography color="textSecondary">No availability specified</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account History
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" color="textSecondary">
              Joined: {new Date(vol.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last Updated: {new Date(vol.updatedAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Notification Preference: {vol.notificationPreference}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons (Placeholders) */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button variant="outlined" color="primary">
          Edit Profile
        </Button>
        <Button variant="outlined" color="error">
          Deactivate Account
        </Button>
      </Box>
    </Stack>
  );
}