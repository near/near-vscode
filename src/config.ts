import BN from "bn.js";

export const SOCIAL_FS_SCHEME = 'near';
export const SOCIAL_CONTRACT_ACCOUNT = 'social.near';
export const WIDGET_EXT = `.jsx`;
export const APP_NAME = 'vscode social';
export const COST_PER_BYTE = new BN("10000000000000000000");
export const DATA_OVERHEAD = 336; // TODO: Compute better
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