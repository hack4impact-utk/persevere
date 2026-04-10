import { Box } from "@mui/material";
import { notFound } from "next/navigation";
import { JSX } from "react";

import VolunteerProfile from "@/components/staff/volunteer-management/volunteer-profile";
import { fetchVolunteerById } from "@/services/volunteer-client.service";

type PageProps = {
  params: { id: string };
};

export default async function VolunteerDetailPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const volunteer = await fetchVolunteerById(Number(params.id));

  if (!volunteer) {
    notFound();
  }

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <VolunteerProfile volunteer={volunteer} />
    </Box>
  );
}
