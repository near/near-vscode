import * as vscode from "vscode";

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
  };
}

export function alert(text: string) {
  vscode.window.showInformationMessage(text);
}

function getWidgetUrl (network: string) {
	return network === "testnet" 
		? "https://test.near.social/#/embed/test_alice.testnet/widget/remote-code?code="
		: "https://near.social/#/embed/zavodil.near/widget/remote-code?code=";
}

export function getWidgetWithCode(): string {
  const currentWidgetCode = vscode.window.activeTextEditor?.document.getText() ?? "";
  const previewUrlPrefix = getWidgetUrl('mainnet');
  return previewUrlPrefix + encodeURIComponent(currentWidgetCode);
}

export function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
