import * as vscode from "vscode";
import { openAccountWidgets } from "./commands/load";
import { loginAccount } from "./commands/login";
import { publishCode } from "./commands/publish";
import { handleTransactionCallback } from "./commands/callbacks";
import { SocialFS } from "./modules/file-system/fs";
import { WidgetPreviewPanel } from "./modules/preview";
import { chooseLocalPath, populateFS } from "./commands/init-fs";
import { getTransactionStatus } from "./modules/social";

export function activate(context: vscode.ExtensionContext) {
  const localWorkspace: string | undefined = context.workspaceState.get('localStoragePath');

  // File System
  let socialFS = new SocialFS(localWorkspace);
  if (localWorkspace) { populateFS(socialFS, localWorkspace); }
  context.subscriptions.push(vscode.workspace.registerFileSystemProvider(socialFS.scheme, socialFS, { isCaseSensitive: true }));

  // Preview Widget
  const previewPanel = new WidgetPreviewPanel(context, socialFS);

  context.subscriptions.push(
    vscode.commands.registerCommand("near.showWidgetPreview", () => {
      previewPanel.createAndShowPanel();
      previewPanel.showActiveCode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.chooseLocalPath", async () => {
      chooseLocalPath(context, socialFS);
    })
  );

  // Open Widgets by Account ID
  context.subscriptions.push(
    vscode.commands.registerCommand("near.openWidgetsFromAccount", (accountId?) => {
      openAccountWidgets(socialFS, accountId);
    })
  );

  // Login
  context.subscriptions.push(
    vscode.commands.registerCommand("near.login", () =>
      loginAccount(context, 'mainnet')
    )
  );

  // Publish Code
  context.subscriptions.push(
    vscode.commands.registerCommand("near.publishWidget", () =>
      publishCode(context, 'mainnet')
    )
  );

  // Callback
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: handleTransactionCallback
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
  context.workspaceState.update('localStoragePath', undefined);
}