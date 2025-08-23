import { compressToUint8Array, decompressFromUint8Array } from "lz-string";
import type { LatexSuitePluginSettingsRaw } from "../../src/settings/settings";
import { DEFAULT_SETTINGS_RAW } from "../../src/settings/settings";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "./ui/snippets_editor/codemirror_setup";
import type { Extension } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import { compiler } from "./typescript";
import { DEFAULT_SNIPPETS_str } from "src/utils/default_snippets";
import { parseSnippetVariables } from "src/snippets/parse";

class Setting {
    container_element: HTMLElement;
    setting_info: HTMLElement;
    setting_control: HTMLElement;
    setting_name: HTMLElement;
    setting_desc: HTMLElement;

    setClass(className: string) {
        this.container_element.classList.add(className);
        return this;
    }
    constructor(container_element: HTMLElement) {
        const setting_div = document.createElement("div");
        setting_div.classList.add("setting-item");
        container_element.appendChild(setting_div);
        this.container_element = setting_div;

        this.setting_info = document.createElement("div");
        this.setting_info.classList.add("setting-item-info");
        this.container_element.appendChild(this.setting_info);

        this.setting_control = document.createElement("div");
        this.setting_control.classList.add("setting-item-control");
        this.container_element.appendChild(this.setting_control);

        this.setting_name = document.createElement("div");
        this.setting_name.classList.add("setting-item-name");
        this.setting_info.appendChild(this.setting_name);

        this.setting_desc = document.createElement("div");
        this.setting_desc.classList.add("setting-item-description");
        this.setting_info.appendChild(this.setting_desc);
    }

    setName(name: string) {
        this.setting_name.textContent = name;
        return this;
    }

    setHeading() {
        this.container_element.classList.add("setting-item-heading");
        return this;
    }

    setDesc(desc: string | DocumentFragment) {
        if (desc instanceof DocumentFragment) {
            this.setting_desc.appendChild(desc);
        } else {
            this.setting_desc.textContent = desc;
        }
        return this;
    }

    addToggle(callback: (toggle: ToggleComponent) => void) {
        const toggle = new ToggleComponent(this.setting_control);
        callback(toggle);
        return this;
    }

    addText(callback: (text: TextComponent) => void) {
        const text = new TextComponent(this.setting_control);
        callback(text);
        return this;
    }

    addTextArea(callback: (textArea: TextAreaComponent) => void) {
        const textArea = new TextAreaComponent(this.setting_control);
        callback(textArea);
        return this;
    }

    addDropdown(callback: (dropdown: DropDownComponent) => void) {
        callback(new DropDownComponent(this.setting_control));
    }
}

class TextComponent {
    container_element: HTMLInputElement;
    constructor(container_element: HTMLElement) {
        this.container_element = document.createElement("input");
        this.container_element.type = "text";
        container_element.appendChild(this.container_element);
    }

    setPlaceholder(placeholder: string) {
        this.container_element.placeholder = placeholder;
        return this;
    }
    setValue(value: string) {
        this.container_element.value = value;
        return this;
    }
    onChange(callback: (value: string) => void) {
        this.container_element.addEventListener("input", (event) => {
            const value = (event.target as HTMLInputElement).value;
            callback(value);
        });
        return this;
    }
}

class DropDownComponent {
    container_element: HTMLSelectElement;

    constructor(container_element: HTMLElement) {
        this.container_element = document.createElement("select");
        this.container_element.classList.add("dropdown");
        container_element.appendChild(this.container_element);
    }

    addOption(value: string, label: string) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        this.container_element.appendChild(option);
        return this;
    }

    setValue(value: string) {
        const option = this.container_element.querySelector(
            `option[value="${value}"]`,
        );

        if (!option) {
            return this;
        }
        this.container_element.value = value;
        return this;
    }

    onChange(callback: (value: string) => void) {
        this.container_element.addEventListener("change", (event) => {
            callback((event.target as HTMLSelectElement).value);
        });
        return this;
    }
}

