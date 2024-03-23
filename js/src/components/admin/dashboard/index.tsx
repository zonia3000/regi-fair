import React from 'react';
import Dashboard from './Dashboard';
import { createRoot } from 'react-dom/client';

document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('wpoe-dashboard');
    if (typeof container !== 'undefined' && container !== null) {
        const root = createRoot(container);
        root.render(<Dashboard />);
    }
});
