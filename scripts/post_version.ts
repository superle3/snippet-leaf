/// <reference types="node" />

import { execSync } from "child_process";

const UPSTREAM_REMOTE = "upstream";

function set_version_suffix() {
    execSync("git config --local version.suffix v");
}
function get_last_tag() {
    const lastCreatedTag = execSync("git tag --sort=-version:refname ")
        .toString()
        .trim()
        .split("\n")[0];
    return lastCreatedTag;
}
function push_tag(tag: string) {
    execSync(`git push "${UPSTREAM_REMOTE}" "${tag.replaceAll(/"/g, '\\"')}"`);
    execSync(`git push "${UPSTREAM_REMOTE}" HEAD:main`);
}

set_version_suffix();

const last_created_tag = get_last_tag();
push_tag(last_created_tag);
