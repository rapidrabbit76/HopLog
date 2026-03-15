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

function splitUrlSuffix(value: string) {
  const match = value.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);

  return {
    pathname: match?.[1] ?? value,
    search: match?.[2] ?? "",
    hash: match?.[3] ?? "",
  };
}

function isSafePathSegment(segment: string) {
  return Boolean(segment) && segment !== "." && segment !== ".." && !segment.includes("/") && !segment.includes("\\");
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
  const { pathname, search, hash } = splitUrlSuffix(value);
  const relativeImagePath = getRelativePostImagePath(pathname);

  if (!relativeImagePath) {
    return value;
  }

  return `${buildPublicPostImageUrl(postId, relativeImagePath)}${search}${hash}`;
}

export function resolvePostImageFilePath(postPathSegments: string[], imagePath: string | null) {
  if (postPathSegments.length === 0 || !imagePath || !postPathSegments.every(isSafePathSegment)) {
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
  const postDir = path.resolve(postsBaseDir, ...postPathSegments);

  if (postDir === postsBaseDir || !postDir.startsWith(`${postsBaseDir}${path.sep}`)) {
    return null;
  }

  const postImagesDir = path.resolve(postDir, "images");
  const fullPath = path.resolve(postImagesDir, ...normalizedImagePath.split("/"));

  if (fullPath === postImagesDir || !fullPath.startsWith(`${postImagesDir}${path.sep}`)) {
    return null;
  }

  return fullPath;
}
