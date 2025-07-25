const tabstop_regex_v1 = /\$(\d)|(\{\d+:[^}]+\})/g;

const escape_v2_tabstop_in_v1_spec = /\${\d+:[^}]+\}|@/g;

const convert_tabstop_v1_to_v2 = (replacement: string): string => {
    return replacement.replace(tabstop_regex_v1, (_, p1, p2) => {
        if (p1) {
            return `@{${p1}}`;
        }
        return `@${p2}`;
    });
};

const convert_captured_groups_v1_to_v2 = (
    snippet: RegExp,
    replacement: string,
): string => {
    const captured_groups =
        new RegExp(`|${snippet.source}`).exec("").length - 1;
    if (captured_groups === 0) {
        return replacement;
    }
    const captured_groups_regex = new RegExp(
        `\\[\\[(${Array.from({ length: captured_groups }, (_, i) => i).join(
            "|",
        )})\\]\\]`,
        "g",
    );
    return replacement.replace(captured_groups_regex, (_, p1) => {
        return `@[${parseInt(p1, 10)}]`;
    });
};

const escape_v2_tabstop_char = (replacement: string): string => {
    return replacement.replace(escape_v2_tabstop_in_v1_spec, (match) => {
        if (match === "@") {
            return "@@";
        }
        return match;
    });
};

const VISUAL_SNIPPET_MAGIC_SELECTION_PLACEHOLDER_REGEX_v1 = /\$\{VISUAL\}/;

const convert_VISUAL_SNIPPET_MAGIC_SELECTION_PLACEHOLDER = (
    replacement: string,
): string => {
    return replacement.replace(
        VISUAL_SNIPPET_MAGIC_SELECTION_PLACEHOLDER_REGEX_v1,
        "@{VISUAL}",
    );
};

export const convert_replacement_v1_to_v2 = <
    T extends string | ((...args: unknown[]) => string),
>(
    trigger: RegExp | string,
    replacement: T,
): T => {
    if (typeof replacement === "string") {
        const new_replacement = convert_tabstop_v1_to_v2(
            convert_VISUAL_SNIPPET_MAGIC_SELECTION_PLACEHOLDER(
                escape_v2_tabstop_char(replacement),
            ),
        );
        if (typeof trigger === "string") {
            return new_replacement as T;
        }
        return convert_captured_groups_v1_to_v2(trigger, new_replacement) as T;
    } else if (typeof replacement === "function") {
        return ((...args: unknown[]) => {
            return convert_tabstop_v1_to_v2(
                escape_v2_tabstop_char(replacement(...args)),
            );
        }) as T;
    } else {
        throw new Error("Invalid replacement type");
    }
};
