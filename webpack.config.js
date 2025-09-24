const path = require('path');

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, './'),
    },
    compress: true,
    port: 8080,
    open: true,
  },
};