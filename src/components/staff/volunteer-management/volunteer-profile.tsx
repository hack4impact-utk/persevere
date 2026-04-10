"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { JSX, useState } from "react";

import type { FetchVolunteerByIdResult } from "@/services/volunteer-client.service";

import { VolunteerImpactTab } from "./volunteer-impact-tab";
import { VolunteerOverviewTab } from "./volunteer-overview-tab";

type VolunteerProfileProps = {
  volunteer: FetchVolunteerByIdResult;
  onDelete?: () => void;
  onVolunteerUpdated?: () => void;
};

export default function VolunteerProfile({
  volunteer,
  onDelete,
  onVolunteerUpdated,
}: VolunteerProfileProps): JSX.Element {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_e, v: number) => setTab(v)}
          aria-label="Volunteer detail tabs"
        >
          <Tab
            label="Overview"
            id="volunteer-tab-0"
            aria-controls="volunteer-tabpanel-0"
          />
          <Tab
            label="Service & Impact"
            id="volunteer-tab-1"
            aria-controls="volunteer-tabpanel-1"
          />
        </Tabs>
      </Box>

      <Box
        role="tabpanel"
        hidden={tab !== 0}
        id="volunteer-tabpanel-0"
        aria-labelledby="volunteer-tab-0"
      >
        {tab === 0 && (
          <Box sx={{ pt: 3 }}>
            <VolunteerOverviewTab
              volunteer={volunteer}
              onVolunteerUpdated={onVolunteerUpdated}
              onDelete={onDelete}
            />
          </Box>
        )}
      </Box>

      <Box
        role="tabpanel"
        hidden={tab !== 1}
        id="volunteer-tabpanel-1"
        aria-labelledby="volunteer-tab-1"
      >
        {tab === 1 && (
          <Box sx={{ pt: 3 }}>
            <VolunteerImpactTab volunteer={volunteer} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
