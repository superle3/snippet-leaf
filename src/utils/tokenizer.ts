import type { SyntaxNode } from "@lezer/common";

export function* stackResolveNodeIterate(
    node: SyntaxNode,
    pos: number,
    side: -1 | 0 | 1,
) {
    const cursor = node.cursor();
    cursor.moveTo(pos, side);
    let parent: SyntaxNode | null = cursor.node;
    while (parent) {
        yield parent;
        parent = parent.parent;
    }
}

export function* iterateParents(node: SyntaxNode): Generator<SyntaxNode> {
    let parent: SyntaxNode | null = node;
    while (parent) {
        yield parent;
        parent = parent.parent;
    }
}
