<template>
    <div id='openSeadragon1'></div>
</template>

<script setup>

import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { defineProps } from 'vue';

const router = useRouter();
const store = useStore();

const props = defineProps(["heigh_res_file_path"])

console.log(`props.heigh_res_file_path = ${props.heigh_res_file_path}`)


const high_res_image_filename_map = [
    "26312.png", "30697.png", "37894.png", "44198.png", "51537.png", "7387.png"
]

onMounted(() => {
    // console.log("say Hello~");

    const img_idx = store.state.pic_browser.CPU_storage.selected_img.val;
    // console.log("image idx = ", img_idx)

    const file_raw_name = high_res_image_filename_map[img_idx].split(".")[0]
    // console.log(`file_forder_name = ${file_raw_name}`)

    const data_set_root_local = "http://localhost:8080/ImageViewerRoot/BioMedical-1400/tiled_img/"
    const data_set_root = "http://122.51.22.4:9999/ImageViewerRoot/BioMedical-1400/tiled_img/"

    // const dzi_file_path = `data/${file_raw_name}.dzi`
    const dzi_file_path = data_set_root_local+`${file_raw_name}_tile/${file_raw_name}.dzi`
    // const images_folder_url = `http://localhost:8000/${file_raw_name}_tile/${file_raw_name}_files/`
    const images_folder_url = data_set_root + `${file_raw_name}_tile/${file_raw_name}_files/`
    console.log("dzi_file_path = ", dzi_file_path)
    console.log("images_folder_url = ", images_folder_url)

    fetch(dzi_file_path).then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error('Network response was not ok.');
    }).then(xmlString => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, 'text/xml');
        const RootDocAttributes = xml.getElementsByTagName('Image')[0].attributes;
        const SizeAttribute = xml.getElementsByTagName('Size')[0].attributes;

        const tile_dzi_json = {
            xmlns: RootDocAttributes.xmlns.value,
            // Url: "http://localhost:8000/data/2_files/",
            Url: images_folder_url,
            Overlap: RootDocAttributes.Overlap.value,
            TileSize: RootDocAttributes.TileSize.value,
            Format: RootDocAttributes.Format.value,
            Size: {
                Height: SizeAttribute.Height.value,
                Width: SizeAttribute.Width.value,
            },
        }

        // // 处理你的dzi数据
        console.log("SizeAttribute = ", SizeAttribute);
        console.log("tile_dzi_json = ", tile_dzi_json);


        OpenSeadragon({
            id: 'openSeadragon1',
            prefixUrl: '../images/',
            tileSources: {
                Image: tile_dzi_json
            },
            showNavigator: true, // 是否展示图像导航栏控件 (也就是右下角的玻片)
            navigatorPosition: 'BOTTOM_RIGHT', // 导航栏控件位置
            navigatorSizeRatio: 0.1, // 玻片的展示倍率
        });

    }).catch(error => {
        console.error('Error fetching or parsing dzi file:', error);
    });

    // 这里获取图片的 名称信息，之后就可以获取特定的存储位置了，之后改vux全局变量，传参加载高分辨率图片
    // 饭后回来先搞图片处理



    // OpenSeadragon({
    //     id: 'openSeadragon1',
    //     prefixUrl: '../images/',
    //     tileSources: {
    //         Image: {
    //             xmlns: 'http://schemas.microsoft.com/deepzoom/2008',
    //             // Url: 'P:/PKUVIS/WebGPU_Image_Viewer/svs_process/static/files/2_files/',
    //             Url: 'http://localhost:8000/data/2_files/',
    //             Overlap: '1',
    //             TileSize: '254',
    //             Format: 'jpeg',
    //             Size: {
    //                 Height: '31029',
    //                 Width: '39839'
    //             }
    //         }
    //     }
    // });





    // /**
    //  *  通过按键返回 collection 浏览模式
    //  * */ 
    // window.addEventListener("keydown", (event) => {

    //     switch (event.keyCode) {
    //         case "Q".charCodeAt(0):
    //             // console.log(store.state.pic_browser.main_view_flow_quad)
    //             // collection渲染状态位复位
    //             store.state.pic_browser.main_view_flow_quad.fence = {

    //                 // init and render loop
    //                 DATASET_INFO_READY: { val: false }, // 初始化阶段向后台申请数据库信息
    //                 DATASET_INFO_PARSE_DONE: { val: false },
    //                 RENDER_READY: { val: false },

    //                 // dynamic pre-fetch loop
    //                 COMPUTE_MIP_SUBMIT: { val: false }, // 已经向GPU提交计算MipLevel的申请，等待数据返回
    //                 MIP_COMPUTE_DONE: { val: false },
    //                 BITMAP_RECEIVED: { val: false },    // 收到后台发来的BitMap字符串，准备构建
    //                 BITMAP_READY: { val: false },       // BitMap构建完成，可以填充Texture Memory
    //                 /**
    //                  *  我们使用数据包的形式，对数据进行分批次的更新，当最后一批数据更新完毕之前不会触发下一个取数据轮次，
    //                  * 以下 LAST_DATA_PACK_FLAG 被置位后，才会触发下一轮次的更新
    //                  * */
    //                 LAST_DATA_PACK_FLAG: { val: false },

    //                 /**
    //                  *  Single Image Fetch
    //                  * */
    //                 GET_SELECTED_IMG: { val: false },
    //             }
    //             // router.push('./collection')
    //             router.replace('./collection')
    //             break;

    //         default:
    //             break;
    //     }

    // })

})

</script>

<style scoped>
#openSeadragon1 {
    position: absolute;
    top: 0%;
    left: 0%;
    width: 100%;
    height: 100%;
    /* border: chocolate 1vw solid; */
    box-sizing: border-box;
    background-color: white;

}
</style>