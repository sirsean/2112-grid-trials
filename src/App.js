import React from 'react';
import { Provider } from 'react-redux';
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from 'react-router-dom';
import './App.css';
import { store } from './database.js';
import Home from './views/home.js';
import CurrentContest from './views/current_contest.js';
import Registry from './views/registry.js';
import { Contest } from './views/contest.js';

function App() {
    return (
        <Provider store={store}>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/current" element={<CurrentContest />} />
                    <Route path="/registry" element={<Registry />} />
                    <Route path="/contest/:index" element={<Contest />} />
                </Routes>
            </Router>
        </Provider>
    );
}

export default App;
