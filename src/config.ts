export const NEAR_FS_SCHEME = 'near';
export const getFsSchemeRoot = () => `${NEAR_FS_SCHEME}:/`;
export const SOCIAL_CONTRACT_ACCOUNT = 'social.near';
export const FS_EXT = `.jsx`;
export const isValidAccountId = (accountId: string): accountId is AccountId => /\w+\.near$/.test(accountId);
export const isValidWidgetFsName = (maybeWidgetName: string): maybeWidgetName is WidgetFSName => maybeWidgetName.slice(-(FS_EXT.length)) === FS_EXT;