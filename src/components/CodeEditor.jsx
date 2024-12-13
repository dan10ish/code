import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Play,
  Square,
  Loader2,
  Terminal,
  X,
  Download,
  Github,
  Keyboard,
  Command,
  Maximize2,
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
    defaultCode: `import numpy as np\nimport matplotlib.pyplot as plt\nnp.random.seed(42)\nx = np.linspace(0, 10, 1000)\nfunctions = {\n'sin(x)': np.sin(x),\n'cos(x)': np.cos(x),\n'exp(x/5)': np.exp(x/5)/100,\n'log(x+1)': np.log(x+1)\n}\nplt.figure(figsize=(10, 6))\nfor name, y in functions.items():\n plt.plot(x[:200], y[:200], linewidth=2, label=name)\nplt.title('Mathematical Functions')\nplt.xlabel('x')\nplt.ylabel('y')\nplt.legend()\nplt.grid(True)\nplt.show()\ntime = np.linspace(0, 8*np.pi, 1000)\namplitude = np.exp(-0.1 * time)\nsignal = amplitude * np.sin(time)\nplt.figure(figsize=(10, 6))\nplt.plot(time, amplitude, 'r--', label='Envelope')\nplt.plot(time, -amplitude, 'r--')\nplt.plot(time, signal, 'b-', label='Signal')\nplt.title('Damped Oscillation')\nplt.xlabel('Time')\nplt.ylabel('Amplitude')\nplt.legend()\nplt.grid(True)\nplt.show()\nangles = np.linspace(0, 2*np.pi, 100)\nradius = 1 + np.sin(3*angles)\nx = radius * np.cos(angles)\ny = radius * np.sin(angles)\nplt.figure(figsize=(10, 6))\nplt.plot(x, y)\nplt.title('Parametric Curve')\nplt.axis('equal')\nplt.grid(True)\nplt.show()\nx = np.linspace(-5, 5, 100)\ny = np.linspace(-5, 5, 100)\nX, Y = np.meshgrid(x, y)\nZ = np.sin(np.sqrt(X**2 + Y**2))\nplt.figure(figsize=(10, 6))\ncontour = plt.contourf(X, Y, Z, levels=20, cmap='viridis')\nplt.colorbar(contour)\nplt.title('Wave Interference Pattern')\nplt.xlabel('x')\nplt.ylabel('y')\nplt.show()\nx = np.linspace(-3, 3, 50)\ny = np.linspace(-3, 3, 50)\nX, Y = np.meshgrid(x, y)\nZ = np.sin(np.sqrt(X**2 + Y**2))\nplt.figure(figsize=(10, 6))\nplt.imshow(Z, extent=[-3, 3, -3, 3], cmap='magma', aspect='equal')\nplt.colorbar(label='Value')\nplt.title('Surface Plot')\nplt.xlabel('x')\nplt.ylabel('y')\nplt.show()`,
  },
  javascript: {
    name: "JavaScript",
    defaultCode: `const name = await prompt("What's your name? ");\nconst age = await prompt("How old are you? ");\nconsole.log(\`Hello \${name}! You are \${age} years old.\`);`,
  },
  cpp: {
    name: "C++",
    defaultCode: `#include <iostream>\n#include <string>\n\nint main() {\n    std::string name;\n    std::string age;\n    \n    std::cout << "What's your name? ";\n    std::cin >> name;\n    \n    std::cout << "How old are you? ";\n    std::cin >> age;\n    \n    std::cout << "Hello " << name << "! You are " << age << " years old.\\n";\n    return 0;\n}`,
  },
  p5js: {
    name: "p5.js",
    defaultCode: `function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
  background(0);
}

function draw() {
  if (mouseIsPressed) {
    noStroke();
    fill(frameCount % 360, 80, 100, 0.5);
    circle(mouseX, mouseY, 20);
  }

  translate(width/2, height/2);
  let angle = frameCount * 0.1;
  let radius = frameCount % 100;
  let x = cos(angle) * radius;
  let y = sin(angle) * radius;
  noStroke();
  fill((frameCount * 2) % 360, 100, 100, 0.1);
  circle(x, y, 10);
}`,
  },
};

