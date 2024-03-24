import React from 'react';
import { __ } from '@wordpress/i18n';
import { Routes, Route, HashRouter as Router } from 'react-router-dom';
import SettingsRoot from './SettingsRoot';
import EditTemplate from './EditTemplate';

const Settings = function () {
    return (
        <div className='wrap'>
            <Router>
                <Routes>
                    <Route path="/" element={<SettingsRoot />} />
                    <Route path="/template/:templateId" element={<EditTemplate />} />
                </Routes>
            </Router>
        </div>
    );
}

export default Settings;
