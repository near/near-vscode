import * as vscode from 'vscode';
import { NEAR_FS_SCHEME } from './config';
import { openWidgetsFromAccount } from './near-openWidgetsFromAccount';
import {NearFS} from './NearFS';

export function activate(context: vscode.ExtensionContext) {

  const widgetsFS = new NearFS();
  
  context.subscriptions.push(vscode.workspace.registerFileSystemProvider(NEAR_FS_SCHEME, widgetsFS, {isCaseSensitive: true}));

	const nearWidgetContentProvider = new class implements vscode.TextDocumentContentProvider {
		onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
		onDidChange = this.onDidChangeEmitter.event;
		provideTextDocumentContent(uri: vscode.Uri): string {
			return "hello near scheme";
		}
	};
	context.subscriptions.push(vscode.commands.registerCommand('near.openWidgetsFromAccount', openWidgetsFromAccount));

  console.log('vsnear loaded!');

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
export function deactivate() {
}
