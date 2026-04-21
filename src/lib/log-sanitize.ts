/**
 * Strips control characters and ANSI escape sequences from log values
 * to prevent log injection attacks.
 *
 * Preserves: tab (\x09), printable ASCII, and non-ASCII (unicode) characters.
 * Strips: \x00–\x08, \x0a–\x1f (LF, CR, VT, FF, and other control chars), \x7f (DEL),
 *         and ANSI CSI escape sequences (\u001b[...m).
 */
export function sanitizeLogValue(value: string): string {
  // \u001b is the ESC character — matched as ANSI sequences first, then remaining control chars
  return value.replace(/\u001b\[[0-9;]*[a-zA-Z]|[\x00-\x08\x0a-\x1f\x7f]/g, "");
}
