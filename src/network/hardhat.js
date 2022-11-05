import { ethers } from 'ethers';

export const REGISTRY_CONTRACT_ADDRESS = '0xb8C25FD8450a6a53539fF8E502fC5Db0D9907417';

export const NETWORK_PARAMS = {
    chainId: ethers.BigNumber.from(31337).toHexString(),
    chainName: 'Hardhat',
    nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
    },
    rpcUrls: ['http://localhost:8545'],
};

