# CodeCanvas 🎨

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fcode.danish.bio)](https://code.danish.bio)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful, lightweight online code editor supporting Python, JavaScript, and C++ with real-time compilation and data visualization capabilities.

## 🚀 [Live Demo](https://code.danish.bio)

![CodeCanvas Preview](public/preview.png)

## ✨ Features

### 🔧 Multi-Language Support

- **Python**: Data visualization with matplotlib & numpy
- **JavaScript**: Interactive input/output with async support
- **C++**: Full C++17 support with standard I/O

### 📊 Data Visualization

- Real-time plot rendering
- Interactive plot viewer
- Dark theme optimized graphs
- Export capabilities

### 💻 Editor Features

- Syntax highlighting
- Code auto-completion
- Real-time error detection
- Multiple themes
- Mobile responsive

### ⚡ Performance

- Lightweight & fast loading
- Offline support
- Efficient code compilation
- Real-time output

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Editor**: Monaco Editor
- **Python Runtime**: Pyodide
- **Styling**: CSS Variables + Tailwind
- **Icons**: Lucide React
- **Deployment**: GitHub Pages

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codecanvas.git

# Navigate to project directory
cd codecanvas

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=CodeCanvas
VITE_APP_DESCRIPTION="Interactive Online Code Editor"
```

## 📝 Configuration

### Custom Domain Setup

1. Add DNS records:

```
A     code     185.199.108.153
A     code     185.199.109.153
A     code     185.199.110.153
A     code     185.199.111.153
CNAME www.code code.danish.bio
```

2. Update CNAME in repository settings

### Editor Preferences

Modify `constants.js` for default editor settings:

```javascript
export const EDITOR_DEFAULTS = {
  theme: "vs-dark",
  fontSize: 14,
  tabSize: 2,
  // ...more settings
};
```

## 🎨 Customization

### Themes

Update CSS variables in `index.css`:

```css
:root {
  --bg-primary: #0a0a0a;
  --accent-primary: #3b82f6;
  /* ...more variables */
}
```

### Languages

Add new language support in `constants.js`:

```javascript
export const LANGUAGES = {
  python: {
    /* config */
  },
  javascript: {
    /* config */
  },
  cpp: {
    /* config */
  },
};
```

## 📱 PWA Support

CodeCanvas works offline and can be installed as a PWA:

- Installable on desktop & mobile
- Offline compilation support
- Local storage for code saves
- Push notifications (optional)

## 🔒 Security

- Secure code execution
- Sandboxed environment
- HTTPS enforced
- Input sanitization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Author

**Danish**

- Website: [danish.bio](https://danish.bio)
- GitHub: [@dan10ish](https://github.com/dan10ish)

## 🌟 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Pyodide](https://pyodide.org/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)

## 📊 Statistics

![GitHub Stars](https://img.shields.io/github/stars/dan10ish/codecanvas?style=social)
![GitHub Forks](https://img.shields.io/github/forks/dan10ish/codecanvas?style=social)
![GitHub Issues](https://img.shields.io/github/issues/dan10ish/codecanvas)
![GitHub PRs](https://img.shields.io/github/issues-pr/dan10ish/codecanvas)
