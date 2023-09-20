import 'zx/globals';
$.verbose = false;

import * as vscode from 'vscode';
import { findUsage, getAffectedRoutesCommand } from './commands';
import { PhpParserCached } from './core/PhpParserCached';
import { TwigComponentUsageParser } from './core/TwigComponentUsageParser';
import { getFilesByExtension } from './shell/git';
import { createTwigHoverProvider } from './providers/hover';
import { createTwigCompletionProviders } from './providers/completion';
import { createPhpTwigDefinitionProvider, createTwigToTwigDefinitionProvider } from './providers/definition';


export const activate = (context: vscode.ExtensionContext) => vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Twig Extension',
    cancellable: false,
}, async (progress) => {
    const reportProgress = (message: string) => progress.report({ message, increment: 100 / 5 });

    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    reportProgress('registering lightweight providers');
    context.subscriptions.push(
        createTwigHoverProvider(),
        createTwigToTwigDefinitionProvider(),
    );

    reportProgress('registering twig completion provider');
    context.subscriptions.push(...await createTwigCompletionProviders());

    reportProgress('php parser');
    const phpParser = new PhpParserCached();
    context.subscriptions.push(phpParser);

    context.subscriptions.push(createPhpTwigDefinitionProvider(phpParser));

    reportProgress('vue files');
    const vueFiles = await getFilesByExtension(PROJECT_DIR, 'vue');
    const vueComponentNames = vueFiles.map(f => f.split('/').at(-1).split('.')[0]);

    reportProgress('twigComponentUsageParser');
    const twigComponentUsageParser = new TwigComponentUsageParser(vueComponentNames);
    context.subscriptions.push(twigComponentUsageParser);
    await twigComponentUsageParser.initialize();

    context.subscriptions.push(
        vscode.commands.registerCommand('twig-tools.find-usage', () => findUsage(twigComponentUsageParser, phpParser)),
        vscode.commands.registerCommand('twig-tools.get-affected-routes', () => getAffectedRoutesCommand(twigComponentUsageParser, phpParser)),
    );
});


export function deactivate() { }
