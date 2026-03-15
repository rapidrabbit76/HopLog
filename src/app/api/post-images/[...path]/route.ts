import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { resolvePostImageFilePath } from "@/lib/post-images";

function getImageContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";

  return "application/octet-stream";
}

function splitPostImageSegments(pathSegments: string[]) {
  const imageDirIndex = pathSegments.lastIndexOf("images");

  if (imageDirIndex <= 0 || imageDirIndex === pathSegments.length - 1) {
    return null;
  }

  return {
    postPathSegments: pathSegments.slice(0, imageDirIndex),
    imagePath: pathSegments.slice(imageDirIndex + 1).join("/"),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const split = splitPostImageSegments(pathSegments);
  const fullPath = split ? resolvePostImageFilePath(split.postPathSegments, split.imagePath) : null;

  if (!fullPath || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return new NextResponse("Image Not Found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(fullPath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": getImageContentType(fullPath),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
