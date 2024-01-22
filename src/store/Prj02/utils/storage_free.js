/**
 *  用于清理使用一次过后不再继续使用的全局变量
 * 
 *  Big Texture BitMap
 *  instance info array
 *  raw json from server
 * 
 * */


function free_storage(state) {
    /**
     *  Free BitMap
     * */
    state.CPU_storage["instancedBitMap"] = [];
    state.CPU_storage["mipBitMap"] = [];
    state.CPU_storage["quadBitMap"] = [];
    state.CPU_storage["largeBitMap"] = [];

    /**
     *  Free Instance Info
     * */
    state.CPU_storage["vertices_arr"] = [];
    state.CPU_storage["indices_arr"] = [];
    // 注意 storage_arr 不能释放，用于存放回传的MipLevel信息
    // state.CPU_storage["storage_arr"] = []; 

    /**
     *  Free Raw JSON File
     * */
    state.CPU_storage.server_raw_info["dataset_info_pack"] = {};
    state.CPU_storage.server_raw_info["mip_bitmap_info_pack"] = {};

}

export { free_storage }
