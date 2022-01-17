const http = require("http");
const fs = require("fs");
const request = require("request");
const exec = require("child_process").exec;
const FormData = require("form-data");
const crypto = require("crypto");

let debug = true;

let app = http.createServer((req, res) => {
    let body = "";
    req.on("error", (err) => {
        console.log("request error");
        console.error(err);
    })
    .on("data", (data) => {
        body += data;
    });
    res.setHeader("Access-Control-Allow-Origin", "*");

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
            let date = new Date(parseInt(params.get("time")));
            let log = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} - ${params.get("title")} ${params.get("duration")} - ${ip}`
            if(debug) console.log(log);
            exec(`echo "${log}" >> log.txt`, ()=>{});

            let dir = `temp/${crypto.createHash("sha256").update(ip + params.get("time")).digest("hex")}`;
            let cut = parseInt(params.get("cut"));
            let duration = parseInt(params.get("duration"));
            let lastCut = cut + duration - 1;
            let webpName = `${params.get("trimName")}_${cut.toString().padStart(5,"0")}-${lastCut.toString().padStart(5,"0")}.webp`;

            sendForm(form, "filename", webpName, res);
            makeDirs(dir)
            .then(dir => {
                return imagesDownload(dir, params, res, form);
            })
            .then(() => {
                return ffmpeg(dir, webpName, res, form);
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
                            sendForm(form, "Content-Length", fs.statSync(webp).size, res);
                            resolve(data);
                            if(debug) {
                                console.log(res.getHeaders());
                                console.log(`read file ${webp} finish`);
                            }
                        };
                    });
                });
            })
            .then(data => {
                return new Promise((resolve, reject) => {
                    if (req.socket.destroyed) reject();
                    else {
                        sendForm(form, "webp", data, res);
                        res.end(callback = () => {
                            resolve();
                            if(debug) console.log(`send file ${dir}/${webpName} finish`);
                        });
                    }
                });
            })
            .catch(() => {
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
        promises.push(download(`${cloud}/${encodeURIComponent(params.get("title"))}/${filename}`, `${dir}/${filename}`, res, form));
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

function ffmpeg(dir, webpName, res, form) {
    return new Promise((resolve,reject) => {
        let p = exec(`ffmpeg -framerate 12 -pattern_type glob -i "${dir}/*.jpg" -vf "scale=720:-1" -loop 0 -preset drawing -qscale 90 "${dir}/${webpName}" -progress pipe:1`,
        (err) => {
            if (err) reject(err);
            else {
                resolve(`${dir}/${webpName}`);
                if(debug) console.log(`conversion ${dir}/${webpName} finish`);
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

function sendForm(form, key, value, res) {
    form.append(key, value);
    while (form._streams.length) {
        let stream = form._streams.shift();
        if (typeof stream == "function") {
            continue
        }
        res.write(stream);
    }
}