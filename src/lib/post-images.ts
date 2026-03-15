import path from "path";

function getContentDir() {
  return process.env.CONTENT_DIR || "content";
}

function encodePathSegments(segments: string[]) {
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

function buildPublicPostImageUrl(postId: string, relativeImagePath: string) {
  return `/posts/${encodePathSegments(postId.split("/"))}/images/${encodePathSegments(relativeImagePath.split("/"))}`;
}

function normalizeImageAssetPath(value: string) {
  const normalized = value.replace(/\\/g, "/");
  const trimmed = normalized.startsWith("./") ? normalized.slice(2) : normalized;

  if (!trimmed.startsWith("images/")) {
    return null;
  }

  const resolved = path.posix.normalize(trimmed);

  if (resolved === "images" || !resolved.startsWith("images/")) {
    return null;
  }

  return resolved.slice("images/".length);
}

export function getRelativePostImagePath(value: string) {
  if (!value || value.startsWith("/") || value.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(value)) {
    return null;
  }

  return normalizeImageAssetPath(value);
}

export function resolvePostImageUrl(postId: string, value: string) {
  const relativeImagePath = getRelativePostImagePath(value);

  if (!relativeImagePath) {
    return value;
  }

  return buildPublicPostImageUrl(postId, relativeImagePath);
}

export function resolvePostImageFilePath(postPathSegments: string[], imagePath: string | null) {
  if (postPathSegments.length === 0 || !imagePath) {
    return null;
  }

  const normalizedImagePath = path.posix.normalize(imagePath.replace(/\\/g, "/"));

  if (
    normalizedImagePath === "." ||
    normalizedImagePath === ".." ||
    normalizedImagePath.startsWith("../") ||
    normalizedImagePath.includes("/../")
  ) {
    return null;
  }

  const postsBaseDir = path.resolve(process.cwd(), getContentDir(), "posts");
  const postImagesDir = path.resolve(postsBaseDir, ...postPathSegments, "images");
  const fullPath = path.resolve(postImagesDir, ...normalizedImagePath.split("/"));

  if (fullPath === postImagesDir || !fullPath.startsWith(`${postImagesDir}${path.sep}`)) {
    return null;
  }

  return fullPath;
}
