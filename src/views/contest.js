import React from 'react';
import { ethers } from 'ethers';
import { useSelector } from 'react-redux';
import {
    useParams,
} from 'react-router-dom';
import {
    fetchContestByIndex,
    fetchContest,
    processRefund,
    fetchRunner,
    approve,
    registerRunner,
    fetchRunsForContest,
    collectWinnings,
} from '../client.js';
import {
    store,
    selectNow,
    selectAddress,
    selectViewRunContestAddress,
    selectContest,
    selectCanceling,
    setViewRunContestAddress,
    setContest,
    setCanceling,
    notCanceling,
    setRunner,
    selectRunner,
    setRegistering,
    selectRegistering,
    selectRunnerScores,
    setCollecting,
    notCollecting,
    selectCollecting,
} from '../database.js';
import { Page } from './layout.js';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

function Markdown({ text }) {
    if (text) {
        const sanitized = { __html: sanitizeHtml(marked.parse(text)) };
        return (
            <div className="Markdown" dangerouslySetInnerHTML={sanitized} />
        );
    }
}

function AttrRow(props) {
    return (
        <div className="AttrRow">
            <span className="name">{props.name}::</span>
            <span className="value">{props.value}</span>
        </div>
    );
}

function formatDate(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, ' UTC');
}

function formatTimestamp(timestamp) {
    if (timestamp) {
        return formatDate(new Date(timestamp * 1000));
    }
}

function formatData(data) {
    return ethers.utils.formatUnits(data, 18);
}

function CanceledContestRunnerRow({ contest, runnerId }) {
    const onClick = function(e) {
        e.preventDefault();
        store.dispatch(setCanceling(runnerId));
        processRefund(contest.contestAddress, runnerId).then(tx => {
            return tx.wait();
        }).then(receipt => {
            return fetchContest(contest.contestAddress);
        }).then(contest => {
            store.dispatch(notCanceling(runnerId));
            store.dispatch(setContest(contest));
        }).catch(e => {
            store.dispatch(notCanceling(runnerId));
            console.error(e);
        });
    }
    const canceling = useSelector(selectCanceling(runnerId));
    return (
        <tr key={runnerId}>
            <td>{runnerId}</td>
            <td>
                {canceling && <em>canceling</em>}
                {!canceling && <button onClick={onClick}>Process Refund</button>}
            </td>
        </tr>
    );
}

function CanceledContest({ contest }) {
    return (
        <div className="DisplayContest">
        <Markdown text={contest.description} />
        <h3>Canceled!</h3>
        {(contest.runnerIds.length > 0) &&
            <div>
                <h3>Registered Runners</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Runner ID</th>
                            <th>Refund</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contest.runnerIds.map(runnerId => <CanceledContestRunnerRow key={runnerId} contest={contest} runnerId={runnerId} />)}
                    </tbody>
                </table>
            </div>}
        </div>
    );
}

function RunnerBox({ runnerId }) {
    const href= `https://runner-hunter.sirsean.workers.dev/${runnerId}`;
    const imgSrc = `https://2112-api.sirsean.workers.dev/runner/${runnerId}.png`;
    return (
        <div className="imgWrapper">
            <a href={href} target="_blank" rel="noreferrer"><img src={imgSrc} alt={runnerId} /></a>
            <span className="runnerId">{runnerId}</span>
        </div>
    );
}

function UnstartedContestRunnerRow({ contest, runnerId }) {
    return (
        <div className="col">
            <RunnerBox runnerId={runnerId} />
        </div>
    );
}

function RegisterRunnerSelection({ contest, runner }) {
    const onClick = (e) => {
        e.preventDefault();
        store.dispatch(setRegistering(true));
        approve(contest.DATA, contest.contestAddress, contest.entryFee).then(tx => {
            return tx.wait();
        }).then(receipt => {
            return registerRunner(contest.contestAddress, runner.id);
        }).then(tx => {
            return tx.wait();
        }).then(receipt => {
            return fetchContest(contest.contestAddress);
        }).then(contest => {
            store.dispatch(setRegistering(false));
            store.dispatch(setRunner(null));
            store.dispatch(setContest(contest));
        }).catch (e => {
            console.error(e);
            store.dispatch(setRegistering(false));
        });
    }
    const isRegistering = useSelector(selectRegistering);
    const address = useSelector(selectAddress);
    const isOwner = address?.toLowerCase() === runner?.owner.toLowerCase();
    if (runner) {
        return (
            <div className="RegisterRunnerSelection">
                <div className="row">
                    <div className="col">
                        <RunnerBox runnerId={runner.id} />
                    </div>
                    <div className="col" style={{padding: '0.8em'}}>
                        <h2>T{runner.attributes.Talent}::{runner.attributes.Faction.replace('The ', '').replace(/s$/, '')}</h2>
                        {!isRegistering && isOwner &&
                            <div>
                                <button onClick={onClick}>Register</button>
                                <p>There will be two transactions, first to approve your DATA for this contract, and then to register and pay the entry fee.</p>
                            </div>}
                        {!isRegistering && !isOwner &&
                            <p>You can only register runners you own.</p>}
                        {isRegistering && <div><em>registering</em></div>}
                    </div>
                </div>
            </div>
        );
    }
}

function RegisterRunnerForm({ contest }) {
    const search = (e) => {
        e.preventDefault();
        const runnerId = e.target.runnerId.value;
        fetchRunner(runnerId).then(runner => {
            store.dispatch(setRunner(runner));
        });
    }
    const runner = useSelector(selectRunner);
    return (
        <div className="RegisterRunnerForm">
            <form onSubmit={search}>
                <input type="text" name="runnerId" placeholder="Cryptorunner ID" tabIndex="1" />
                <button>Search</button>
            </form>
            {runner && <RegisterRunnerSelection contest={contest} runner={runner} />}
        </div>
    );
}

