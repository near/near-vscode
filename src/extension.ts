// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { WidgetsFS } from './fs-provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const widgetsFS = new WidgetsFS();
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('nearfs', widgetsFS, { isCaseSensitive: true }));
	
	context.subscriptions.push(vscode.commands.registerCommand('nearfs.workspaceInit', _ => {
		// widgetsFS.init();
		vscode.workspace.updateWorkspaceFolders(0, null, { uri: vscode.Uri.parse('nearfs:/'), name: "NEAR.social" });
	}));

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsnear1" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vsnear1.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vsnear1!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
