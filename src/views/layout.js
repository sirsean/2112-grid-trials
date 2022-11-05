import { NETWORK_PARAMS } from '../network.js';
import { switchChain } from '../wallet.js';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    selectAddress,
} from '../database.js';
import { connectWalletOnClick } from '../wallet.js';

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
