import * as vscode from 'vscode';

export const openAccountWidgets = async (fsScheme: string, accountId?: string) => {
    accountId = accountId || await vscode.window.showInputBox({ placeHolder: 'mainnet account id' });

    if (accountId) { // TODO: Validate correctly
      vscode.window.showInformationMessage(`NEAR Account: ${accountId}`);
      vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse(`${fsScheme}:/${accountId}/`), name: `⛓ mainnet:// ${accountId}` });
    } else {
      vscode.window.showErrorMessage('Invalid Account ID');
    }
  };
