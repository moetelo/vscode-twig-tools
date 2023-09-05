// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vue-twig" is now active!');

	const disposable = vscode.commands.registerCommand('vue-twig.helloWorld', () => {

		vscode.window.showInformationMessage('Hello World from vue-twig! Teststetetetsts');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
