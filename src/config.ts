import BN from "bn.js";

export const SOCIAL_FS_SCHEME = 'near';
export const SOCIAL_CONTRACT_ACCOUNT = 'social.near';
export const WIDGET_EXT = `.jsx`;
export const APP_NAME = 'vscode social';
export const COST_PER_BYTE = new BN("10000000000000000000");
export const TGAS30 = new BN("30"+"0".repeat(12));

export const defaultContext = {
    wrapperSrc: "adminalpha.near/widget/DS.Theme",
    wrapperProps: {}
};