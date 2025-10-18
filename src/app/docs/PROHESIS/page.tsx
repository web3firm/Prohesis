import fs from "fs";
import path from "path";
import { marked } from "marked";

export const dynamic = "force-static";

function getMarkdownHtml() {
  try {
    const file = path.resolve(process.cwd(), "docs/PROHESIS.md");
    const md = fs.readFileSync(file, "utf8");
    return marked.parse(md) as string;
  } catch {
    return "<p>Documentation file not found.</p>";
  }
}

export default function ProhesisDocs() {
  const html = getMarkdownHtml();
  return (
    <main className="max-w-3xl mx-auto p-6">
      <article className="prose prose-blue" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
