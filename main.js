userSelect = new Set();
allList = [], promises = [];
movieList = document.querySelector("#movieList");
movieCheckbox = document.querySelector("#movieCheckbox");
runButton = document.querySelector("#run");
result = document.querySelector("#result");
cloud = "https://d2wwh0934dzo2k.cloudfront.net/ghibli";
protocol = /[^:]+(?=:)/.exec(document.URL)[0];
decoder = new TextDecoder();
encoder = new TextEncoder();
boundary = "\n--boundary--\n";
const serverResponseWait = 800;

fetch("list.json").then(response => response.json())
.then(json => {
    list = json;
    let sum = 0;

    for (let category in list) {
        let i;
        for (i=0; i<list[category].length; i++) {
            allList.push(list[category][i]);
            let name = list[category][i].name.slice(3);

            let option = document.createElement("option");
            option.value = sum+i;
            option.text = name;
            movieList.querySelector(`option[value='${category}']`).appendTemp(option);

            let template = document.querySelector("#movieCheckboxTemplate").content.cloneNode(true);
            let input = template.querySelector("input");
            input.value = sum+i;
            input.nextSibling.textContent = name.slice(0,name.indexOf("(")-1);
            movieCheckbox.querySelectorAll("td")[sum+i].append(template.firstElementChild);
        }
        sum += i;
    }
    appendRestore();
    movieCheckbox.addEventListener("change", event => {
        if (event.target.checked) {
            userSelect.add(event.target.value);
        }
        else {
            userSelect.delete(event.target.value)
        }
    });
});

document.querySelector("#formatSelect").addEventListener("change", event => {
    format = event.target.value;
    let movieSelect = document.querySelectorAll("#movieSelect label");
    let countSelect = document.querySelector("#countSelect");
    let rulePC = getCSSRule("myCSS", "#run");
    let ruleMobile = getCSSRule("myCSS", "#run", "(max-width: 768px)");
    
    if (format != "slider") {
        selectAttribute(`.${format}`, "hidden", false, true, ...document.querySelectorAll("#webpNum, #jpgNum"));
    }
    document.querySelector("#durationSelect").hidden = format == "jpg";
    document.querySelector("#share").hidden = format != "jpg";
    document.querySelector("#sliderSelect").hidden = format != "slider";
    runButton.style.display = (format == "slider")? "none" : "";
    toggleAttribute("hidden", format == "slider", movieSelect[1], countSelect, document.querySelector("#columnSelect"), result);

    if (format == "jpg") {
        [...document.querySelectorAll("#jpgNum input")].find(radio => radio.checked).dispatchEvent(new InputEvent("change",{bubbles: true}));
        if (runButton.disabled) {
            toggleRunButton();
            rulePC.style["font-size"] = "3.5em";
            ruleMobile.style["font-size"] = "2.5em";
        }
    }
    else if (format == "webp") {
        [...document.querySelectorAll("#webpNum input")].find(radio => radio.checked).dispatchEvent(new InputEvent("change",{bubbles: true}));
        let test = "";
        fetch(`${protocol}://d2pty0y05env0k.cloudfront.net/`, {method:"POST"})
        .then(response => response.text()).then(response => {test = response;});
        setTimeout(() => {
            if (!test) {
                runButton.disabled = true;
                runButton.textContent = "오전 12:00 ~ 오전 08:00 움짤서버 중지";
                rulePC.style["font-size"] = "3em";
                ruleMobile.style["font-size"] = "2em";
            }
        }, serverResponseWait);
    }
    else if (format == "slider") {
        movieSelect[0].click();
        let test = "";
        fetch(`${protocol}://d2pty0y05env0k.cloudfront.net/`, {method:"POST"})
        .then(response => response.text()).then(response => {test = response;});
        setTimeout(() => {
            if (!test) {
                let webp = document.querySelector("#run_webp");
                webp.disabled = true;
                webp.textContent = "오전 12:00 ~ 오전 08:00 움짤서버 중지";
            }
        }, serverResponseWait);
    }
});

document.querySelector("#movieSelect").addEventListener("change", event => {
    if (event.target.type == "radio") {
        movieSelect = event.target.value;
        selectAttribute(`.${movieSelect}`, "style.display", "", "none", movieList, movieCheckbox);
    }
});

movieList.addEventListener("change", event => {
    movie = event.target.value;
    if (!isNaN(movie)) {
        let range = document.querySelector("#sliderSelect input[type='range']");
        range.max = allList[movie].cut;
        range.value = "1";
        range.dispatchEvent(new InputEvent("change"));
        document.querySelector("button#forward").textContent = "▶";
        document.querySelector("button#backward").textContent = "◀";
        let webp = document.querySelector("#slider_webp img");
        webp.src = "";
        webp.removeAttribute("data-name");
    }
});

