import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { window } from "vscode";
import { getChangeForWidget, getChangesForPreview } from "./LocalChange";
import { getWidget, waitForWidget } from "./NearWidget";

export class WidgetPreviewFactory {
  private static instance: WidgetPreviewFactory;
  private context: vscode.ExtensionContext;
  private previews: Record<string, WidgetPreview> = {};

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static init(context: vscode.ExtensionContext) {
    if (WidgetPreviewFactory.instance) {
      throw new Error("WidgetEditorPreview is already initialized");
    }
    WidgetPreviewFactory.instance = new WidgetPreviewFactory(context);
    vscode.window.registerWebviewPanelSerializer(WidgetPreview.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: { code: string; widgetUri: string }
      ) {
        console.log(`Got state:`, state);
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
        if (state.widgetUri) {
          const w = await waitForWidget(state.widgetUri);
          if (w !== null) {
            WidgetPreviewFactory.create(state.widgetUri, webviewPanel);
          }
        }
      },
    });
  }

  static create(widgetUriStr: string, panel?: vscode.WebviewPanel) {
    const newPreview = WidgetPreview.create(
      WidgetPreviewFactory.instance.context,
      widgetUriStr,
      () => WidgetPreviewFactory.disposePreview(widgetUriStr),
      panel
    );
    WidgetPreviewFactory.instance.previews[widgetUriStr] = newPreview;
  }

  static createOrFocus(widgetUriStr: string) {
    const existing = WidgetPreviewFactory.instance.previews[widgetUriStr];
    if (existing) {
      existing.panel.reveal(undefined, true);
    } else {
      WidgetPreviewFactory.create(widgetUriStr);
    }
  }

  static reloadActivePreview() {
    const previews = Object.values(WidgetPreviewFactory.instance.previews);
    for (const p of previews) {
      if (p.panel.active) {
        p.updateCode(true);
        return;
      }
    }
    vscode.window.showErrorMessage("Error reloading widget.");
  }

  static async focusActivePreviewSource() {
    const previews = Object.values(WidgetPreviewFactory.instance.previews);
    let isError = false;
    for (const p of previews) {
      if (p.panel.active) {
        const uri = vscode.Uri.parse(p.widgetUriStr);
        try {
          const doc = await vscode.workspace.openTextDocument(uri);
          vscode.window.showTextDocument(doc);
        } catch (e) {
          isError = true;
        }
        break;
      }
    }
    if (isError) {
      vscode.window.showErrorMessage("Error opening source file.");
    }
  }

  private static disposePreview(widgetUriStr: string) {
    delete WidgetPreviewFactory.instance.previews[widgetUriStr];
  }
}

export class WidgetPreview {
  public static readonly viewType = "WidgetPreview";

  readonly panel: vscode.WebviewPanel;
  readonly context: vscode.ExtensionContext;
  readonly widgetUriStr: string;
  private _disposables: vscode.Disposable[] = [];

  public static create(
    extensionContext: vscode.ExtensionContext,
    widgetUristr: string,
    onDispose: () => void,
    panel?: vscode.WebviewPanel
  ) {
    let newPanel = panel;
    if (!newPanel) {
      const viewColumn = vscode.ViewColumn.Beside;
      newPanel = vscode.window.createWebviewPanel(
        WidgetPreview.viewType,
        "",
        {
          viewColumn,
          preserveFocus: true,
        },
        getWebviewOptions(extensionContext.extensionUri)
      );
      const isDark = [
        vscode.ColorThemeKind.Dark,
        vscode.ColorThemeKind.Dark,
      ].includes(vscode.window.activeColorTheme.kind);
      newPanel.iconPath = vscode.Uri.joinPath(
        extensionContext.extensionUri,
        "media",
        isDark ? "near-dark.png" : "near-light.png"
      );
    }
    const newPreview = new WidgetPreview(
      widgetUristr,
      newPanel,
      extensionContext,
      onDispose
    );
    return newPreview;
  }

  private constructor(
    widgetUriStr: string,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    onDispose: () => void
  ) {
    this.widgetUriStr = widgetUriStr;
    this.panel = panel;
    this.context = context;

    this.panel.title = `Preview ${this.widgetUriStr.toString()}`;
    setHtmlForWebview(context, panel);

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this.panel.onDidDispose(
      () => {
        this.dispose();
        onDispose();
      },
      null,
      this._disposables
    );

    // Update the content based on view changes
    this.panel.onDidChangeViewState(
      (e) => {
        const visible = e.webviewPanel.visible;
        console.log("onDidChangeViewState", {
          visible: e.webviewPanel.visible,
          active: e.webviewPanel.active,
          viewColumn: e.webviewPanel.viewColumn,
        });
        if (visible) {
          this.updateCode();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "request-update-code":
            this.updateCode();
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public updateCode(forceUpdate = false) {
    if (this.panel.visible) {
      // const code = getWidgetSourceCode(this.widgetUriStr.toString());
      const p = getPreviewProps(this.widgetUriStr.toString());
      if (p) {
        const previewProps = JSON.stringify(p);
        this.panel.webview.postMessage({
          command: "update-code",
          iframeQs: previewProps,
          forceUpdate,
          widgetUri: this.widgetUriStr.toString(),
        });
      } else {
        throw new Error("bad preview props");
      }
    }
  }

  public dispose() {
    this.panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

const setHtmlForWebview = (
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
) => {
  const webview = panel.webview;
  const scriptPathOnDisk = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "main.js"
  );
  const styleResetPath = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "reset.css"
  );
  const stylesPathMainPath = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "vscode.css"
  );
  const html = getPanelHtmlFileContent(context)
    .replaceAll("{{cspSource}}", webview.cspSource)
    .replaceAll("{{nonce}}", getNonce())
    .replace(
      "{{stylesResetUri}}",
      webview.asWebviewUri(styleResetPath).toString()
    )
    .replace(
      "{{stylesMainUri}}",
      webview.asWebviewUri(stylesPathMainPath).toString()
    )
    .replace(
      "{{scriptUri}}",
      webview.asWebviewUri(scriptPathOnDisk).toString()
    );
  webview.html = html;
};

const getPanelHtmlFileContent = (context: vscode.ExtensionContext): string => {
  const filePath: vscode.Uri = vscode.Uri.file(
    path.join(context.extensionPath, "media", "panel.html")
  );
  return fs.readFileSync(filePath.fsPath, "utf8");
};

export function getWebviewOptions(
  extensionUri: vscode.Uri
): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
  };
}

interface WidgetConfigProp {
  redirectMap: Record<string, { code: string }>;
}
interface PreviewProps {
  code: string;
  props?: Record<string, any>;
  config?: WidgetConfigProp;
}

export const getPreviewProps = (widgetUriStr: string): PreviewProps => {
  const widget = getWidget(widgetUriStr);
  if (!widget) {
    window.showErrorMessage(`Error loading preview: ${widgetUriStr}`);
    return { code: `return <code>error</code>` };
  } else {
    let code = "";
    const change = getChangeForWidget(widgetUriStr);
    if (change) {
      code = change.content?.toString() || "";
    } else {
      code = widget.code?.toString("utf-8") || "";
    }
    const redirectMap = getChangesForPreview();
    return {
      code,
      config: { redirectMap },
    };
  }
};

export function getWidgetSourceCode(widgetUriStr: string): string {
  const widget = getWidget(widgetUriStr);
  if (!widget || widget.code === null) {
    window.showErrorMessage(`Error loading preview: ${widgetUriStr}`);
    return `return <code>error</code>`;
  } else {
    return widget.code.toString();
  }
}

export function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
