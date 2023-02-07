import * as vscode from "vscode";
import { window } from "vscode";
import { NEAR_FS_SCHEME } from "./util";
import { openWidgetsFromAccount } from "./near-openWidgetsFromAccount";
import { loginAccount } from "./near-loginAccount";
import { NearFS } from "./NearFS";
import { getWidget } from "./NearWidget";
import { WidgetPreviewFactory } from "./WidgetPreview";

export function activate(context: vscode.ExtensionContext) {
  const widgetsFS = new NearFS();

  WidgetPreviewFactory.init(context);

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(NEAR_FS_SCHEME, widgetsFS, {
      isCaseSensitive: true,
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.showWidgetPreview", () => {
      let error = false;
      const uri = window.activeTextEditor?.document?.uri.toString() || null;
      if (uri !== null) {
        const widget = getWidget(uri);
        if (widget !== null) {
          WidgetPreviewFactory.createOrFocus(widget.uri.toString());
        } else {
          error = true;
        }
      } else {
        error = true;
      }
      if (error) {
        vscode.window.showInformationMessage(
          "Error showing preview."
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.openWidgetsFromAccount", () =>
      openWidgetsFromAccount(context)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.login", () =>
      loginAccount(context)
    )
  );

  const handleUri = (uri: vscode.Uri) => {
    const queryParams = new URLSearchParams(uri.query);

    if (queryParams.has('account_id')) {
      const accountId = queryParams.get('account_id') as string;
      vscode.window.showInformationMessage(`NEAR Account: ${accountId}`);
      vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse(`${NEAR_FS_SCHEME}:/${accountId}/`), name: `NEAR: ${accountId}` });
    }
  };

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri
    })
  );

}

// This method is called when your extension is deactivated
export function deactivate() { }