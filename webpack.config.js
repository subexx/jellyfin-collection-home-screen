const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    plugin: './src/plugin.js',
    settings: './src/settings.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};