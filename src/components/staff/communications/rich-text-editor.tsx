"use client";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import LinkIcon from "@mui/icons-material/Link";
import TitleIcon from "@mui/icons-material/Title";
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// Predefined color palette
const COLOR_PALETTE = [
  "#000000", // Black
  "#434343", // Dark Gray
  "#666666", // Gray
  "#999999", // Light Gray
  "#E53935", // Red
  "#D81B60", // Pink
  "#8E24AA", // Purple
  "#5E35B1", // Deep Purple
  "#3949AB", // Indigo
  "#1E88E5", // Blue
  "#039BE5", // Light Blue
  "#00ACC1", // Cyan
  "#00897B", // Teal
  "#43A047", // Green
  "#7CB342", // Light Green
  "#C0CA33", // Lime
  "#FDD835", // Yellow
  "#FFB300", // Amber
  "#FB8C00", // Orange
  "#F4511E", // Deep Orange
];

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number | string;
};

/**
 * RichTextEditor
 *
 * A rich text editor built on TipTap with formatting toolbar.
 * Supports bold, italic, underline, headings, lists, links, and text color.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your message...",
  disabled = false,
  minHeight = 200,
}: RichTextEditorProps): ReactElement {
  const [headingAnchorEl, setHeadingAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkAnchorEl, setLinkAnchorEl] = useState<HTMLElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: "color: #1976d2; text-decoration: underline;",
        },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false, // Required for Next.js SSR compatibility
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor-content",
        style: `min-height: ${typeof minHeight === "number" ? `${minHeight}px` : minHeight}; outline: none; padding: 12px; font-family: inherit; font-size: 14px; line-height: 1.6;`,
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Update editable state when disabled changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const handleHeadingClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setHeadingAnchorEl(event.currentTarget);
    },
    [],
  );

  const handleHeadingClose = useCallback(() => {
    setHeadingAnchorEl(null);
  }, []);

  const handleHeadingSelect = useCallback(
    (level: 1 | 2 | 3 | 0) => {
      if (!editor) return;
      if (level === 0) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level }).run();
      }
      handleHeadingClose();
    },
    [editor, handleHeadingClose],
  );

  const handleColorClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setColorAnchorEl(event.currentTarget);
    },
    [],
  );

  const handleColorClose = useCallback(() => {
    setColorAnchorEl(null);
  }, []);

  const handleColorSelect = useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().focus().setColor(color).run();
      handleColorClose();
    },
    [editor, handleColorClose],
  );

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!editor) return;

      // If there's already a link, remove it
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
        return;
      }

      // Open link popover
      const previousUrl = editor.getAttributes("link").href || "";
      setLinkUrl(previousUrl);
      setLinkAnchorEl(event.currentTarget);

      // Focus the input after popover opens
      setTimeout(() => {
        linkInputRef.current?.focus();
      }, 100);
    },
    [editor],
  );

  const handleLinkClose = useCallback(() => {
    setLinkAnchorEl(null);
    setLinkUrl("");
  }, []);

  const handleLinkSubmit = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      // Add https:// if no protocol specified
      const url = /^https?:\/\//.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().setLink({ href: url }).run();
    }

    handleLinkClose();
  }, [editor, linkUrl, handleLinkClose]);

  const handleLinkKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleLinkSubmit();
      } else if (event.key === "Escape") {
        handleLinkClose();
      }
    },
    [handleLinkSubmit, handleLinkClose],
  );

  if (!editor) {
    return <Box sx={{ minHeight }} />;
  }

  const isHeadingOpen = Boolean(headingAnchorEl);
  const isColorOpen = Boolean(colorAnchorEl);
  const isLinkOpen = Boolean(linkAnchorEl);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        "& .rich-text-editor-content": {
          flex: 1,
          overflowY: "auto",
          "& p": { margin: "0 0 8px 0" },
          "& h1": {
            fontSize: "1.75rem",
            fontWeight: 600,
            margin: "16px 0 8px",
          },
          "& h2": { fontSize: "1.5rem", fontWeight: 600, margin: "14px 0 6px" },
          "& h3": {
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: "12px 0 4px",
          },
          "& ul, & ol": { paddingLeft: "24px", margin: "8px 0" },
          "& li": { marginBottom: "4px" },
          "& a": { color: "#1976d2", textDecoration: "underline" },
          "& p.is-editor-empty:first-child::before": {
            content: `"${placeholder}"`,
            color: "#9e9e9e",
            pointerEvents: "none",
            position: "absolute",
          },
        },
        "& .ProseMirror": {
          position: "relative",
        },
        "& .ProseMirror-focused": {
          outline: "none",
        },
      }}
    >
      {/* Editor Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          border: "none",
          minHeight: 0,
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          pt: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        {/* Heading dropdown */}
        <Tooltip title="Heading">
          <IconButton
            size="small"
            onClick={handleHeadingClick}
            disabled={disabled}
            sx={{
              color: editor.isActive("heading") ? "primary.main" : "inherit",
            }}
          >
            <TitleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={headingAnchorEl}
          open={isHeadingOpen}
          onClose={handleHeadingClose}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <MenuItem onClick={() => handleHeadingSelect(0)}>
            Normal text
          </MenuItem>
          <MenuItem onClick={() => handleHeadingSelect(1)}>Heading 1</MenuItem>
          <MenuItem onClick={() => handleHeadingSelect(2)}>Heading 2</MenuItem>
          <MenuItem onClick={() => handleHeadingSelect(3)}>Heading 3</MenuItem>
        </Menu>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Bold */}
        <Tooltip title="Bold (Ctrl+B)">
          <ToggleButton
            value="bold"
            size="small"
            selected={editor.isActive("bold")}
            onChange={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            sx={{ border: "none", p: 0.5 }}
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        {/* Italic */}
        <Tooltip title="Italic (Ctrl+I)">
          <ToggleButton
            value="italic"
            size="small"
            selected={editor.isActive("italic")}
            onChange={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            sx={{ border: "none", p: 0.5 }}
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        {/* Underline */}
        <Tooltip title="Underline (Ctrl+U)">
          <ToggleButton
            value="underline"
            size="small"
            selected={editor.isActive("underline")}
            onChange={() => editor.chain().focus().toggleUnderline().run()}
            disabled={disabled}
            sx={{ border: "none", p: 0.5 }}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Bullet List */}
        <Tooltip title="Bullet List">
          <ToggleButton
            value="bulletList"
            size="small"
            selected={editor.isActive("bulletList")}
            onChange={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            sx={{ border: "none", p: 0.5 }}
          >
            <FormatListBulletedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        {/* Numbered List */}
        <Tooltip title="Numbered List">
          <ToggleButton
            value="orderedList"
            size="small"
            selected={editor.isActive("orderedList")}
            onChange={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            sx={{ border: "none", p: 0.5 }}
          >
            <FormatListNumberedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Link */}
        <Tooltip title={editor.isActive("link") ? "Remove Link" : "Add Link"}>
          <ToggleButton
            value="link"
            size="small"
            selected={editor.isActive("link")}
            onClick={handleLinkClick}
            disabled={disabled}
            sx={{ border: "none", p: 0.5 }}
          >
            <LinkIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Popover
          open={isLinkOpen}
          anchorEl={linkAnchorEl}
          onClose={handleLinkClose}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Box sx={{ p: 1.5, display: "flex", gap: 1, alignItems: "center" }}>
            <input
              ref={linkInputRef}
              type="text"
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={handleLinkKeyDown}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                width: "250px",
                outline: "none",
              }}
            />
            <IconButton size="small" onClick={handleLinkSubmit} color="primary">
              <LinkIcon fontSize="small" />
            </IconButton>
          </Box>
        </Popover>

        {/* Text Color */}
        <Tooltip title="Text Color">
          <IconButton
            size="small"
            onClick={handleColorClick}
            disabled={disabled}
            sx={{
              color: editor.getAttributes("textStyle").color || "inherit",
            }}
          >
            <FormatColorTextIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Popover
          open={isColorOpen}
          anchorEl={colorAnchorEl}
          onClose={handleColorClose}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Box
            sx={{
              p: 1.5,
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 0.5,
              width: "160px",
            }}
          >
            {COLOR_PALETTE.map((color) => (
              <Box
                key={color}
                onClick={() => handleColorSelect(color)}
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  borderRadius: "4px",
                  cursor: "pointer",
                  border: "1px solid rgba(0,0,0,0.1)",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                }}
              />
            ))}
          </Box>
        </Popover>
      </Box>
    </Box>
  );
}
