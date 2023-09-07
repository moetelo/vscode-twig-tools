import { CachedMap } from './CachedMap';
import { getFilesRecursively } from './fs';

export class TwigComponentUsageParser {
    private _cache: CachedMap<string, string[]>;
    private _components: string[];

    constructor(cacheJsonFilePath: string, components: string[]) {
        this._cache = new CachedMap(cacheJsonFilePath);
        this._components = components;
    }

    async initialize(templatesDir: string) {
        const twigFilePaths = await getFilesRecursively(templatesDir, {
            extensions: [ '.html.twig' ]
        });

        for (const path of twigFilePaths) {
            await this._parseComponentUsage(path);
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
        return this._components.filter(componentName => content.includes(`</${componentName}>`));
    }
}
