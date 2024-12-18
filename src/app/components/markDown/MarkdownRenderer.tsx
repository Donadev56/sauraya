// components/MarkdownRenderer.tsx
import React, { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import styles from "../../styles/MarkdownRenderer.module.scss";
import {
  IconCopy,
  IconCopyCheck,

} from "@tabler/icons-react";

interface MarkdownRendererProps {
  content: string;
  index: number;
  messagesLength: number;
}
interface CodeProps {
  inline?: boolean; // Rendre inline facultatif
  className?: string;
  children: React.ReactNode;
}


const CodeBlock: React.FC<CodeProps> = ({
  inline , 
  className,
  children,
  ...props
}) => {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "code";

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline && match ? (
    <div className={styles["code-container"]}>
      <div className={styles["code-header"]}>
        <span className={styles["code-language"]}>{language}</span>
        <button className={styles["copy-button"]} onClick={handleCopy}>
          {copied ? <IconCopyCheck /> : <IconCopy />}
        </button>
      </div>
      <SyntaxHighlighter
        customStyle={{ borderRadius : "7px" , backgroundColor: "#171717", fontSize: "14px" }}
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const components: Partial<Components> = {
  code: CodeBlock as any,
};


const MarkdownRenderer = ({
  content,
  index,
  messagesLength,
}: MarkdownRendererProps) => {
  return (
    <div
      id={index === messagesLength - 1 ? "aiCopyMessage" : ""}
      className={styles.markdown}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
