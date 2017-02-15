var webpack = require("webpack");

var path = require('path');

var target = path.resolve(__dirname, './site');

var config = {
    entry: path.resolve(__dirname, './src/index.js'),

    output: {
        path: target,

        library: ['GSVInjection'],

        filename: 'gsv-injection.js'
    },

    plugins: [],

    module: {
        loaders: [
            {test: /\.json$/, loader: "json"}
        ]
    },
    
    node: {
        console: false,
        global: true,
        process: true,
        Buffer: true,
        __filename: true,
        __dirname: true,
        setImmediate: true
    }
};

webpack(config, function(err, stats) {
    if(err) {
        console.log(err.message);

        return;
    }

    console.log("Webpack Building Browser Bundle:");

    console.log(stats.toString({reasons: true, errorDetails: true}));
});