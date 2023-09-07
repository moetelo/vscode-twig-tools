import { CachedMap } from './CachedMap';
import { getFilesRecursively } from '../shell/fs';

export class TwigComponentUsageParser {
    private _cache: CachedMap<string, string[]>;
    private _components: string[];

    constructor(cacheJsonFilePath: string, components: string[]) {
        this._cache = new CachedMap(cacheJsonFilePath);
        this._components = components;
    }

    async initialize(templatesDir: string) {
        const filePaths = await getFilesRecursively(templatesDir);
        const twigFilePaths = filePaths.filter(f => f.endsWith('.html.twig'));

        for (const path of twigFilePaths) {
            await this._parseComponentUsage(path);
        }
    }

    getPathsContainingComponent(componentName: string, treatTemplatesDirAsCwd = true): string[] {
        const paths = [...this._cache.entries()]
            .filter(([_, componentNames]) => componentNames.includes(componentName))
            .map(([path, _]) => path);

        if (treatTemplatesDirAsCwd) {
            return paths.map(path => path.substring(path.indexOf('templates') + 'templates/'.length));
        }

        return paths;
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
