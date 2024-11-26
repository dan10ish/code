import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import EditorTools from "./EditorTools";

const EditorContainer = ({ code, language, onChange, isRunning }) => {
  const [editor, setEditor] = useState(null);

  const handleEditorDidMount = (editor, monaco) => {
    setEditor(editor);

    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', Consolas, monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      lineHeight: 24,
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: true,
      wordWrap: "on",
      showUnused: false,
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: "off",
      tabCompletion: "off",
      parameterHints: { enabled: false },
      inlayHints: { enabled: false },
      renderControlCharacters: false,
      renderLineHighlight: "all",
      hideCursorInOverviewRuler: true,
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
      mobileOptimizedSelection: true,
    });

    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: { "editorGhostText.foreground": "#00000000" },
    });
    monaco.editor.setTheme("custom-dark");
  };

  return (
    <div className="editor-container">
      {editor && <EditorTools editor={editor} language={language} />}
      <div className="monaco-editor-wrapper">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme="custom-dark"
          options={{ readOnly: isRunning }}
          saveViewState={false}
        />
      </div>
    </div>
  );
};

export default EditorContainer;
