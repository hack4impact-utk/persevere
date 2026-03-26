"use client";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { ModalTitleBar } from "@/components/shared";
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <ModalTitleBar title={announcement?.subject ?? ""} onClose={onClose} />
      <DialogContent dividers>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={2}
        >
          {announcement
            ? new Date(announcement.sentAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </Typography>
        <Box
          sx={{
            "& p": { mt: 0, mb: 1.5 },
            "& ul, & ol": { pl: 2.5 },
            "& h1, & h2, & h3": { mb: 1 },
          }}
          dangerouslySetInnerHTML={{ __html: announcement?.body ?? "" }}
        />
      </DialogContent>
    </Dialog>
  );
}
