import { ProgressLocation, window } from "vscode";
import * as vscode from 'vscode';
import { NearFS } from "./NearFS";
import { NEAR_FS_SCHEME } from "./config";

export const openWidgetsFromAccount = async () => {
    const accountId = await vscode.window.showInputBox({ placeHolder: 'mainnet account id' });
    if (accountId) {
      // loadAccountAsync(widgetsFS, accountId);
      vscode.workspace.updateWorkspaceFolders(0, 0, {uri: vscode.Uri.parse(`${NEAR_FS_SCHEME}:/${accountId}/`), name: `NEAR: ${accountId}`});
    } else {
      vscode.window.showErrorMessage('Invalid Account ID');
    }
  };

export const loadAccountAsync = async (widgetsFS: NearFS , accountId: string) => {
    window.withProgress({
        location: ProgressLocation.Notification,
        title: `Loading account: ${accountId}`,
        cancellable: false
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            console.log(`User canceled loading account ${accountId}`);
        });
        
        // progress.report({ increment: 50, message: 'Loading' });
        
        // const accountLoaded = await widgetsFS.loadAccount(accountId);
        vscode.workspace.updateWorkspaceFolders(0, 0, {uri: vscode.Uri.parse(`${NEAR_FS_SCHEME}:/${accountId}/`), name: `NEAR: ${accountId}`});
        // widgetsFS.root.entries.set(accountId, new WidgetAccountDir(accountId));

        return Promise.resolve();
    });
};