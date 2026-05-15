"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { MobileDialog, ModalTitleBar } from "@/components/shared";
import type { AnnouncementItem } from "@/hooks/use-announcements";

type AnnouncementDetailModalProps = {
  open: boolean;
  onClose: () => void;
  announcement: AnnouncementItem | null;
};

export default function AnnouncementDetailModal({
  open,
  onClose,
  announcement,
}: AnnouncementDetailModalProps): JSX.Element {
  return (
    <MobileDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <ModalTitleBar title={announcement?.subject ?? ""} onClose={onClose} />
      <DialogContent dividers>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ mb: 2 }}
        >
          <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
            {announcement
              ? `${announcement.senderFirstName.charAt(0)}${announcement.senderLastName.charAt(0)}`.toUpperCase()
              : ""}
          </Avatar>
          <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,.6)" }}>
            {announcement
              ? `${announcement.senderFirstName} ${announcement.senderLastName}`
              : ""}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,.6)" }}>
            ·
          </Typography>
          <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,.6)" }}>
            {announcement
              ? new Date(announcement.sentAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </Typography>
        </Stack>
        <Box
          sx={{
            "& p": { mt: 0, mb: 1.5 },
            "& ul, & ol": { pl: 2.5 },
            "& h1, & h2, & h3": { mb: 1 },
          }}
          dangerouslySetInnerHTML={{ __html: announcement?.body ?? "" }}
        />
      </DialogContent>
    </MobileDialog>
  );
}
