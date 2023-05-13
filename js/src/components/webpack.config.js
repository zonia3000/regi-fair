const path = require('path')

module.exports = {
    entry: {
        dashboard: './admin/dashboard/index.tsx',
        settings: './admin/settings/index.tsx',
        users: './users/index.tsx'
    },
    output: {
        publicPath: '/',
        path: path.resolve(__dirname, '../../build/components'),
        filename: '[name].js'
    },
    externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@wordpress/components': 'wp.components',
        '@wordpress/i18n': 'wp.i18n',
        '@wordpress/api-fetch': 'wp.apiFetch'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|tsx|ts)$/,
                exclude: /node_module/,
                use: 'babel-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.tsx', '.ts'],
    },
    devtool: 'source-map'
};