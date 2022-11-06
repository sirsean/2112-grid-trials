import React from 'react';
import { useSelector } from 'react-redux';
import { fetchNumContests, fetchCurrentContest } from '../client.js';
import {
    store,
    selectNumContests,
    setNumContests,
    setViewRunContestAddress,
} from '../database.js';
import { Page } from './layout.js';
import { DisplayContest } from './contest.js';

function RenderPage() {
    const numContests = useSelector(selectNumContests);
    if (numContests) {
        return (
            <div className="CurrentContest">
                <DisplayContest />
            </div>
        );
    } else {
        return (
            <div className="CurrentContest">
                <div className="row">
                    <div className="col" style={{ margin: '0 auto' }}>
                        <em>there are no contests</em>
                    </div>
                </div>
            </div>
        );
    }
}

export default function CurrentContest() {
    const onIsCorrect = () => {
        return fetchNumContests().then(numContests => {
            store.dispatch(setNumContests(numContests));
            return fetchCurrentContest();
        }).then(contestAddress => {
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
