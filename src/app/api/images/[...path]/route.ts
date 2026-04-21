import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

import { getImageContentType } from "@/lib/image-content-type";

function getImagesBaseDir() {
  const contentDir = process.env.CONTENT_DIR || "content";
  return path.resolve(process.cwd(), contentDir, "images");
}

function resolveImageFilePath(pathSegments: string[]) {
  if (pathSegments.length === 0) {
    return null;
  }

  const imagesBaseDir = getImagesBaseDir();
  const fullPath = path.resolve(imagesBaseDir, ...pathSegments);

  if (fullPath === imagesBaseDir || !fullPath.startsWith(`${imagesBaseDir}${path.sep}`)) {
    return null;
  }

  return fullPath;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: imagePathArray } = await params;
  const fullPath = resolveImageFilePath(imagePathArray);

  if (!fullPath || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return new NextResponse("Image Not Found", { status: 404 });
  }

  const fileBuffer = await fs.promises.readFile(fullPath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": getImageContentType(fullPath),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
