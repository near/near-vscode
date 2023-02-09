import * as vscode from "vscode";
import { getChangeForWidget } from "./LocalChange";
import { fsUriStrToUriStr, FS_EXT, NEAR_FS_SCHEME } from "./util";

const registry: Map<string, NearWidget> = new Map();
const WAIT_TIMEOUT = 10000;

export const getWidget = (uriStr: string): NearWidget | null => {
  const w = registry.get(uriStr);
  return w || null;
};

export const waitForWidget = async (uriStr: string) => {
  const now = Date.now();
  return new Promise<NearWidget | null>((resolve) => {
    const waitInterval = setInterval(() => {
      const w = getWidget(uriStr);
      if (w) {
        console.log("waiting for widget", uriStr);
        resolve(w);
        clearInterval(waitInterval);
      } else if (Date.now() - now > WAIT_TIMEOUT) {
        console.log("timed out waiting for widget");
        clearInterval(waitInterval);
      }
    }, 1000);
  });
};

export const getWidgetByFsUri = (fsUriStr: string): NearWidget | null => {
  const uriStr = fsUriStrToUriStr(fsUriStr);
  const w = registry.get(uriStr);
  return w || null;
};

const setWidget = (widget: NearWidget): void => {
  registry.set(widget.uri.toString(), widget);
};

const disposeWidget = (widget: NearWidget | string): void => {
  const uri = typeof widget === "string" ? widget : widget.uri.toString();
  registry.delete(uri);
};

export interface WidgetFile extends vscode.FileStat {
  type: vscode.FileType.File;
  ctime: number;
  mtime: number;
  size: number;
  permissions?: vscode.FilePermission;
  widget: NearWidget;
}

export class NearWidget {
  readonly accountId: AccountId;
  readonly name: WidgetName;
  readonly uri: vscode.Uri;
  code: Buffer | null;
  chainData: any = null;

  private constructor(
    accountId: AccountId,
    name: WidgetName,
    code: Buffer | null
  ) {
    this.accountId = accountId;
    this.name = name;
    this.uri = this._makeUri();
    this.code = code;
  }

  get chainUri(): string {
    return `${this.accountId}/widget/${this.name}`;
  }

  get fsName(): WidgetFSName {
    return `${this.name}${FS_EXT}`;
  }

  private _makeUri(): vscode.Uri {
    const uri = vscode.Uri.from({
      scheme: NEAR_FS_SCHEME,
      path: `/${this.accountId}/${this.name}${FS_EXT}`,
    });
    return uri;
  }

  getFsFile(): WidgetFile {
    return {
      type: vscode.FileType.File,
      ctime: 0,
      mtime: 0,
      size: this.code?.length || 0,
      permissions: 0,
      widget: this,
    };
  }

  static fsNameToName(fsName: WidgetFSName): WidgetName {
    const result = new RegExp(`^(.*)\\${FS_EXT}$`).exec(fsName);
    if (result && result[1]) {
      return result[1];
    } else {
      return fsName;
    }
  }

  static create(accountId: AccountId, name: WidgetName, code: Buffer | null) {
    const newWidget = new NearWidget(accountId, name, code);
    const localChanges = getChangeForWidget(newWidget.uri.toString());
    if (localChanges) {
      newWidget.code = localChanges.content;
    }
    setWidget(newWidget);
    return newWidget;
  }
}