function UnstartedContest({ contest }) {
    const attrs = [
        ['Duration', `${contest.contestLengthDays} day${contest.contestLengthDays !== 1 ? 's' : ''}`],
        ['Mode', contest.mode],
        ['Entry Fee', formatData(contest.entryFee)],
        ['Min Runners', contest.minRunners],
        ['First Place', formatData(contest.payoutFirst)],
        ['Second Place', formatData(contest.payoutSecond)],
        ['Third Place', formatData(contest.payoutThird)],
    ];
    const runnerIds = contest.runnerIds.slice().reverse();
    const contractHref = `https://polygonscan.com/address/${contest.contestAddress}`;
    return (
        <div className="DisplayContest">
            <Markdown text={contest.description} />
            {attrs.map(([k, v]) => <AttrRow key={k} name={k} value={v} />)}
            <p><a target="_blank" rel="noreferrer" href={contractHref}>Contest Contract</a></p>
            <RegisterRunnerForm contest={contest} />
            <hr />
            <div className="row wrap">
                {runnerIds.map(runnerId => <UnstartedContestRunnerRow key={runnerId} contest={contest} runnerId={runnerId} />)}
            </div>
        </div>
    );
}

function CollectWinningsButton({ contest, score }) {
    const collecting = useSelector(selectCollecting(score.runnerId));
    if (contest.winnersSet) {
        const onClick = (e) => {
            e.preventDefault();
            store.dispatch(setCollecting(score.runnerId));
            collectWinnings(contest.contestAddress, score.runnerId).then(tx => {
                return tx.wait();
            }).then(receipt => {
                return fetchContest(contest.contestAddress);
            }).then(contest => {
                store.dispatch(notCollecting(score.runnerId));
                store.dispatch(setContest(contest));
            }).catch(e => {
                store.dispatch(notCollecting(score.runnerId));
                console.error(e);
            });
        }
        if (collecting) {
            return (
                <div><em>collecting</em></div>
            );
        } else if (score.runnerId === contest.winnerFirst && contest.pendingFirst) {
            return (
                <div>
                    <button onClick={onClick}>Collect {formatData(contest.payoutFirst)} DATA</button>
                </div>
            );
        } else if (score.runnerId === contest.winnerSecond && contest.pendingSecond) {
            return (
                <div>
                    <button onClick={onClick}>Collect {formatData(contest.payoutSecond)} DATA</button>
                </div>
            );
        } else if (score.runnerId === contest.winnerThird && contest.pendingThird) {
            return (
                <div>
                    <button onClick={onClick}>Collect {formatData(contest.payoutThird)} DATA</button>
                </div>
            );
        }
    }
}

function StartedContestRunnerRow({ contest, score }) {
    const attrs = [
        ['Total DATA', score.data],
        ['Best DATA', score.best],
        ['Average DATA', score.average.toFixed(1)],
        ['Notoriety', score.np],
        ['Runs', score.runs],
    ];
    return(
        <div className="row">
            <div className="col">
                <RunnerBox runnerId={score.runnerId} />
            </div>
            <div className="col">
                {attrs.map(([k, v]) => <AttrRow key={k} name={k} value={v} />)}
            </div>
            <div className="col">
                <CollectWinningsButton contest={contest} score={score} />
            </div>
        </div>
    );
}

function StartedContest({ contest }) {
    const now = useSelector(selectNow);
    const scores = useSelector(selectRunnerScores);
    const attrs = [
        ['Mode', contest.mode],
        ['Start', formatTimestamp(contest.startTimestamp)],
        ['End', formatTimestamp(contest.endTimestamp)],
        ['Now', formatTimestamp(now)],
        ['First Place', formatData(contest.payoutFirst)],
        ['Second Place', formatData(contest.payoutSecond)],
        ['Third Place', formatData(contest.payoutThird)],
    ];
    React.useEffect(() => {
        fetchRunsForContest(contest);
    }, [contest]);
    return (
        <div className="DisplayContest">
            <Markdown text={contest.description} />
            {attrs.map(([k, v]) => <AttrRow key={k} name={k} value={v} />)}
            <hr />
            {scores.map(score => <StartedContestRunnerRow key={score.runnerId} contest={contest} score={score} />)}
        </div>
    );
}

function DisplayContestForAddress({ contestAddress }) {
    const contest = useSelector(selectContest);
    React.useEffect(() => {
        fetchContest(contestAddress)
            .then(contest => {
                store.dispatch(setContest(contest));
            });
    }, [contestAddress]);
    if (contest) {
        if (contest.canceled) {
            return <CanceledContest contest={contest} />;
        } else if (contest.winnersSet) {
            return <StartedContest contest={contest} />;
        } else if (contest.started) {
            return <StartedContest contest={contest} />;
        } else if (!contest.started) {
            return <UnstartedContest contest={contest} />;
        }
    }
}

export function DisplayContest() {
    const contestAddress = useSelector(selectViewRunContestAddress);
    if (contestAddress) {
        return <DisplayContestForAddress contestAddress={contestAddress} />;
    }
}

function RenderPage() {
    return (
        <div className="Contest">
            <DisplayContest />
        </div>
    );
}

export function Contest() {
    const { index } = useParams();
    const onIsCorrect = () => {
        return fetchContestByIndex(index).then(contestAddress => {
            store.dispatch(setViewRunContestAddress(contestAddress));
        }).catch(e => {
            console.error(e.reason);
        });
    }
    return (
        <Page onIsCorrect={onIsCorrect}>
            <RenderPage />
        </Page>
    );
}
