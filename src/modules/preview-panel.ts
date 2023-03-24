import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { WIDGET_EXT } from "../config";
import { SocialFS } from "./file-system/fs";

export class WidgetPreviewPanel {
  panel: vscode.WebviewPanel | undefined;
  visible: boolean;
  fileSystem: SocialFS;
  readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext, fileSystem: SocialFS) {
    this.context = context;
    this.visible = false;
    this.fileSystem = fileSystem;
  }

  private createNewPanel(log: vscode.OutputChannel) {
    this.panel = vscode.window.createWebviewPanel(
      "WidgetPreview",
      "Widget Preview",
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      {
        enableScripts: true,   // Enable javascript in the webview
        localResourceRoots: [  // restrict which content the webview can load
          vscode.Uri.joinPath(this.context.extensionUri, "webview/dist")
        ],
      }
    );

    this.panel!.onDidDispose((e) => { this.visible = false; });

    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'console.log':
            const msgs = message.data.map((arg: any) => JSON.stringify(arg));
            // drop first message
            msgs.shift();
            log.appendLine(`> ${msgs.join(' ')}`);
            return;
        }
      },
    );
  }

  public createAndShowPanel(log: vscode.OutputChannel) {
    if (!this.visible) { this.createNewPanel(log); }
    this.visible = true;
    
    // Get index.html and replace relative resource paths with the vscode relative ones
    const filePath: vscode.Uri = vscode.Uri.file(
      path.join(this.context.extensionPath, "webview/dist", "index.html")
    );
    let html = fs.readFileSync(filePath.fsPath, "utf8");
  
    const manifest = require(vscode.Uri.joinPath(this.context.extensionUri, 'webview/dist', 'manifest.json').path);
  
    // manifest is a dictionary {filename: hash-filename}
    for (const key in manifest) {
      const webviewPath = vscode.Uri.joinPath(this.context.extensionUri, "webview/dist", manifest[key]);
      html = html.replace(
        manifest[key],
        this.panel!.webview.asWebviewUri(webviewPath).toString()
      );
    }
    this.panel!.webview.html = html;
  };

  public async showActiveCode(forceUpdate = false) {
    let code = vscode.window.activeTextEditor?.document?.getText() || "";

    // Get props
    let data = await this.fileSystem.readFile(vscode.Uri.parse(`${this.fileSystem.scheme}:/props.json`));
    let props = JSON.parse(data?.toString() || "{}");

    // Get config
    data = await this.fileSystem.readFile(vscode.Uri.parse(`${this.fileSystem.scheme}:/context.json`));
    let context = JSON.parse(data?.toString() || "{}");
    
    // Get local widgets code
    let redirectMap: { [key: string]: { [key: string]: string }; } = {};
    for (const uri of this.fileSystem.localFiles) {
      if (uri.path.endsWith('.json')) { continue; }

      const fcode = await this.fileSystem.readFile(uri);
      const socialPath = uriToSocialPath(uri);
      redirectMap[socialPath] = { "code": fcode.toString() };
    };

    this.panel?.webview.postMessage({
      command: "update-code",
      code: code,
      props,
      config: { redirectMap },
      context,
      forceUpdate,
      widgetUri: "",
    });
  }
}

// Aux
function uriToSocialPath(uri: vscode.Uri): string {
  const [_, accountId, widgetName] = uri.path.split('/');
  return `${accountId}/widget/${widgetName.replace(WIDGET_EXT, '')}`;
}