const SHORTCUTS = {
  toggleRunStop: {
    key: "Enter",
    modifier: "Ctrl / Command",
    description: "Run / Stop code",
  },
  toggleConsole: { key: "`", modifier: "Ctrl", description: "Toggle console" },
  increaseFontSize: {
    key: "+",
    modifier: "Ctrl",
    description: "Increase font size",
  },
  decreaseFontSize: {
    key: "-",
    modifier: "Ctrl",
    description: "Decrease font size",
  },
};

const InfoModal = ({ isOpen, onClose }) =>
  !isOpen ? null : (
    <div className="plot-modal" onClick={onClose}>
      <div className="plot-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="plot-modal-close modal-close console-close"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="info-content">
          <h2 className="info-title">Supported Features</h2>
          <div className="info-section keyboard-shortcuts-section">
            <h3 className="keyboard-section-title">
              <Keyboard size={20} strokeWidth={1.5} /> Keyboard Shortcuts
            </h3>
            <div className="keyboard-shortcuts">
              {Object.entries(SHORTCUTS).map(
                ([key, { key: shortcutKey, modifier, description }]) => (
                  <div key={key} className="keyboard-shortcut">
                    <span>
                      {modifier.split(" / ").map((mod, idx) => (
                        <React.Fragment key={idx}>
                          {mod === "Command" ? <Command size={14} /> : mod}
                          {idx < modifier.split(" / ").length - 1 && " / "}
                        </React.Fragment>
                      ))}{" "}
                      {shortcutKey}
                    </span>
                    <span>{description}</span>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="info-section">
            <h3>Python (≥ 3.9)</h3>
            <div className="library-list">
              {["numpy", "matplotlib", "pandas", "scipy"].map((lib) => (
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
                ),
              )}
            </div>
          </div>
          <div className="info-section">
            <h3>p5.js (Creative Coding)</h3>
            <div className="library-list">
              {[
                "p5.js core",
                "p5.sound",
                "canvas graphics",
                "interactive elements",
              ].map((lib) => (
                <span key={lib} className="library-item">
                  {lib}
                </span>
              ))}
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
  const editorRef = useRef(null);

  const renderOutput = useCallback(() => {
    return (
      <>
        {outputBuffer.map((item, index) => (
          <pre key={index} className={`${item.type}-text`}>
            {item.text}
          </pre>
        ))}

        {language === "p5js" && (
          <div className="p5-canvas-wrapper">
            {isRunning && <div className="p5-status">Running sketch</div>}
            <div className="p5-canvas-container">
              <div id="p5-canvas-container" />
              {isRunning && (
                <div className="canvas-actions">
                  <button
                    className="tool-button"
                    onClick={() => setSelectedPlot("p5-canvas")}
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {output?.plot &&
          output.plot.map((plotSrc, index) => (
            <div key={index} className="plot-container">
              <img src={plotSrc} alt={`Plot ${index + 1}`} />
              <div className="plot-actions">
                <button
                  className="tool-button"
                  onClick={() => setSelectedPlot(plotSrc)}
                >
                  <Maximize2 size={16} />
                </button>
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
      </>
    );
  }, [language, outputBuffer, output, isRunning]);

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

    if (language === "p5js" && window.currentP5Instance) {
      window.currentP5Instance.remove();
      delete window.currentP5Instance;
      const container = document.getElementById("p5-canvas-container");
      if (container) container.innerHTML = "";
    }

    if (inputResolver) {
      setWaitingForInput(false);
      setInputPrompt("");
      setInputValue("");
      setInputResolver(null);
    }

    setIsRunning(false);
    setIsStopping(false);
    setOutputBuffer([]);
    setOutput(null);
  };

  const runCode = useCallback(async () => {
    if (!isRunning) {
      const executeCode = async () => {
        setIsRunning(true);
        setIsStopping(false);
        setOutputBuffer([]);
        setOutput(null);
        setWaitingForInput(false);

        abortControllerRef.current = new AbortController();

        try {
          let result;
          if (language === "p5js") {
            const canvasContainer = document.getElementById(
              "p5-canvas-container",
            );
            if (canvasContainer) {
              canvasContainer.innerHTML = "";
              const createSketch = (codeString) => {
                return (p) => {
                  const globalObject = {};
                  Object.getOwnPropertyNames(p).forEach((prop) => {
                    globalObject[prop] = p[prop];
                  });

                  const wrappedCode = `
                      with (p) {
                        ${codeString}
                      }
                      if (typeof setup !== 'undefined') p.userSetup = setup;
                      if (typeof draw !== 'undefined') p.userDraw = draw;
                    `;

                  Function("p", wrappedCode)(p);

                  p.setup = function () {
                    const canvas = p.createCanvas(400, 400);
                    canvas.elt.style.pointerEvents = "none";
                    if (p.userSetup) p.userSetup();
                  };

                  p.draw = function () {
                    if (p.userDraw) p.userDraw();
                  };
                };
              };

              window.currentP5Instance = new window.p5(
                createSketch(code),
                canvasContainer,
              );
              document.querySelector(
                "#p5-canvas-container canvas",
              ).style.pointerEvents = "none";
            }
          } else {
            switch (language) {
              case "python":
                result = await compiler.runPython(
                  code,
                  abortControllerRef.current.signal,
                );
                break;
              case "javascript":
                result = await compiler.runJavaScript(
                  code,
                  handleInput,
                  abortControllerRef.current.signal,
                );
                break;
              case "cpp":
                result = await compiler.runCPP(
                  code,
                  handleInput,
                  abortControllerRef.current.signal,
                );
                break;
            }

            if (result?.output) {
              setOutputBuffer([
                {
                  text: result.output,
                  type: result.error ? "error" : "output",
                },
              ]);
            }
            if (result?.error && language !== "python") {
              setOutputBuffer((prev) => [
                ...prev,
                { text: result.error, type: "error" },
              ]);
            }
            if (result?.plot) setOutput(result);
          }
        } catch (error) {
          if (!abortControllerRef.current?.signal.aborted) {
            setOutputBuffer([{ text: error.message, type: "error" }]);
          }
        } finally {
          if (!waitingForInput) {
            setIsRunning(false);
          }
        }
      };

      if (!showConsole) {
        setShowConsole(true);
        setTimeout(executeCode, 100);
      } else {
        executeCode();
      }
    }
  }, [code, language, handleInput, isRunning, showConsole, waitingForInput]);

  const handleLanguageChange = (e) => {
    stopCode();
    setLanguage(e.target.value);
    setCode(LANGUAGES[e.target.value].defaultCode);
    setOutput(null);
    setOutputBuffer([]);
  };

  const handleConsoleClose = () => {
    stopCode();
    setShowConsole(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      if (cmdKey && e.key === SHORTCUTS.toggleRunStop.key) {
        e.preventDefault();
        if (!isRunning) {
          runCode();
        } else {
          stopCode();
        }
      } else if (e.ctrlKey && e.key === SHORTCUTS.toggleConsole.key) {
        e.preventDefault();
        setShowConsole((prev) => !prev);
      } else if (e.ctrlKey && e.key === SHORTCUTS.increaseFontSize.key) {
        e.preventDefault();
        editorRef.current?.updateOptions({
          fontSize: (editorRef.current.getOption("fontSize") || 14) + 1,
        });
      } else if (e.ctrlKey && e.key === SHORTCUTS.decreaseFontSize.key) {
        e.preventDefault();
        editorRef.current?.updateOptions({
          fontSize: Math.max(
            (editorRef.current.getOption("fontSize") || 14) - 1,
            8,
          ),
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, showConsole, runCode, stopCode]);

  return (
    <>
      <div className="editor-container">
        <div className="toolbar">
          <select
            className="language-select"
            value={language}
            onChange={handleLanguageChange}
          >
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>
          <div className="toolbar-group" style={{ marginLeft: "auto" }}>
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
              className="button-icon"
              onClick={() => setShowConsole(!showConsole)}
            >
              <Terminal size={20} />
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
              editorRef={editorRef}
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
                  onClick={handleConsoleClose}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="console-content">
                {renderOutput()}
                {(isRunning || isStopping) && !waitingForInput && (
                  <div className="console-loading">
                    <Loader2 className="spinner" size={24} />
                    <span>{isStopping ? "Stopping" : "Running"}</span>
                  </div>
                )}
                {waitingForInput && !isStopping && (
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
    </>
  );
};

export default CodeEditor;
