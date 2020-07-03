var http = require("http");
var fs = require("fs");
var request = require('request');
var exec = require('child_process').exec;

var app = http.createServer((req, res) => {
    let body = "";
    req.on("error", (err) => {
        console.log("request error");
        console.error(err);
    })
    .on("data", (data) => {
            body += data;
    })
    res.setHeader("Access-Control-Allow-Origin", "*");

    let url = req.url;
    if (url == "/webp") {
        res.setHeader("Content-Type", "application/octet-stream");
        return req.on("end", () => {
            res.on("error", (err) => {
                console.log("response error");
                console.error(err);
            });
            res.statusCode = 200;
            
            let ip = req.connection.remoteAddress;
            let params = urlParse(body);
            let date = new Date(parseInt(params["time"]));
            console.log(`${date.getMonth()}/${date.getDate()} ${date.getHours()}-${date.getMinutes()}-${date.getSeconds()} ${req.connection.remoteAddress}`)

            params["cuts"] = params["cuts"].split(",").map(x => x.padStart(5,"0"));
            let dir = `./${params["time"]}/${params["num"]}`;
            // let dir = `./d/${params["num"]}`;
            makeDirs(dir)
            .then(value => {
                // console.log(`make ${value} finish`);
                return imagesDownload(value, params);
            }).then(values => {
                // console.log(`downlaod images to ${dir} finish`);
                return ffmpeg(dir);
            }).then (value => {
                // console.log(`conversion ${value} finish`);
                child = exec(`rm -rf ${dir}`, ()=>{});
                fs.readFile(value, (err, data) => {
                    if (err) console.error(err);
                    else {
                        res.end(data);
                    }
                });
            });
        });
    }
    else {
        res.setHeader("Content-Type", "text/plain");
        let time = url.slice(1);
        return req.on("end", () => {
            res.on("error", (err) => {
                console.log("response error");
                console.error(err);
            });
            res.statusCode = 200;
            child = exec(`rm -rf ${time}`, ()=>{
                res.end(`${time} deleted`);
            });
        });
    }
})
app.listen(8080);

function urlParse(urlencoded) {
    let params = {};
    for (let param of urlencoded.split("&")) {
        let keyVal = param.split("=");
        params[keyVal[0]] = decodeURIComponent(keyVal[1]);
    }
    return params
}

function makeDirs(dir) {
    return new Promise(resolve => {
        fs.mkdir(dir, {recursive: true}, (err) => {
            if (err) console.error(err);
            else {
                resolve(dir);
            }
        });
    })
}

function imagesDownload(dir, params) {
    let promises = [];
    for (let i=0; i<params["cuts"].length; i++) {
        promises.push(download(`https://d2wwh0934dzo2k.cloudfront.net/ghibli/${encodeURIComponent(params["title"])}/${params["cuts"][i]}.jpg`,
            `${dir}/${(i+1).toString().padStart(5,"0")}.jpg`));
    }
    return Promise.all(promises);
}

function download(uri, filename) {
    return new Promise(resolve => {
        request(uri)
        .pipe(fs.createWriteStream(filename))
        .on("close", () => resolve(filename));
    });
}

function ffmpeg(dir) {
    return new Promise(resolve => {
        child = exec(`ffmpeg -framerate 12 -i "${dir}/%5d.jpg" -vf "scale=960:-1:flags=lanczos" -loop 0 ${dir}.webp -y`,
        (err) => {
            if (err) console.error(err);
            else resolve(`${dir}.webp`);
        });            
    });
}