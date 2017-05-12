const webpack = require('webpack');
const helpers = require('./helpers');

/*
 * Webpack Plugins
 */
// problem with copy-webpack-plugin
const AssetsPlugin = require('assets-webpack-plugin');
const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin;
const HtmlElementsPlugin = require('./html-elements-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const ngcWebpack = require('ngc-webpack');

/*
 * Webpack Constants
 */
const AOT = helpers.hasNpmFlag('aot');
const METADATA = {
  title: 'Ontimize web ng2 webpack',
  baseUrl: '/',
  isDevServer: false
};

module.exports = function (options) {
  isProd = options.env === 'production';
  return {

    entry: {
      'ontimize-web-ng2': helpers.root('index.ts')
    },
    resolve: {
      extensions: ['.ts', '.js', '.html']
    },
    module: {
      rules: [

        {
          test: /\.ts$/,
          loaders: ['awesome-typescript-loader?configFileName=tsconfig-build.json', 'angular2-template-loader'],
          exclude: [/\.(spec|e2e)\.ts$/]
        },
        /* Embed files. */
        {
          test: /\.(html|css)$/,
          loader: 'raw-loader',
          exclude: /\.async\.(html|css)$/
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
          include: [helpers.root('ontimize')]
        },


        // {
        //   test: /\.ts$/,
        //   use: [{
        //     loader: 'awesome-typescript-loader',
        //     options: {
        //       configFileName: 'tsconfig-build.json'
        //     }
        //   }, {
        //     loader: 'angular2-template-loader'
        //   }
        //   ],
        //   exclude: [/\.(spec|e2e)\.ts$/]
        // },

        // {
        //   test: /\.scss$/,
        //   use: ['to-string-loader', 'css-loader', 'sass-loader'],
        //   include: [helpers.root('ontimize')]
        // }, {
        //   test: /\.html$/,
        //   use: 'raw-loader'
        // }



        // , {
        //   test: /\.json$/,
        //   use: 'json-loader'
        // }, {
        //   test: /\.css$/,
        //   use: ['to-string-loader', 'css-loader'],
        //   include: [helpers.root('ontimize')]
        // }, {
        //   test: /\.(jpg|png|gif)$/,
        //   use: 'file-loader'
        // }, {
        //   test: /\.(eot|woff2?|svg|ttf)([\?]?.*)$/,
        //   use: 'file-loader'
        // }
      ]
    },
    plugins: [
      new ContextReplacementPlugin(
        /angular(\\|\/)core(\\|\/)@angular/,
        helpers.root('./ontimize')
      ),

      new CopyWebpackPlugin([
        // { from: 'config', to: '../config' },
        { from: 'CHANGELOG.md', to: '../' },
        { from: 'LICENSE', to: '../' },
        { from: 'README.md', to: '../' },
        { from: 'package.json', to: '../' },
        { from: 'ontimize.scss', to: '../' },
        { from: 'ontimize/components/**/*-theme.scss', to: '../' },
        { from: 'ontimize/components/material/**/*.scss', to: '../' },
        { from: 'ontimize/components/theming/**/*.scss', to: '../' },


        { from: 'ontimize/components/container/o-container.component.scss', to: '../' },
        { from: 'ontimize/components/input/input.scss', to: '../' },



        // { from: 'ontimize/**/*.scss', to: '../' },
        { from: 'ontimize/**/*.html', to: '../' },
        { from: 'ontimize/components/table/vendor/**', to: '../' }
      ]),
      // new AssetsPlugin({
      //   path: helpers.root('dist'),
      //   filename: 'webpack-assets.json',
      //   prettyPrint: true
      // }),

      // new ScriptExtHtmlWebpackPlugin({
      //   defaultAttribute: 'defer'
      // }),

      // new HtmlElementsPlugin({
      //   headTags: require('./head-config.common')
      // }),

      // new LoaderOptionsPlugin({}),

      // // Fix Angular 2
      // new NormalModuleReplacementPlugin(
      //   /facade(\\|\/)async/,
      //   helpers.root('node_modules/@angular/core/src/facade/async.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /facade(\\|\/)collection/,
      //   helpers.root('node_modules/@angular/core/src/facade/collection.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /facade(\\|\/)errors/,
      //   helpers.root('node_modules/@angular/core/src/facade/errors.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /facade(\\|\/)lang/,
      //   helpers.root('node_modules/@angular/core/src/facade/lang.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /facade(\\|\/)math/,
      //   helpers.root('node_modules/@angular/core/src/facade/math.js')
      // ),

      new ngcWebpack.NgcWebpackPlugin({
        // disabled: !AOT,
        tsConfig: helpers.root('tsconfig-build.json'),
        resourceOverride: helpers.root('config/resource-override.js')
      })

    ],

    node: {
      global: true,
      crypto: 'empty',
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false
    }

  };
}