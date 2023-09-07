import * as vscode from 'vscode';


export class TwigComponentUsageParser {
    private readonly _cache: Map<string, string[]> = new Map();
    private readonly _components: Set<string>;

    constructor(components: Iterable<string>) {
        this._components = new Set(components);
    }

    async initialize() {
        const twigFilePaths = await vscode.workspace.findFiles('templates/**/*.html.twig');

        for (const uri of twigFilePaths) {
            await this._parseComponentUsage(uri.path);
        }
    }

    getPathsContainingComponent(componentName: string): string[] {
        const paths = [...this._cache.entries()]
            .filter(([_, componentNames]) => componentNames.includes(componentName))
            .map(([path, _]) => path);

        return paths.map(path => path.substring(path.indexOf('templates') + 'templates/'.length));
    }

    private async _parseComponentUsage(twigPath: string): Promise<string[]> {
        const cached = this._cache.get(twigPath);
        if (cached) {
            return cached;
        }

        const content = await fs.readFile(twigPath, 'utf8');
        const componentNames = this._parseComponentNames(content);
        this._cache.set(twigPath, componentNames);

        return componentNames;
    }

    private _parseComponentNames(content: string) {
        return [...this._components].filter(componentName => content.includes(`</${componentName}>`));
    }
}
