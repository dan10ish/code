import React, { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Trash2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Check,
  Download,
} from "lucide-react";

const LANGUAGES = {
  python: {
    name: "Python",
    defaultCode: `# Sample Code\nimport numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\nplt.figure(figsize=(8, 6))\nplt.plot(x, y, 'b-', label='sin(x)')\nplt.title('Sine Wave Plot')\nplt.xlabel('x')\nplt.ylabel('sin(x)')\nplt.grid(True)\nplt.legend()\nplt.show()`,
  },
  javascript: {
    name: "JavaScript",
    defaultCode: `// Sample Code\nconst name = await prompt("What's your name? ");\nconst age = await prompt("How old are you? ");\nconsole.log(\`Hello \${name}! You are \${age} years old.\`);`,
  },
  cpp: {
    name: "C++",
    defaultCode: `// Sample Code\n#include <iostream>\n#include <string>\n\nint main() {\n    std::string name;\n    std::string age;\n    \n    std::cout << "What's your name? ";\n    std::cin >> name;\n    \n    std::cout << "How old are you? ";\n    std::cin >> age;\n    \n    std::cout << "Hello " << name << "! You are " << age << " years old.\\n";\n    return 0;\n}`,
  },
  p5js: {
      name: 'p5.js',
      defaultCode: `function setup() {
    background(0);
    noStroke();
    colorMode(HSB);
  }
  
  function draw() {
    fill(random(360), 100, 100, 0.1);
    circle(random(width), random(height), 20);
  }`,
    },
};

const EditorTools = ({ editor, language }) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateUndoRedoState = useCallback(() => {
    const model = editor.getModel();
    if (model) {
      setCanUndo(model.canUndo());
      setCanRedo(model.canRedo());
    }
  }, [editor]);

  useEffect(() => {
    if (editor) {
      updateUndoRedoState();

      const disposables = [
        editor.onDidChangeModelContent(updateUndoRedoState),
        editor.onDidFocusEditorText(updateUndoRedoState),
      ];

      return () => {
        disposables.forEach((d) => d.dispose());
      };
    }
  }, [editor, updateUndoRedoState]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editor.getValue());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleClear = useCallback(() => {
    editor.setValue("");
    editor.focus();
    updateUndoRedoState();
  }, [editor, updateUndoRedoState]);

  const handleFontSizeChange = useCallback(
    (delta) => {
      const newSize = Math.min(Math.max(fontSize + delta, 10), 24);
      setFontSize(newSize);
      editor.updateOptions({ fontSize: newSize });
    },
    [editor, fontSize]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    editor.trigger("keyboard", "undo", null);
    updateUndoRedoState();
  }, [editor, canUndo, updateUndoRedoState]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    editor.trigger("keyboard", "redo", null);
    updateUndoRedoState();
  }, [editor, canRedo, updateUndoRedoState]);

  const handleDownload = useCallback(() => {
    const code = editor.getValue();
    const ext = 
        language === "python" ? ".py" 
        : language === "javascript" ? ".js"
        : language === "p5js" ? ".js"
        : ".cpp";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editor, language]);

  return (
    <div className="editor-tools">
      <button
        className="tool-button"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <button className="tool-button" onClick={handleClear} title="Clear">
        <Trash2 size={16} />
      </button>
      <div className="tool-divider" />
      <button
        className="tool-button"
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo size={16} />
      </button>
      <button
        className="tool-button"
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo size={16} />
      </button>
      <div className="tool-divider" />
      <button
        className="tool-button"
        onClick={() => handleFontSizeChange(-1)}
        title="Decrease font"
      >
        <ZoomOut size={16} />
      </button>
      <span className="font-size-display">{fontSize}</span>
      <button
        className="tool-button"
        onClick={() => handleFontSizeChange(1)}
        title="Increase font"
      >
        <ZoomIn size={16} />
      </button>
      <div className="tool-divider" />
      <button
        className="tool-button"
        onClick={handleDownload}
        title="Download code"
      >
        <Download size={16} />
      </button>
    </div>
  );
};

export default EditorTools;
