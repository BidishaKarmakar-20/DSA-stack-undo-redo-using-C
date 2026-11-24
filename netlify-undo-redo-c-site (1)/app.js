const MAX_STACK = 8;
const MAX_STR_LEN = 255;

const state = {
  currentText: "",
  undoStack: [],
  redoStack: []
};

const C_CODE_SECTIONS = [
  {
    id: "header",
    code: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX 100
#define STR_LEN 256`
  },
  {
    id: "struct",
    code: `typedef struct {
    char items[MAX][STR_LEN];
    int top;
} Stack;

void initStack(Stack *s) { s->top = -1; }
int isEmpty(Stack *s)    { return s->top == -1; }
int isFull(Stack *s)     { return s->top == MAX - 1; }

void push(Stack *s, const char *str) {
    if (isFull(s)) {
        printf("Stack Overflow! Cannot save more history.\n");
        return;
    }
    strcpy(s->items[++(s->top)], str);
}

int pop(Stack *s, char *dest) {
    if (isEmpty(s)) return 0;
    strcpy(dest, s->items[(s->top)--]);
    return 1;
}`
  },
  {
    id: "type",
    code: `void typeText(char *currentText, Stack *undoStack, Stack *redoStack, const char *newText) {
    push(undoStack, currentText);   // 1. Save snapshot before edit
    initStack(redoStack);           // 2. Clear redo history on new branch
    strncat(currentText, newText, STR_LEN - strlen(currentText) - 1);
}`
  },
  {
    id: "delete",
    code: `void deleteText(char *currentText, Stack *undoStack, Stack *redoStack, int count) {
    int len = (int)strlen(currentText);
    if (len == 0 || count <= 0) return;
    push(undoStack, currentText);   // 1. Save snapshot before deletion
    initStack(redoStack);           // 2. Clear redo history
    currentText[(count >= len) ? 0 : (len - count)] = '\0';
}`
  },
  {
    id: "undo",
    code: `void undo(char *currentText, Stack *undoStack, Stack *redoStack) {
    if (isEmpty(undoStack)) {
        printf("Nothing to Undo!\n");
        return;
    }
    push(redoStack, currentText);   // 1. Save current state to redoStack
    pop(undoStack, currentText);    // 2. Restore previous state from undoStack
}`
  },
  {
    id: "redo",
    code: `void redo(char *currentText, Stack *undoStack, Stack *redoStack) {
    if (isEmpty(redoStack)) {
        printf("Nothing to Redo!\n");
        return;
    }
    push(undoStack, currentText);   // 1. Save current state back to undoStack
    pop(redoStack, currentText);    // 2. Re-apply state from redoStack
}`
  },
  {
    id: "main",
    code: `int main(void) {
    Stack undoStack, redoStack;
    char currentText[STR_LEN] = "";
    initStack(&undoStack);
    initStack(&redoStack);

    typeText(currentText, &undoStack, &redoStack, "Hello");
    typeText(currentText, &undoStack, &redoStack, " World");
    printf("Text: %s\n", currentText); // Hello World

    undo(currentText, &undoStack, &redoStack);
    printf("After Undo: %s\n", currentText); // Hello

    redo(currentText, &undoStack, &redoStack);
    printf("After Redo: %s\n", currentText); // Hello World
    return 0;
}`
  }
];

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCCode(activeBlockId = null) {
  const codeEl = document.getElementById("cCodeBlock");
  codeEl.innerHTML = C_CODE_SECTIONS.map((sec) => {
    const isHighlighted = sec.id === activeBlockId ? " highlighted" : "";
    return `<span class="code-block-segment${isHighlighted}" data-sec="${sec.id}">${escapeHtml(sec.code)}</span>`;
  }).join("\n\n");

  document.querySelectorAll(".legend-tag").forEach((tag) => {
    tag.classList.toggle("active", tag.dataset.block === activeBlockId);
  });
}

function pushWithCap(stackArr, value) {
  if (stackArr.length >= MAX_STACK) {
    stackArr.shift(); // Drop oldest state when full in demo mode
  }
  stackArr.push(value);
}

function renderStackColumn(containerId, stackArr, topBadgeId, emptyFlagId, fullFlagId) {
  const container = document.getElementById(containerId);
  const topIndex = stackArr.length - 1;

  document.getElementById(topBadgeId).textContent = `top = ${topIndex}`;

  const emptyEl = document.getElementById(emptyFlagId);
  const fullEl = document.getElementById(fullFlagId);

  const isEmpty = stackArr.length === 0;
  const isFull = stackArr.length === MAX_STACK;

  emptyEl.textContent = `isEmpty() == ${isEmpty ? 1 : 0}`;
  emptyEl.classList.toggle("flag-active", isEmpty);

  fullEl.textContent = `isFull() == ${isFull ? 1 : 0}`;
  fullEl.classList.toggle("flag-active", isFull);

  let slotsHtml = "";
  for (let i = 0; i < MAX_STACK; i++) {
    const occupied = i < stackArr.length;
    const isTop = occupied && i === topIndex;
    const displayVal = occupied
      ? `"${escapeHtml(stackArr[i])}"`
      : "<empty>";

    slotsHtml += `
      <div class="stack-slot ${occupied ? "occupied" : ""} ${isTop ? "is-top" : ""}" role="listitem">
        <span class="slot-index">[${i}]</span>
        <span class="slot-val">${displayVal}</span>
        ${isTop ? '<span class="slot-badge">TOP</span>' : ""}
      </div>
    `;
  }
  container.innerHTML = slotsHtml;
}

