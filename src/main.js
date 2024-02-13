import { createApp } from 'vue'

import App from './App.vue'

// 引入插件Vuex用于组件通信
// npm install vuex --save
// import Vuex from 'vuex'
// 引入在 ./store/index.js 文件中创建配置好的 store 即可
import { store } from './store'


import "animate.css"



// // 引入插件VueRouter
// // npm install vue-router (目前默认是4版本)
// // import * as VueRouter from 'vue-router'
// // 引入在 ./router/index.js 文件中创建配置好的 router 即可
// import { router } from './router'


// // 引入消息订阅模块(组件间消息传递)
// // npm install
// import PubSub from 'pubsub-js'

// // 第三方动画库 https://animate.style/
// // npm install animate.css --save 
// // 注: 使用过程中在组件中直接引入即可
// import "animate.css"
// // 使用示例 : <h1 class="animate__animated animate__bounce">An animated element</h1>
// // 详细示例请参考 /home/ctrtemp/Documents/WebSever/Learning/Vue/learning/vue_test/18_src_TodoList_Animation/components/MyItem.vue

// // 第三方独属id生成器
// // npm install nanoid --save
// // 注: 使用过程中在组件中直接引入即可
// import nanoid from 'nanoid'


const app = createApp(App)
    .use(store)
    // .use(router)
    .mount('#app');
