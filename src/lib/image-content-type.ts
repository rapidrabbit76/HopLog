import path from "path";

export function getImageContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".ico") return "image/x-icon";
  if (ext === ".avif") return "image/avif";

  // SVG can contain <script> and is treated as application/octet-stream
  // to prevent XSS when served from user-controlled content directories.
  return "application/octet-stream";
}
