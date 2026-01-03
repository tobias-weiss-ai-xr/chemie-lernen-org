const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname),
      publicPath: './'
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      minimize: isProduction,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          },
          three: {
            test: /[\\/]node_modules[\\/](three|ecsy|troika-3d)[\\/]/,
            name: 'three',
            priority: 20
          }
        }
      },
      occurrenceOrder: true
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    module: {
      rules: [
        {
          test: /\.(js|mjs)$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              cacheCompression: true
            }
          }
        }
      ]
    },
    resolve: {
      alias: {
        'three': path.resolve(__dirname, 'node_modules/three')
      },
      extensions: ['.js', '.json']
    },
    watchOptions: {
      ignored: [/node_modules/, /dist/],
      aggregateTimeout: 300,
      poll: false
    },
    devServer: {
      static: {
        directory: __dirname
      },
      compress: true,
      hot: true,
      https: true,
      host: '0.0.0.0',
      port: 8080
    }
  };
};
