import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const FS = vscode.workspace.fs;

export class WidgetPreviewPanel {
  panel: vscode.WebviewPanel | undefined;
  visible: boolean;
  localWorkspace: string;
  readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext, localWorkspace: string) {
    this.context = context;
    this.visible = false;
    this.localWorkspace = localWorkspace;
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

    let localProps: { [key: string]: string } = {};
    for (const resource of ['props', 'context', 'flags']) {
      const uri = vscode.Uri.parse(path.join(this.localWorkspace, `${resource}.json`));
      const data = await FS.readFile(uri);
      let prop = JSON.parse(data.toString() || "{}");

      if ('components' in prop) { prop = prop['components']; };
      localProps[resource] = prop;
    }

    // // Get local widgets code
    // let redirectMap: { [key: string]: { [key: string]: string }; } = {};

    // const allLocalFiles = glob.sync(`**/*.jsx`, { cwd: this.localWorkspace });

    // for (const fPath of allLocalFiles) {
    //   const uri = vscode.Uri.parse(path.join(this.localWorkspace, fPath));
    //   const fcode = await FS.readFile(uri);
    //   const socialPath = uriToSocialPath(uri);
    //   redirectMap[socialPath] = { "code": fcode.toString() };
    // };

    this.panel?.webview.postMessage({
      command: "update-code",
      code: code,
      forceUpdate,
      widgetUri: "",
      ...localProps,
    });
  }
}