class ToggleComponent {
    container_element: HTMLLabelElement;
    input: HTMLInputElement;
    constructor(container_element: HTMLElement) {
        this.container_element = document.createElement("label");
        this.container_element.classList.add("switch");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "switch-input";

        const slider = document.createElement("span");
        slider.className = "switch-slider";

        this.container_element.appendChild(input);
        this.container_element.appendChild(slider);

        container_element.appendChild(this.container_element);

        this.input = input;
    }

    setValue(value: boolean) {
        this.input.checked = value;
        return this;
    }

    onChange(callback: (value: boolean) => void) {
        this.input.addEventListener("change", (event) => {
            callback((event.target as HTMLInputElement).checked);
        });
        return this;
    }
}

class TextAreaComponent {
    container_element: HTMLTextAreaElement;
    constructor(container_element: HTMLElement) {
        this.container_element = document.createElement("textarea");
        this.container_element.spellcheck = false;
        this.container_element.className = "setting-textarea";
        this.container_element.rows = 4;
        container_element.appendChild(this.container_element);
    }

    setPlaceholder(placeholder: string) {
        this.container_element.placeholder = placeholder;
        return this;
    }

    setValue(value: string) {
        this.container_element.value = value;
        return this;
    }

    onChange(callback: (value: string) => void) {
        this.container_element.addEventListener("input", (event) => {
            const target = event.target as typeof event.target & {
                value: string;
            };
            const value = target.value;
            callback(value);
        });
        return this;
    }
}

class ExtraButtonComponent {
    container_element: HTMLElement;
    constructor(container_element: HTMLElement) {
        this.container_element = document.createElement("button");
        container_element.appendChild(this.container_element);
    }

    setIcon(icon: "checkmark" | "cross" | "trash" | "repeat") {
        switch (icon) {
            case "checkmark":
                this.container_element.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>';
                break;
            case "cross":
                this.container_element.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
                break;
            case "trash":
                this.container_element.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
                break;
            case "repeat":
                this.container_element.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-repeat"><path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path></svg>';
                break;
            default:
                break;
        }
        return this;
    }
    onClick(callback: () => void) {
        this.container_element.addEventListener("click", callback);
        return this;
    }
}

const settings_div = document.getElementById("settings-editor");
if (!settings_div) {
    throw new Error("Settings editor not found");
}
class LatexSuiteSettingTab {
    containerEl: HTMLElement;
    plugin: {
        settings: LatexSuitePluginSettingsRaw;
        saveSettings: () => Promise<void>;
    };
    constructor(
        containerEl: HTMLElement,
        plugin: {
            settings: LatexSuitePluginSettingsRaw;
            saveSettings: () => Promise<void>;
        },
    ) {
        this.containerEl = containerEl;
        this.plugin = plugin;
    }

    addHeading(containerEl: HTMLElement, name: string, icon = "math") {
        new Setting(containerEl).setName(name).setHeading();
    }

    display() {
        this.displaySnippetSettings();
        this.displayConcealSettings();
        this.displayColorHighlightBracketsSettings();
        this.displayAutofractionSettings();
        this.displayMatrixShortcutsSettings();
        this.displayTaboutSettings();
        this.displayAutoEnlargeBracketsSettings();
        this.displayAdvancedSnippetSettings();
        this.displayImportExportSettings();
    }

    displayImportExportSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Import/Export Settings", "download");

        // Import from Obsidian
        const obsidianSetting = new Setting(containerEl)
            .setName("Import from Obsidian")
            .setDesc(
                "Import settings from Obsidian LaTeX Suite. Upload your Obsidian `data.json` file. Can be found in your vault's `.obsidian/plugins/obsidian-latex-suite` folder.",
            );

        const obsidianImportDiv = document.createElement("div");
        obsidianImportDiv.style.display = "flex";
        obsidianImportDiv.style.gap = "10px";
        obsidianImportDiv.style.alignItems = "center";

        const obsidianFileInput = document.createElement("input");
        obsidianFileInput.type = "file";
        obsidianFileInput.accept = ".json";
        obsidianFileInput.style.flex = "1";

