export type FunctionArgument = {
    identifier: string,
    defaultValue?: string,
};

export type TwigFunctionLike = {
    identifier: string;
    arguments: FunctionArgument[];
};

export type TwigVariable = {
    identifier: string;
    value: string;
};
