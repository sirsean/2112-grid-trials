import React from 'react';
import { useSelector } from 'react-redux';
import { isCorrectChainAsync } from '../wallet.js';
import { fetchNumContests, fetchCurrentContest } from '../client.js';
import {
    store,
    selectHasWallet,
    selectIsCorrectChain,
    selectNumContests,
    setHasWallet,
    setIsCorrectChain,
    setNumContests,
    setViewRunContestAddress,
} from '../database.js';
import { retryOperation } from '../util.js';
import { Header, NoWallet, SwitchChain } from './layout.js';
import { DisplayContest } from './contest.js';

export default function CurrentContest() {
    const numContests = useSelector(selectNumContests);
    const hasWallet = useSelector(selectHasWallet);
    const correctChain = useSelector(selectIsCorrectChain);
    React.useEffect(() => {
        store.dispatch(setHasWallet(!!window.ethereum));
        const checkChain = async () => {
            return retryOperation(isCorrectChainAsync, 100, 5).then(isCorrect => {
                store.dispatch(setIsCorrectChain(isCorrect));
                return isCorrect;
            });
        };
        checkChain()
            .then(isCorrect => {
                if (isCorrect) {
                    return fetchNumContests().then(numContests => {
                        store.dispatch(setNumContests(numContests));
                        return fetchCurrentContest();
                    }).then(contestAddress => {
                        console.log('current', contestAddress);
                        store.dispatch(setViewRunContestAddress(contestAddress));
                    }).catch(e => {
                        console.log(e.reason);
                    });
                }
            });
    }, []);
    if (!hasWallet) {
        return <NoWallet />;
    } else if (!correctChain) {
        return <SwitchChain />;
    } else {
        if (numContests) {
            return (
                <div className="CurrentContest">
                    <Header />
                    <DisplayContest />
                </div>
            );
        } else {
            return (
                <div className="CurrentContest">
                    <Header />
                    <div className="row">
                        <div className="col" style={{ margin: '0 auto' }}>
                            <em>there are no contests</em>
                        </div>
                    </div>
                </div>
            );
        }
    }
}
