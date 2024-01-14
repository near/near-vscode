import BN from "bn.js";

export const SOCIAL_FS_SCHEME = 'near';
export const SOCIAL_CONTRACT_ACCOUNT = 'social.near';
export const WIDGET_EXT = `.jsx`;
export const APP_NAME = 'vscode social';
export const COST_PER_BYTE = new BN("10000000000000000000");
export const DATA_OVERHEAD = 840; // 6 x https://github.com/NearSocial/VM/blob/d8eb1674cca9aa3350583d40b8a46a74dbbc4ac6/src/lib/data/utils.js#L182C31-L182C46
export const TGAS30 = new BN("30" + "0".repeat(12));

export function contractAccountForNetwork(network: string) {
    return network === "mainnet" ? "social.near" : "v1.social08.testnet";
}

export function networkRPC(network: string) {
    return network === "mainnet" ? "https://rpc.near.org" : "https://rpc.testnet.near.org";
}

export const defaultContext = {
    wrapperSrc: "near/widget/DIG.Theme",
    wrapperProps: {},
    networkId: "mainnet"
};