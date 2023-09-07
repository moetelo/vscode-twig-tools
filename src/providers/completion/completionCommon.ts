import * as vscode from 'vscode';

import { LanguageId } from '../../constants';
import { escapeForRegex } from '../../utils/regex';
import { TwigVariable, TwigFunctionLike } from './types';


const createContextChecker = (trigger: string) => {
    const triggerRegex = new RegExp(`${escapeForRegex(trigger)}\\s*([a-zA-Z_][a-zA-Z0-9_]*)?$`, 'g');
    const endsWithTriggerFollowedByWords = (text: string) => triggerRegex.test(text);

    return (document: vscode.TextDocument, position: vscode.Position) => {
        const start = new vscode.Position(position.line, 0);
        const range = new vscode.Range(start, position);
        const text = document.getText(range);

        return endsWithTriggerFollowedByWords(text);
    };
};


export const createVariableCompletionProvider = (variables: TwigVariable[], trigger: string): vscode.Disposable => {
    const endsWithTriggerFollowedByWords = createContextChecker(trigger);

    const completions = variables.map((variable) => {
        const item = new vscode.CompletionItem(variable.identifier, vscode.CompletionItemKind.Variable);

        item.detail = variable.value;
        item.documentation = variable.value;
        item.commitCharacters = ['|', '.'];

        return item;
    });

    return vscode.languages.registerCompletionItemProvider(LanguageId.Twig, {
        provideCompletionItems(document, position, _token) {
            if (!endsWithTriggerFollowedByWords(document, position)) {
                return [];
            }

            console.log(`triggered ${trigger}`);

            return completions;
        },
    }, trigger);
};


export const createFunctionLikeCompletionProvider = (functions: TwigFunctionLike[], trigger: string): vscode.Disposable => {
    const endsWithTriggerFollowedByWords = createContextChecker(trigger);

    // meh
    const isFilter = trigger === '|';

    const completions = functions.map((func) => {
        const item = new vscode.CompletionItem(func.identifier, vscode.CompletionItemKind.Function);

        if (isFilter) {
            item.detail = func.identifier;
            item.insertText = func.identifier;
        } else {
            const requiredArguments = func.arguments.filter((arg) => !arg.defaultValue);
            const optionalArguments = func.arguments.filter((arg) => arg.defaultValue);

            const requiredArgumentsRepr = requiredArguments.map((arg) => arg.identifier).join(', ');
            const optionalArgumentsRepr = optionalArguments.length
                ? ', [' + optionalArguments.map((arg) => `${arg.identifier} = ${arg.defaultValue}`).join(', ') + ']'
                : '';

            item.detail = `${func.identifier}(${requiredArgumentsRepr}${optionalArgumentsRepr})`;
            item.insertText = new vscode.SnippetString(`${func.identifier}(${requiredArguments.map((arg, i) => `\${${i + 1}:${arg.identifier}}`).join(', ')})`);
        }

        return item;
    });

    return vscode.languages.registerCompletionItemProvider(LanguageId.Twig, {
        provideCompletionItems(document, position, _token) {
            if (!endsWithTriggerFollowedByWords(document, position)) {
                return [];
            }

            console.log(`triggered ${trigger}`);

            return completions;
        },
    }, trigger);
};
