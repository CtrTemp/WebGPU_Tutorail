const fs = require("fs")


const data = fs.readFileSync("./AnnualReportFiles/Report01/2020.pdf");

// const base64Data = Buffer.from(data).toString("base64");
const base64Data = Buffer.from(data).toString("binary");

console.log("base64Data = ", base64Data);



