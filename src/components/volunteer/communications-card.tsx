"use client";

import CampaignIcon from "@mui/icons-material/Campaign";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX, useState } from "react";

import { AsyncContent } from "@/components/shared";
import type { AnnouncementItem } from "@/hooks/use-announcements";
import { useAnnouncements } from "@/hooks/use-announcements";

import AnnouncementDetailModal from "./announcement-detail-modal";
import { formatDate } from "./utils";

export default function AnnouncementsCard(): JSX.Element {
  const { announcements, loading, error } = useAnnouncements();
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);

  return (
    <>
      <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CampaignIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>
              Announcements
            </Typography>
          </Box>

          <AsyncContent
            loading={loading}
            error={error}
            empty={announcements.length === 0}
            emptyMessage="No announcements yet."
          >
            <Box sx={{ overflowY: "auto", maxHeight: 320 }}>
              <Stack spacing={0}>
                {announcements.map((announcement, i) => (
                  <ButtonBase
                    key={announcement.id}
                    onClick={() => setSelected(announcement)}
                    sx={{
                      display: "block",
                      textAlign: "left",
                      width: "100%",
                      py: 1.5,
                      borderTop: i === 0 ? "none" : "1px solid",
                      borderColor: "divider",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={1}>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {announcement.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" flexShrink={0}>
                        {new Date(announcement.sentAt).toLocaleString("en-US", { month: "short", day: "numeric" })}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      by {announcement.senderName || "Staff"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      lineHeight={1.45}
                      mt={0.5}
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {announcement.body}
                    </Typography>
                  </ButtonBase>
                ))}
              </Stack>
            </Box>
          </AsyncContent>

          <Box mt={2}>
            <Link
              component={NextLink}
              href="/volunteer/announcements"
              variant="body2"
              underline="hover"
            >
              View all announcements →
            </Link>
          </Box>
        </CardContent>
      </Card>
      <AnnouncementDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        announcement={selected}
      />
    </>
  );
}
