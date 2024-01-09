const fs = require("fs")

function dataURL2Blob(dataUrl) {
    const bsArr = dataUrl.split(',')
    const pattern = /^data:(.*?)(;base64)/
    const type = bsArr[0].match(pattern)[1]
    const dataStr = atob(bsArr[1])
    const len = dataStr.length
    const uint8Array = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        uint8Array[i] = dataStr.charCodeAt(i)
    }

    return new Blob([uint8Array], { type })
}


export { dataURL2Blob }