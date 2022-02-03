const http = require("http");
const fs = require("fs");
const request = require("request");
const exec = require("child_process").exec;
const FormData = require("form-data");
const crypto = require("crypto");
const webpWidth = 720;
const gifWidth = 480;
const durationLimit = 84;

let debug = false;

exec("rm -rf temp", () => {});

let app = http.createServer((req, res) => {
    let body = "";
    req.on("error", (err) => {
        console.log("request error");
        console.error(err);
    })
    .on("data", (data) => {
        body += data;
    });
    res.setHeader("Access-Control-Allow-Origin", "https://rosenrose.github.io");

    let form = new FormData();
    let [url, parameters] = req.url.split("?");

    if (url == "/webp") {
        return req.on("end", () => {
            res.on("error", (err) => {
                console.log("response error");
                console.error(err);
            });

            let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            let params = new URLSearchParams(body);
            params.set("duration", Math.min(parseInt(params.get("duration")), durationLimit));

            let date = new Date(parseInt(params.get("time")));
            let log = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}: - ${params.get("title")} ${parseInt(params.get("cut"))} ${params.get("duration")} ${params.get("webpGif")} - ${ip}`
            if(debug) console.log(log);
            exec(`echo "${log}" >> log.txt`, ()=>{});

            let dir = `temp/${crypto.createHash("sha256").update(ip + params.get("time")).digest("hex")}`;
            let cut = parseInt(params.get("cut"));
            let duration = parseInt(params.get("duration"));
            let lastCut = cut + duration - 1;
            let filename = `${params.get("trimName")}_${cut.toString().padStart(5,"0")}-${lastCut.toString().padStart(5,"0")}.${params.get("webpGif")}`;

            sendForm(form, "filename", filename, res);
            makeDirs(dir)
            .then(dir => {
                return imagesDownload(dir, params, res, form);
            })
            .then(() => {
                return ffmpeg(dir, filename, res, form);
            })
            .catch(err => {
                if(debug) console.error(err);
            })
            .then(webp => {
                return new Promise(resolve => {
                    fs.readFile(webp, (err, data) => {
                        if (err) console.error(err);
                        else {
                            // res.writeHead(200, {"Content-Type": "image/webp", "Content-Length": fs.statSync(webp).size});
                            sendForm(form, "webp", data, res, {"contentType": `image/${params.get("webpGif")}`});
                            res.end(callback = () => {
                                resolve();
                                if(debug) {
                                    console.log(`send file ${dir}/${filename} finish`);
                                    console.log(res.getHeaders());
                                }
                            });
                        };
                    });
                });
            })
            .catch(() => {
                res.end("error!");
                if(debug) {
                    console.log("connection destroyed");
                }
            })
            .finally(() => {
                exec(`rm -rf ${dir}`, () => {
                    if(debug) console.log(`remove Dir ${dir} finish`);
                });
            });
        });
    }
    else if (url == "/delete") {
        return req.on("end", () => {
            // exec("find . ! -name server.js ! -name log.txt -exec rm -rf {} \\;", () => {
            exec("rm -rf temp", () => {
                res.end("");
            });
        });
    }
    else if (url == "/log") {
        res.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
        return req.on("end", () => {
            fs.readFile("log.txt","utf8", (err,data) => {
                if (err) res.end(err);
                else res.end(data);
            })
        });
    }
    else {
        res.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
        return req.on("end", () => {
            fs.readdir(`..${url}`, (err, files) => {
                if(err) console.error(err);
                else {
                    res.write(`origin: ${req.headers.origin}\n`);
                    res.write(`parameters: ${parameters}\n`);
                    res.end(files.join("\n"));
                }
            });
        });
    }
})
app.listen(8080);

function makeDirs(dir) {
    return new Promise(resolve => {
        fs.mkdir(dir, {recursive: true}, (err) => {
            if (err) console.error(err);
            else {
                resolve(dir);
                if(debug) console.log(`make ${dir} finish`);
            }
        });
    })
}

function imagesDownload(dir, params, res, form) {
    let promises = [];
    let cloud = "https://d2wwh0934dzo2k.cloudfront.net/ghibli";
    let cut = parseInt(params.get("cut"));
    let duration = parseInt(params.get("duration"));

    for (let i=0; i<duration; i++) {
        let filename = `${(cut+i).toString().padStart(5,"0")}.jpg`;
        promises.push(download(new URL(`${cloud}/${params.get("title")}/${filename}`).href, `${dir}/${filename}`, res, form));
    }

    return Promise.all(promises).then(() => {
        if(debug) console.log(`downlaod images to ${dir} finish`);
    });
}

function download(uri, filename, res, form) {
    return new Promise(resolve => {
        request(uri)
        .pipe(fs.createWriteStream(filename))
        .on("close", () => {
            sendForm(form, "download", "", res);
            resolve();
        });
    });
}

function ffmpeg(dir, filename, res, form) {
    return new Promise((resolve,reject) => {
        let command;

        if (filename.endsWith("webp")) {
            command = `-vf "scale=${webpWidth}:-1" -loop 0 -preset drawing -qscale 90`;
        }
        else {
            command = `-lavfi "split[a][b];[a]scale=${gifWidth}:-1,palettegen[p];[b]scale=${gifWidth}:-1[g];[g][p]paletteuse"`
        }

        let p = exec(`ffmpeg -framerate 12 -pattern_type glob -i "${dir}/*.jpg" ${command} "${dir}/${filename}" -progress pipe:1`, (err) => {
            if (err) reject(err);
            else {
                resolve(`${dir}/${filename}`);
                if(debug) console.log(`conversion ${dir}/${filename} finish`);
            }
        });
        p.stdout.on("data", data => {
            sendForm(form, "progress", data, res);
            if(debug) console.log(data);
        });
        // p.stderr.on("data", data => {
        //     console.log(data);
        // });
    });
}

function sendForm(form, key, value, res, option) {
    form.append(key, value, option);
    if (debug) console.log(form);

    while (form._streams.length) {
        let stream = form._streams.shift();
        if (typeof stream == "function") {
            continue
        }
        res.write(stream);
    }
}