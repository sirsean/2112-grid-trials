import { createSlice, configureStore } from '@reduxjs/toolkit';
import sortBy from 'sort-by';

const rawPersisted = localStorage.getItem('runsById');
const persisted = rawPersisted ? JSON.parse(rawPersisted) : {};

const slice = createSlice({
    name: '2112-grid-trials',
    initialState: {
        now: parseInt((new Date()).getTime() / 1000),
        hasWallet: false,
        isCorrectChain: false,
        address: null,
        numContests: null,
        viewRunContestAddress: null,
        contest: null,
        canceling: {},
        runner: null,
        registering: false,
        runsById: persisted,
        collecting: {},
    },
    reducers: {
        setHasWallet: (state, action) => {
            state.hasWallet = action.payload;
        },
        setIsCorrectChain: (state, action) => {
            state.isCorrectChain = action.payload;
        },
        setAddress: (state, action) => {
            state.address = action.payload;
        },
        setNumContests: (state, action) => {
            state.numContests = action.payload;
        },
        setViewRunContestAddress: (state, action) => {
            if (state.viewRunContestAddress !== action.payload) {
                state.contest = null;
            }
            state.viewRunContestAddress = action.payload;
        },
        setContest: (state, action) => {
            state.contest = action.payload;
        },
        setCanceling: (state, action) => {
            state.canceling[action.payload] = true;
        },
        notCanceling: (state, action) => {
            delete state.canceling[action.payload];
        },
        setRunner: (state, action) => {
            state.runner = action.payload;
        },
        setRegistering: (state, action) => {
            state.registering = action.payload;
        },
        addRun: (state, action) => {
            const run = action.payload;
            state.runsById[run.runId] = run;
        },
        setCollecting: (state, action) => {
            state.collecting[action.payload] = true;
        },
        notCollecting: (state, action) => {
            delete state.collecting[action.payload];
        },
    },
});

export const setHasWallet = slice.actions.setHasWallet;
export const setIsCorrectChain = slice.actions.setIsCorrectChain;
export const setAddress = slice.actions.setAddress;
export const setNumContests = slice.actions.setNumContests;
export const setViewRunContestAddress = slice.actions.setViewRunContestAddress;
export const setContest = slice.actions.setContest;
export const setCanceling = slice.actions.setCanceling;
export const notCanceling = slice.actions.notCanceling;
export const setRunner = slice.actions.setRunner;
export const setRegistering = slice.actions.setRegistering;
export const addRun = slice.actions.addRun;
export const setCollecting = slice.actions.setCollecting;
export const notCollecting = slice.actions.notCollecting;

export const store = configureStore({
    reducer: slice.reducer,
});

export function persistStorage() {
    const state = store.getState();
    localStorage.setItem('runsById', JSON.stringify(state.runsById));
}

export const selectNow = state => state.now;
export const selectHasWallet = state => state.hasWallet;
export const selectIsCorrectChain = state => state.isCorrectChain;
export const selectAddress = state => state.address;
export const selectNumContests = state => state.numContests;
export const selectViewRunContestAddress = state => state.viewRunContestAddress;
export const selectContest = state => state.contest;
export const selectCanceling = runnerId => state => state.canceling[runnerId];
export const selectRunner = state => state.runner;
export const selectRegistering = state => state.registering;
export const selectCollecting = runnerId => state => state.collecting[runnerId];

function sortByMode(mode) {
    switch (mode) {
        case 'BEST':
            return sortBy('-best', '-data', '-np', '-runs', 'runnerId');
        case 'AVERAGE':
            return sortBy('-average', '-data', '-best', '-runs', 'runnerId');
        case 'NOTORIETY':
            return sortBy('-np', '-data', '-best', '-runs', 'runnerId');
        default: // ie TOTAL
            return sortBy('-data', 'best', '-np', '-runs', 'runnerId');
    }
}

export const selectRunnerScores = ({ runsById, contest }) => {
    const runs = Object.values(runsById).filter(run => {
        return ((contest.startTimestamp <= run.startTime) && (contest.startTimestamp <= run.endTime) && (run.endTime <= contest.endTimestamp));
    });
    const runsByRunner = runs.reduce((acc, run) => {
        acc[run.runnerId] ||= [];
        acc[run.runnerId].push(run);
        return acc;
    }, {});

    const runnerIdSet = new Set(contest.runnerIds);
    
    let scores = Object.values(runsByRunner).map(runnerRuns => runnerRuns.reduce((acc, run) => {
        acc.runnerId = run.runnerId;
        acc.runs++;
        acc.data += run.data;
        acc.np += run.notorietyPoints;
        if (run.data > acc.best) {
            acc.best = run.data;
        }
        acc.average = (acc.data / acc.runs);
        return acc;
    }, { runnerId: null, runs: 0, data: 0, np: 0, best: 0 })).filter(score => {
        return runnerIdSet.has(score.runnerId);
    });

    contest.runnerIds.forEach(runnerId => {
        if (!runsByRunner[runnerId]) {
            scores.push({
                runnerId,
                runs: 0,
                data: 0,
                np: 0,
                best: 0,
                average: 0,
            });
        }
    });

    return scores.sort(sortByMode(contest.mode));
};
