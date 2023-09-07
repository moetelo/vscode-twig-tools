import * as vscode from 'vscode';

import { LanguageId, snippets } from '../../constants';


export const createTwigStaticCompletionProvider = () => {
    const snippetCompletionItems = snippets
        .filter(item => item.prefix)
        .map(snippet => {
            const description = snippet.description || '';
            const example = snippet.example || '';

            const item = new vscode.CompletionItem('🖊️ ' + snippet.prefix, vscode.CompletionItemKind.Function);
            item.detail = description;
            item.documentation = description + '\n\n' + example;
            item.insertText = new vscode.SnippetString(snippet.body);

            return item;
        });

    return vscode.languages.registerCompletionItemProvider(LanguageId.Twig, {
        provideCompletionItems: () => snippetCompletionItems,
    });
};
