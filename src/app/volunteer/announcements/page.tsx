"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX, useState } from "react";

import { AsyncContent, PageHeader } from "@/components/shared";
import AnnouncementDetailModal from "@/components/volunteer/announcement-detail-modal";
import type { AnnouncementItem } from "@/hooks/use-announcements";
import { useAnnouncements } from "@/hooks/use-announcements";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function AnnouncementsPage(): JSX.Element {
  const { announcements, loading, error } = useAnnouncements();
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      <PageHeader
        eyebrow="Volunteer Portal"
        title="Announcements"
        subtitle="Stay informed with the latest updates from the team."
      />
      <AsyncContent
        loading={loading}
        error={error}
        empty={announcements.length === 0}
        emptyMessage="No announcements yet."
      >
        <Stack sx={{ gap: 1.75 }}>
          {announcements.map((announcement) => (
            <ButtonBase
              key={announcement.id}
              onClick={() => setSelected(announcement)}
              sx={{ display: "block", textAlign: "left", width: "100%" }}
            >
              <Card elevation={1} sx={{ p: 2.5, "&:hover": { boxShadow: 4 } }}>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    mb: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {announcement.subject}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
                    {getInitials(
                      announcement.senderFirstName,
                      announcement.senderLastName,
                    )}
                  </Avatar>
                  <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,.6)" }}>
                    {announcement.senderFirstName} {announcement.senderLastName}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,.6)" }}>
                    ·
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,.6)" }}>
                    {new Date(announcement.sentAt).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </Typography>
                </Stack>
              </Card>
            </ButtonBase>
          ))}
        </Stack>
      </AsyncContent>

      <AnnouncementDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        announcement={selected}
      />
    </Box>
  );
}
