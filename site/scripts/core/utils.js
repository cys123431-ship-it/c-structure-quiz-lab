export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizeOutput(text, compareMode = "default") {
  let normalized = String(text ?? "").replaceAll("\r\n", "\n").replaceAll("\t", " ");

  if (compareMode === "addressAware") {
    normalized = normalized
      .replace(/0x[0-9a-fA-F]+/g, "<addr>")
      .replace(/\b\d{8,}\b/g, "<addr>");
  }

  return normalized
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
    .trim();
}

export function normalizeTokenAnswer(text) {
  return String(text ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/;$/, "")
    .toLowerCase();
}

export function normalizeFullCode(text) {
  return String(text ?? "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}
