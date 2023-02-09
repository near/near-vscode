import * as vscode from 'vscode';

export const loginAccount = async (context: vscode.ExtensionContext) => {
  const publisher = context.extension.packageJSON.publisher;
  const name = context.extension.packageJSON.name;
  const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

  vscode.env.openExternal(vscode.Uri.parse(`https://wallet.near.org/login/?success_url=${callback}`));
};


// Login Browser Callback
export const handleLoginCallback = (uri: vscode.Uri) => {
  const queryParams = new URLSearchParams(uri.query);

  if (queryParams.has('account_id')) {
    const accountId = queryParams.get('account_id') as string;
    vscode.commands.executeCommand("near.openWidgetsFromAccount", accountId);
  }
};