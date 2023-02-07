import { ProgressLocation, window } from "vscode";
import * as vscode from 'vscode';
import { NearFS } from "./NearFS";
import { NEAR_FS_SCHEME } from "./util";
import { getWidgetWithCode, NearSocialViewer } from "./NearSocialViewer";

export const openWidgetsFromAccount = async (context: vscode.ExtensionContext) => {
    const accountId = await vscode.window.showInputBox({ placeHolder: 'mainnet account id' });
    if (accountId) {
      vscode.workspace.updateWorkspaceFolders(0, 0, {uri: vscode.Uri.parse(`${NEAR_FS_SCHEME}:/${accountId}/`), name: `NEAR: ${accountId}`});
    } else {
      vscode.window.showErrorMessage('Invalid Account ID');
    }
  };
