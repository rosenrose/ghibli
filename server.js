let http = require("http");
let fs = require("fs");
let request = require('request');
let exec = require('child_process').exec;
let debug = true;
let boundary = "\n--boundary--\n";

let app = http.createServer((req, res) => {
    let body = "";
    req.on("error", (err) => {
        console.log("request error");
        console.error(err);
    })
    .on("data", (data) => {
        body += data;
    })
    res.setHeader("Access-Control-Allow-Origin", "*");

    let [url, parameters] = req.url.split("?");
    if (url == "/webp") {
        return req.on("end", () => {
            res.on("error", (err) => {
                console.log("response error");
                console.error(err);
            });

            let ip = req.socket.remoteAddress;
            let params = urlParse(body);
            let date = new Date(parseInt(params["time"]));
            let log = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} - ${params["title"]} ${params["duration"]} - ${ip}`
            if(debug) console.log(log);
            exec(`echo "${log}" >> log.txt`, ()=>{});

            let dir = `${params["time"]}/${params["num"]}`;
            // let dir = `d/${params["num"]}`;
            makeDirs(dir)
            .then(dir => {
                return imagesDownload(dir, params, res);
            }).then(() => {
                return ffmpeg(dir, res);
            }).catch(err => {
                if(debug) console.error(err);
            }).then(webp => {
                return new Promise(resolve => {
                    fs.readFile(webp, (err, data) => {
                        if (err) console.error(err);
                        else {
                            // res.writeHead(200, {"Content-Type": "image/webp", "Content-Length": fs.statSync(webp).size});
                            res.write(`Content-Length: ${fs.statSync(webp).size}${boundary}`);
                            resolve(data);
                            if(debug) {
                                console.log(res.getHeaders());
                                console.log(`read file ${webp} finish`);
                            }
                        };
                    });
                });
            }).then(data => {
                return new Promise((resolve,reject) => {
                    if(req.socket.destroyed) reject();
                    else {
                        res.end(data, () => {
                            resolve(dir);
                            if(debug) console.log(`send file ${dir}/webp.webp finish`);
                        });
                    }
                });
            }).catch(() => {
                if(debug) console.log("connection destroyed");
            }).then(() => {
                return new Promise(resolve => {
                    exec(`rm -rf ${dir}`, () => {
                        resolve(`${params["time"]}`);
                        if(debug) console.log(`remove Dir ${dir} finish`);
                    });
                });
            }).then(value => {
                return new Promise(resolve => {
                    fs.readdir(value, (err, files) => {
                        if (err) console.error(err);
                        else {
                            resolve(files.length);
                            if(debug) console.log(`read Dir ${value} finish`);
                        }
                    });
                });
            }).then(length => {
                return new Promise(resolve => {
                    if (length == 0) {
                        fs.rmdir(`${params["time"]}`, () => {
                            resolve();
                            if(debug) console.log(`remove Dir ${params["time"]} finish`);
                        });
                    }
                });
            });
        });
    }
    else if (url == "/delete") {
        return req.on("end", () => {
            exec("find . ! -name server.js ! -name log.txt ! -name server.py ! -name templates -exec rm -rf {} \\;", () => {
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

function urlParse(urlencoded) {
    return Object.fromEntries(urlencoded.split("&").map(keyVal => keyVal.split("=")).map(([k,v]) => [k,decodeURIComponent(v)]));
}

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

function imagesDownload(dir, params, res) {
    let promises = [];
    let cloud = "https://d2wwh0934dzo2k.cloudfront.net/ghibli";
    let cut = parseInt(params["cut"]);
    let duration = parseInt(params["duration"]);

    for (let i=0; i<duration; i++) {
        promises.push(download(`${cloud}/${encodeURIComponent(params["title"])}/${(cut+i).toString().padStart(5,"0")}.jpg`,
            `${dir}/${(i+1).toString().padStart(5,"0")}.jpg`, res));
    }

    return Promise.all(promises).then(() => {
        if(debug) console.log(`downlaod images to ${dir} finish`);
    });
}

function download(uri, filename, res) {
    return new Promise(resolve => {
        request(uri)
        .pipe(fs.createWriteStream(filename))
        .on("close", () => {
            res.write("download"+boundary);
            resolve(filename);
        });
    });
}

function ffmpeg(dir, res) {
    return new Promise((resolve,reject) => {
        let p = exec(`ffmpeg -framerate 12 -i "${dir}/%5d.jpg" -vf "scale=720:-1" -loop 0 -preset drawing -qscale 90 "${dir}/webp.webp" -progress pipe:1`,
        (err) => {
            if (err) reject(err);
            else {
                resolve(`${dir}/webp.webp`);
                if(debug) console.log(`conversion ${dir}/webp.webp finish`);
            }
        });
        p.stdout.on("data", data => {
            res.write(data+boundary);
            if(debug) console.log(data);
        });
        // p.stderr.on("data", data => {
        //     console.log(data);
        // });
    });
}