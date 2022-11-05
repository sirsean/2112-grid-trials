// MAKE SURE TO ONLY INCLUDE THE RIGHT NETWORK
import { REGISTRY_CONTRACT_ADDRESS as ADDRESS, NETWORK_PARAMS as PARAMS } from './network/polygon.js';
//import { REGISTRY_CONTRACT_ADDRESS as ADDRESS, NETWORK_PARAMS as PARAMS } from './network/hardhat.js';

export const REGISTRY_CONTRACT_ADDRESS = ADDRESS;
export const NETWORK_PARAMS = PARAMS;

// the game contract only exists on polygon anyway
export const GAME_ADDRESS = '0x9d0c114Ac1C3cD1276B0366160B3354ca0f9377E';
