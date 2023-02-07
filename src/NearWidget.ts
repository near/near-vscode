import * as vscode from "vscode";
import { fsUriStrToUriStr, FS_EXT, NEAR_FS_SCHEME } from "./util";

const registry: Map<string, NearWidget> = new Map();

export const getWidget = (uriStr :string): NearWidget | null => {
    const w = registry.get(uriStr);
    return w || null;
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
  const uri = typeof widget === 'string' ?  widget : widget.uri.toString();
  registry.delete(uri);
};


export interface WidgetFile extends vscode.FileStat {
  type: vscode.FileType.File;
  ctime: number;
  mtime: number;
  size: number;
  permissions: vscode.FilePermission;
  widget: NearWidget;
}

export class NearWidget {
  readonly accountId: AccountId;
  readonly name: WidgetName;
  readonly uri: vscode.Uri;
  code: string | null;
  chainData: any = null;

  private constructor(accountId: AccountId, name: WidgetName, code: string | null) {
    this.accountId = accountId;
    this.name = name;
    this.uri = this._makeUri();
    this.code = code;
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
      permissions: vscode.FilePermission.Readonly,
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

  static create(accountId: AccountId, name: WidgetName, code: string | null) {
    const newWidget = new NearWidget(accountId, name, code);
    setWidget(newWidget);
    return newWidget;
  }
}
