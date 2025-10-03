const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  target: 'web',
  entry: {
    popup: './src/popup.tsx',
    content: './src/scripts/content.tsx',
    background: './src/scripts/background.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      if (pathData.chunk.name === 'content') {
        return 'static/js/content.js';
      }
      if (pathData.chunk.name === 'background') {
        return 'static/js/background.js';
      }
      if (pathData.chunk.name === 'queries') {
        return 'queries.js';
      }
      return '[name].js';
    },
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: {
            ignore: ['**/popup.html']
          }
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: (pathData) => {
        if (pathData.chunk.name === 'content') {
          return 'static/css/content.css';
        }
        return 'static/css/[name].css';
      }
    })
  ],
  optimization: {
    splitChunks: {
      chunks: (chunk) => {
        // content script and background script should not be split
        return chunk.name !== 'content' && chunk.name !== 'background';
      }
    }
  }
};