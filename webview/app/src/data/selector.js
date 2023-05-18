import { connect, KeyPair, keyStores } from 'near-api-js';
import { functionCall } from 'near-api-js/lib/transaction';


const keyStore = new keyStores.InMemoryKeyStore();

const contractId = (networkId) => {
    return {
        testnet: "v1.social08.testnet",
        mainnet: "social.near"
    }[networkId]
};

const connectionConfig = (keyStore, networkId) => {
    return {
        testnet: {
            networkId: "testnet",
            keyStore,
            nodeUrl: "https://rpc.testnet.near.org",
            walletUrl: "https://wallet.testnet.near.org",
        },
        mainnet: {
            networkId: "mainnet",
            keyStore,
            nodeUrl: "https://rpc.near.org",
            walletUrl: "https://wallet.near.org",
        }
    }[networkId]
};

class expectedAccount {
    constructor(account) { this.account = account }
    async signAndSendTransaction({ receiverId, actions }) {
        const { methodName, args, gas } = actions[0].params
        let new_actions = [functionCall(methodName, args, gas, "0")]
        return await this.account.signAndSendTransaction({ receiverId, actions: new_actions })
    }
}

export async function create_selector(networkId = "mainnet", accountId, accessKey) {
    if (accessKey) {
        const keyPair = KeyPair.fromString(accessKey)
        await keyStore.setKey("mainnet", accountId, keyPair)
    }

    const nearConnection = await connect(connectionConfig(keyStore, networkId));

    const account = await nearConnection.account(accountId);

    const walletState = {
        contract: { contractId: contractId(networkId) },
        accounts: [{ accountId }]
    }

    return {
        wallet: () => new expectedAccount(account),
        store: { observable: { subscribe: (f) => { f(walletState) } }, getState: () => walletState }
    }
}