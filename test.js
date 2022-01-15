let http = require("http");
let fs = require("fs");
let ws = require("ws");
let exec = require('child_process').exec;
let FormData = require("form-data");
let sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let wss = new ws.Server({noServer: true});
http.createServer(accept).listen(8080);

function accept(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // res.writeHead(200, {"Content-Type": "multipart/form-data"});

    if ((req.headers.upgrade && req.headers.upgrade.toLowerCase() == "websocket") ||
        req.headers.connection.match(/\bupgrade\b/)) {
        wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onConnect);
    }
    else {
        ffmpeg(res)
        .then((webp) => {
            return new Promise(resolve => {
                fs.readFile(webp, (err, data) => {
                    if (err) console.error(err);
                    else {
                        res.write(`Content-Length: ${fs.statSync(webp).size}\n`);
                        resolve(data);
                        // await sleep(10);
                    };
                });
            });
        })
        .then(data => {
            res.end(data);
        });
    }
    return;
}

function onConnect(ws) {
    ws.on("message", (message) => {
        ffmpeg(ws)
        .then((webp) => {
            fs.readFile(webp, (err, data) => {
                if (err) console.error(err);
                else {
                    ws.send(data);
                    ws.close(1000);
                };
            });
        });
    });
}

function ffmpeg(res) {
    return new Promise(resolve => {
        let p = exec(`ffmpeg -framerate 12 -pattern_type glob -i "test/*.jpg" -vf "scale=720:-1" -loop 0 -preset drawing -qscale 90 "test/webp.webp" -y -progress pipe:1`, () => {resolve("test/webp.webp");});
        p.stdout.on("data", data => {
            // ws.send(data);
            res.write(data);
        });
        p.stderr.on("data", data => {
            // res.write(data);
        })
    });
}