import * as vscode from 'vscode';
import { DisposableLike } from '../vscode-extensions';


export class TwigComponentUsageParser implements DisposableLike {
    private readonly _cache: Map<string, string[]> = new Map();
    private readonly _components: Set<string>;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(components: Iterable<string>) {
        this._components = new Set(components);

        this._disposables.push(
            vscode.workspace.onDidSaveTextDocument((document) => {
                const { fsPath } = document.uri;

                if (fsPath.endsWith('.html.twig') && this._cache.has(fsPath)) {
                    this.invalidate(fsPath);
                }
            })
        );
    }

    async initialize() {
        const twigFilePaths = await vscode.workspace.findFiles('templates/**/*.html.twig');

        for (const uri of twigFilePaths) {
            await this._parseComponentUsage(uri.path);
        }
    }

    async invalidate(filename: string) {
        console.log(`Invalidating cache for ${filename}`);

        try {
            const componentNames = await this._parseComponentNamesInFile(filename);
            this._cache.set(filename, componentNames);
        } catch (err) {
            console.error(`Failed to invalidate cache for ${filename}`, err);
        }
    }

    getPathsContainingComponent(componentName: string): string[] {
        const paths = [...this._cache.entries()]
            .filter(([_, componentNames]) => componentNames.includes(componentName))
            .map(([path, _]) => path);

        return paths.map(path => path.substring(path.indexOf('templates') + 'templates/'.length));
    }

    dispose(): void {
        this._disposables.forEach(x => x.dispose());
    }

    private async _parseComponentUsage(twigPath: string): Promise<string[]> {
        const cached = this._cache.get(twigPath);
        if (cached) {
            return cached;
        }

        const componentNames = await this._parseComponentNamesInFile(twigPath);
        this._cache.set(twigPath, componentNames);

        return componentNames;
    }

    private async _parseComponentNamesInFile(filename: string) {
        const content = await fs.readFile(filename, 'utf8');
        return this._parseComponentNames(content);
    }

    private _parseComponentNames(content: string) {
        return [...this._components].filter(componentName => content.includes(`</${componentName}>`));
    }

}
