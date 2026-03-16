import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import type { JSX } from "react";

import { StatusBadge } from "@/components/ui";
import type { Opportunity } from "@/components/volunteer/types";

export function SpotsChip({ opp }: { opp: Opportunity }): JSX.Element {
  if (opp.spotsRemaining === null) {
    return <StatusBadge label="Open enrollment" color="success" />;
  }
  if (opp.spotsRemaining <= 0) {
    return <StatusBadge label="Full" color="default" />;
  }
  if (opp.spotsRemaining <= 3) {
    return (
      <StatusBadge
        label={`${opp.spotsRemaining} spot${opp.spotsRemaining === 1 ? "" : "s"} left`}
        color="warning"
        icon={<PeopleOutlineIcon />}
      />
    );
  }
  return (
    <StatusBadge
      label={`${opp.spotsRemaining} spots left`}
      color="success"
      icon={<PeopleOutlineIcon />}
    />
  );
}
