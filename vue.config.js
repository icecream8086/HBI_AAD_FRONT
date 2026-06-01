const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    devtool: 'source-map',
  },
  chainWebpack: (config) => {
    config.resolve.extensions
      .merge(['.ts', '.vue'])
  },
  devServer: {
    port: 8086,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/info': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/__become-wheel': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/_tick': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
