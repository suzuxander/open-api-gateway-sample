const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    api: './lambda/index.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: ['ts-loader']
      },
    ]
  },
  plugins: [],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    modules: [
      'node_modules',
      path.resolve(__dirname, 'app'),
      path.resolve(__dirname, 'gen'),
    ],
    alias: {
      gen: path.resolve(__dirname, './gen')
    },
  },
  target: 'node'
};