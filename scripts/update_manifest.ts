import fs from "fs";
import path from "path";
import * as v from "valibot";

const version = process.argv[2];
if (!version) {
    process.exit(1);
}
const UpdateManifestSchema = v.pipe(
    v.string(),
    v.parseJson(),
    v.object({
        addons: v.object({
            "snippetleaf@superle3": v.object({
                updates: v.array(
                    v.object({
                        version: v.string(),
                        update_link: v.string(),
                    }),
                ),
            }),
        }),
    }),
    v.transform((manifest) => {
        return {
            addons: {
                "snippetleaf@superle3": {
                    updates: [
                        ...manifest.addons["snippetleaf@superle3"].updates,
                        {
                            version: version,
                            update_link: `https://github.com/superle3/snippet-leaf/releases/download/v${version}/snippetleaf-${version}.xpi`,
                        },
                    ],
                },
            },
        };
    }),
    v.stringifyJson(),
);
const update_manifest_path = path.join(
    import.meta.dirname,
    "../browser_extension/update_manifest.json",
);
const raw_update_manifest = fs.readFileSync(update_manifest_path).toString();
const updated_update_manifest = v.parse(
    UpdateManifestSchema,
    raw_update_manifest,
);
fs.writeFileSync(update_manifest_path, updated_update_manifest);
