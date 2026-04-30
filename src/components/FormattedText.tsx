import { Fragment } from "react";

/**
 * Renderiza texto com formatação markdown básica (negrito **texto** e quebras de linha)
 * de forma segura, sem usar dangerouslySetInnerHTML.
 */
export function FormattedText({
  text,
  strongClassName = "",
}: {
  text: string;
  strongClassName?: string;
}) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          <FormattedLine line={line} strongClassName={strongClassName} />
        </Fragment>
      ))}
    </>
  );
}

function FormattedLine({
  line,
  strongClassName,
}: {
  line: string;
  strongClassName: string;
}) {
  const parts: (string | { type: "strong"; content: string })[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    parts.push({ type: "strong", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  if (parts.length === 0) {
    parts.push(line);
  }

  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <strong key={i} className={strongClassName}>
            {part.content}
          </strong>
        )
      )}
    </>
  );
}