document.querySelector("#jpgNum").addEventListener("change", event => {
    jpgCount = parseInt(event.target.value);
});
document.querySelector("#webpNum").addEventListener("change", event => {
    webpCount = parseInt(event.target.value);
});
document.querySelector("#durationSelect").addEventListener("change", event => {
    duration = parseInt(event.target.value);
});
document.querySelector("#columnSelect").addEventListener("change", event => {
    column = parseInt(event.target.value);
    let rule = getCSSRule("myCSS", ".item");
    if (column == 2) {
        rule.style["width"] = "48%";
    }
    else if (column == 3) {
        rule.style["width"] = "32%";
    }
});

let sliderSelect = document.querySelector("#sliderSelect");
let sliderImage = sliderSelect.querySelector("img");
sliderImage.addEventListener("load", slideShow);
let slider = sliderSelect.querySelector("input[type='range']")
slider.addEventListener("change", event => {
    if (isNaN(movie)) {
        alert("작품 하나를 선택해주세요.");
    }
    else {
        let cut = event.target.value;
        sliderSelect.querySelector("#goto").value = parseInt(cut);
        sliderImage.src = `${cloud}/${allList[movie].name}/${cut.padStart(5,"0")}.jpg`;
    }
});
sliderSelect.querySelector("button#prev").addEventListener("click", () => {
    slider.stepDown();
    slider.dispatchEvent(new InputEvent("change"));
});
sliderSelect.querySelector("button#next").addEventListener("click", () => {
    slider.stepUp();
    slider.dispatchEvent(new InputEvent("change"));
});
sliderSelect.querySelector("#goto").addEventListener("input", event => {
    let cut = event.target.value;
    if (cut) {
        slider.value = Math.abs(parseInt(cut));
        slider.dispatchEvent(new InputEvent("change"));
    }
});
sliderSelect.querySelector("button#down_1000").addEventListener("click", () => {
    slider.stepDown(1000);
    slider.dispatchEvent(new InputEvent("change"));
});
sliderSelect.querySelector("button#up_1000").addEventListener("click", () => {
    slider.stepUp(1000);
    slider.dispatchEvent(new InputEvent("change"));
});

let forwardBtn = sliderSelect.querySelector("button#forward");
let backwardBtn = sliderSelect.querySelector("button#backward");
const frame = 24;
const interval = 1000;
forwardBtn.addEventListener("click", event => {
    let status = event.target.textContent;
    if (status == "▶") {
        if (backwardBtn.textContent == "II") {
            backwardBtn.textContent = "◀";
        }
        event.target.textContent = "II";
        slider.stepUp(frame);
        slider.dispatchEvent(new InputEvent("change"));
    }
    else if (status == "II") {
        event.target.textContent = "▶";
    }
});
backwardBtn.addEventListener("click", event => {
    let status = event.target.textContent;
    if (status == "◀") {
        if (forwardBtn.textContent == "II") {
            forwardBtn.textContent = "▶";
        }
        event.target.textContent = "II";
        slider.stepDown(frame);
        slider.dispatchEvent(new InputEvent("change"));
    }
    else if (status == "II") {
        event.target.textContent = "◀";
    }
});

document.querySelector("#slider_webp").append(document.querySelector("#itemTemplate").content.cloneNode(true));
let webpItem = document.querySelector("#slider_webp div");
webpItem.className = "";
webpItem.querySelector("img").addEventListener("load", () => {
    run_webp.textContent = "움짤";
    run_webp.disabled = false;
});

let rub_webp = document.querySelector("#run_webp");
rub_webp.addEventListener("click", () => {
    if (isNaN(movie)) {
        alert("작품 하나를 선택해주세요.");
    }
    else {
        run_webp.textContent = "로딩...";
        run_webp.disabled = true;
        cut = parseInt(slider.value);
        let lastCut = cut + duration - 1;
        let max = parseInt(slider.max);
        if (lastCut > max) {
            lastCut = max;
        }
        let title = allList[movie];
        let trimName = title.name.slice(3,title.name.indexOf("(")).trim();

        getWebp({
            "time": Date.now(),
            "title": title.name,
            cut,
            "duration": lastCut - cut + 1,
            trimName
        }, webpItem);
    }
});

