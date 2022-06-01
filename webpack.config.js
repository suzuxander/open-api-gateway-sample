const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    // for api
    'user/get/index': './lambda/user/get.ts',
    'user/post/index': './lambda/user/post.ts',
    'user/delete/index': './lambda/user/delete.ts',
    // for api client
    'client/get': './lambda/client/get.ts',
    'client/post': './lambda/client/post.ts',
    'client/delete': './lambda/client/delete.ts',
    'client/apikey/get': './lambda/client/apikey/get.ts',
    'client/apikey/post': './lambda/client/apikey/post.ts',
    'client/apikey/delete': './lambda/client/apikey/delete.ts',
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
      'lambda',
      'gen'
    ],
    alias: {
      gen: path.resolve(__dirname, './gen'),
      lambda: path.resolve(__dirname, './lambda')
    },
  },
  target: 'node'
};