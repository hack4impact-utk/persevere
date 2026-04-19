import type { SxProps, Theme } from "@mui/material/styles";
import type { JSX } from "react";

import { StatusBadge } from "@/components/ui";
import type { Opportunity } from "@/components/volunteer/types";

type SpotsChipProps = { opp: Opportunity; sx?: SxProps<Theme> };

export function SpotsChip({ opp, sx }: SpotsChipProps): JSX.Element {
  if (opp.spotsRemaining === null) {
    return <StatusBadge label="Open enrollment" color="success" sx={sx} />;
  }
  if (opp.spotsRemaining <= 0) {
    return <StatusBadge label="Full" color="default" sx={sx} />;
  }
  if (opp.spotsRemaining <= 3) {
    return (
      <StatusBadge
        label={`${opp.spotsRemaining} spot${opp.spotsRemaining === 1 ? "" : "s"} left`}
        color="warning"
        sx={sx}
      />
    );
  }
  return (
    <StatusBadge
      label={`${opp.spotsRemaining} spots left`}
      color="success"
      sx={sx}
    />
  );
}
