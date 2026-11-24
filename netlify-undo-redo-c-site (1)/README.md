# Undo & Redo Using Stacks in C — DSA Interactive Visualizer

A zero-dependency static web application demonstrating how Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) operations are implemented in C using two LIFO array-based stacks (`undoStack` and `redoStack`).

## Project Structure (Netlify Ready)

```text
├── index.html       # Semantic entry point (required by Netlify at publish root)
├── styles.css       # Responsive dark-mode styling
├── app.js           # Dual-stack state simulation, keyboard shortcuts & C code highlighter
├── undo_redo.c      # Standalone compilable C99 implementation
├── favicon.svg      # Vector site icon
├── netlify.toml     # Netlify publish directory, security headers & cache rules
├── _redirects       # Netlify clean route fallback
└── README.md        # Deployment & compilation guide
```

## Deploying to Netlify

1. **Drag & Drop (Fastest):** Extract the ZIP folder and drag the folder directly onto [app.netlify.com/drop](https://app.netlify.com/drop).
2. **Git Deployment:** Push these files to a GitHub/GitLab/Bitbucket repository, connect it in Netlify, leave **Build command** blank, and set **Publish directory** to `.` (automatically configured by `netlify.toml`).

## Compiling the C Program Locally

```bash
gcc -std=c99 -Wall -Wextra undo_redo.c -o undo_redo
./undo_redo
```
