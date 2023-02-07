import * as vscode from "vscode";
import { window } from "vscode";
import { NEAR_FS_SCHEME } from "./config";
import { openWidgetsFromAccount } from "./near-openWidgetsFromAccount";
import { NearFS } from "./NearFS";
import { WidgetPreviewFactory } from "./WidgetEditorPreview";

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
      // NearSocialViewer.createOrShow(context);
      const uri = window.activeTextEditor?.document?.uri || null;
      if (uri) {
        WidgetPreviewFactory.getOrCreate(uri);
      } else {
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
