import * as vscode from 'vscode';
import { Snippet } from '../types/Snippet';

import { TWIG_LANGUAGE_ID, snippets } from '../constants';

function createHover(snippet: Snippet) {
    const example = snippet.example || '';
    const description = snippet.description || '';

    return new vscode.Hover({
        language: 'html',
        value: description + '\n\n' + example,
    });
}

function findAndCreateHover(arr: Snippet[], word: string) {
    const snippet = arr.find(item => item.prefix === word);
    return snippet ? createHover(snippet) : null;
}

export const createTwigHoverProvider = () => vscode.languages.registerHoverProvider(TWIG_LANGUAGE_ID, {
    provideHover(document, position, _token) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        return findAndCreateHover(snippets, word);
    }
});
