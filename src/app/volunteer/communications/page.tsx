import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

/**
 * Volunteer communications page — full inbox for staff announcements and reminders.
 *
 * This page will display all communications sent by staff to volunteers,
 * including announcements, reminders, and updates, with subject, sender,
 * date, and full message body.
 *
 * Full implementation coming soon.
 */
export default function VolunteerCommunicationsPage(): JSX.Element {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        "& > *": { flexShrink: 0 },
        gap: 3,
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      <Typography variant="h5" fontWeight={700}>
        Communications
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Announcements, reminders, and updates from the Persevere team. Full
        inbox view coming soon.
      </Typography>
    </Box>
  );
}
