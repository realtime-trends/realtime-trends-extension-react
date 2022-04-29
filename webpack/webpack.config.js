const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function (env, argv) {
    const isEnvProduction = true;
    const isEnvDevelopment = false;

    const babelLoaderRegExp = /\.(js|jsx|ts|tsx)$/;
    const cssRegExp = /\.(css|scss)$/i;
    const cssModuleRegExp = /\.module\.(css|scss)$/;

    const cssLoaderOptions = {
        importLoaders: 1,
        sourceMap: isEnvDevelopment,
    };
    const cssLoaderOptionsForModule = {
        importLoaders: 1,
        sourceMap: isEnvDevelopment,
        modules: true,
    };
    const sassLoaderOptions = {
        sassOptions: {
            indentWidth: 4,
            sourceMap: isEnvDevelopment,
            outputStyle: 'compressed',
        },
    };

    return {
        mode: isEnvProduction ? 'production' : 'development',
        entry: {
         main: path.resolve(__dirname, "..", "src", "index.tsx"),
         content: path.resolve(__dirname, "..", "src", "scripts", "content.tsx"),
         background: path.resolve(__dirname, "..", "src", "scripts", "background.ts"),
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'static/js/[name].js',
            publicPath: require('react-dev-utils/getPublicUrlOrPath'),
        },
        resolve: {
            enforceExtension: false,
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        module: {
            rules: [
                {
                    test: babelLoaderRegExp,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                    },
                },
                {
                    test: cssRegExp,
                    exclude: cssModuleRegExp,
                    use: [MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: cssLoaderOptions,
                        },
                        {
                            loader: 'sass-loader',
                            options: sassLoaderOptions,
                        },'postcss-loader'],
                },
                {
                    test: cssRegExp,
                    include: cssModuleRegExp,
                    use: [MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: cssLoaderOptionsForModule
                        },
                        {
                            loader: 'sass-loader',
                            options: sassLoaderOptions,
                        },
                     ],
                },
            ],
        },
        devServer: {
            port: 3000,
            liveReload: true,
        },
        devtool: isEnvProduction ? 'source-map' : 'eval',
        optimization: {
         minimize: true,
        },
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: './public/index.html',
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true,
                },
            }),
            new MiniCssExtractPlugin({
                filename: 'static/css/[name].css',
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, '../public'),
                        to: path.resolve(__dirname, 'dist'),
                        noErrorOnMissing: true,
                        globOptions: {
                           ignore: ["**/index.html"]
                        }
                    },
                ],
            })
        ],
    }
}