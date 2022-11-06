import React from 'react';
import { NETWORK_PARAMS } from '../network.js';
import { switchChain } from '../wallet.js';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    store,
    selectAddress,
    selectHasWallet,
    selectIsCorrectChain,
    setHasWallet,
    setIsCorrectChain,
} from '../database.js';
import { connectWalletOnClick, isCorrectChainAsync } from '../wallet.js';
import { retryOperation } from '../util.js';

export function Header() {
    const address = useSelector(selectAddress);
    return (
        <header>
            <div className="left">
                <h1><Link to="/">2112 Grid Trials</Link></h1>
            </div>
            <div className="right">
                {address && <span>{address}</span>}
                {!address && <button onClick={connectWalletOnClick}>connect</button>}
            </div>
        </header>
    );
}

export function NoWallet() {
    return (
        <div className="NoWallet">
            <p><em>you need to install a wallet to view this page.</em></p>
        </div>
    );
}

export function SwitchChain() {
    const onClick = async (e) => {
        switchChain().then(r => window.location.reload());
    }
    return (
        <div className="SwitchChain">
            <p>to read this data from the blockchain, you need to switch your wallet to {NETWORK_PARAMS.chainName}</p>
            <p><button onClick={onClick}>Switch to {NETWORK_PARAMS.chainName}</button></p>
        </div>
    );
}

export function Page({ children, onIsCorrect }) {
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
                    return onIsCorrect();
                }
            });
    }, [onIsCorrect]);
    if (!hasWallet) {
        return <NoWallet />;
    } else if (!correctChain) {
        return <SwitchChain />;
    } else {
        return (
            <div>
                <Header />
                <div>{children}</div>
            </div>
        );
    }
}
