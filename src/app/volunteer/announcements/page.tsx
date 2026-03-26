"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX, useState } from "react";

import { AsyncContent } from "@/components/shared";
import AnnouncementDetailModal from "@/components/volunteer/announcement-detail-modal";
import type { AnnouncementItem } from "@/hooks/use-announcements";
import { useAnnouncements } from "@/hooks/use-announcements";

export default function AnnouncementsPage(): JSX.Element {
  const { announcements, loading, error } = useAnnouncements();
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 }, pb: 4 }}>
      <Typography variant="h6" fontWeight={600} mb={3}>
        Announcements
      </Typography>
      <AsyncContent
        loading={loading}
        error={error}
        empty={announcements.length === 0}
        emptyMessage="No announcements yet."
      >
        <Stack spacing={2}>
          {announcements.map((announcement) => (
            <ButtonBase
              key={announcement.id}
              onClick={() => setSelected(announcement)}
              sx={{ display: "block", textAlign: "left", width: "100%" }}
            >
              <Card
                variant="outlined"
                sx={{ "&:hover": { borderColor: "primary.main" } }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={1}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {announcement.subject}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ ml: 2, flexShrink: 0 }}
                    >
                      {new Date(announcement.sentAt).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      color: "text.secondary",
                      typography: "body2",
                      "& p": { mt: 0, mb: 0 },
                    }}
                    dangerouslySetInnerHTML={{ __html: announcement.body }}
                  />
                </CardContent>
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
