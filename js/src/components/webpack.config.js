import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    entry: {
        events: './admin/events/index.tsx',
        templates: './admin/templates/index.tsx',
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
            },
            {
                test: /\.css$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.tsx', '.ts', '.css'],
    },
    devtool: 'source-map'
};

export default config;
