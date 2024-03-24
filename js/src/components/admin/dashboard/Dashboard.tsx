import React from 'react';
import { __ } from '@wordpress/i18n';
import EditEvent from './EditEvent';
import ListEvents from './ListEvents';
import { Routes, Route, HashRouter as Router } from 'react-router-dom';

const Dashboard = () => {
    return (
        <div className='wrap'>
            <Router>
                <Routes>
                    <Route path="/" element={<ListEvents />} />
                    <Route path="/event/:eventId" element={<EditEvent />} />
                </Routes>
            </Router>
        </div>
    );
}

export default Dashboard;
