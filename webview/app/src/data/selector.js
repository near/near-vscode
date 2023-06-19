import { connect, KeyPair, keyStores } from 'near-api-js';

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
    async signAndSendTransaction(tx) {
        
        try{
            const res = await this.account.signAndSendTransaction(tx);
            return res;
        } catch({name, message}) {
            console.log("tx error", `ERROR: ${message}`);
            throw Error(message)
        }
    }
    async signAndSendTransactions({ transactions }) {
        return Promise.all(
            transactions.map(tx => this.signAndSendTransaction(tx))
        );
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