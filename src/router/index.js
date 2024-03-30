import { createRouter, createWebHashHistory } from "vue-router"


import Prj02_InstanceFlowing from '../components/Prj02_InstanceFlowing.vue';
import HighResImage from "../components/HighResImage.vue"


const routes = [
    {
        name: 'collection',
        path: '/collection',
        component: Prj02_InstanceFlowing
    },
    {
        name: 'heigh_res',
        path: '/heigh_res',
        component: HighResImage
    },
    //默认初始化跳转到 /heigh_res
    {
        path: '/',
        redirect: '/collection',
    },

];

const routers = createRouter({
    routes,
    history: createWebHashHistory()
})

export default routers
