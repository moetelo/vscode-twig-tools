import * as vscode from 'vscode';

import snippetsArr from '../../twig/snippets/filters.json';
import { TWIG_LANGUAGE_ID } from '../constants';
import { SymfonyCommand, executeSymfonyCommand, isDockerInstalled } from '../shell/docker';

export const createTwigStaticCompletionProvider = () => vscode.languages.registerCompletionItemProvider(TWIG_LANGUAGE_ID, {
    resolveCompletionItem: (item, _token) => item,
    provideCompletionItems(document, position, _token) {
        const start = new vscode.Position(position.line, 0);
        const range = new vscode.Range(start, position);
        const text = document.getText(range);

        if (text[text.length - 1] !== '|') {
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

export const createTwigCompletionProvider = async (): Promise<vscode.Disposable | null> => {
    if (!await isDockerInstalled()) {
        console.error('Docker is not installed');
        return null;
    }

    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const debugTwig = await executeSymfonyCommand(PROJECT_DIR, SymfonyCommand.DebugTwig);

    console.log(debugTwig);

    return vscode.languages.registerCompletionItemProvider(TWIG_LANGUAGE_ID, {
        resolveCompletionItem: (item, _token) => item,
        provideCompletionItems(document, position, _token) {
            return [];
        },
    }, '{{');
};
