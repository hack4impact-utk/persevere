import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { type ReactElement, type ReactNode } from "react";

type ModalTitleBarProps = {
  title: ReactNode;
  onClose: () => void;
};

export function ModalTitleBar({
  title,
  onClose,
}: ModalTitleBarProps): ReactElement {
  return (
    <DialogTitle>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">{title}</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
  );
}
