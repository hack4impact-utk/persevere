"use client";

import CampaignIcon from "@mui/icons-material/Campaign";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
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
            <CampaignIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Announcements
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <AsyncContent
            loading={loading}
            error={error}
            empty={announcements.length === 0}
            emptyMessage="No announcements yet."
          >
            <Box sx={{ overflowY: "auto", maxHeight: 240 }}>
              <Stack spacing={1.5}>
                {announcements.map((announcement) => (
                  <ButtonBase
                    key={announcement.id}
                    onClick={() => setSelected(announcement)}
                    sx={{
                      display: "block",
                      textAlign: "left",
                      width: "100%",
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      noWrap
                      sx={{ mb: 0.25 }}
                    >
                      {announcement.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(announcement.sentAt)}
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
