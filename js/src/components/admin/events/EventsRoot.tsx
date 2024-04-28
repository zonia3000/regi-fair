import React from 'react';
import { __ } from '@wordpress/i18n';
import EditEvent from './EditEvent';
import ListEvents from './ListEvents';
import { Routes, Route, HashRouter as Router } from 'react-router-dom';
import ListRegistrations from './registrations/ListRegistrations';

const EventsRoot = () => {
    return (
        <div className='wrap'>
            <Router>
                <Routes>
                    <Route path="/" element={<ListEvents />} />
                    <Route path="/event/:eventId" element={<EditEvent />} />
                    <Route path="/event/:eventId/registrations" element={<ListRegistrations />} />
                </Routes>
            </Router>
        </div>
    );
}

export default EventsRoot;
