import { ethers } from 'ethers';
import { getProvider, loadContract } from './wallet.js';
import { REGISTRY_CONTRACT_ADDRESS, GAME_ADDRESS } from './network.js';
import ContestRegistryABI from './abi/ContestRegistry.js';
import RunContestABI from './abi/RunContest.js';
import ERC20ABI from './abi/ERC20.js';
import GameABI from './abi/Game.js';
import { retryOperation } from './util.js';
import {
    store,
    addRun,
} from './database.js';

function registryContract() {
    return loadContract(REGISTRY_CONTRACT_ADDRESS, ContestRegistryABI);
}

function contestContract(contestAddress, isSigner) {
    return loadContract(contestAddress, RunContestABI, isSigner);
}

function erc20Contract(address, isSigner) {
    return loadContract(address, ERC20ABI, isSigner);
}

function gameContract() {
    return loadContract(GAME_ADDRESS, GameABI);
}

export async function fetchNumContests() {
    return registryContract().numContests().then(numContests => numContests.toNumber());
}

export async function fetchCurrentContest() {
    return registryContract().currentContest();
}

export async function fetchContestByIndex(index) {
    return registryContract().contests(index);
}

export async function processRefund(contestAddress, runnerId) {
    return contestContract(contestAddress, true).processRefund(runnerId);
}

export async function registerRunner(contestAddress, runnerId) {
    return contestContract(contestAddress, true).registerRunner(runnerId);
}

export async function collectWinnings(contestAddress, runnerId) {
    return contestContract(contestAddress, true).collectWinnings(runnerId);
}

export async function fetchContest(contestAddress) {
    const contract = contestContract(contestAddress);
    return Promise.all([
        contract.DATA(),
        contract.entryFee(),
        contract.minRunners(),
        contract.mode().then(m => m.toUpperCase()),
        contract.description(),
        contract.payoutFirst(),
        contract.payoutSecond(),
        contract.payoutThird(),
        contract.winnersSet(),
        contract.winnerFirst().then(runnerId => Promise.all([runnerId, contract.runnerPayers(runnerId).then(addr => ethers.constants.AddressZero !== addr)])),
        contract.winnerSecond().then(runnerId => Promise.all([runnerId, contract.runnerPayers(runnerId).then(addr => ethers.constants.AddressZero !== addr)])),
        contract.winnerThird().then(runnerId => Promise.all([runnerId, contract.runnerPayers(runnerId).then(addr => ethers.constants.AddressZero !== addr)])),
        contract.contestLengthDays(),
        contract.started(),
        contract.startTimestamp(),
        contract.endTimestamp(),
        contract.canceled(),
        contract.numRunners().then(numRunners => Promise.all([...Array(numRunners.toNumber()).keys()].map(index => contract.runnerIds(index).then(runnerId => runnerId.toNumber())))),
    ]).then(([ DATA, entryFee, minRunners, mode, description, payoutFirst, payoutSecond, payoutThird, winnersSet, [winnerFirst, pendingFirst], [winnerSecond, pendingSecond], [winnerThird, pendingThird], contestLengthDays, started, startTimestamp, endTimestamp, canceled, runnerIds ]) => {
        return {
            contestAddress,
            DATA,
            mode,
            description,
            canceled,
            started,
            winnersSet,
            entryFee: entryFee.toString(),
            minRunners: minRunners.toNumber(),
            payoutFirst: payoutFirst.toString(),
            payoutSecond: payoutSecond.toString(),
            payoutThird: payoutThird.toString(),
            winnerFirst: winnerFirst.toNumber(),
            pendingFirst,
            winnerSecond: winnerSecond.toNumber(),
            pendingSecond,
            winnerThird: winnerThird.toNumber(),
            pendingThird,
            contestLengthDays: contestLengthDays.toNumber(),
            startTimestamp: startTimestamp.toNumber(),
            endTimestamp: endTimestamp.toNumber(),
            runnerIds,
        };
    });
}

export async function fetchRunner(runnerId) {
    return fetch(`https://2112-api.sirsean.workers.dev/runner/${runnerId}`).then(r => r.json());
}

export async function approve(erc20Address, spender, amount) {
    return erc20Contract(erc20Address, true).approve(spender, amount);
}

async function fetchRunData(runId) {
    return gameContract().runsById(runId).then(r => {
        return {
            runId,
            notorietyPoints: r.notorietyPoints?.toNumber(),
            data: parseInt(ethers.utils.formatUnits(r.data, 18)),
            startTime: r.startTime?.toNumber(),
            endTime: r.endTime?.toNumber(),
        };
    });
}

async function augmentRun(run) {
    return fetchRunData(run.runId).then(runData => {
        return {
            runnerId: run.tokenId.toNumber(),
            ...runData,
        };
    });
}

async function filterRuns(fromBlock, toBlock) {
    const contract = gameContract();
    return contract.queryFilter(contract.filters.RunEnded(), fromBlock, toBlock)
        .then(all => all.map(e => e.args));
}

export async function runsPage(runnerIdSet, fromBlock, toBlock) {
    const runs = await retryOperation(async () => { return filterRuns(fromBlock, toBlock) }, 100, 5);
    let augmented = [];
    for (let i=0; i < runs.length; i++) {
        const run = runs[i];
        if (runnerIdSet.has(run.tokenId.toNumber())) {
            const r = await retryOperation(async () => { return await augmentRun(run) }, 200, 5);
            store.dispatch(addRun(r));
            augmented.push(r);
        }
    }
    return augmented;
}

export async function fetchRunsForContest({ startTimestamp, endTimestamp, runnerIds }) {
    const runnerIdSet = new Set(runnerIds);
    const provider = getProvider();
    return provider.getBlock().then(async (block) => {
        let blockNumber = block.number;
        let runs = [];
        do {
            const page = await runsPage(runnerIdSet, blockNumber-10000, blockNumber);
            blockNumber -= 10000;
            runs.push(...page);
            const nextBlock = await provider.getBlock(blockNumber);
            if (nextBlock.timestamp < startTimestamp) {
                break;
            }
            if ((page.length > 0) && (page[0].endTime < startTimestamp)) {
                break;
            }
        } while(true);
        return runs.filter(run => {
            return ((startTimestamp <= run.startTime) && (startTimestamp <= run.endTime) && (run.endTime <= endTimestamp));
        });
    });
}
