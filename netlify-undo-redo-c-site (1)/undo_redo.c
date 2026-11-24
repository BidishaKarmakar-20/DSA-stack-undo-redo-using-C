#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX 100
#define STR_LEN 256

typedef struct {
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
}

void typeText(char *currentText, Stack *undoStack, Stack *redoStack, const char *newText) {
    push(undoStack, currentText);   // 1. Save snapshot before edit
    initStack(redoStack);           // 2. Clear redo history on new branch
    strncat(currentText, newText, STR_LEN - strlen(currentText) - 1);
}

void deleteText(char *currentText, Stack *undoStack, Stack *redoStack, int count) {
    int len = (int)strlen(currentText);
    if (len == 0 || count <= 0) return;
    push(undoStack, currentText);   // 1. Save snapshot before deletion
    initStack(redoStack);           // 2. Clear redo history
    currentText[(count >= len) ? 0 : (len - count)] = '\0';
}

void undo(char *currentText, Stack *undoStack, Stack *redoStack) {
    if (isEmpty(undoStack)) {
        printf("Nothing to Undo!\n");
        return;
    }
    push(redoStack, currentText);   // 1. Save current state to redoStack
    pop(undoStack, currentText);    // 2. Restore previous state from undoStack
}

void redo(char *currentText, Stack *undoStack, Stack *redoStack) {
    if (isEmpty(redoStack)) {
        printf("Nothing to Redo!\n");
        return;
    }
    push(undoStack, currentText);   // 1. Save current state back to undoStack
    pop(redoStack, currentText);    // 2. Re-apply state from redoStack
}

int main(void) {
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
}
