class CompilerService {
  constructor() {
    this.pyodide = null;
    this.initialized = false;
    this.initializePromise = null;
  }

  async ensurePyodide() {
    if (this.initialized && this.pyodide) return this.pyodide;
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = (async () => {
      try {
        if (!document.querySelector('script[src*="pyodide.js"]')) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!window.loadPyodide)
          throw new Error("Pyodide failed to load properly");

        this.pyodide = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });

        await this.pyodide.loadPackage(["numpy", "matplotlib"]);

        await this.pyodide.runPythonAsync(`
          import matplotlib
          matplotlib.use('Agg')
          import matplotlib.pyplot as plt
          import numpy as np
          import sys
          import io
          import base64

          plt.style.use('dark_background')
          matplotlib.rcParams.update({
              'figure.facecolor': '#0a0a0a',
              'axes.facecolor': '#0a0a0a',
              'axes.edgecolor': '#404040',
              'grid.color': '#404040',
              'text.color': '#ffffff',
              'axes.labelcolor': '#ffffff',
              'xtick.color': '#ffffff',
              'ytick.color': '#ffffff',
              'axes.spines.top': True,
              'axes.spines.right': True,
              'figure.figsize': [10, 6],
              'font.size': 10
          })

          class CaptureOutput:
              def __init__(self):
                  self.content = []
              def write(self, text):
                  self.content.append(text)
              def flush(self):
                  pass
              def getvalue(self):
                  return ''.join(self.content)

          sys.stdout = CaptureOutput()
          sys.stderr = CaptureOutput()
        `);

        this.initialized = true;
        return this.pyodide;
      } catch (error) {
        this.initializePromise = null;
        throw error;
      }
    })();

    return this.initializePromise;
  }

  async runPython(code) {
    try {
      if (/input\s*\(/.test(code)) {
        return {
          output:
            "This website does not support Python input. Try JavaScript or C++.",
          error: "Input not supported",
          plot: null,
        };
      }

      const pyodide = await this.ensurePyodide();

      await pyodide.runPythonAsync(`
        plt.close('all')
        sys.stdout.content.clear()
        sys.stderr.content.clear()
      `);

      await pyodide.runPythonAsync(code);

      const output = await pyodide.runPythonAsync("sys.stdout.getvalue()");

      const plotData = await pyodide.runPythonAsync(`
        def capture_plots():
            plots = []
            fig_nums = plt.get_fignums()
            
            for fig_num in fig_nums:
                fig = plt.figure(fig_num)
                if len(fig.axes) > 0:
                    buf = io.BytesIO()
                    fig.savefig(buf, format='png', dpi=100, bbox_inches='tight', 
                              facecolor='#0a0a0a', edgecolor='none')
                    buf.seek(0)
                    plot_base64 = base64.b64encode(buf.read()).decode('utf-8')
                    plots.append(plot_base64)
                plt.close(fig)
            return plots

        capture_plots()
      `);

      return {
        output: output.trim(),
        error: null,
        plot:
          plotData && plotData.length > 0
            ? plotData.map((plot) => `data:image/png;base64,${plot}`)
            : null,
      };
    } catch (error) {
      return {
        output: "",
        error: error.toString(),
        plot: null,
      };
    }
  }

  async runJavaScript(code, handleInput) {
    try {
      let output = "";
      let error = "";

      const sandbox = {
        console: {
          log: (...args) => {
            output +=
              args
                .map((arg) =>
                  typeof arg === "object" ? JSON.stringify(arg) : String(arg)
                )
                .join(" ") + "\n";
          },
          error: (...args) => {
            error +=
              args
                .map((arg) =>
                  typeof arg === "object" ? JSON.stringify(arg) : String(arg)
                )
                .join(" ") + "\n";
          },
          warn: (...args) => {
            output += "Warning: " + args.join(" ") + "\n";
          },
        },
        prompt: async (text) => {
          const value = await handleInput(text || "");
          return value;
        },
        alert: (msg) => {
          output += "Alert: " + msg + "\n";
        },
      };

      const fn = new Function(
        ...Object.keys(sandbox),
        `async function __run() {\n${code}\n}\n__run();`
      );

      await fn(...Object.values(sandbox));

      return {
        output,
        error: error || null,
      };
    } catch (error) {
      return {
        output: "",
        error: error.message,
      };
    }
  }

  async runCPP(code, handleInput) {
    try {
      const cinMatches =
        code.match(/std::cin\s*>>\s*[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      let stdin = "";

      for (const cin of cinMatches) {
        const variable = cin.split(">>")[1].trim();
        const value = await handleInput(`Enter value for ${variable}: `);
        stdin += value + "\n";
      }

      const response = await fetch("https://wandbox.org/api/compile.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          compiler: "gcc-head",
          options: "warning,gnu++17",
          stdin,
        }),
      });

      if (!response.ok) throw new Error("Compilation API request failed");

      const result = await response.json();

      return {
        output: result.program_output || "",
        error: result.compiler_error || result.program_error || null,
      };
    } catch (error) {
      return {
        output: "",
        error: "Failed to compile C++ code: " + error.message,
      };
    }
  }
}

export const compiler = new CompilerService();
