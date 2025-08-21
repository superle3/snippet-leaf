// type flags = "i" | "m" | "s" | "u" | "v";
// type options = "t" | "m" | "M" | "n" | "A" | "r" | "v" | "w";

// // A recursive type to generate combinations of flags.
// // It takes a union of single-character strings `T` and generates all unique combinations.
// type Combinations<T extends string, U extends string = T> = T extends string
//     ? T | `${T}${Combinations<Exclude<U, T>>}`
//     : never;

// type Include<T, U> = T extends U ? T : never;

// // The final type including single flags and all combinations.
// type FlagCombinations = Combinations<flags>;
// type OptionsCombinations = Combinations<options>;
// type OptionsWithoutR = Exclude<OptionsCombinations, `${string}r${string}`>;
// type VisualOptions = Include<OptionsWithoutR, `${string}v${string}`>;

// type RegularOptions = Exclude<
//     OptionsCombinations,
//     `${string}r${string}` | `${string}v${string}`
// >;

// type OptionsWithoutV = Exclude<OptionsCombinations, `${string}v${string}`>;
// type RegexOptions = Include<OptionsWithoutV, `${string}r${string}`>;

// type regular_snippet = {
//     trigger: string;
//     replacement: string | ((match: string) => string);
//     options: RegularOptions;
// };

// type regex_snippet = (
//     | {
//           trigger: RegExp;
//           replacement: string | ((match: RegExpMatchArray) => string);
//           options: OptionsWithoutR;
//       }
//     | {
//           trigger: string;
//           replacement: string | ((match: RegExpMatchArray) => string);
//           options: RegexOptions;
//       }
// ) & {
//     flags?: FlagCombinations;
// };

// type visual_snippet =
//     | {
//           trigger: string;
//           replacement: string | ((sel: string) => string | false);
//           options: VisualOptions;
//       }
//     | {
//           trigger: string;
//           replacement: `${string}\${VISUAL}${string}`;
//           options: OptionsWithoutR;
//       };

// export type SnippetSignature = (
//     | regular_snippet
//     | regex_snippet
//     | visual_snippet
// ) & {
//     priority?: number;
//     description?: string;
//     version?: 1 | 2;
// };

export type SnippetSignature = {
    trigger: string | RegExp;
    replacement: string | ((match: unknown) => unknown);
    options: string;
    flags?: string;
    priority?: number;
    description?: string;
    version?: number;
};
