declare module "*?raw" {
    const inlineCode: string;
    export default inlineCode;
}

declare module "*.json5?json5" {
    const json5Data: unknown;
    export default json5Data;
}
