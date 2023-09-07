import * as vscode from 'vscode';

export function getSelectedTextIfOnlyOneSelection(): string {
    const editor = vscode.window.activeTextEditor;
    const { document, selection, selections } = editor;

    // check if there's only one selection or if the selection spans multiple lines
    if (selections.length > 1 || selection.start.line !== selection.end.line) {
        return undefined;
    }

    return getSelectedText(selections[0], document).text;
}

function getSelectedText(selection: vscode.Selection, document: vscode.TextDocument): { text: string, range: vscode.Range } {
    const range = new vscode.Range(selection.start, selection.end);

    return {
        text: range ? document.getText(range) : undefined,
        range,
    };
}
