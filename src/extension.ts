import * as vscode from "vscode";
import {window} from "vscode";
import {NEAR_FS_SCHEME} from "./util";
import {openWidgetsFromAccount} from "./commands/load";
import {NearFS} from "./NearFS";
import {getWidget} from "./NearWidget";
import {WidgetPreviewFactory} from "./WidgetPreview";
import { loginAccount } from "./commands/login";
import { publishCode } from "./commands/publish";
import { handleTransactionCallback } from "./callbacks";
import { initLocalChangesRegistry } from "./LocalChange";
import { window } from "vscode";
import { getDecorationsProvider, initLocalChangesRegistry } from "./LocalChange";
import { openWidgetsFromAccount } from "./near-openWidgetsFromAccount";
import { NearFS } from "./NearFS";
import { getWidget } from "./NearWidget";
import { NEAR_FS_SCHEME } from "./util";
import { WidgetPreviewFactory } from "./WidgetPreview";

export function activate(context: vscode.ExtensionContext) {
  const widgetsFS = new NearFS();

  WidgetPreviewFactory.init(context);
  initLocalChangesRegistry(context, widgetsFS);

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(NEAR_FS_SCHEME, widgetsFS, {
      isCaseSensitive: true,
    })
  );

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(getDecorationsProvider())
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
        vscode.window.showInformationMessage("Error showing preview.");
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("near.reloadWidgetPreview", () => {
      WidgetPreviewFactory.reloadActivePreview();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.focusActivePreviewSource", () => {
      WidgetPreviewFactory.focusActivePreviewSource();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.openWidgetsFromAccount", (accountId?) =>
      openWidgetsFromAccount(accountId)
    )
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
export function deactivate() {}
