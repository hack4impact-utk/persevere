"use client";

import MailOutlineIcon from "@mui/icons-material/MailOutline";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX } from "react";

import { AsyncContent } from "@/components/shared";
import { useVolunteerCommunications } from "@/hooks/use-volunteer-communications";

import { formatDate } from "./utils";

export default function CommunicationsCard(): JSX.Element {
  const { communications, loading, error } = useVolunteerCommunications();

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <MailOutlineIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Communications
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <AsyncContent
          loading={loading}
          error={error}
          empty={communications.length === 0}
          emptyMessage="No communications yet."
        >
          <Box sx={{ overflowY: "auto", maxHeight: 240 }}>
            <Stack spacing={2}>
              {communications.map((comm) => (
                <Box
                  key={comm.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    noWrap
                    sx={{ mb: 0.5 }}
                  >
                    {comm.subject}
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {comm.sender
                        ? `${comm.sender.firstName} ${comm.sender.lastName}`
                        : "Staff"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flexShrink: 0, ml: 1 }}
                    >
                      {formatDate(comm.sentAt.toISOString())}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </AsyncContent>

        <Box mt={2}>
          <Link
            component={NextLink}
            href="/volunteer/communications"
            variant="body2"
            underline="hover"
          >
            View all communications →
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}
