import * as vscode from 'vscode';

import { activateCodeLens, activateMarks } from './lib';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "codemarks" is now active!');
	activateMarks(context);
	activateCodeLens(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
