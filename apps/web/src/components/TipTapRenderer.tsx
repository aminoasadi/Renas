import type { ReactNode } from "react";

/**
 * Renders a TipTap editor document (structured JSON) directly to React
 * elements — no `dangerouslySetInnerHTML` anywhere in this file. Content
 * the CMS didn't put through the editor's own schema simply won't match
 * these node types and is silently skipped rather than rendered as raw
 * markup, which is what makes this safe against injected HTML even though
 * the source is "trusted" CMS content.
 */

interface TTMark {
  type: string;
  attrs?: Record<string, unknown>;
}
interface TTNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TTNode[];
  text?: string;
  marks?: TTMark[];
}

function renderMarks(text: string, marks: TTMark[] | undefined, key: number): ReactNode {
  let node: ReactNode = text;
  if (!marks) return <span key={key}>{node}</span>;

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        node = <strong>{node}</strong>;
        break;
      case "italic":
        node = <em>{node}</em>;
        break;
      case "underline":
        node = <u>{node}</u>;
        break;
      case "strike":
        node = <s>{node}</s>;
        break;
      case "code":
        node = <code>{node}</code>;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        node = (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {node}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return <span key={key}>{node}</span>;
}

function renderNode(node: TTNode, key: number): ReactNode {
  const children = node.content?.map((child, i) =>
    child.type === "text" ? renderMarks(child.text ?? "", child.marks, i) : renderNode(child, i),
  );

  switch (node.type) {
    case "doc":
      return <div key={key}>{children}</div>;
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const Tag = (level === 3 ? "h3" : level === 4 ? "h4" : "h2") as "h2" | "h3" | "h4";
      return <Tag key={key}>{children}</Tag>;
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{node.content?.map((c) => c.text).join("")}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      if (!src) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={alt} loading="lazy" />;
    }
    case "callout":
      return (
        <div key={key} className="m-callout">
          {children}
        </div>
      );
    case "table":
      return (
        <div key={key} style={{ overflowX: "auto" }}>
          <table>
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{children}</tr>;
    case "tableCell":
    case "tableHeader":
      return node.type === "tableHeader" ? <th key={key}>{children}</th> : <td key={key}>{children}</td>;
    default:
      return null;
  }
}

export function TipTapRenderer({ document }: { document: unknown }) {
  if (!document || typeof document !== "object") return null;
  const doc = document as TTNode;
  if (doc.type !== "doc") return null;
  return <div className="m-article-body">{renderNode(doc, 0)}</div>;
}
