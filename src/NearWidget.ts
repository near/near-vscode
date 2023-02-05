import * as vscode from "vscode";
import { FS_EXT } from "./config";

export interface WidgetFile extends vscode.FileStat {
  type: vscode.FileType.File;
  ctime: number;
  mtime: number;
  size: number;
  name: string;
  permissions: vscode.FilePermission;
  widget: NearWidget;
}

export class NearWidget {
  name: string;
  code: string | null;
  chainData: any = null;

  private constructor(name: string, code: string | null) {
    this.name = name;
    this.code = code;
  }

  get fsName() {
    return `${this.name}${FS_EXT}`;
  }

  getFsFile(): WidgetFile {
    return {
      type: vscode.FileType.File,
      ctime: 0,
      mtime: 0,
      size: this.code?.length || 0,
      name: this.fsName,
      permissions: vscode.FilePermission.Readonly,
      widget: this,
    };
  }

  static nameFromFsName(fsName: WidgetFSName): WidgetName {
    const result = new RegExp(`^(.*)\\${FS_EXT}$`).exec(fsName);
    if (result && result[1]) {
        return result[1];
    } else {
        return fsName;
    }
  }

  static create(name: string, code: string | null) {
    return new NearWidget(name, code);
  }
}
