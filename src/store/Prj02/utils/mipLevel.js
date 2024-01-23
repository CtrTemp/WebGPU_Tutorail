


function parse_mipLevelArr(state) {
    // console.log("mip info arr = ", state.CPU_storage.storage_arr["mip"]);

    const mip_range = state.CPU_storage.mip_info["total_length"];

    // 清空原数组
    for (let i = 0; i < mip_range; i++) {
        state.CPU_storage.mip_info["index_arr"][i] = [];
    }

    const mip_arr = state.CPU_storage.storage_arr["mip"];

    for (let i = 0; i < mip_arr.length; i++) {
        const mip_val = Math.floor(mip_arr[i]);
        const file_name_idx = i;
        if (mip_val >= 0) {
            state.CPU_storage.mip_info.index_arr[mip_val].push(file_name_idx);
        }
    }

    // console.log("val = ", state.CPU_storage.mip_info.index_arr);
}







export { parse_mipLevelArr }
