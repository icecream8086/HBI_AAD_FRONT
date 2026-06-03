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
  },
})
