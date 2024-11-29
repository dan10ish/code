import React, { useState, useCallback, useRef } from "react";
import {
  Play,
  Square,
  Loader2,
  Terminal,
  X,
  Download,
  Github,
} from "lucide-react";
import { compiler } from "../services/compiler";
import EditorContainer from "./EditorContainer";

const InfoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="40"
    height="40"
    style={{ transform: "scale(0.6)", margin: "-10px" }}
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
    />
  </svg>
);

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

const InfoModal = ({ isOpen, onClose }) =>
  !isOpen ? null : (
    <div className="plot-modal" onClick={onClose}>
      <div className="plot-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="plot-modal-close modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="info-content">
          <h2 className="info-title">Supported Features</h2>
          <div className="info-section">
            <h3>Python (≥ 3.9)</h3>
            <div className="library-list">
              {[
                "numpy",
                "matplotlib",
                "pandas",
                "scipy",
                "plotly",
                "scikit_learn",
                "sympy",
                "networkx",
              ].map((lib) => (
                <span key={lib} className="library-item">
                  {lib}
                </span>
              ))}
            </div>
          </div>
          <div className="info-section">
            <h3>JavaScript (≥ ES2017)</h3>
            <div className="library-list">
              {[
                "async/await",
                "interactive input",
                "promises",
                "modern APIs",
              ].map((feature) => (
                <span key={feature} className="library-item">
                  {feature}
                </span>
              ))}
            </div>
          </div>
          <div className="info-section">
            <h3>C++ (≥ C++17)</h3>
            <div className="library-list">
              {["STL", "user input", "file streams", "modern features"].map(
                (feature) => (
                  <span key={feature} className="library-item">
                    {feature}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

const Attribution = () => (
  <div className="attribution">
    <div>
      Made by{" "}
      <a
        href="https://dan10ish.github.io"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="attribution-color">Danish</span>
      </a>
    </div>
  </div>
);

const PlotModal = ({ src, onClose }) =>
  !src ? null : (
    <div className="plot-modal" onClick={onClose}>
      <div className="plot-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="plot-modal-close modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <img src={src} alt="Plot" />
        <div className="plot-actions">
          <button
            className="tool-button"
            onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement("a");
              link.href = src;
              link.download = `plot.png`;
              link.click();
            }}
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );

const CodeEditor = () => {
  const [code, setCode] = useState(LANGUAGES.python.defaultCode);
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [outputBuffer, setOutputBuffer] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputResolver, setInputResolver] = useState(null);
  const abortControllerRef = useRef(null);

  const handleInput = async (prompt) => {
    if (language === "python") return "";
    return new Promise((resolve, reject) => {
      if (abortControllerRef.current?.signal.aborted) {
        reject(new Error("Execution stopped"));
        return;
      }
      setWaitingForInput(true);
      setInputPrompt(prompt || "Enter input:");
      setInputValue("");
      setInputResolver(() => (value) => {
        if (abortControllerRef.current?.signal.aborted) {
          reject(new Error("Execution stopped"));
          return;
        }
        setWaitingForInput(false);
        setInputPrompt("");
        setInputValue("");
        resolve(value);
      });
      abortControllerRef.current?.signal.addEventListener("abort", () => {
        setWaitingForInput(false);
        setInputPrompt("");
        setInputValue("");
        reject(new Error("Execution stopped"));
      });
    });
  };

  const submitInput = () => {
    if (inputResolver && !isStopping) {
      inputResolver(inputValue);
      setInputResolver(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && waitingForInput && !isStopping) {
      e.preventDefault();
      submitInput();
    }
  };

  const stopCode = async () => {
    setIsStopping(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (inputResolver) {
      setWaitingForInput(false);
      setInputPrompt("");
      setInputValue("");
      setInputResolver(null);
    }
    setTimeout(() => {
      setIsRunning(false);
      setIsStopping(false);
      setShowConsole(false);
      setOutputBuffer([]);
      setOutput(null);
    }, 500);
  };

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setIsStopping(false);
    setOutputBuffer([]);
    setOutput(null);
    setShowConsole(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let result;
      switch (language) {
        case "python":
          result = await compiler.runPython(code, signal);
          break;
        case "javascript":
          result = await compiler.runJavaScript(code, handleInput, signal);
          break;
        case "cpp":
          result = await compiler.runCPP(code, handleInput, signal);
          break;
        default:
          throw new Error(`Language ${language} not supported`);
      }

      if (signal.aborted) return;

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
      if (!signal.aborted) {
        setOutputBuffer([{ text: error.message, type: "error" }]);
      }
    } finally {
      if (!signal.aborted) {
        setIsRunning(false);
      }
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
            <Terminal size={20} />
          </button>
        </div>
        <div className="toolbar-group">
          <a
            href="https://github.com/dan10ish/code"
            target="_blank"
            rel="noopener noreferrer"
            className="button-icon"
          >
            <Github size={20} />
          </a>
          <button className="button-icon" onClick={() => setShowInfo(true)}>
            <InfoIcon />
          </button>
          <button
            className={`button ${
              isRunning || isStopping ? "button-danger" : "button-primary"
            }`}
            onClick={isRunning ? stopCode : runCode}
            disabled={isStopping}
          >
            {isRunning ? <Square size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      <div className={`editor-layout ${!showConsole ? "full" : ""}`}>
        <div className="editor-pane">
          <EditorContainer
            code={code}
            language={language}
            onChange={setCode}
            isRunning={isRunning}
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
                className="button-icon button-close"
                onClick={() => setShowConsole(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="console-content">
              {(isRunning || isStopping) && (
                <div className="console-loading">
                  <Loader2 className="spinner" size={24} />
                  <span>
                    {isStopping ? "Stopping code..." : "Running code..."}
                  </span>
                </div>
              )}
              {outputBuffer.map((item, index) => (
                <pre key={index} className={`${item.type}-text`}>
                  {item.text}
                </pre>
              ))}
              {output?.plot &&
                output.plot.map((plotSrc, index) => (
                  <div key={index} className="plot-container">
                    <img
                      src={plotSrc}
                      alt={`Plot ${index + 1}`}
                      onClick={() => setSelectedPlot(plotSrc)}
                    />
                    <div className="plot-actions">
                      <button
                        className="tool-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement("a");
                          link.href = plotSrc;
                          link.download = `plot-${index + 1}.png`;
                          link.click();
                        }}
                      >
                        <Download size={16} />
                      </button>
                    </div>
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
                    disabled={isStopping}
                  />
                  <button
                    className="console-input-button"
                    onClick={submitInput}
                    disabled={isStopping}
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
