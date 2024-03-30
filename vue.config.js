const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  publicPath: "./",
  configureWebpack: {
    resolve: { fallback: { fs: false } }
  },
  devServer: {
    // proxy: {
    //   '/': { // 路径一旦访问就会触发使用代理服务器地址进行访问
    //     target: 'http://122.51.22.4:9999/', // 目标服务器地址
    //     changeOrigin: true, // 是否改变源地址
    //   }
    // }

    // 代理解决跨域访问问题
    proxy: 'http://122.51.22.4:9999/'

  }
})
