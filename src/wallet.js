import { ethers } from 'ethers';
import { store, setAddress } from './database.js';
import { NETWORK_PARAMS } from './network.js';

export function getProvider() {
    return new ethers.providers.Web3Provider(window.ethereum);
}

export function loadContract(address, abi, isSigner) {
    const provider = getProvider();
    let p = provider;
    if (isSigner) {
        p = provider.getSigner();
    }
    return new ethers.Contract(address, abi, p);
}

export function isCorrectChain() {
    if (window.ethereum) {
        const currentChainId = ethers.BigNumber.from(window.ethereum.networkVersion);
        return (currentChainId.toHexString() === NETWORK_PARAMS.chainId);
    } else {
        return false;
    }
}

export async function isCorrectChainAsync() {
    return isCorrectChain();
}

export async function switchChain() {
    return window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_PARAMS.chainId }],
    }).catch(error => {
        if (error.code === 4902) {
            return window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [NETWORK_PARAMS],
            });
        }
    });
}

export async function connectWalletOnClick(e) {
    if (!isCorrectChain()) {
        await switchChain();
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    provider.send('eth_requestAccounts', [])
        .then(([address]) => {
            store.dispatch(setAddress(address));
        });
}
