import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { openAccountWidgets } from "./commands/load";
import { loginAccount } from "./commands/login";
import { publishCode } from "./commands/publish";
import { handleTransactionCallback } from "./commands/callbacks";
import { WidgetPreviewPanel } from "./modules/preview-panel";
import { preview } from "./commands/preview";
import { startIDE } from "./commands/start-ide";
import { updateAllFlags, updateFlags } from "./flags";
import { addKeyForContract } from "./commands/add-key";

let localWorkspace: string = "";
const FS = vscode.workspace.fs;

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'BOS.enabled', false);
  vscode.commands.executeCommand('setContext', 'BOS.canStart', false);

  // auto start if the folder is already configured
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    localWorkspace = vscode.workspace.workspaceFolders[0].uri.path;
    vscode.commands.executeCommand('setContext', 'BOS.canStart', true);

    const files = ["props.json", "context.json", "flags.json"];
    let allExist = true;
    for (const file of files) {
      allExist &&= fs.existsSync(path.join(localWorkspace, file));
    }

    allExist && updateAllFlags(localWorkspace);

    vscode.commands.executeCommand('setContext', 'BOS.enabled', allExist);
  }

  // Button to start BOS IDE
  context.subscriptions.push(
    vscode.commands.registerCommand("near.startIDE", () => startIDE(localWorkspace))
  );

  // Fetch Widgets by Account ID
  context.subscriptions.push(
    vscode.commands.registerCommand("near.openWidgetsFromAccount", (accountId?) => {
      openAccountWidgets(localWorkspace, accountId);
    })
  );

  // Login Account
  context.subscriptions.push(
    vscode.commands.registerCommand("near.login", () =>
      loginAccount(context, localWorkspace)
    )
  );

  // Login Account
  context.subscriptions.push(
    vscode.commands.registerCommand("near.addKey", () =>
      addKeyForContract(context, localWorkspace)
    )
  );

  // Preview Widget
  const previewPanel = new WidgetPreviewPanel(context, localWorkspace);
  const log = vscode.window.createOutputChannel("Widget");

  context.subscriptions.push(
    vscode.commands.registerCommand("near.showWidgetPreview", () => { preview(previewPanel, log); })
  );

  // Publish Code
  context.subscriptions.push(
    vscode.commands.registerCommand("near.publishWidget", () =>
      publishCode(context, localWorkspace)
    )
  );

  // Handle Callbacks (login, publish)
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: (uri) => handleTransactionCallback(uri, context, localWorkspace)
    })
  );

  // Watch for changes in the workspace and update flags
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.jsx');

  watcher.onDidChange(async (document: vscode.Uri) => {
    updateFlags(localWorkspace, document);
  });

  watcher.onDidDelete(async (document: vscode.Uri) => {
    updateFlags(localWorkspace, document, true);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  vscode.commands.executeCommand('setContext', 'loadedStoragePath', false);
}

// aux
export async function addToContext(localWorkspace: string | undefined, key: string, value: string) {
  if (!localWorkspace) { return; }

  const contextUri = vscode.Uri.parse(path.join(localWorkspace, `context.json`));
  let data = await FS.readFile(contextUri);
  let contextData = JSON.parse(data?.toString() || "{}");
  contextData[key] = value;
  await FS.writeFile(contextUri, Buffer.from(JSON.stringify(contextData, null, 2)));
}

export async function getFromContext(localWorkspace: string | undefined, key: string): Promise<string | undefined> {
  if (!localWorkspace) { return; }

  const contextUri = vscode.Uri.parse(path.join(localWorkspace, `context.json`));
  let data = await FS.readFile(contextUri);
  let contextData = JSON.parse(data?.toString() || "{}");
  return key in contextData? contextData[key] : undefined;
}