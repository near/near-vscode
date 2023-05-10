import path from 'path';
import * as vscode from 'vscode';

import { defaultContext } from '../config';
import * as social from '../modules/social';
import { SocialFS } from '../modules/file-system/fs';

export const openAccountWidgets = async (fileSystem: SocialFS, accountId?: string) => {
  accountId = accountId || await vscode.window.showInputBox({ placeHolder: 'mainnet account id' });

  if (accountId) {
    vscode.window.showInformationMessage(`Loading widgets for: ${accountId}`);

    const widgetNames = await social.getWidgetsNames(accountId);

    if (!widgetNames.length) {
      return vscode.window.showErrorMessage('No widgets found');
    }

    fileSystem.createDirectory(vscode.Uri.parse(`${fileSystem.scheme}:/${accountId}`));

    for (const name of widgetNames) {
      let dir = accountId;
      let file = name.split('.');

      // separate `a.widget.name` into `/a/widget/name.jsx`
      while (file.length > 1) {
        dir = path.join(dir, file[0]);
        file = file.slice(1);
        fileSystem.createDirectory(vscode.Uri.parse(`${fileSystem.scheme}:/${dir}`));
      }

      fileSystem.addReference(vscode.Uri.parse(`${fileSystem.scheme}:/${dir}/${file[0]}.jsx`));
    }

    // Add a props.json file if it does not exist
    fileSystem.writeFile(vscode.Uri.parse(`${fileSystem.scheme}:/props.json`), Buffer.from("{}"), {
      overwrite: false,
      create: true
    });

    // Add a config.json file if it does not exist
    fileSystem.writeFile(vscode.Uri.parse(`${fileSystem.scheme}:/context.json`), Buffer.from(JSON.stringify(defaultContext)), {
      overwrite: false,
      create: true
    });
  } else {
    vscode.window.showErrorMessage('Invalid Account ID');
  }
};
