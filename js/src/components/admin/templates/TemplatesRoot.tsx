import React from 'react';
import { __ } from '@wordpress/i18n';
import { Routes, Route, HashRouter as Router } from 'react-router-dom';
import EditTemplate from './EditTemplate';
import ListTemplates from './ListTemplates';

const TemplatesRoot = function () {
    return (
        <div className='wrap'>
            <Router>
                <Routes>
                    <Route path="/" element={<ListTemplates />} />
                    <Route path="/template/:templateId" element={<EditTemplate />} />
                </Routes>
            </Router>
        </div>
    );
}

export default TemplatesRoot;
