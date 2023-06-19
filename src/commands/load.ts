import path from 'path';
import * as vscode from 'vscode';

import * as social from '../modules/social';
import { getFromContext } from '../extension';

export const openAccountWidgets = async (localWorkspace:string, accountId?: string) => {
  accountId = accountId || await vscode.window.showInputBox({ placeHolder: 'Mainnet AccountId [e.g. alice.near]' });

  const networkId = await getFromContext(localWorkspace, 'networkId') || "mainnet";

  if (accountId) {
    vscode.window.showInformationMessage(`Loading widgets for: ${accountId}`);

    const widgetNames = await social.getWidgetsNames(accountId, networkId);

    if (!widgetNames.length) {
      return vscode.window.showErrorMessage('No widgets found');
    }

    vscode.workspace.fs.createDirectory(vscode.Uri.parse(path.join(localWorkspace, accountId)));

    for (const name of widgetNames) {
      let dir = path.join(localWorkspace, accountId);
      let file = name.split('.');

      // separate `a.widget.name` into `/a/widget/name.jsx`
      while (file.length > 1) {
        dir = path.join(dir, file[0]);
        file = file.slice(1);
        vscode.workspace.fs.createDirectory(vscode.Uri.parse(dir));
      }

      const widgetCode = await social.getWidgetCode(accountId, name, networkId);
      vscode.workspace.fs.writeFile(vscode.Uri.parse(path.join(dir, `${file[0]}.jsx`)), Buffer.from(widgetCode));
    }
  } else {
    vscode.window.showErrorMessage('Invalid Account ID');
  }
};
