const path = require('path');

module.exports = {
  entry: {
    contentScript: './contentScript.js',
    openai: './openai.js',
    ui: './ui.js',
    transcript: './transcript.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
