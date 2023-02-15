import * as vscode from 'vscode';
import { NEAR_FS_SCHEME } from "../util";

export const openWidgetsFromAccount = async (accountId?: string) => {
  accountId = accountId || await vscode.window.showInputBox({ placeHolder: 'mainnet account id' });

  if (accountId) { // TODO: Validate correctly
    vscode.window.showInformationMessage(`NEAR Account: ${accountId}`);
    vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse(`${NEAR_FS_SCHEME}:/${accountId}/`), name: `⛓ mainnet: ${accountId}` });
  } else {
    vscode.window.showErrorMessage('Invalid Account ID');
  }
};
