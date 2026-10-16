/** Plain CV text only: preserve paragraphs and render bullet groups without HTML. */
export function SchoolFormattedText({ text }: { text: string }) {
  const blocks: { type: "paragraph" | "list"; lines: string[] }[] = [];
  let separate = true;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) { separate = true; continue; }
    const bullet = line.match(/^\s*[•*-]\s+(.+)$/);
    const type = bullet ? "list" : "paragraph";
    const last = blocks.at(-1);
    const value = bullet ? bullet[1] : line;
    if (!separate && last?.type === type) last.lines.push(value);
    else blocks.push({ type, lines: [value] });
    separate = false;
  }
  return <div className="school-quote-formatted">{blocks.map((block, index) => block.type === "list"
    ? <ul key={index}>{block.lines.map((line, i) => <li key={i}>{line}</li>)}</ul>
    : <p key={index}>{block.lines.join("\n")}</p>)}</div>;
}