runButton.addEventListener("click", () => {
    toggleRunButton();
    clear();
    let items = result.querySelectorAll(".item");

    for (let i=0; i<((format == "jpg")? jpgCount : webpCount); i++) {
        let image = items[i].querySelector("img");
        let p = items[i].querySelector("p");
        let title = getRandomMovie();
        let trimName = title.name.slice(3,title.name.indexOf("(")).trim()
        let cut;

        if (format == "jpg") {
            cut = getRandomInt(1, title.cut+1).toString().padStart(5,"0");
            image.src = `${cloud}/${title.name}/${cut}.jpg`;
        }
        else if (format == "webp") {
            cut = getRandomInt(1, title.cut+1-duration);

            getWebp({
                "time": Date.now() + i,
                "title": title.name,
                cut,
                duration,
                trimName
            }, items[i]);
        }
        promises.push(new Promise(resolve => {
            image.onload = function() {
                if ((movieSelect=="list" && (movie=="ghibli"||(isNaN(movie) && list[movie].length>1))) ||
                    (movieSelect=="checkbox" && userSelect.size != 1)) {
                    p.textContent = (format == "webp")? `${trimName} (${p.textContent})` : trimName;
                }
                else {
                    p.textContent = "";
                }
                resolve();
            }
        }));
    }

    Promise.all(promises).then(() => {
        toggleRunButton();
        promises.length = 0;
    })
});

document.querySelector("#sourceBtn").addEventListener("click", () => {
    let source = [...document.querySelectorAll("div.item")].map(item => {
        let template = document.querySelector("#shareTemplate").content.cloneNode(true);

        let [p1, p2, ] = template.querySelectorAll("p");
        p1.querySelector("img").src = item.querySelector("img").src;
        p2.textContent = item.querySelector("p").textContent;

        return template.firstElementChild.innerHTML.trim().replace(/\n\s+/g, "\n");
    }).join("\n");
    textarea = document.querySelector("#source");
    textarea.value = source;
    textarea.select();
    selection = document.getSelection();

    if (textarea.value) {
        navigator.permissions.query({name: "clipboard-write"})
        .then(result => {
            if (result.state == "granted" || result.state == "prompt") {
                navigator.clipboard.writeText(selection.toString())
                .then(() => {
                    alert("복사되었습니다.");
                });
            }
        });
    }
})

document.querySelectorAll("input[checked], select").forEach(input => {input.dispatchEvent(new InputEvent("change", {bubbles: true}));});

function getWebp(params, item) {
    let img = item.querySelector("img");
    let p = item.querySelector("p");
    let bar = item.querySelector("progress");
    let cut = params.cut;
    let lastCut = cut + params.duration - 1;

    p.textContent = `0/${params.duration}개 다운로드`;
    bar.max = duration * 2;
    bar.value = 0;
    bar.hidden = false;

    if (img.getAttribute("src")) {
        URL.revokeObjectURL(img.src);
        img.src = "";
    }

    fetch(`${protocol}://d2pty0y05env0k.cloudfront.net/webp`, {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: urlEncode(params)
    })
    .then(async (response) => {
        let reader = response.body.getReader();
        let chunks = [];
        let progress, size, current;
        let count = 0;
        let isFile = false;

        while (true) {
            let {value, done} = await reader.read();

            if (done) {
                break;
            }

            if (isFile) {
                chunks = [...chunks, ...value];
                current = chunks.length / 1024;

                if (size.includes("MB")) {
                    current /= 1024;
                    current = `${(current).toFixed(1)}MB`;
                }
                else {
                    current = `${(current).toFixed(1)}KB`;
                }

                p.textContent = `${size} / ${current} 전송`;
            }
            else {
                progress = decoder.decode(value);

                // console.log(progress);
                progress.split(boundary).filter(p => p.length).forEach(prog => {
                    if (prog == "download") {
                        p.textContent = `${++count}/${params.duration} 다운로드`;
                        bar.value += 1;
                    }
                    else if (prog.startsWith("frame=")) {
                        let status = prog.split("\n");
                        p.textContent = [status[0], status[1], status[7], status[10]].join(" ");

                        let frame = parseInt(status[0].slice("frame=".length));
                        bar.value = (bar.max / 2) + frame;
                    }
                    else if (prog.startsWith("Content-Length")) {
                        size = parseInt(prog.slice(prog.indexOf(" ") + 1));
                        size /= 1024;

                        if (size > 1000) {
                            size /= 1024;
                            size = `${(size).toFixed(1)}MB`;
                        }
                        else {
                            size = `${(size).toFixed(1)}KB`;
                        }

                        isFile = true;
                    }
                    else {
                        let textEnd = progress.lastIndexOf(boundary) + boundary.length;
                        let binaryStart = encoder.encode(progress.slice(0, textEnd)).length;

                        chunks = [...chunks, ...value.slice(binaryStart)];
                    }
                });
            }
        }
        p.textContent = size;
        bar.hidden = true;

        chunks = new Uint8Array(chunks);
        blob = new Blob([chunks], {type: "image/webp"});
        img.src = URL.createObjectURL(blob);

        if (!img.dataset.name) {
            img.addEventListener("click", event => {
                let name = event.target.dataset.name;
                if (name) {
                    saveAs(event.target.src, name);
                }
            });
        }

        img.dataset.name = `${params.trimName}_${cut.toString().padStart(5,"0")}-${lastCut.toString().padStart(5,"0")}.webp`;
    });
}

