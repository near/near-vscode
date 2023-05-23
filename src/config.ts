import BN from "bn.js";

export const SOCIAL_FS_SCHEME = 'near';
export const SOCIAL_CONTRACT_ACCOUNT = 'social.near';
export const WIDGET_EXT = `.jsx`;
export const APP_NAME = 'vscode social';
export const COST_PER_BYTE = new BN("10000000000000000000"); // 1b
export const DATA_OVERHEAD = 8*5 + 64*4 + 20*4; // 8 bytes for each key (len+dict-size), 64 bytes for accountId, 20bytes for widget-name
export const TGAS30 = new BN("30"+"0".repeat(12));

export const defaultContext = {
    wrapperSrc: "near/widget/DIG.Theme",
    wrapperProps: {}
};