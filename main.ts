import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { logNotice, runAllCommands } from './utils';

interface Settings {
	gitCommands: Array<[string, string]>
}

const DEFAULT_SETTINGS: Settings = {
	gitCommands: [['', '']],
}

export default class MyPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		this.settings.gitCommands.forEach((command) => {
			if (command[0] && command[1]) {
			this.addCommand({
				id: command[0].replace(/\s/gm , '-'),
				name: command[0],
				callback: () => this.executeCommand(command[1]),
			});
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async executeCommand(command: string) {
		if (command) {
			const commandSplit = command.split('\n');
			runAllCommands(commandSplit);
		}
		else logNotice(undefined, 'Undefined git command');
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	addGitCommandSettings(): void {
        this.containerEl.createEl("h2", { text: "Commands" });

        const desc = document.createDocumentFragment();
        desc.append(
            "Commands that can be run through the console.",
            desc.createEl("br"),
            "Multiple commands can be run through one entry here, just use line breaks.",
            desc.createEl("br"),
            "Changing a command requires reloading obsidian.",
            desc.createEl("br"),
            "Adding `//` behind a command will allow you to set a custom message to be shown when it has executed."
        );

        new Setting(this.containerEl).setDesc(desc);

        this.plugin.settings.gitCommands.forEach((command, index) => {
			const div = this.containerEl.createEl("div");
			const title = this.containerEl.createEl("h4", {
				text: "User Function " + index,
			});
            const setting = new Setting(this.containerEl)
			.addExtraButton((extra) => {
				extra
					.setIcon("cross")
					.setTooltip("Delete")
					.onClick(() => {
						const index = this.plugin.settings.gitCommands.indexOf(command);
						if (index > -1) {
							this.plugin.settings.gitCommands.splice(index, 1);
							this.plugin.saveSettings();
							// Force refresh
							this.display();
						}
					});
			})
			.addText((text) => {
				const t = text
					.setPlaceholder("Command name")
					.setValue(command[0])
					.onChange((new_value) => {
						const index = this.plugin.settings.gitCommands.indexOf(command);
						if (index > -1) {
							this.plugin.settings.gitCommands[index][0] = new_value;
							this.plugin.saveSettings();
						}
					});
				return t;
			})
			.addTextArea((text) => {
				const textArea = text
					.setPlaceholder("Git Command")
					.setValue(command[1])
					.onChange((new_cmd) => {
						const index = this.plugin.settings.gitCommands.indexOf(command);
						if (index > -1) {
							this.plugin.settings.gitCommands[index][1] = new_cmd;
							this.plugin.saveSettings();
						}
					});

				return textArea;
			});

			setting.infoEl.remove();

			div.appendChild(title);
			div.appendChild(this.containerEl.lastChild as Node);
        	});

        	new Setting(this.containerEl).addButton((cb) => {
        	    cb.setButtonText("Add new git command")
        	        .setCta()
        	        .onClick(() => {
        	            this.plugin.settings.gitCommands.push(['', '']);
        	            this.plugin.saveSettings();
        	            // Force refresh
        	            this.display();
        	        });
        	});
    }

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		this.addGitCommandSettings();
	}
}
