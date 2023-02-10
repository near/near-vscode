import BN from 'bn.js';

export const NEAR_FS_SCHEME = 'near';
export const getFsSchemeRoot = () => `${NEAR_FS_SCHEME}:/`;
export const SOCIAL_CONTRACT_ACCOUNT = 'social.near';
export const FS_EXT = `.jsx`;
export const APP_NAME = 'vscode NEAR';
export const COST_PER_BYTE = new BN("10000000000000000000");
export const TGAS30 = new BN("30"+"0".repeat(12));

export const isValidAccountId = (accountId: string): accountId is AccountId => true; // TODO: improve /\w+\.near$/.test(accountId) 
export const isValidWidgetFsPath = (maybeWidgetName: string): maybeWidgetName is WidgetFSName => maybeWidgetName.slice(-(FS_EXT.length)) === FS_EXT;
export const fsUriStrToUriStr = (fsUri: string): string => isValidWidgetFsPath(fsUri) ? fsUri.slice(0, -(FS_EXT).length) : fsUri;