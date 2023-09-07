import 'zx/globals';
$.verbose = false;

import * as vscode from 'vscode';
import { findUsage } from './commands/findUsage';
import { PhpParserCached } from './core/PhpParserCached';
import { TwigComponentUsageParser } from './core/TwigComponentUsageParser';
import { getCommitHash, getFilesByExtension } from './shell/git';
import { getAffectedRoutesCommand } from './commands/getAffectedRoutes';
import { createTwigHoverProvider } from './providers/hover';
import { createTwigCompletionProviders } from './providers/completion';

// TODO: fix directory
const EXTENSION_ROOT = './.vscode/extensions/vue-twig';


export const activate = (context: vscode.ExtensionContext) => vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Twig Extension',
    cancellable: false,
}, async (progress) => {
    const reportProgress = (message: string) => progress.report({ message, increment: 100 / 5 });

    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    reportProgress('registering hardcoded providers');

    context.subscriptions.push(createTwigHoverProvider());

    reportProgress('registering twig completion provider');

    context.subscriptions.push(...await createTwigCompletionProviders());

    reportProgress('php parser');
    const commitHash = await getCommitHash(PROJECT_DIR);
    const phpParser = new PhpParserCached(`${EXTENSION_ROOT}/cache/${commitHash}/phpAst.json`);

    reportProgress('vue files');
    const vueFiles = await getFilesByExtension(PROJECT_DIR, 'vue');
    const vueComponentNames = vueFiles.map(f => f.split('/').at(-1).split('.')[0]);
    await fs.mkdir(`${EXTENSION_ROOT}/cache/${commitHash}`, { recursive: true });

    reportProgress('twigComponentUsageParser');
    const twigComponentUsageParser = new TwigComponentUsageParser(
        `${EXTENSION_ROOT}/cache/${commitHash}/twigComponentUsage.json`,
        vueComponentNames,
    );
    await twigComponentUsageParser.initialize();

    context.subscriptions.push(
        vscode.commands.registerCommand('vue-twig.find-usage', () => findUsage(twigComponentUsageParser, phpParser)),
        vscode.commands.registerCommand('vue-twig.get-affected-routes', () => getAffectedRoutesCommand(twigComponentUsageParser, phpParser)),
    );
});


export function deactivate() { }
