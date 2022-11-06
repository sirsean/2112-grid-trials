import React from 'react';
import { useSelector } from 'react-redux';
import {
    Link,
} from 'react-router-dom';
import { fetchNumContests } from '../client.js';
import {
    store,
    selectNumContests,
    setNumContests,
} from '../database.js';
import { Page } from './layout.js';
import { REGISTRY_CONTRACT_ADDRESS } from '../network.js';

function ContestLink({ index }) {
    const href = `/contest/${index}`;
    return (
        <li>
            <Link to={href}>Contest {index}</Link>
        </li>
    );
}


function RenderPage() {
    const numContests = useSelector(selectNumContests);
    const contractHref = `https://polygonscan.com/address/${REGISTRY_CONTRACT_ADDRESS}`;
    if (numContests) {
        return (
            <div className="Registry">
                <h2>Contest Registry</h2>
                <ul>
                    {[...Array(numContests).keys()].reverse().map(index => <ContestLink key={index} index={index} />)}
                </ul>
                <p><a target="_blank" rel="noreferrer" href={contractHref}>Registry Contract</a></p>
            </div>
        );
    } else {
        return (
            <div className="Registry">
                <div className="row">
                    <div className="col" style={{ margin: '0 auto' }}>
                        <em>there are no contests</em>
                    </div>
                </div>
            </div>
        );
    }
}

export default function Registry() {
    const onIsCorrect = () => {
        return fetchNumContests().then(numContests => store.dispatch(setNumContests(numContests)));
    }
    return (
        <Page onIsCorrect={onIsCorrect}>
            <RenderPage />
        </Page>
    );
}
