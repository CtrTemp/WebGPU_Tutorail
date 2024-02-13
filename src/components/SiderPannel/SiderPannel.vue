<template>
    <div class="sider-pannel-container">

        <transition class="thumbnail-animation" enter-active-class="animate__animated animate__slideInLeft"
            leave-active-class="animate__animated animate__slideOutLeft">

            <div class="sider-pannel" v-show="(show_flip) % 2">

                <div @click="show_flip++" class="menu-hide">
                    <div>•</div>
                    <div>•</div>
                    <div>•</div>
                </div>

                <div class="text_item link">
                    <div>
                        •link:
                    </div>
                    <a :href="single_img_info.link">
                        {{ single_img_info.link }}
                    </a>

                </div>

                <div class="text_item language">
                    • language: {{ single_img_info.language }}
                </div>

                <div class="text_item date">
                    • date: {{ single_img_info.date }}
                </div>

                <div class="text_item media_country">
                    • media_country: {{ single_img_info.media_country }}
                </div>

                <div class="text_item media_type">
                    • media_type: {{ single_img_info.media_type }}
                </div>

                <div class="text_item platform">
                    • platform: {{ single_img_info.platform }}
                </div>

                <div class="text_item chart_type">
                    • chart_type: {{ single_img_info.chart_type }}
                </div>

                <div class="img_container">
                    <img src="" alt="" id="detail-img">
                </div>

            </div>
        </transition>



        <transition class="thumbnail-animation animate__delay-1s" enter-active-class="animate__animated ">
            <div @click="show_flip++" v-show="(show_flip + 1) % 2" class="menu-show animate__fadeIn">
                <div>•</div>
                <div>•</div>
                <div>•</div>
            </div>
        </transition>


    </div>
</template>
 
<script setup>


import { reactive, ref } from "vue";
import { computed, watch } from "vue";
import { useStore } from "vuex";

const store = useStore();



let show_flip = ref(1);

let single_img_info = computed(() => {
    return store.state.pic_browser.CPU_storage.single_img_info;
})




</script>
 
<style scoped>
.sider-pannel-container {
    position: absolute;

    top: 0%;
    left: 0%;
    width: 30%;
    height: 100%;

    /* border: red solid 3px; */
    box-sizing: border-box;

    display: flex;
    flex-direction: column;

    /* gap: 5px; */

    /* background-color: rgba(197, 6, 6, 0.25); */

}


.sider-pannel {
    position: absolute;

    top: 0%;
    left: 0%;
    width: 100%;
    height: 100%;


    /* border: yellowgreen solid 3px; */
    box-sizing: border-box;

    background-color: rgba(75, 75, 75, 0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    gap: 1vh;

    padding-top: 1vh;
    /* padding-left: 1vh; */
}


.menu-show {

    position: absolute;

    cursor: pointer;

    top: 40%;
    left: 0%;
    width: 3%;
    height: 20%;

    /* border: 2px steelblue solid; */
    box-sizing: border-box;
    border-radius: 3px;

    background-color: rgba(128, 128, 128, 1.0);
    /* background-color:aqua; */

    font-size: 1.5vh;
    color: aliceblue;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

}



.menu-hide {

    position: absolute;

    cursor: pointer;


    top: 40%;
    right: 0%;
    width: 3%;
    height: 20%;

    /* border: 2px steelblue solid; */
    box-sizing: border-box;
    border-radius: 3px;

    /* background-color: rgba(0, 0, 0, 0.25); */
    background-color: rgba(128, 128, 128, 1.0);

    font-size: 1.5vh;
    color: aliceblue;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

}


.menu-animation {
    --animate-duration: 500ms;
}

.thumbnail-animation {
    --animate-duration: 500ms;
}


.text_item {

    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    width: 85%;
    height: 7.5%;
    color: aliceblue;
    /* background-color: aquamarine; */
    /* border: solid chocolate 3px; */
}

.img_container {

    padding: 10px;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    width: 85%;
    height: 65%;
    /* background-color: aquamarine; */
    /* border: solid chocolate 3px; */
}

a:link {
    /* display: block; */
    /* width: 100px; */
    color: chocolate;
    /* background-color: green; */
    /* text-align: center; */
    font-weight: bold;
    /* text-decoration: none; */
    /* 是否显示下划线 */
}
</style>