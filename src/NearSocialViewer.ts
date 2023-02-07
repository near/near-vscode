import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { alert, getNonce, getWebviewOptions, getWidgetWithCode } from "./helpers";

export class NearSocialViewer {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: NearSocialViewer | undefined;

  public static readonly viewType = "NearSocialPanel";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionContext: vscode.ExtensionContext) {
    const column = vscode.ViewColumn.Two;

    // If we already have a panel, show it.
    if (NearSocialViewer.currentPanel) {
      NearSocialViewer.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(NearSocialViewer.viewType, "NEAR Social", column, getWebviewOptions(extensionContext.extensionUri));

    NearSocialViewer.currentPanel = new NearSocialViewer(panel, extensionContext);
  }

  public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    NearSocialViewer.currentPanel = new NearSocialViewer(panel, context);
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._context = context;
    this._extensionUri = context.extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            alert(message.text);
            break;
          case "publish":
            // this.Publish(message.name, message.tag);
            return;

          case "login":
            // this.NearSignin(NETWORK, getContractId(NETWORK));
            return;

          case "confirm-login":
            // this.CheckPublicKey(NETWORK, undefined);
            return;

          case "sign-out":
            // this.DeleteKey();
            // setTimeout(() => this.SendAccountDetails(), 500);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public updateCode(code: string) {
    if (code) {
      this._panel.webview.postMessage({ command: "update-code", code });
    }
  }

  public dispose() {
    NearSocialViewer.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "NEAR Social";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private getPanel(context: vscode.ExtensionContext): string {
    const filePath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, "media", "panel.html"));
    return fs.readFileSync(filePath.fsPath, "utf8");
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, "media", "main.js");
    const styleResetPath = vscode.Uri.joinPath(this._extensionUri, "media", "reset.css");
    const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css");
    const html = this.getPanel(this._context)
    .replaceAll("{{cspSource}}", webview.cspSource)
    .replaceAll("{{nonce}}", getNonce())
    .replace("{{widgetCode}}", getWidgetWithCode())
    .replace("{{stylesResetUri}}", webview.asWebviewUri(styleResetPath).toString())
    .replace("{{stylesMainUri}}", webview.asWebviewUri(stylesPathMainPath).toString())
    .replace("{{scriptUri}}", webview.asWebviewUri(scriptPathOnDisk).toString());
    return html;
  }
}
