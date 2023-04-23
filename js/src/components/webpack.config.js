const path = require("path")

module.exports = {
    entry: {
        dashboard: "./admin/dashboard/index.js",
        settings: "./admin/settings/index.js"
    },
    output: {
        publicPath: "/",
        path: path.resolve(__dirname, "../../build/components"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_module/,
                use: 'babel-loader'
            },
        ]
    },
    devtool: 'source-map'
};