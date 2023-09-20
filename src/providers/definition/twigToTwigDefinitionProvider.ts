import * as vscode from 'vscode';
import { LanguageId } from '../../constants';

// why parse twig dom when we can just get the string under the cursor
const STRING_REGEX = /['"](.*?)['"]/;


export const createTwigToTwigDefinitionProvider = () => vscode.languages.registerDefinitionProvider(LanguageId.Twig, {
    async provideDefinition(document, position, _token) {
        const stringRange = document.getWordRangeAtPosition(position, STRING_REGEX);
        if (!stringRange) {
            return null;
        }

        const string = document.getText(stringRange);
        const stringValue = string.slice('"'.length, -'"'.length);

        const projectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const filePath = projectDir + '/templates/' + stringValue;

        const fileStat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));

        if (!fileStat) {
            return null;
        }

        return new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(0, 0));
    },
});
