import * as vscode from 'vscode';
import { SocialFS } from '../modules/file-system/fs';
import * as social from '../modules/social';

export const openAccountWidgets = async (fileSystem: SocialFS, accountId?: string) => {
  accountId = accountId || await vscode.window.showInputBox({ placeHolder: 'mainnet account id' });

  if (accountId) { // TODO: Validate correctly
    vscode.window.showInformationMessage(`NEAR Account: ${accountId}`);

    fileSystem.createDirectory(vscode.Uri.parse(`${fileSystem.scheme}:/${accountId}`));

    const widgetNames = await social.getWidgetsNames(accountId);

    for (const name of widgetNames) {
      fileSystem.addReference(vscode.Uri.parse(`${fileSystem.scheme}:/${accountId}/${name}.jsx`));
    }

    // Add a props.json file if it does not exist
    fileSystem.writeFile(vscode.Uri.parse(`${fileSystem.scheme}:/props.json`), Buffer.from("{}"), {
      overwrite: false,
      create: true
    });

  } else {
    vscode.window.showErrorMessage('Invalid Account ID');
  }
};
