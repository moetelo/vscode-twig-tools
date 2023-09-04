import * as fs from 'fs';
import * as path from 'path';
import 'zx/globals';

const engine = require("php-parser");

const IGNORED_PHP_FILE_PATHS = [
    '/var/cache/',
    '/vendor/',
];

const findFilesAndRead = (files: string[], endsWith: string) => {
    return files
        .filter(file => file.endsWith(endsWith))
        .filter(file => !IGNORED_PHP_FILE_PATHS.some(ip => file.includes(ip)))
        .map(file => ({
            file,
            content: fs.readFileSync(file, 'utf8'),
        }));
};

export const findRoutes = (projectDir: string, componentName: string): string[] => {
    const files = getFilesRecursively(projectDir);
    const componentPattern = new RegExp(`<${componentName}(\\s|>)`, 'g');

    const templatesDir = projectDir + 'templates/';
    const twigPathsContainingComponent = findFilesAndRead(files, '.html.twig')
        .map(f => ({
            ...f,
            file: f.file.substring(templatesDir.length),
        }))
        .filter(f => componentPattern.test(f.content))
        .map(twig => twig.file);

    const phpFilesContainingTwig = findFilesAndRead(files, '.php')
        .filter(php =>
            twigPathsContainingComponent.some(twig => php.content.includes(twig)),
        );

    const phpParser = new engine({
        parser: {
            extractDoc: true,
            suppressErrors: true,
        },
        ast: {
            withPositions: true,
        },
    });

    const phpAstMap: { [key: string]: any } = {};
    phpFilesContainingTwig.forEach(php => {
        const phpAst = phpParser.parseCode(php.content);
        phpAstMap[php.file] = phpAst;
    });

    const routes: string[] = phpFilesContainingTwig.flatMap(phpFile => {
        const phpAst = phpAstMap[phpFile.file];

        const namespace = phpAst.children.find(x => x.kind === 'namespace');
        if (!namespace) {
            console.log(phpFile.file);
            return [];
        }

        const classes = namespace.children.filter(x => x.kind === 'class');
        const methods = classes.flatMap(cls => cls.body.filter(x => x.kind === 'method'));

        return methods
            .map(parseRouteAndRenderedTemplate)
            .filter(Boolean)
            .filter(methodInfo => twigPathsContainingComponent.includes(methodInfo.renderedTemplate))
            .map(methodInfo => methodInfo.route);
    });

    return routes;
};

const parseRouteAndRenderedTemplate = (method: any) => {
    const routeAttr = method.attrGroups.flatMap(x => x.attrs).find(x => x.name === 'Route');
    const ret = method.body.children.find(x => x.kind === 'return');

    if (!ret || ret.expr.kind !== 'call' || !routeAttr) {
        return null;
    }

    const route: string = routeAttr.args[0].value;
    const renderedTemplate: string = ret.expr.arguments[0]?.value;

    return {
        route,
        renderedTemplate,
    };
};

const getFilesRecursively = (dir: string): string[] => {
    const files: string[] = [];

    const traverseDirectory = (currentDir: string) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        entries.forEach(entry => {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isFile()) {
                files.push(fullPath);
            } else if (entry.isDirectory()) {
                traverseDirectory(fullPath);
            }
        });
    };

    traverseDirectory(dir);

    return files;
};
