import React, { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from './icons';

declare const hljs: any;

interface CodeBlockProps {
  code: string;
  title: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, title }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isCollapsed && codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, isCollapsed]);

  if (!code || code.trim() === '') {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden my-4 border border-gray-700">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center bg-gray-700/50 px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700 hover:bg-gray-700/70 transition-colors text-left"
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 mr-2 flex-shrink-0" />
        )}
        <span>{title}</span>
      </button>
      {!isCollapsed && (
        <pre className="p-4 text-sm text-gray-300 font-mono overflow-x-auto">
          <code ref={codeRef} className="language-1c">
            {code.trim()}
          </code>
        </pre>
      )}
    </div>
  );
};

export default CodeBlock;