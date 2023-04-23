import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';

document.addEventListener('DOMContentLoaded', function () {
    const element = document.getElementById('wpoe-dashboard');
    if (typeof element !== 'undefined' && element !== null) {
        ReactDOM.render(<Dashboard />, document.getElementById('wpoe-dashboard'));
    }
});
