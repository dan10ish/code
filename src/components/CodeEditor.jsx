import React, { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, Terminal, X, Info } from "lucide-react";
import { compiler } from "../services/compiler";

const LANGUAGES = {
  python: {
    name: "Python",
    defaultCode: `import numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\nplt.figure(figsize=(8, 6))\nplt.plot(x, y, 'b-', label='sin(x)')\nplt.title('Sine Wave Plot')\nplt.xlabel('x')\nplt.ylabel('sin(x)')\nplt.grid(True)\nplt.legend()\nplt.show()`,
  },
  javascript: {
    name: "JavaScript",
    defaultCode: `const name = await prompt("What's your name? ");\nconst age = await prompt("How old are you? ");\nconsole.log(\`Hello \${name}! You are \${age} years old.\`);`,
  },
  cpp: {
    name: "C++",
    defaultCode: `#include <iostream>\n#include <string>\n\nint main() {\n    std::string name;\n    std::string age;\n    \n    std::cout << "What's your name? ";\n    std::cin >> name;\n    \n    std::cout << "How old are you? ";\n    std::cin >> age;\n    \n    std::cout << "Hello " << name << "! You are " << age << " years old.\\n";\n    return 0;\n}`,
  },
};

const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="plot-modal" onClick={onClose}>
      <div className="plot-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="plot-modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="info-content">
          <h2 className="info-title">Code Editor Features</h2>

          <div className="info-section">
            <h3>Python</h3>
            <ul>
              <li>Data visualization with matplotlib</li>
              <li>NumPy for numerical computations</li>
              <li>Input functionality not supported</li>
              <li>Real-time output display</li>
            </ul>
          </div>

          <div className="info-section">
            <h3>JavaScript</h3>
            <ul>
              <li>Full interactive input support via prompt()</li>
              <li>Console output capture</li>
              <li>Async/await support</li>
            </ul>
          </div>

          <div className="info-section">
            <h3>C++</h3>
            <ul>
              <li>Interactive input support via std::cin</li>
              <li>Standard I/O streams</li>
              <li>C++17 support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Attribution = () => (
  <div className="attribution">
    <a
      href="https://dan10ish.github.io"
      target="_blank"
      rel="noopener noreferrer"
    >
      Made by <span className="attribution-color">Danish</span>
    </a>
  </div>
);

const PlotModal = ({ src, onClose }) =>
  src && (
    <div className="plot-modal" onClick={onClose}>
      <div className="plot-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="plot-modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <img src={src} alt="Plot" />
      </div>
    </div>
  );

const CodeEditor = () => {
  const [code, setCode] = useState(LANGUAGES.python.defaultCode);
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [outputBuffer, setOutputBuffer] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputResolver, setInputResolver] = useState(null);

  const handleEditorDidMount = (editor, monaco) => {
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
      colors: {
        "editorGhostText.foreground": "#00000000",
      },
    });
    monaco.editor.setTheme("custom-dark");
  };

  const handleInput = async (prompt) => {
    if (language === "python") return "";
    return new Promise((resolve) => {
      setWaitingForInput(true);
      setInputPrompt(prompt || "Enter input:");
      setInputValue("");
      setInputResolver(() => (value) => {
        setWaitingForInput(false);
        setInputPrompt("");
        setInputValue("");
        resolve(value);
      });
    });
  };

  const submitInput = () => {
    if (inputResolver) {
      inputResolver(inputValue);
      setInputResolver(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && waitingForInput) {
      e.preventDefault();
      submitInput();
    }
  };

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutputBuffer([]);
    setOutput(null);
    setShowConsole(true);
    try {
      let result;
      switch (language) {
        case "python":
          result = await compiler.runPython(code);
          break;
        case "javascript":
          result = await compiler.runJavaScript(code, handleInput);
          break;
        case "cpp":
          result = await compiler.runCPP(code, handleInput);
          break;
        default:
          throw new Error(`Language ${language} not supported`);
      }
      if (result.output) {
        setOutputBuffer([
          { text: result.output, type: result.error ? "error" : "output" },
        ]);
      }
      if (result.error && language !== "python") {
        setOutputBuffer((prev) => [
          ...prev,
          { text: result.error, type: "error" },
        ]);
      }
      if (result.plot) setOutput(result);
    } catch (error) {
      setOutputBuffer([{ text: error.message, type: "error" }]);
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  return (
    <div className="editor-container">
      <div className="toolbar">
        <div className="toolbar-group">
          <select
            className="language-select"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setCode(LANGUAGES[e.target.value].defaultCode);
              setOutput(null);
              setOutputBuffer([]);
            }}
          >
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            className="button-icon"
            onClick={() => setShowConsole(!showConsole)}
          >
            <Terminal size={16} />
          </button>
        </div>
        <div className="toolbar-group">
          <button className="button-icon" onClick={() => setShowInfo(true)}>
            <Info size={16} />
          </button>
          <button
            className="button button-primary"
            onClick={runCode}
            disabled={isRunning || waitingForInput}
          >
            {isRunning ? (
              <Loader2 className="spinner" size={16} />
            ) : (
              <Play size={16} />
            )}
            <span>{isRunning ? "Running..." : "Run"}</span>
          </button>
        </div>
      </div>

      <div className={`editor-layout ${!showConsole ? "full" : ""}`}>
        <div className="editor-pane">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={setCode}
            onMount={handleEditorDidMount}
            theme="custom-dark"
            options={{ readOnly: isRunning }}
          />
        </div>

        {showConsole && (
          <div className={`console-panel ${showConsole ? "show" : ""}`}>
            <div className="console-header">
              <div className="console-header-text">
                <Terminal size={16} />
                <span>Output</span>
              </div>
              <button
                className="button-icon"
                onClick={() => setShowConsole(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="console-content">
              {isRunning && (
                <div className="console-loading">
                  <Loader2 size={24} className="console-loading-icon" />
                  <span>Running code...</span>
                </div>
              )}
              {outputBuffer.map((item, index) => (
                <pre key={index} className={`${item.type}-text`}>
                  {item.text}
                </pre>
              ))}
              {output?.plot &&
                output.plot.map((plotSrc, index) => (
                  <div
                    key={index}
                    className="plot-container"
                    onClick={() => setSelectedPlot(plotSrc)}
                  >
                    <img src={plotSrc} alt={`Plot ${index + 1}`} />
                  </div>
                ))}
              {waitingForInput && (
                <div className="console-input-container">
                  <input
                    type="text"
                    className="console-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={inputPrompt}
                    autoFocus
                  />
                  <button
                    className="console-input-button"
                    onClick={submitInput}
                  >
                    Enter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <PlotModal src={selectedPlot} onClose={() => setSelectedPlot(null)} />
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      <Attribution />
    </div>
  );
};

export default CodeEditor;