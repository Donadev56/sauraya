import React from "react";
import style from "../../styles/CodeBlock.module.scss";
import { IconCopy } from "@tabler/icons-react";
type CodeBlockProps = {
  code: string;
  language?: string;
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const getFirstWord = (input: string) => {
    const match = input.match(/^\s*(\w+)/); // Capture le premier mot composé de lettres ou chiffres
    return match ? match[1] : "";
  };

  const language = getFirstWord(code);

  const formatedCodeWithoutLanguage = code.replace(
    new RegExp(/^\s*(\w+)/, ""),
    "",
  );

  return (
    <div className={style.codeBlock}>
      <div className={style.topCode}>
        <div className={style.topLeft}>
          <div className={style.circles}>
            <div className={style.circle1}></div>
            <div className={style.circle2}></div>
            <div className={style.circle3}></div>
          </div>

          {language}
        </div>

        <div className={style.topRight}>
          <IconCopy />
        </div>
      </div>
      <pre className={style.pre}>
        <code className={`${style.code} `}>{formatedCodeWithoutLanguage}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
