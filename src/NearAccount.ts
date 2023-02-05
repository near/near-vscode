import * as _ from 'lodash';
import * as vscode from "vscode";
import { providers } from "near-api-js";
import { NearWidget, WidgetFile } from "./NearWidget";
import { callRpc } from "./loader";
import { SOCIAL_CONTRACT_ACCOUNT } from "./config";

const provider = new providers.JsonRpcProvider({ url: "https://rpc.near.org" });

export const accountsCache: Record<AccountId, NearAccount> = {};

export interface NearAccountDir extends vscode.FileStat {
  type: vscode.FileType.Directory;
  ctime: number;
  mtime: number;
  size: number;
  name: AccountId;
  // widgetFiles: Map<string, WidgetFile>;
  account: NearAccount;
}

export class NearAccount {
  accountId: AccountId;
  widgets: Record<WidgetName, NearWidget> = {};
  private didFirstLoad = false;

  private constructor(accountId: AccountId) {
    this.accountId = accountId;
  }

  getAccountDir(): NearAccountDir {
    return {
      type: vscode.FileType.Directory,
      ctime: 0,
      mtime: 0,
      size: 0,
      name: this.accountId,
      permissions: vscode.FilePermission.Readonly,
      account: this,
    };
  }

  async getAllWidgetFiles(): Promise<WidgetFile[]> {
    const widgets = await this.getWidgets();
    const entries = Object.entries(widgets);
    const fsFiles = entries.map(([widgetName, w]) => {
      const fsFile = w.getFsFile();
      return fsFile;
    });
    return fsFiles;
  }

  async getOneWidgetFile(widgetName: WidgetName): Promise<WidgetFile | null> {
    const w = await this.getWidget(widgetName);
    if (!w) {
      return null;
    }
    const fsFile = w.getFsFile();
    return fsFile;
  }

  async getWidget(name: WidgetName) {
    if (!this.didFirstLoad) {
      await this.reloadWidgets();
    }
    return this.widgets[name];
  }

  async getWidgets(): Promise<this["widgets"]> {
    if (!this.didFirstLoad) {
      await this.reloadWidgets();
    }
    return this.widgets;
  }

  async reloadWidgets() {
    const args = `{"keys":["${this.accountId}/widget/**"]}`;
    const argsBase64 = Buffer.from(args).toString("base64");
    const rawResult: any = await callRpc(`Account ${this.accountId}`, `get-${SOCIAL_CONTRACT_ACCOUNT}-${args}`, {
      request_type: "call_function",
      account_id: SOCIAL_CONTRACT_ACCOUNT,
      method_name: "get",
      args_base64: argsBase64,
      finality: "optimistic",
    });
    const res = JSON.parse(Buffer.from(rawResult.result).toString());
    const rawWidgets = res[this.accountId]?.widget || {};
    const newWidgets: [WidgetName, NearWidget][] = Object.entries(
      rawWidgets
    ).map(([name, data]: [string, any]) => {
      const code = typeof data === "string" ? data : typeof data === 'object' && typeof data[""] === 'string' ? data[""] : null;
      const newWidget = NearWidget.create(name, code);
      newWidget.chainData = Buffer.from(rawResult.result).toString();
      return [name, newWidget];
    });
    this.widgets = Object.fromEntries(newWidgets);
    this.didFirstLoad = true;
  }

  static byId(accountId: AccountId) {
    if (accountsCache[accountId]) {
      return accountsCache[accountId];
    }
    const newAccount = new NearAccount(accountId);
    accountsCache[accountId] = newAccount;
    return accountsCache[accountId];
  }
}
