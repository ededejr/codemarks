import * as vscode from 'vscode';
import { MarkIdRgx, MarksDB } from './utils';

/**
 * Activates CodeLens features for the extension.
 */
export function activateCodeLens(context: vscode.ExtensionContext) {
	const codelensProvider = new CodelensProvider();

	vscode.languages.registerCodeLensProvider("*", codelensProvider);

	vscode.commands.registerCommand("codemarks.enableCodeLens", () => {
		vscode.workspace.getConfiguration("codemarks").update("enableCodeLens", true, true);
	});

	vscode.commands.registerCommand("codemarks.disableCodeLens", () => {
		vscode.workspace.getConfiguration("codemarks").update("enableCodeLens", false, true);
	});

	vscode.commands.registerCommand("codemarks.codelensAction", (query: any) => {
		vscode.commands.executeCommand("workbench.action.findInFiles", {
			query
		});
	});
}


class CodelensProvider implements vscode.CodeLensProvider {

	private store = new Map<vscode.Range, { text: string }>();
	private codeLenses: vscode.CodeLens[] = [];
	private regex: RegExp;
	private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

	constructor() {
		this.regex = MarkIdRgx;

		vscode.workspace.onDidChangeConfiguration((_) => {
			this._onDidChangeCodeLenses.fire();
		});
	}

	public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

		if (vscode.workspace.getConfiguration("codemarks").get("enableCodeLens", true)) {
			this.codeLenses = [];
			const regex = new RegExp(this.regex);
			const text = document.getText();
			let matches;
			while ((matches = regex.exec(text)) !== null) {
				const line = document.lineAt(document.positionAt(matches.index).line);
				const indexOf = line.text.indexOf(matches[0]);
				const position = new vscode.Position(line.lineNumber, indexOf);
				const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
				if (range) {
					const codeLens = new vscode.CodeLens(range);
					this.codeLenses.push(codeLens);
					this.store.set(range, { text: matches[0] });
				}
			}
			return this.codeLenses;
		}
		return [];
	}

	public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
		if (vscode.workspace.getConfiguration("codemarks").get("enableCodeLens", true)) {
			const data = this.store.get(codeLens.range);
			if (data) {
				const marks = Array.from(MarksDB.values());
				const mark = marks.find(mark => mark.id === data.text.replace('@', '').trim());

				if (mark) {
					codeLens.command = {
						title: mark.codeLens,
						tooltip: "Codemarks are a great way to annotate your code with common themes, patterns and ideas that aren't quite ready to be issues.",
						command: "codemarks.codelensAction",
						arguments: [data.text]
					};
					
					return codeLens;
				}
			}
		}

		return null;
	}
}

