import * as vscode from 'vscode';

import snippetsArr from '../../twig/snippets/filters.json';
import { TWIG_LANGUAGE_ID } from '../constants';

export const createTwigStaticCompletionProvider = () => vscode.languages.registerCompletionItemProvider(TWIG_LANGUAGE_ID, {
    resolveCompletionItem: (item, _token) => item,
    provideCompletionItems(document, position, _token) {
        const start = new vscode.Position(position.line, 0);
        const range = new vscode.Range(start, position);
        const text = document.getText(range);

        const trimmedText = text.trimEnd();

        if (trimmedText[trimmedText.length - 1] !== '|') {
            return [];
        }

        return snippetsArr
            .filter(item => item.text)
            .map(snippet => {
                const description = snippet.description || '';
                const example = snippet.example || '';

                const item = new vscode.CompletionItem(snippet.text || snippet.prefix, vscode.CompletionItemKind.Function);
                item.detail = description;
                item.documentation = description + '\n\n' + example;
                item.insertText = snippet.text;

                return item;
            });
    },
}, '|');
