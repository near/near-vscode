import * as vscode from "vscode";
import { ProgressLocation, window } from "vscode";
import { NEAR_FS_SCHEME } from "./util";

export const openWidgetsFromAccount = async (
  context: vscode.ExtensionContext
) => {
  const accountId = await vscode.window.showInputBox({
    placeHolder: "mainnet account id",
  });
  if (accountId) {
    vscode.workspace.updateWorkspaceFolders(0, 0, {
      uri: vscode.Uri.parse(`${NEAR_FS_SCHEME}:/${accountId}/`),
      name: `⛓ mainnet:// ${accountId}`,
    });
    showLoadingMessage(accountId);
    // vscode.window.showInformationMessage(`Adding to workspace: ${accountId}.`);
  } else {
    vscode.window.showErrorMessage("Invalid Account ID");
  }
};

const showLoadingMessage = (accountId: AccountId) => {
  window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: `Adding to workspace: ${accountId}.`,
      cancellable: false,
    },
    async (progress, token) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  );
}