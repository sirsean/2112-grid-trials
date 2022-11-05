import React from 'react';
import { useSelector } from 'react-redux';
import {
    Link,
} from 'react-router-dom';
import { isCorrectChainAsync } from '../wallet.js';
import { fetchNumContests } from '../client.js';
import {
    store,
    selectHasWallet,
    selectIsCorrectChain,
    selectNumContests,
    setHasWallet,
    setIsCorrectChain,
    setNumContests,
} from '../database.js';
import { retryOperation } from '../util.js';
import { Header, NoWallet, SwitchChain } from './layout.js';

function ContestLink({ index }) {
    const href = `/contest/${index}`;
    return (
        <li>
            <Link to={href}>Contest {index}</Link>
        </li>
    );
}

export default function Registry() {
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
                    return fetchNumContests().then(numContests => store.dispatch(setNumContests(numContests)));
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
                <div className="Registry">
                    <Header />
                    <h2>Contest Registry</h2>
                    <ul>
                        {[...Array(numContests).keys()].reverse().map(index => <ContestLink key={index} index={index} />)}
                    </ul>
                </div>
            );
        } else {
            return (
                <div className="Registry">
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
