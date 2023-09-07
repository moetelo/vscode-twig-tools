import 'zx/globals';
import { Call, Class, Literal, Method, Namespace, Program, Return } from 'php-parser';

import { PhpParserCached } from './core/PhpParserCached';
import { TwigComponentUsageParser } from './core/TwigComponentUsageParser';


export const findRoutes = async (
    phpParser: PhpParserCached,
    twigComponentUsageParser: TwigComponentUsageParser,
    files: string[],
    componentName: string,
): Promise<string[]> => {
    const twigPathsContainingComponent = twigComponentUsageParser.getPathsContainingComponent(componentName);

    const phpFilesContainingTwigPaths = files
        .filter(file => file.endsWith('.php'))
        .map(file => ({
            file,
            content: fs.readFileSync(file, 'utf8'),
        }))
        .filter(php =>
            twigPathsContainingComponent.some(twigTemplatePath => php.content.includes(twigTemplatePath)),
        );

    const routes = phpFilesContainingTwigPaths.flatMap(phpFile => {
        const phpAst = phpParser.parseCode(phpFile.file);

        return extractRoutesFromClass(phpAst, twigPathsContainingComponent);
    });

    return routes;
};

const extractRoutesFromClass = (phpAst: Program, twigPathsContainingComponent: string[]): string[] => {
    const namespace = phpAst.children.find(x => x.kind === 'namespace') as Namespace | undefined;
    if (!namespace) {
        console.error('no namespace found for file');
        return [];
    }

    const classes = namespace.children.filter(x => x.kind === 'class') as Class[];
    const methods = classes.flatMap(cls => cls.body.filter(x => x.kind === 'method')) as Method[];

    return methods
        .map(parseRouteAndRenderedTemplate)
        .filter(Boolean)
        .filter(methodInfo => twigPathsContainingComponent.includes(methodInfo.renderedTemplate))
        .map(methodInfo => methodInfo.route);
};

const parseRouteAndRenderedTemplate = (method: Method) => {
    const routeAttr = method.attrGroups.flatMap(x => x.attrs).find(x => x.name === 'Route');
    const ret = method.body.children.find(x => x.kind === 'return') as Return | undefined;

    if (!ret || ret.expr.kind !== 'call' || !routeAttr) {
        return null;
    }

    const route: string = routeAttr.args[0].value as unknown as string;
    const renderedTemplate: string = ((ret.expr as Call).arguments[0] as Literal | undefined)?.value as string;

    return {
        route,
        renderedTemplate,
    };
};
