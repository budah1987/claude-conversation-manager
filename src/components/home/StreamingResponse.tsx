'use client';

import { useState, useEffect, useRef } from 'react';

interface StreamingResponseProps {
  content: string;
  onComplete: () => void;
}

function renderInline(text: string) {
  const parts: (string | React.ReactElement)[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function TextBlock({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((para, i) => {
        if (!para.trim()) return null;
        const lines = para.split('\n');

        const nonEmpty = lines.filter((l) => l.trim());
        const allList =
          nonEmpty.length > 0 && nonEmpty.every((l) => l.trimStart().startsWith('- '));

        if (allList) {
          return (
            <ul key={i} className={`list-disc pl-5 space-y-1 ${i > 0 ? 'mt-4' : ''}`}>
              {nonEmpty.map((line, j) => (
                <li key={j}>{renderInline(line.trimStart().slice(2))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className={i > 0 ? 'mt-4' : ''}>
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

export function StreamingResponse({ content, onComplete }: StreamingResponseProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const words = useRef(content.split(/(\s+)/));
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => {
        const next = prev + 1;
        if (next >= words.current.length) {
          clearInterval(interval);
          onCompleteRef.current();
          return words.current.length;
        }
        return next;
      });
    }, 12);

    return () => clearInterval(interval);
  }, []);

  const visibleText = words.current.slice(0, wordIndex).join('');

  return (
    <div
      className="text-[16px] leading-[1.6]"
      style={{
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)',
      }}
    >
      <TextBlock text={visibleText} />
    </div>
  );
}
