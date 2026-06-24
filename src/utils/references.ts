const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function extractReferences(content: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    if (!seen.has(match[1])) {
      refs.push(match[1]);
      seen.add(match[1]);
    }
  }
  return refs;
}

export function replaceReference(
  content: string,
  oldId: string,
  newId: string,
): string {
  return content.replaceAll(`[[${oldId}]]`, `[[${newId}]]`);
}
