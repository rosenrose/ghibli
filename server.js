const http = require("http");
const fs = require("fs");
const request = require('request');
const exec = require('child_process').exec;

var app = http.createServer((req, res) => {
    let body = ""
    return req
        .on("error", (err) => {
            console.log("request error");
            console.error(err);
        })
        .on("data", (data) => {
            body += data;
        })
        .on("end", async() => {
            res.on("error", (err) => {
                console.log("respone error");
                console.error(err);
            });

            let params = urlParse(body);
            params["cuts"] = params["cuts"].split(",");
            let promises = [];
            for (let cut of params["cuts"]) {
                promises.push(download(`https://d2wwh0934dzo2k.cloudfront.net/ghibli/${params["title"]}/${cut}.jpg`,`./${cut}.jpg`));
            }
            Promise.all(promises).then(_ => {
                //child = exec(`ffmpeg -framerate 12 -i "./%5d.jpg" -vf "scale=960:-1:flags=lanczos" 1.gif -y`, (error, stdout, stderr) => {
                //    console.log(stdout);
                //});
                console.log("done");
            });

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
        });
})
app.listen(8080);

function urlParse(urlencoded) {
    let params = {};
    for (let param of urlencoded.split("&")) {
        let keyVal = param.split("=");
        params[keyVal[0]] = keyVal[1];
    }
    return params
}

function download(uri, filename) {
    return request(uri)
        .then(data => {
            fs.writeFileSync(filename, data);
            //console.log(filename);
        })
}