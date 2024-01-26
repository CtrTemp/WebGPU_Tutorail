


function parse_mipLevelArr(state) {
    // console.log("mip info arr = ", state.CPU_storage.storage_arr["mip"]);


    const mip_range = state.CPU_storage.mip_info["total_length"];

    // console.time("parse mipLevelArr-- clear arr");

    // 清空原数组
    for (let i = 0; i < mip_range; i++) {
        state.CPU_storage.mip_info["index_arr"][i] = [];
    }

    // console.timeEnd("parse mipLevelArr-- clear arr");

    // console.time("refine mipLevelArr");

    const mip_arr = state.CPU_storage.storage_arr["mip"];

    for (let i = 0; i < mip_arr.length; i++) {
        const mip_val = Math.floor(mip_arr[i]);
        const file_name_idx = i; 
        // mip_val<=5 的限定是为了防止push过多的不必要数据，我们认为16*16以及更小的分辨率的数据就不必取了
        if (mip_val >= 0 && mip_val <= 5) {
            state.CPU_storage.mip_info.index_arr[mip_val].push(file_name_idx);
        }
    }
    console.log(state.CPU_storage.mip_info);
    // console.timeEnd("refine mipLevelArr");


    console.log("val = ", state.CPU_storage.mip_info.index_arr);
}







export { parse_mipLevelArr }
