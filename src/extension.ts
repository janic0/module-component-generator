import * as vscode from "vscode";
import * as fs from "fs";
import { join } from "path";

const error = (text: string) => vscode.window.showErrorMessage(text);
const info = (text: string) => vscode.window.showInformationMessage(text);

const getContent = (
	type: "vue" | "ts" | "scss" | "variables",
	location: "components" | "modules",
	moduleName: string
): string => {
	if (type === "vue")
		return `<template>
  <div class="${moduleName}"></div>
</template>

<script src="@/${location}/${moduleName}/${
			moduleName + ".ts"
		}" lang="ts"></script>

<style src="@/${location}/${moduleName}/${
			moduleName + ".scss"
		}" lang="scss"></style>
`;
	else if (type === "ts")
		return `import { defineComponent } from 'vue';

export default defineComponent({
  name: '${moduleName}'
});
`;
	else if (type === "scss") return `.${moduleName} {}`;
	return "";
};

const create = (type: "modules" | "components") => {
	if (vscode.workspace.workspaceFolders) {
		const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		fs.readdir(workspaceFolder, (err, files) => {
			if (err) return error(err.message);
			if (!files.includes("src")) return error("no src folder found");
			fs.stat(join(workspaceFolder, "src"), (err, stat) => {
				if (err) return error(err.message);
				if (!stat.isDirectory()) return error("src is not a directory");
				fs.readdir(join(workspaceFolder, "src"), (err, files) => {
					if (err) return error(err.message);
					if (!files.includes(type)) return error(`no ${type} folder found"`);
					fs.stat(join(workspaceFolder, "src", type), (err, stat) => {
						if (err) return error(err.message);
						if (!stat.isDirectory()) return error(type + " is not a directory");
						vscode.window
							.showInputBox({
								placeHolder: type.slice(0, -1) + " name",
								ignoreFocusOut: false,
							})
							.then((moduleName) => {
								if (!moduleName) return info("Cancelled");
								fs.readdir(join(workspaceFolder, "src", type), (err, files) => {
									if (err) return error(err.message);
									if (
										files
											.map((elm) => elm.toLowerCase())
											.includes(moduleName.toLowerCase())
									)
										return error(type.slice(0, -1) + " already exists");
									fs.mkdir(
										join(workspaceFolder, "src", type, moduleName),
										(err) => {
											if (err) return error(err.message);
											["scss", "ts", "vue"].map((extension) => {
												fs.writeFile(
													join(
														workspaceFolder,
														"src",
														type,
														moduleName,
														moduleName + "." + extension
													),
													getContent(
														extension as "scss" | "ts" | "vue",
														type,
														moduleName
													),
													(err) => {
														if (err) return error(err.message);
														info(moduleName.slice(0, -1) + " created");
													}
												);
											});
											fs.writeFile(
												join(
													workspaceFolder,
													"src",
													type,
													moduleName,
													"_variables.scss"
												),
												getContent("variables", type, moduleName),
												(err) => {
													if (err) return error(err.message);
													info(moduleName.slice(0, -1) + " created");
												}
											);
										}
									);
								});
							});
					});
				});
			});
		});
	}
};

export function activate(context: vscode.ExtensionContext) {
	const moduleDisposable = vscode.commands.registerCommand(
		"extension.createModule",
		() => create("modules")
	);
	const componentDisposable = vscode.commands.registerCommand(
		"extension.createComponent",
		() => create("components")
	);

	context.subscriptions.push(moduleDisposable);
	context.subscriptions.push(componentDisposable);
}
