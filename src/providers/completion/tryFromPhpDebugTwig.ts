import { executeSymfonyCommand, SymfonyCommand } from '../../shell/docker';
import { TwigFunctionLike, TwigVariable } from './types';

export type TwigDebugSections = {
    Filters: TwigFunctionLike[];
    Functions: TwigFunctionLike[];
    Globals: TwigVariable[];
    Tests: string[];
};

const sectionLineRegex: Record<keyof TwigDebugSections, RegExp> = {
    'Filters': /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*)(?:\((?<args>[^)]*)\))?/,
    'Functions': /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*)\((?<args>[^)]*)\)/,
    'Globals': /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*) = (?<args>.+)/,
    'Tests': /^\* (?<identifier>[a-z ]+)/,
};

const headerRegex = /^([A-Za-z ]+)$/;

const skippedSections = [
    'Loader Paths',
    'Namespace       Paths',
];


const parseSections = (input: string): TwigDebugSections => {
    const sections: TwigDebugSections = {
        Filters: [],
        Functions: [],
        Globals: [],
        Tests: [],
    };

    let currentSectionName = '';

    const lines = input.split('\n').map((line) => line.trim());

    for (const line of lines) {
        const sectionHeaderMatch = line.match(headerRegex);
        if (sectionHeaderMatch) {
            currentSectionName = sectionHeaderMatch[1].trim();
            sections[currentSectionName] = [];
            continue;
        }

        const section = sections[currentSectionName];
        if (skippedSections.includes(currentSectionName)) {
            continue;
        }

        if (currentSectionName) {
            const sectionLineMatch = line.match(sectionLineRegex[currentSectionName]);
            if (sectionLineMatch) {
                const { identifier, args } = sectionLineMatch.groups!;

                if (currentSectionName === 'Globals') {
                    section.push({
                        identifier,
                        value: args,
                    });

                    continue;
                }

                if (currentSectionName === 'Tests') {
                    section.push(identifier);
                    continue;
                }

                const argsArr = (args || '').split(',').map((arg) => arg.trim())
                    .map((arg) => {
                        const [identifier, defaultValue] = arg.split('=');
                        return {
                            identifier,
                            defaultValue,
                        };
                    });

                section.push({
                    identifier,
                    arguments: argsArr,
                });
            }
        }
    }

    return sections;
};

export const getSectionsFromPhpDebugTwig = async (projectDir: string) => {
    const debugTwig = await executeSymfonyCommand(projectDir, SymfonyCommand.DebugTwig);
    return parseSections(debugTwig);
};
