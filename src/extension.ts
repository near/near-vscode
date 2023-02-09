import * as vscode from "vscode";
import { openAccountWidgets } from "./commands/load";
import { loginAccount, handleLoginCallback } from "./commands/login";
import { SocialFS } from "./modules/file-system";
import { WidgetPreviewPanel } from "./modules/preview";

export function activate(context: vscode.ExtensionContext) {

  // File System
  const socialFS = new SocialFS();

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(
      socialFS.scheme, socialFS, { isCaseSensitive: true })
  );

  // Preview Widget
  const previewPanel = new WidgetPreviewPanel(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("near.showWidgetPreview", () => {
      previewPanel.createPanel();
      previewPanel.showActiveCode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.reloadWidgetPreview", () => {
      previewPanel.showActiveCode(true);
    })
  );

  // context.subscriptions.push(
  //   vscode.commands.registerCommand("near.focusActivePreviewSource", () => {
  //     WidgetPreviewFactory.focusActivePreviewSource();
  //   })
  // );

  // Open Widgets by Account ID
  context.subscriptions.push(
    vscode.commands.registerCommand("near.openWidgetsFromAccount", (accountId?) =>
      openAccountWidgets(socialFS.scheme, accountId)
    )
  );

  // Login and Login Callback
  context.subscriptions.push(
    vscode.commands.registerCommand("near.login", () =>
      loginAccount(context)
    )
  );

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: handleLoginCallback
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() { }