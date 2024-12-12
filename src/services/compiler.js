class CompilerService {
  constructor() {
    this.pyodide = null;
    this.initialized = false;
    this.initializePromise = null;
    this.loadedPackages = new Set();
    this.packageDeps = {
      numpy: [],
      matplotlib: ["numpy"],
      pandas: ["numpy"],
      scipy: ["numpy"],
      plotly: ["numpy"],
      scikit_learn: ["numpy", "scipy"],
      sympy: [],
      networkx: ["numpy"],
    };
  }

  async ensurePyodide() {
    if (this.initialized && this.pyodide) return this.pyodide;
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = (async () => {
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

      if (!window.loadPyodide) throw new Error("Pyodide failed to load");

      this.pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
      });

      await this.loadCorePackages();
      await this.setupPythonEnvironment();

      this.initialized = true;
      return this.pyodide;
    })();

    return this.initializePromise;
  }

  async loadCorePackages() {
    await this.pyodide.loadPackage(["numpy", "matplotlib"]);
    this.loadedPackages.add("numpy");
    this.loadedPackages.add("matplotlib");
  }

  async setupPythonEnvironment() {
    await this.pyodide.runPythonAsync(`
      import matplotlib
      matplotlib.use('Agg')
      import matplotlib.pyplot as plt
      import numpy as np
      import sys
      import io
      import base64
      plt.style.use('dark_background')

      SOLARIZED = {
          'base03': '#002b36',
          'base02': '#073642',
          'base01': '#586e75',
          'base0':  '#839496',
          'base1':  '#93a1a1',
          'base2':  '#eee8d5',
          'base3':  '#fdf6e3',
          'yellow': '#b58900',
          'orange': '#cb4b16',
          'red':    '#dc322f',
          'magenta':'#d33682',
          'violet': '#6c71c4',
          'blue':   '#268bd2',
          'cyan':   '#2aa198',
          'green':  '#859900',
      }

      matplotlib.rcParams.update({
          'figure.facecolor': SOLARIZED['base03'],
          'axes.facecolor': SOLARIZED['base03'],
          'axes.edgecolor': SOLARIZED['base0'],
          'axes.labelcolor': SOLARIZED['base1'],
          'text.color': SOLARIZED['base1'],
          'xtick.color': SOLARIZED['base1'],
          'ytick.color': SOLARIZED['base1'],
          'grid.color': SOLARIZED['base0'],
          'grid.alpha': 0.5,
          'grid.linewidth': 1,
          'axes.grid': True,
          'grid.linestyle': '-',
          'axes.spines.top': True,
          'axes.spines.right': True,
          'axes.spines.left': True,
          'axes.spines.bottom': True,
          'figure.figsize': [10, 6],
          'font.size': 11,
          'axes.labelsize': 11,
          'axes.titlesize': 14,
          'axes.titleweight': 'bold',
          'lines.linewidth': 2.5,
          'axes.prop_cycle': plt.cycler('color', [
              SOLARIZED['base3'],
              SOLARIZED['cyan'],
              SOLARIZED['blue'],
              SOLARIZED['yellow'],
              SOLARIZED['red'],
              SOLARIZED['magenta'],
              SOLARIZED['violet'],
              SOLARIZED['orange'],
          ]),
          'legend.facecolor': SOLARIZED['base02'],
          'legend.edgecolor': SOLARIZED['base0'],
          'legend.fontsize': 10,
          'legend.framealpha': 1.0,
          'patch.edgecolor': SOLARIZED['base0'],
          'patch.force_edgecolor': True,
          'savefig.dpi': 120,
          'savefig.bbox': 'tight',
          'savefig.facecolor': SOLARIZED['base03'],
          'savefig.edgecolor': 'none',
          'axes.axisbelow': True
      })

      def make_plot_solarized(fig):
          for ax in fig.get_axes():
              ax.set_axisbelow(True)
              for spine in ax.spines.values():
                  spine.set_color(SOLARIZED['base0'])
                  spine.set_linewidth(1)
              ax.grid(True, linestyle='-', alpha=0.5, color=SOLARIZED['base0'], linewidth=1)
              ax.tick_params(colors=SOLARIZED['base1'], width=1)
          return fig

      original_savefig = plt.savefig
      def savefig_solarized(*args, **kwargs):
          make_plot_solarized(plt.gcf())
          return original_savefig(*args, **kwargs)
      plt.savefig = savefig_solarized

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
  }

  async loadRequiredPackages(packages) {
    const toLoad = new Set();
    const stack = [...packages];

    while (stack.length) {
      const pkg = stack.pop();
      if (!this.loadedPackages.has(pkg) && this.packageDeps[pkg]) {
        toLoad.add(pkg);
        stack.push(...this.packageDeps[pkg]);
      }
    }

    if (toLoad.size) {
      try {
        await this.pyodide.loadPackage([...toLoad]);
        toLoad.forEach((pkg) => this.loadedPackages.add(pkg));
      } catch (error) {
        return { error: `Failed to load packages: ${error.message}` };
      }
    }
    return { success: true };
  }

  async detectRequiredPackages(code) {
    const imports =
      code.match(/(?:from|import)\s+([a-zA-Z0-9_]+)(?:\s+(?:import|as))?\b/g) ||
      [];
    return [
      ...new Set(
        imports
          .map((imp) => imp.split(/\s+/)[1].split(".")[0])
          .filter((pkg) => this.packageDeps.hasOwnProperty(pkg)),
      ),
    ];
  }

  async runPython(code) {
    try {
      if (/input\s*\(/.test(code))
        return {
          output: "Input not supported in Python. Use JavaScript or C++.",
          error: "Input not supported",
          plot: null,
        };

      const pyodide = await this.ensurePyodide();
      const packages = await this.detectRequiredPackages(code);
      const loadResult = await this.loadRequiredPackages(packages);

      if (loadResult.error)
        return { output: "", error: loadResult.error, plot: null };

      await pyodide.runPythonAsync(`
        plt.close('all')
        sys.stdout.content.clear()
        sys.stderr.content.clear()
      `);

      await pyodide.runPythonAsync(code);
      const output = await pyodide.runPythonAsync("sys.stdout.getvalue()");
      const plots = await this.capturePlots(pyodide);

      return {
        output: output.trim(),
        error: null,
        plot: plots.length ? plots : null,
      };
    } catch (error) {
      return { output: "", error: error.toString(), plot: null };
    }
  }

  async capturePlots(pyodide) {
    return await pyodide.runPythonAsync(`
      plots = []
      for fig_num in plt.get_fignums():
        fig = plt.figure(fig_num)
        if fig.axes:
          buf = io.BytesIO()
          fig.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='#0a0a0a', edgecolor='none')
          buf.seek(0)
          plots.append('data:image/png;base64,' + base64.b64encode(buf.read()).decode('utf-8'))
          plt.close(fig)
      plots
    `);
  }

  async runJavaScript(code, handleInput) {
    try {
      let output = "",
        error = "";
      const sandbox = {
        console: {
          log: (...args) =>
            (output +=
              args
                .map((arg) =>
                  typeof arg === "object" ? JSON.stringify(arg) : String(arg),
                )
                .join(" ") + "\n"),
          error: (...args) =>
            (error +=
              args
                .map((arg) =>
                  typeof arg === "object" ? JSON.stringify(arg) : String(arg),
                )
                .join(" ") + "\n"),
          warn: (...args) => (output += "Warning: " + args.join(" ") + "\n"),
        },
        prompt: async (text) => await handleInput(text || ""),
        alert: (msg) => (output += "Alert: " + msg + "\n"),
      };

      const fn = new Function(
        ...Object.keys(sandbox),
        `async function __run() {${code}}\n__run();`,
      );
      await fn(...Object.values(sandbox));

      return { output, error: error || null };
    } catch (error) {
      return { output: "", error: error.message };
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          compiler: "gcc-head",
          options: "warning,gnu++17",
          stdin,
        }),
      });

      if (!response.ok) throw new Error("Compilation failed");
      const result = await response.json();

      return {
        output: result.program_output || "",
        error: result.compiler_error || result.program_error || null,
      };
    } catch (error) {
      return { output: "", error: "Compilation failed: " + error.message };
    }
  }

  async runP5js(code, signal) {
    try {
      if (signal?.aborted) {
        throw new Error("Execution stopped");
      }

      return {
        output: "P5.js sketch ready",
        error: null,
        sketch: code,
      };
    } catch (error) {
      return {
        output: "",
        error: `P5.js error: ${error.toString()}`,
        sketch: null,
      };
    }
  }
}

export const compiler = new CompilerService();
