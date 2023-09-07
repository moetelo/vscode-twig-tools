import * as vscode from 'vscode';

import { TWIG_LANGUAGE_ID } from '../constants';
import { SymfonyCommand, executeSymfonyCommand, isDockerInstalled } from '../shell/docker';
import { createTwigStaticCompletionProvider } from './staticCompletion';
import { escapeForRegex } from '../utils/regex';

type FunctionArgument = {
    identifier: string,
    defaultValue?: string,
};

type TwigFunctionLike = {
    identifier: string;
    arguments: FunctionArgument[];
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

                const argsArr = (args || '').split(',').map((arg) => arg.trim())
                    .map((arg) => {
                        const [identifier, defaultValue] = arg.split('=');
                        return {
                            identifier,
                            defaultValue,
                        };
                    });

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
    const providers = [
        createTwigStaticCompletionProvider(),
    ];

    if (!await isDockerInstalled()) {
        vscode.window.showErrorMessage('Docker is not installed, falling back to static completion.');
        return providers;
    }

    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const debugTwig = await executeSymfonyCommand(PROJECT_DIR, SymfonyCommand.DebugTwig);
    const sections = parseSections(debugTwig);

    console.log(sections);

    providers.push(
        createFunctionLikeCompletionProvider(sections.Functions, '{{'),
        createFunctionLikeCompletionProvider(sections.Filters, '|'),
        createVariableCompletionProvider(sections.Globals, '{{'),
    );

    return providers;
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
        item.documentation = variable.value;
        item.commitCharacters = ['|', '.'];

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
    }, trigger);
};


const createFunctionLikeCompletionProvider = (functions: TwigFunctionLike[], trigger: string): vscode.Disposable => {
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

    return vscode.languages.registerCompletionItemProvider(TWIG_LANGUAGE_ID, {
        provideCompletionItems(document, position, _token) {
            if (!endsWithTriggerFollowedByWords(document, position)) {
                return [];
            }

            console.log(`triggered ${trigger}`);

            return completions;
        },
    }, trigger);
};
