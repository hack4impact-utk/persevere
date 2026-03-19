"use client";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { JSX, ReactNode } from "react";
import { useState } from "react";

export type OnboardingModuleCardProps = {
  title: string;
  description?: string;
  completionRate?: number; // 0-100
  statusNode?: ReactNode; // e.g. Chip or secondary text
  icon?: ReactNode; // Replaced image
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  // For volunteer view where we might have an explicit completion state rather than a rate
  isCompleted?: boolean;
};

export default function OnboardingModuleCard({
  title,
  description,
  completionRate,
  statusNode,
  icon,
  onClick,
  onEdit,
  onDelete,
  isCompleted,
}: OnboardingModuleCardProps): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>): void => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent): void => {
    event.stopPropagation();
    handleCloseMenu();
    onEdit?.();
  };

  const handleDelete = (event: React.MouseEvent): void => {
    event.stopPropagation();
    handleCloseMenu();
    onDelete?.();
  };

  const showMenu = onEdit || onDelete;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        },
      }}
    >
      <CardActionArea
        component="div"
        onClick={onClick}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 140,
            bgcolor: "primary.50",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {icon && (
            <Box
              sx={{
                color: "primary.main",
                display: "flex",
                opacity: 0.8,
                "& > svg": {
                  fontSize: 64,
                  filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.1))",
                },
              }}
            >
              {icon}
            </Box>
          )}

          {showMenu && (
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "background.paper",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "background.paper", opacity: 0.9 },
                zIndex: 2,
              }}
              onMouseDown={(e) => e.stopPropagation()} // Prevent card click
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <CardContent
          sx={{
            flexGrow: 1,
            pt: 3,
            pb: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
            sx={{ lineHeight: 1.3 }}
          >
            {title}
          </Typography>

          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {description}
            </Typography>
          )}

          <Box
            sx={{
              mt: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {completionRate !== undefined && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={28}
                    thickness={5}
                    sx={{ color: "divider", position: "absolute", zIndex: 0 }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={completionRate}
                    size={28}
                    thickness={5}
                    sx={{
                      color:
                        completionRate === 100
                          ? "success.main"
                          : "primary.main",
                      position: "relative",
                      zIndex: 1,
                      strokeLinecap: "round",
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ fontSize: "0.65rem", lineHeight: 1 }}
                  >
                    Completion Rate
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    display="block"
                    sx={{ mt: 0.5 }}
                  >
                    {completionRate}%
                  </Typography>
                </Box>
              </Box>
            )}

            {isCompleted !== undefined && completionRate === undefined && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={28}
                    thickness={5}
                    sx={{ color: "divider", position: "absolute", zIndex: 0 }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={isCompleted ? 100 : 0}
                    size={28}
                    thickness={5}
                    sx={{
                      color: isCompleted ? "success.main" : "primary.main",
                      position: "relative",
                      zIndex: 1,
                      strokeLinecap: "round",
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ fontSize: "0.65rem", lineHeight: 1 }}
                  >
                    Completion Status
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    display="block"
                    sx={{ mt: 0.5 }}
                  >
                    {isCompleted ? "Complete" : "Pending"}
                  </Typography>
                </Box>
              </Box>
            )}

            {statusNode && <Box ml="auto">{statusNode}</Box>}
          </Box>
        </CardContent>
      </CardActionArea>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleCloseMenu}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { minWidth: 120, mt: 0.5 },
          },
        }}
      >
        {onEdit && <MenuItem onClick={handleEdit}>Edit</MenuItem>}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}
