import * as vscode from 'vscode';

import { TWIG_LANGUAGE_ID } from '../constants';
import { SymfonyCommand, executeSymfonyCommand, isDockerInstalled } from '../shell/docker';
import { createTwigStaticCompletionProvider } from './staticCompletion';
import { escapeForRegex } from '../utils/regex';

type TwigFunctionLike = {
    identifier: string;
    arguments: string[];
};

type TwigVariable = {
    identifier: string;
    value: string;
};

type TwigDebugSections = {
    Filters: TwigFunctionLike[];
    Functions: TwigFunctionLike[];
    Globals: TwigVariable[];
    Tests: string[];
};

const sectionLineRegex: Record<keyof TwigDebugSections, RegExp> = {
    'Filters': /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*)(?:\((?<args>[^)]*)\))?/,
    'Functions': /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*)\((?<args>[^)]*)\)/,
    'Globals': /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*) = (?<args>.+)/,
    'Tests': /^\* (?<identifier>[a-z ]+)/,
};

const headerRegex = /^([A-Za-z ]+)$/;

const skippedSections = [
    'Loader Paths',
    'Namespace       Paths',
];


const parseSections = (input: string): TwigDebugSections => {
    const sections: TwigDebugSections = {
        Filters: [],
        Functions: [],
        Globals: [],
        Tests: [],
    };

    let currentSectionName = '';

    const lines = input.split('\n').map((line) => line.trim());

    for (const line of lines) {
        const sectionHeaderMatch = line.match(headerRegex);
        if (sectionHeaderMatch) {
            currentSectionName = sectionHeaderMatch[1].trim();
            sections[currentSectionName] = [];
            continue;
        }

        const section = sections[currentSectionName];
        if (skippedSections.includes(currentSectionName)) {
            continue;
        }

        if (currentSectionName) {
            const sectionLineMatch = line.match(sectionLineRegex[currentSectionName]);
            if (sectionLineMatch) {
                const { identifier, args } = sectionLineMatch.groups!;

                if (currentSectionName === 'Globals') {
                    section.push({
                        identifier,
                        value: args,
                    });

                    continue;
                }

                if (currentSectionName === 'Tests') {
                    section.push(identifier);
                    continue;
                }

                const argsArr = (args || '').split(',').map((arg) => arg.trim());
                section.push({
                    identifier,
                    arguments: argsArr,
                });
            }
        }
    }

    return sections;
};


export const createTwigCompletionProviders = async (): Promise<vscode.Disposable[]> => {
    if (!await isDockerInstalled()) {
        vscode.window.showErrorMessage('Docker is not installed, falling back to static completion.');
        return [
            createTwigStaticCompletionProvider(),
        ];
    }

    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const debugTwig = await executeSymfonyCommand(PROJECT_DIR, SymfonyCommand.DebugTwig);
    const sections = parseSections(debugTwig);

    console.log(sections);

    return [
        createFunctionLikeCompletionProvider(sections.Functions, '{{'),
        createFunctionLikeCompletionProvider(sections.Filters, '|'),
        createVariableCompletionProvider(sections.Globals, '{{'),
    ];
};

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


const createVariableCompletionProvider = (variables: TwigVariable[], trigger: string): vscode.Disposable => {
    const endsWithTriggerFollowedByWords = createContextChecker(trigger);

    const completions = variables.map((variable) => {
        const item = new vscode.CompletionItem(variable.identifier, vscode.CompletionItemKind.Variable);

        item.detail = variable.value;

        return item;
    });

    return vscode.languages.registerCompletionItemProvider(TWIG_LANGUAGE_ID, {
        provideCompletionItems(document, position, _token) {
            if (!endsWithTriggerFollowedByWords(document, position)) {
                return [];
            }

            console.log(`triggered ${trigger}`);

            return completions;
        },
    });
};


const createFunctionLikeCompletionProvider = (functions: TwigFunctionLike[], trigger: string): vscode.Disposable => {
    const endsWithTriggerFollowedByWords = createContextChecker(trigger);

    const completions = functions.map((func) => new vscode.CompletionItem(func.identifier, vscode.CompletionItemKind.Function));

    return vscode.languages.registerCompletionItemProvider(TWIG_LANGUAGE_ID, {
        provideCompletionItems(document, position, _token) {
            if (!endsWithTriggerFollowedByWords(document, position)) {
                return [];
            }

            console.log(`triggered ${trigger}`);

            return completions;
        },
    });
};