function updateUI(traceMsg, activeCodeBlock = null) {
  const displayEl = document.getElementById("currentTextDisplay");
  if (state.currentText.length === 0) {
    displayEl.innerHTML = '<span class="placeholder-text">[Empty Buffer — Type or run a preset below]</span>';
  } else {
    displayEl.textContent = state.currentText;
  }

  document.getElementById("bufferLenTag").textContent = `Length: ${state.currentText.length} / ${MAX_STR_LEN}`;
  document.getElementById("undoBtn").disabled = state.undoStack.length === 0;
  document.getElementById("redoBtn").disabled = state.redoStack.length === 0;

  if (traceMsg) {
    document.getElementById("traceMessage").textContent = traceMsg;
  }

  renderStackColumn("undoStackVisual", state.undoStack, "undoTopBadge", "undoEmptyFlag", "undoFullFlag");
  renderStackColumn("redoStackVisual", state.redoStack, "redoTopBadge", "redoEmptyFlag", "redoFullFlag");
  renderCCode(activeCodeBlock);
}

function handleTypeText(rawStr) {
  if (!rawStr) return;
  const remaining = MAX_STR_LEN - state.currentText.length;
  if (remaining <= 0) {
    updateUI("Buffer full (255 chars). Cannot append more.", "type");
    return;
  }
  const chunk = rawStr.slice(0, remaining);
  pushWithCap(state.undoStack, state.currentText);
  state.redoStack = [];
  state.currentText += chunk;
  updateUI(`typeText("${chunk}") -> pushed snapshot to undoStack, cleared redoStack.`, "type");
}

function handleDeleteText(count) {
  const n = parseInt(count, 10);
  if (isNaN(n) || n <= 0 || state.currentText.length === 0) {
    updateUI("deleteText() skipped: buffer is empty or count <= 0.", "delete");
    return;
  }
  pushWithCap(state.undoStack, state.currentText);
  state.redoStack = [];
  const nextLen = Math.max(0, state.currentText.length - n);
  state.currentText = state.currentText.slice(0, nextLen);
  updateUI(`deleteText(${n}) -> pushed snapshot to undoStack, cleared redoStack.`, "delete");
}

function handleUndo() {
  if (state.undoStack.length === 0) return;
  pushWithCap(state.redoStack, state.currentText);
  state.currentText = state.undoStack.pop();
  updateUI(`undo() -> pushed current to redoStack, popped "${state.currentText}" from undoStack.`, "undo");
}

function handleRedo() {
  if (state.redoStack.length === 0) return;
  pushWithCap(state.undoStack, state.currentText);
  state.currentText = state.redoStack.pop();
  updateUI(`redo() -> pushed current to undoStack, popped "${state.currentText}" from redoStack.`, "redo");
}

function handleReset() {
  state.currentText = "";
  state.undoStack = [];
  state.redoStack = [];
  updateUI('initStack(&undoStack); initStack(&redoStack); currentText[0] = "\0";', "struct");
}

function runDemoSequence() {
  handleReset();
  const steps = [
    () => handleTypeText("DSA "),
    () => handleTypeText("Stacks "),
    () => handleTypeText("in C!"),
    () => handleUndo(),
    () => handleUndo(),
    () => handleRedo()
  ];
  steps.forEach((fn, idx) => {
    setTimeout(fn, idx * 450);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const appendInput = document.getElementById("appendInput");
  const deleteInput = document.getElementById("deleteCountInput");

  document.getElementById("typeBtn").addEventListener("click", () => {
    const val = appendInput.value;
    if (!val) return;
    handleTypeText(val);
    appendInput.value = "";
    appendInput.focus();
  });

  appendInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("typeBtn").click();
    }
  });

  document.getElementById("deleteBtn").addEventListener("click", () => {
    handleDeleteText(deleteInput.value);
  });

  document.getElementById("undoBtn").addEventListener("click", handleUndo);
  document.getElementById("redoBtn").addEventListener("click", handleRedo);
  document.getElementById("resetBtn").addEventListener("click", handleReset);
  document.getElementById("presetBtn").addEventListener("click", runDemoSequence);

  document.querySelectorAll(".legend-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      renderCCode(tag.dataset.block);
    });
  });

  document.getElementById("copyCodeBtn").addEventListener("click", async (e) => {
    const fullCode = C_CODE_SECTIONS.map((s) => s.code).join("\n\n");
    try {
      await navigator.clipboard.writeText(fullCode);
      e.target.textContent = "Copied!";
      setTimeout(() => (e.target.textContent = "Copy C Code"), 1600);
    } catch {
      e.target.textContent = "Select & Copy Manually";
    }
  });

  document.getElementById("downloadCBtn").addEventListener("click", () => {
    const fullCode = C_CODE_SECTIONS.map((s) => s.code).join("\n\n") + "\n";
    const blob = new Blob([fullCode], { type: "text/x-csrc" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "undo_redo.c";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      if (document.activeElement !== appendInput) {
        e.preventDefault();
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
      if (document.activeElement !== appendInput) {
        e.preventDefault();
        handleRedo();
      }
    }
  });

  updateUI('Initialized undoStack.top = -1, redoStack.top = -1, currentText = ""', "struct");
});
