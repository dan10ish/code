import React, { useState } from "react";
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
      scrollBeyondLastLine: true,
      padding: { top: 16, bottom: 32 },
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

    monaco.editor.defineTheme("solarized-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "93a1a1" },
        { token: "keyword", foreground: "859900" },
        { token: "type", foreground: "268bd2" },
        { token: "string", foreground: "2aa198" },
        { token: "number", foreground: "d33682" },
        { token: "comment", foreground: "586e75" },
        { token: "constant", foreground: "cb4b16" },
        { token: "variable", foreground: "b58900" },
        { token: "function", foreground: "268bd2" },
      ],
      colors: {
        "editor.background": "#002b36",
        "editor.foreground": "#93a1a1",
        "editorCursor.foreground": "#93a1a1",
        "editor.lineHighlightBackground": "#073642",
        "editorLineNumber.foreground": "#586e75",
        "editor.selectionBackground": "#073642",
        "editor.inactiveSelectionBackground": "#073642",
        "editorIndentGuide.background": "#073642",
        "editorBracketMatch.background": "#073642",
        "editorBracketMatch.border": "#859900",
        "editorGutter.background": "#002b36",
        "editorGhostText.foreground": "#00000000",
      },
    });
    monaco.editor.setTheme("solarized-dark");
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
          theme="solarized-dark"
          options={{ readOnly: isRunning }}
          saveViewState={false}
        />
      </div>
    </div>
  );
};

export default EditorContainer;
