import * as vscode from "vscode";
import { window } from "vscode";
import { NEAR_FS_SCHEME } from "./util";
import { openWidgetsFromAccount } from "./near-openWidgetsFromAccount";
import { NearFS } from "./NearFS";
import { getWidget, getWidgetByFsUri } from "./NearWidget";
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
        if (widget) {
          WidgetPreviewFactory.getOrCreate(widget.uri);
        } else {
          error = true;
        }
      } else {
        error = true;
      }
      if (error) {
        vscode.window.showInformationMessage(
          "Error showing preview. Please report this."
        );
      }
    })
  );

  // if (vscode.window.registerWebviewPanelSerializer) {
  //   // Make sure we register a serializer in activation event
  //   vscode.window.registerWebviewPanelSerializer(NearSocialViewer.viewType, {
  //     async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
  //       console.log(`Got state: ${state}`);
  //       // Reset the webview options so we use latest uri for `localResourceRoots`.
  //       webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
  //       NearSocialViewer.revive(webviewPanel, context);
  //     },
  //   });
  // }
  context.subscriptions.push(
    vscode.commands.registerCommand("near.openWidgetsFromAccount", () =>
      openWidgetsFromAccount(context)
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