        const obsidianImportButton = document.createElement("button");
        obsidianImportButton.textContent = "Import";
        obsidianImportButton.disabled = true;

        obsidianFileInput.addEventListener("change", (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            obsidianImportButton.disabled = !file;
        });

        obsidianImportButton.addEventListener("click", async () => {
            const file = obsidianFileInput.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const obsidianSettings = JSON.parse(text);

                const convertedSettings = this.convertObsidianSettings(
                    obsidianSettings,
                    this.plugin.settings,
                );

                Object.assign(this.plugin.settings, convertedSettings);
                await this.plugin.saveSettings();

                alert("Settings imported successfully from Obsidian!");
                location.reload();
            } catch (error) {
                console.error("Failed to import Obsidian settings:", error);
                alert(
                    "Failed to import settings. Please check the file format.",
                );
            }
        });

        obsidianImportDiv.appendChild(obsidianFileInput);
        obsidianImportDiv.appendChild(obsidianImportButton);
        obsidianSetting.setting_control.appendChild(obsidianImportDiv);

        const exportSetting = new Setting(containerEl)
            .setName("Export current settings")
            .setDesc(
                "Export your current settings to a JSON file that can be imported later.",
            );

        const exportButton = document.createElement("button");
        exportButton.textContent = "Export Settings";
        exportButton.addEventListener("click", () => {
            this.exportSettings();
        });
        exportSetting.setting_control.appendChild(exportButton);

        const importSetting = new Setting(containerEl)
            .setName("Import settings")
            .setDesc("Import settings from a previously exported file.");

        const importDiv = document.createElement("div");
        importDiv.style.display = "flex";
        importDiv.style.gap = "10px";
        importDiv.style.alignItems = "center";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json";
        fileInput.style.flex = "1";

        const importButton = document.createElement("button");
        importButton.textContent = "Import";
        importButton.disabled = true;

        fileInput.addEventListener("change", (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            importButton.disabled = !file;
        });

        importButton.addEventListener("click", async () => {
            const file = fileInput.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importedSettings = JSON.parse(text);

                if (!this.validateSettingsStructure(importedSettings)) {
                    throw new Error("Invalid settings file structure");
                }

                Object.assign(this.plugin.settings, importedSettings);
                await this.plugin.saveSettings();

                alert("Settings imported successfully!");
                location.reload();
            } catch (error) {
                console.error("Failed to import settings:", error);
                alert(
                    "Failed to import settings. Please check the file format.",
                );
                location.reload();
            }
        });

        importDiv.appendChild(fileInput);
        importDiv.appendChild(importButton);
        importSetting.setting_control.appendChild(importDiv);
    }

    convertObsidianSettings(
        obsidianSettings: Record<string, unknown>,
        oldSettings: LatexSuitePluginSettingsRaw = DEFAULT_SETTINGS_RAW,
    ): LatexSuitePluginSettingsRaw {
        // The main difference is that Obsidian uses defaultSnippetVersion 1, while this app uses 2
        // When importing from Obsidian, we keep the Obsidian defaultSnippetVersion (1) intact
        for (const key of Object.keys(obsidianSettings)) {
            if (!(key in oldSettings) && key in obsidianSettings) {
                delete obsidianSettings[key];
            }
            if (key === "snippets" && key in obsidianSettings) {
                obsidianSettings[key] =
                    "export default " + obsidianSettings[key];
            }
        }
        return { ...oldSettings, ...obsidianSettings };
    }

    validateSettingsStructure(settings: unknown): boolean {
        // Basic validation to ensure the imported object has the expected structure
        if (typeof settings !== "object" || settings === null) {
            return false;
        }

        const settingsObj = settings as Record<string, unknown>;

        // Check for some key properties that should exist in both Obsidian and this app
        const requiredKeys = [
            "snippetsEnabled",
            "snippetsTrigger",
            "concealEnabled",
        ];
        for (const key of requiredKeys) {
            if (!(key in settingsObj)) {
                console.warn(`Missing required setting: ${key}`);
                return false;
            }
        }

        // Additional validation for critical types
        if (typeof settingsObj.snippetsEnabled !== "boolean") {
            console.warn("snippetsEnabled must be boolean");
            return false;
        }

        if (typeof settingsObj.concealEnabled !== "boolean") {
            console.warn("concealEnabled must be boolean");
            return false;
        }

        return true;
    }

    exportSettings() {
        const settingsToExport = {
            ...this.plugin.settings,
            exportedAt: new Date().toISOString(),
            exportedFrom: "Snippet Leaf Browser Extension",
        };

        const dataStr = JSON.stringify(settingsToExport, null, 2);
        const dataUri =
            "data:application/json;charset=utf-8," +
            encodeURIComponent(dataStr);

        const exportFileDefaultName = `snippet-leaf-settings-${new Date().toISOString().split("T")[0]}.json`;

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    }

    displaySnippetSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Snippets", "ballpen");

        new Setting(containerEl)
            .setName("Enabled")
            .setDesc("Whether snippets are enabled.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.snippetsEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.snippetsEnabled = value;
                        await this.plugin.saveSettings();
                    }),
            );

        const snippetsSetting = new Setting(containerEl)
            .setName("Snippets")
            .setDesc(
                'Enter snippets here.  Remember to add a comma after each snippet, and escape all backslashes with an extra \\. Lines starting with "//" will be treated as comments and ignored.',
            )
            .setClass("snippets-text-area");

        this.createSnippetsEditor(snippetsSetting);

        new Setting(containerEl)
            .setName("Key trigger for non-auto snippets")
            .setDesc("What key to press to expand non-auto snippets.")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("Tab", "Tab")
                    .addOption(" ", "Space")
                    .setValue(this.plugin.settings.snippetsTrigger)
                    .onChange(
                        async (
                            value: typeof this.plugin.settings.snippetsTrigger,
                        ) => {
                            this.plugin.settings.snippetsTrigger = value;
                            await this.plugin.saveSettings();
                        },
                    ),
            );

        new Setting(containerEl)
            .setName("Default snippet version")
            .setDesc(
                "The default snippet version to use for the snippet syntax. Version 2 is recommended for most users.",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("1", "Version 1")
                    .addOption("2", "Version 2")
                    .setValue(
                        String(this.plugin.settings.defaultSnippetVersion),
                    )
                    .onChange(async (value: string) => {
                        this.plugin.settings.defaultSnippetVersion = parseInt(
                            value,
                        ) as 1 | 2;
                        await this.plugin.saveSettings();
                    }),
            );
    }

    displayConcealSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Conceal", "math-integral-x");

        const descFragment = document.createDocumentFragment();

        const line1 = document.createElement("div");
        line1.textContent =
            "Make equations more readable by hiding LaTeX syntax and instead displaying it in a pretty format.";
        descFragment.appendChild(line1);

        const line2 = document.createElement("div");
        line2.innerHTML = `
            e.g. <code>\\dot{x}^{2} + \\dot{y}^{2}</code> will display as ẋ² + ẏ², and <code>\\sqrt{ 1-\\beta^{2} }</code> will display as √{ 1-β² }.
        `;
        descFragment.appendChild(line2);

        const line3 = document.createElement("div");
        line3.textContent = "LaTeX beneath the cursor will be revealed.";
        descFragment.appendChild(line3);

        descFragment.appendChild(document.createElement("br"));

        const line4 = document.createElement("div");
        line4.textContent =
            "Disabled by default to not confuse new users. However, I recommend turning this on once you are comfortable with the plugin!";
        descFragment.appendChild(line4);

        new Setting(containerEl)
            .setName("Enabled")
            .setDesc(descFragment)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.concealEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.concealEnabled = value;
                        await this.plugin.saveSettings();
                    }),
            );

        // Second description fragment for reveal delay
        const delayDescFragment = document.createDocumentFragment();

        const delayLine1 = document.createElement("div");
        delayLine1.textContent =
            "How long to delay the reveal of LaTeX for, in milliseconds, when the cursor moves over LaTeX. Defaults to 0 (LaTeX under the cursor is revealed immediately).";
        delayDescFragment.appendChild(delayLine1);

        delayDescFragment.appendChild(document.createElement("br"));

        const delayLine2 = document.createElement("div");
        delayLine2.textContent =
            "Can be set to a positive number, e.g. 300, to delay the reveal of LaTeX, making it much easier to navigate equations using arrow keys.";
        delayDescFragment.appendChild(delayLine2);

        delayDescFragment.appendChild(document.createElement("br"));

        const delayLine3 = document.createElement("div");
        delayLine3.textContent = "Must be an integer ≥ 0.";
        delayDescFragment.appendChild(delayLine3);

        new Setting(containerEl)
            .setName("Reveal delay (ms)")
            .setDesc(delayDescFragment)
            .addText((text) =>
                text
                    .setPlaceholder(
                        String(DEFAULT_SETTINGS_RAW.concealRevealTimeout),
                    )
                    .setValue(String(this.plugin.settings.concealRevealTimeout))
                    .onChange((value) => {
                        // Make sure the value is a non-negative integer
                        const ok = /^\d+$/.test(value);
                        if (ok) {
                            this.plugin.settings.concealRevealTimeout =
                                Number(value);
                            this.plugin.saveSettings();
                        }
                    }),
            );
    }

    displayColorHighlightBracketsSettings() {
        const containerEl = this.containerEl;
        this.addHeading(
            containerEl,
            "Highlight and color brackets",
            "parentheses",
        );

        new Setting(containerEl)
            .setName("Color paired brackets")
            .setDesc("Whether to colorize matching brackets.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.colorPairedBracketsEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.colorPairedBracketsEnabled = value;
                        await this.plugin.saveSettings();
                    }),
            );
        new Setting(containerEl)
            .setName("Highlight matching bracket beneath cursor")
            .setDesc(
                "When the cursor is adjacent to a bracket, highlight the matching bracket.",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        this.plugin.settings.highlightCursorBracketsEnabled,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.highlightCursorBracketsEnabled =
                            value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Highlighting theme")
            .setDesc(
                "Whether to use a dark or light theme to highlight/color the brackets.",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .setValue(this.plugin.settings.theme)
                    .onChange(async (value) => {
                        this.plugin.settings.theme =
                            value as LatexSuitePluginSettingsRaw["theme"];
                        await this.plugin.saveSettings();
                    })
                    .addOption("light", "Light")
                    .addOption("dark", "Dark"),
            );
    }

    displayAutofractionSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Auto-fraction", "math-x-divide-y-2");

        new Setting(containerEl)
            .setName("Enabled")
            .setDesc("Whether auto-fraction is enabled.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.autofractionEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.autofractionEnabled = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Fraction symbol")
            .setDesc(
                "The fraction symbol to use in the replacement. e.g. \\frac, \\dfrac, \\tfrac",
            )
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS_RAW.autofractionSymbol)
                    .setValue(this.plugin.settings.autofractionSymbol)
                    .onChange(async (value) => {
                        this.plugin.settings.autofractionSymbol = value;

                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Excluded environments")
            .setDesc(
                'A list of environments to exclude auto-fraction from running in. For example, to exclude auto-fraction from running while inside an exponent, such as e^{...}, use  ["^{", "}"]',
            )
            .addTextArea((text) =>
                text
                    .setPlaceholder(
                        this.plugin.settings.autofractionExcludedEnvs,
                    )
                    .setValue(this.plugin.settings.autofractionExcludedEnvs)
                    .onChange(async (value) => {
                        try {
                            JSON.parse(value);
                            this.plugin.settings.autofractionExcludedEnvs =
                                value;
                            await this.plugin.saveSettings();
                        } catch (e) {
                            console.error(
                                "Failed to parse excluded environments:",
                                e,
                            );
                        }
                    }),
            );

        new Setting(containerEl)
            .setName("Breaking characters")
            .setDesc(
                'A list of characters that denote the start/end of a fraction. e.g. if + is included in the list, "a+b/c" will expand to "a+\\frac{b}{c}". If + is not in the list, it will expand to "\\frac{a+b}{c}".',
            )
            .addText((text) =>
                text
                    .setPlaceholder(
                        DEFAULT_SETTINGS_RAW.autofractionBreakingChars,
                    )
                    .setValue(this.plugin.settings.autofractionBreakingChars)
                    .onChange(async (value) => {
                        this.plugin.settings.autofractionBreakingChars = value;

                        await this.plugin.saveSettings();
                    }),
            );
    }

    displayMatrixShortcutsSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Matrix shortcuts", "brackets-contain");

        new Setting(containerEl)
            .setName("Enabled")
            .setDesc("Whether matrix shortcuts are enabled.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.matrixShortcutsEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.matrixShortcutsEnabled = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Environments")
            .setDesc(
                "A list of environment names to run the matrix shortcuts in, separated by commas.",
            )
            .addText((text) =>
                text
                    .setPlaceholder(
                        DEFAULT_SETTINGS_RAW.matrixShortcutsEnvNames,
                    )
                    .setValue(this.plugin.settings.matrixShortcutsEnvNames)
                    .onChange(async (value) => {
                        this.plugin.settings.matrixShortcutsEnvNames = value;

                        await this.plugin.saveSettings();
                    }),
            );
    }

    displayTaboutSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Tabout", "tabout");

        new Setting(containerEl)
            .setName("Enabled")
            .setDesc("Whether tabout is enabled.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.taboutEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.taboutEnabled = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }

    displayAutoEnlargeBracketsSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Auto-enlarge brackets", "parentheses");

        new Setting(containerEl)
            .setName("Enabled")
            .setDesc(
                "Whether to automatically enlarge brackets containing e.g. sum, int, frac.",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.autoEnlargeBrackets)
                    .onChange(async (value) => {
                        this.plugin.settings.autoEnlargeBrackets = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Triggers")
            .setDesc(
                "A list of symbols that should trigger auto-enlarge brackets, separated by commas.",
            )
            .addText((text) =>
                text
                    .setPlaceholder(
                        DEFAULT_SETTINGS_RAW.autoEnlargeBracketsTriggers,
                    )
                    .setValue(this.plugin.settings.autoEnlargeBracketsTriggers)
                    .onChange(async (value) => {
                        this.plugin.settings.autoEnlargeBracketsTriggers =
                            value;

                        await this.plugin.saveSettings();
                    }),
            );
    }

    displayAdvancedSnippetSettings() {
        const containerEl = this.containerEl;
        this.addHeading(containerEl, "Advanced snippet settings");

        new Setting(containerEl)
            .setName("Snippet variables")
            .setDesc(
                "Assign snippet variables that can be used as shortcuts when writing snippets.",
            )
            .addTextArea((text) =>
                text
                    .setValue(this.plugin.settings.snippetVariables)
                    .onChange(async (value) => {
                        try {
                            parseSnippetVariables(value);
                            this.plugin.settings.snippetVariables = value;
                        } catch (e) {
                            console.error(
                                "Failed to parse snippet variables:",
                                e,
                            );
                        }
                        await this.plugin.saveSettings();
                    })
                    .setPlaceholder(DEFAULT_SETTINGS_RAW.snippetVariables),
            )
            .setClass("latex-suite-snippet-variables-setting");

        new Setting(containerEl)
            .setName("Word delimiters")
            .setDesc(
                'Symbols that will be treated as word delimiters, for use with the "w" snippet option.',
            )
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS_RAW.wordDelimiters)
                    .setValue(this.plugin.settings.wordDelimiters)
                    .onChange(async (value) => {
                        this.plugin.settings.wordDelimiters = value;

                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Remove trailing whitespaces in snippets in inline math")
            .setDesc(
                "Whether to remove trailing whitespaces when expanding snippets at the end of inline math blocks.",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.removeSnippetWhitespace)
                    .onChange(async (value) => {
                        this.plugin.settings.removeSnippetWhitespace = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(
                "Remove closing $,\\),\\] when backspacing inside blank math",
            )
            .setDesc(
                "Whether to also remove the closing $,\\),\\] when you delete the opening $,\\(,\\[ symbol inside blank math.",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.autoDelete$)
                    .onChange(async (value) => {
                        this.plugin.settings.autoDelete$ = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Don't trigger snippets when IME is active")
            .setDesc(
                "Whether to suppress snippets triggering when an IME is active.",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.suppressSnippetTriggerOnIME)
                    .onChange(async (value) => {
                        this.plugin.settings.suppressSnippetTriggerOnIME =
                            value;
                        await this.plugin.saveSettings();
                    }),
            );
        //The toggle both hides the settings and makes the plugin not load the vim commands on startup.
        // the vim toggle is loaded before the rest since expanding down looks better.
    }

    createSnippetsEditor(snippetsSetting: Setting) {
        const customCSSWrapper = document.createElement("div");
        customCSSWrapper.classList.add("snippets-editor-wrapper");
        const snippets_footer = document.createElement("div");
        snippets_footer.classList.add("snippets-editor-footer");
        const validity = document.createElement("div");
        validity.classList.add("snippets-editor-validity-wrapper");
        snippets_footer.appendChild(validity);

        const validityIndicator = new ExtraButtonComponent(validity);
        validityIndicator.container_element.classList.add(
            "snippets-editor-validity-indicator",
        );

        const validityText = document.createElement("div");
        validityText.classList.add("snippets-editor-validity-text");
        validityText.classList.add("setting-item-description");
        validityText.style.padding = "0";
        validity.appendChild(validityIndicator.container_element);
        validity.appendChild(validityText);
        validityText.textContent = "Saved";
        function updateValidityIndicator(success: boolean, error: string) {
            validityIndicator.setIcon(success ? "checkmark" : "cross");
            validityText.textContent = success
                ? "Saved"
                : `Invalid syntax. Changes not saved: ${error}`;
        }

        snippetsSetting.setting_control.appendChild(customCSSWrapper);
        snippetsSetting.setting_control.appendChild(snippets_footer);

        const extensions = basicSetup(this.plugin.settings.snippets);
        updateValidityIndicator(true, "");

        const change = EditorView.updateListener.of(async (v) => {
            if (v.docChanged) {
                const snippets = v.state.doc.toString();
                let success = true;
                let error = "";
                const diagnostics = compiler(snippets);
                if (diagnostics.length > 0) {
                    console.error("Snippet syntax error:", diagnostics);
                    success = false;
                    error = diagnostics.map((d) => d.messageText).join(", ");
                }
                updateValidityIndicator(success, error);
                if (!success) return;
                this.plugin.settings.snippets = snippets;
                // console.log(snippets);
                await this.plugin.saveSettings();
            }
        });

        extensions.push(change);

        const view = createCMEditor(this.plugin.settings.snippets, extensions);
        compiler(this.plugin.settings.snippets);
        customCSSWrapper.appendChild(view.dom);
        snippetsSetting.setting_info.style.marginBottom = "20px";
        snippetsSetting.container_element.style.flexDirection = "column";
        snippetsSetting.container_element.style.justifyContent = "flex-start";
        snippetsSetting.setting_info.style.width = "100%";
        snippetsSetting.setting_control.style.width = "100%";
        snippetsSetting.setting_control.style.display = "flex";
        snippetsSetting.setting_control.style.flexDirection = "column";
        snippetsSetting.setting_control.style.gap = "10px";

        const buttonsDiv = document.createElement("div");
        snippets_footer.appendChild(buttonsDiv);
        const reset = new ExtraButtonComponent(buttonsDiv);
        reset.setIcon("repeat").onClick(async () => {
            view.setState(
                EditorState.create({
                    doc: DEFAULT_SNIPPETS_str,
                    extensions: extensions,
                }),
            );
            updateValidityIndicator(true, "");
            this.plugin.settings.snippets = DEFAULT_SNIPPETS_str;
            await this.plugin.saveSettings();
        });

        const trash = new ExtraButtonComponent(buttonsDiv);
        trash.setIcon("trash").onClick(async () => {
            const doc = "export default []\n";
            view.setState(EditorState.create({ doc, extensions }));
            updateValidityIndicator(true, "");
            this.plugin.settings.snippets = doc;
            await this.plugin.saveSettings();
        });
    }
}

function createCMEditor(content: string, extensions: Extension[]) {
    const view = new EditorView({
        state: EditorState.create({ doc: content, extensions }),
    });

    return view;
}

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    return btoa(String.fromCharCode(...uint8Array));
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
}

async function main() {
    // await browser.storage.sync.clear();
    console.time("main");
    const settings = await get_settings();
    new LatexSuiteSettingTab(settings_div, {
        settings,
        saveSettings: async function () {
            await store_settings(this.settings);
        },
    }).display();
    console.timeEnd("main");
}

export async function get_settings(): Promise<LatexSuitePluginSettingsRaw> {
    const version = await browser.storage.sync.get("version");
    if (!version.version) {
        await browser.storage.sync.clear();
        await browser.storage.sync.set({ version: 1 });
        console.log("overriding settings");
        await store_settings(DEFAULT_SETTINGS_RAW);
        return DEFAULT_SETTINGS_RAW;
    }
    const settings = await browser.storage.sync.get(
        Object.entries(DEFAULT_SETTINGS_RAW).reduce(
            (acc, [key, value]) => {
                if (key === "snippets" || key === "snippetVariables")
                    return acc;
                acc[key] = value;
                return acc;
            },
            {} as Record<string, string | boolean | number>,
        ),
    );
    settings.snippets = await get_decompressed("snippets");
    settings.snippetVariables = await get_decompressed("snippetVariables");

    return settings as LatexSuitePluginSettingsRaw;
}

function store_compressed(
    key: string,
    value: Uint8Array,
): Record<string, string | number> {
    const CHUNK_SIZE = Math.ceil(8000 / 3); // 7.5KB per chunk
    const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
    const compressed_items: Record<string, string | number> = {
        [`${key}_number`]: totalChunks,
    };
    for (let i = 0; i < totalChunks; i++) {
        const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        compressed_items[`${key}${i + 1}`] = uint8ArrayToBase64(chunk);
    }
    return compressed_items;
}

async function get_decompressed(key: string): Promise<string> {
    const settings = (await browser.storage.sync.get(
        `${key}_number`,
    )) as Record<string, number>;
    if (!settings) {
        console.error(`No chunks found for ${key}`);
        return "";
    }
    const total_chunks = settings[`${key}_number`];
    const chunks = Array.from(
        { length: total_chunks },
        (_, i) => `${key}${i + 1}`,
    );
    const results = await browser.storage.sync.get(chunks);
    const results_joined = Array.from(
        { length: total_chunks },
        (_, i) => results[`${key}${i + 1}`],
    );
    return decompressFromUint8Array(
        base64ToUint8Array(results_joined.join("")),
    );
}

async function store_settings(
    settings: typeof DEFAULT_SETTINGS_RAW = DEFAULT_SETTINGS_RAW,
): Promise<void> {
    const compressedSnippets = compressToUint8Array(settings.snippets);
    const compressedSnippetVariables = compressToUint8Array(
        settings.snippetVariables,
    );

    const key_value_storage = {
        ...Object.entries(settings).reduce(
            (acc, [key, value]) => {
                if (key === "snippets" || key === "snippetVariables")
                    return acc;
                acc[key] = value;
                return acc;
            },
            {} as Record<string, string | boolean | number>,
        ),
        ...store_compressed("snippets", compressedSnippets),
        ...store_compressed("snippetVariables", compressedSnippetVariables),
    };
    await browser.storage.sync.set(key_value_storage);
}

main();
