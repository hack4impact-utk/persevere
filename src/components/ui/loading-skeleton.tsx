import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import type { JSX } from "react";

type LoadingSkeletonProps = {
  variant: "card-grid" | "lines";
  count?: number;
  columns?: { xs?: number; sm?: number; md?: number };
};

const LINE_WIDTHS = ["70%", "90%", "80%", "55%", "50%"];

export function LoadingSkeleton({
  variant,
  count,
  columns,
}: LoadingSkeletonProps): JSX.Element {
  if (variant === "card-grid") {
    const n = count ?? 6;
    const cols = columns ?? { xs: 1, sm: 2, md: 3 };
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: `repeat(${cols.xs ?? 1}, 1fr)`,
            sm: `repeat(${cols.sm ?? 2}, 1fr)`,
            md: `repeat(${cols.md ?? 3}, 1fr)`,
          },
          gap: 3,
        }}
      >
        {Array.from({ length: n }).map((_, i) => (
          <Card key={i} sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Skeleton variant="text" width="70%" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="80%" sx={{ mb: 1.5 }} />
              <Skeleton variant="text" width="55%" />
              <Skeleton variant="text" width="50%" sx={{ mb: 2 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  const n = count ?? 5;
  return (
    <Stack spacing={1.5} sx={{ py: 2 }}>
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={LINE_WIDTHS[i % LINE_WIDTHS.length]}
          height={24}
        />
      ))}
    </Stack>
  );
}