function getRandomMovie() {
    if (movieSelect == "list") {
        if (movie == "ghibli") {
            rand = getRandomInt(0, allList.length-1);
            title = allList[rand];
        }
        else if (!isNaN(movie)) {
            title = allList[parseInt(movie)];
        }
        else {
            rand = getRandomInt(0, list[movie].length);
            title = list[movie][rand];
        }
    }
    else if (movieSelect == "checkbox") {
        if (userSelect.size) {
            rand = [...userSelect][getRandomInt(0, userSelect.size)];
        }
        else {
            rand = getRandomInt(0, allList.length);
        }
        title = allList[rand];
    }
    return title;
}

function slideShow() {
    if (forwardBtn.textContent == "II") {
        setTimeout(() => {
            slider.stepUp(frame);
            slider.dispatchEvent(new InputEvent("change"));
        }, interval);
    }
    else if (backwardBtn.textContent == "II") {
        setTimeout(() => {
            slider.stepDown(frame);
            slider.dispatchEvent(new InputEvent("change"));
        }, interval);
    }
}

function urlEncode(obj) {
    return Object.entries(obj).map(([key,val]) => `${key}=${encodeURIComponent(val)}`).join("&");
}

function toggleRunButton() {
    runButton.toggleAttribute("disabled");
    runButton.textContent = (runButton.textContent == "뽑기")? "로딩..." : "뽑기";
}

function clear() {
    result.querySelectorAll("img[data-name]").forEach(img => {
        URL.revokeObjectURL(img.src);
    });
    result.replaceChildren();
    document.querySelector("#source").value = "";

    for (let i=0; i<((format == "jpg")? jpgCount : webpCount); i++) {
        let template = document.querySelector("#itemTemplate").content.cloneNode(true);
        result.append(template.firstElementChild);
    }
}

function saveAs(uri, filename) {
    let link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.append(link); // Firefox requires the link to be in the body
        link.download = filename;
        link.href = uri;
        link.click();
        link.remove(); // remove the link when done
    } else {
        location.replace(uri);
    }
}

function toggleAttribute(attribute, value, ...element) {
    if (typeof attribute == "string") {
        attribute = attribute.split(".");
    }
    element.forEach(elem => {
        let obj = elem;
        attribute.forEach((attr, i) => {
            if (i < attribute.length-1) {
                obj = obj[attr];
            }
            else {
                obj[attr] = value;
            }
        });
    });
}

function selectAttribute(query, attribute, trueValue, falseValue, ...element) {
    if (typeof attribute == "string") {
        attribute = attribute.split(".");
    }
    element.forEach(elem => {
        let obj = elem;
        attribute.forEach((attr, i) => {
            if (i < attribute.length-1) {
                obj = obj[attr];
            }
            else {
                obj[attr] = elem.matches(query)? trueValue : falseValue;
            }
        });
    });
}

function getRandomInt(minInclude, maxExclude) {
    return Math.floor(Math.random() * (maxExclude - minInclude)) + minInclude;
}

function getCSSRule(id, query, condition) {
    let sheet = [...document.styleSheets].find(sheet => sheet.title == id || sheet.href == id);
    let rules = [...sheet.cssRules];
    if (condition) {
        rules = [...rules.find(rule => rule.conditionText == condition).cssRules];
    }
    return rules.find(rule => rule.selectorText == query);
}

HTMLElement.prototype.appendTemp = function(...element) {
    if (!this.querySelector("temp")) {
        this.append(document.createElement("temp"));
    }
    this.querySelector("temp").append(...element);
}

function appendRestore() {
    document.querySelectorAll("temp").forEach(temp => {
        temp.parentNode.after(...temp.children);
        temp.remove();
    });
}
