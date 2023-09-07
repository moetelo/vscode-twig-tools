import * as vscode from 'vscode';

import { isDockerInstalled } from '../../shell/docker';
import { createTwigStaticCompletionProvider } from './staticCompletion';
import { createFunctionLikeCompletionProvider, createVariableCompletionProvider } from './completionCommon';
import { getSectionsFromPhpDebugTwig } from './tryFromPhpDebugTwig';


export const createTwigCompletionProviders = async (): Promise<vscode.Disposable[]> => {
    const providers = [
        createTwigStaticCompletionProvider(),
    ];

    if (!await isDockerInstalled()) {
        vscode.window.showErrorMessage('Docker is not installed, falling back to static completion.');
        return providers;
    }

    const projectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const sections = await getSectionsFromPhpDebugTwig(projectDir);

    console.log(sections);

    providers.push(
        createFunctionLikeCompletionProvider(sections.Functions, '{{'),
        createFunctionLikeCompletionProvider(sections.Filters, '|'),
        createVariableCompletionProvider(sections.Globals, '{{'),
    );

    return providers;
};
