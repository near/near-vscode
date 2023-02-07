import * as vscode from "vscode";
import {window} from "vscode";
import {NEAR_FS_SCHEME} from "./util";
import {openWidgetsFromAccount} from "./near-openWidgetsFromAccount";
import {NearFS} from "./NearFS";
import {getWidget} from "./NearWidget";
import {WidgetPreviewFactory} from "./WidgetPreview";

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
}

// This method is called when your extension is deactivated
export function deactivate() {}
