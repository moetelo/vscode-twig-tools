import * as vscode from 'vscode';
import { Snippet } from '../types/Snippet';

import snippetsArr from '../../twig/snippets/filters.json';
import functionsArr from '../../twig/snippets/functions.json';
import twigArr from '../../twig/snippets/twig.json';
import { TWIG_LANGUAGE_ID } from '../constants';

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

        const hover = findAndCreateHover(snippetsArr, word)
            || findAndCreateHover(functionsArr, word)
            || findAndCreateHover(twigArr, word);

        return hover;
    }
});
