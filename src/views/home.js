import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Header } from './layout.js';
import { selectAddress } from '../database.js';
import { connectWalletOnClick } from '../wallet.js';

export default function Home() {
    const address = useSelector(selectAddress);
    return (
        <div className="Home">
            <Header />
            <p>Greetings, runners!</p>
            <p>The trials are about competition. We're always running hard in the Grid against the corps, but every once in a while we want to see who's the best runner.</p>
            <p>Want to enter? Put up your DATA. Jack in. Run hard.</p>
            <p>To the winner go the spoils!</p>
            {window.ethereum && address &&
                <ul>
                    <li><Link to="/current">Current Contest</Link></li>
                    <li><Link to="/registry">Contest Registry</Link></li>
                </ul>}
            {window.ethereum && !address &&
                <p>To participate, please <button onClick={connectWalletOnClick}>connect your wallet</button>.</p>}
            {!window.ethereum && <p>To view the trials, you will need to install a wallet.</p>}
            <hr />
            <div className="errata">
                <p>Each contest has an entry fee, paid in DATA. These entry fees are used to pay the winners; each contest sets how much DATA the top three finishers will win.</p>
                <p>The contest cannot start until enough runners have paid the fee, such that there is enough DATA to pay the winners.</p>
                <p>If enough runners do not sign up, the contest may be canceled, in which case the runners who did sign up can claim a refund and get 100% of their DATA back. You do not lose if there is no game.</p>
                <p>Each contest may have a different duration.</p>
                <p>Each contest may choose a different metric for choosing winners, such as "most total DATA", "best single run", "highest average DATA", or "most notoriety points". You will know this before you enter.</p>
                <p>Once the contest is over, the winners can collect their DATA winnings. Anybody can click that button, but the DATA gets paid to the winner.</p>
                <p>The contests are saved on the blockchain, and never go away. Even once a new contest starts, you can always go back and collect your winnings from old contests.</p>
            </div>
        </div>
    );
}
