// Parse message content into text/code segments with language detection
export function parseMessageContent(content: string): Array<{
  type: 'text' | 'code';
  content: string;
  language?: string;
}> {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const segments = content.split('```');

  segments.forEach((segment, i) => {
    if (i % 2 === 0) {
      // Regular text
      if (segment) {
        parts.push({ type: 'text', content: segment });
      }
    } else {
      // Code block - extract language identifier
      const lines = segment.split('\n');
      const firstLine = lines[0]?.trim();
      const hasLang = firstLine && !firstLine.includes(' ') && lines.length > 1;
      const language = hasLang ? firstLine : undefined;
      const code = hasLang ? lines.slice(1).join('\n') : segment;

      parts.push({
        type: 'code',
        content: code.trim(),
        language
      });
    }
  });

  return parts;
}

// Check if content contains code blocks
export function hasCodeBlocks(content: string): boolean {
  return content.includes('```');
}

// Extract first code block with language
export function extractFirstCodeBlock(content: string): {
  code: string;
  language: string;
} | null {
  const parts = parseMessageContent(content);
  const firstCode = parts.find(p => p.type === 'code');

  if (!firstCode) return null;

  return {
    code: firstCode.content,
    language: firstCode.language || 'plaintext',
  };
}

// Count lines in code block
export function countLines(code: string): number {
  return code.split('\n').length;
}

// Simple syntax highlighter
export function getLineColor(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return '#637777'; // comments
  if (trimmed.startsWith('const ') || trimmed.startsWith('function ') ||
      trimmed.startsWith('async ') || trimmed.startsWith('return ') ||
      trimmed.startsWith('if ') || trimmed.startsWith('else ')) {
    return '#c792ea'; // keywords
  }
  return '#c2c0b2'; // default code
}
