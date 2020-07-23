var format = "jpg";
var movieSelect = "list";
var movie = "long";
var userSelect = [];
var allList = [];
var duration = 18;
var count = 6;
var runButton = document.querySelector("#run");
var cloud = "https://d2wwh0934dzo2k.cloudfront.net/ghibli";
// var cloud = "http://kjw4569.iptime.org:8080/ghibli";

fetch("./list.json").then(response => response.json())
    .then(json => {
    list = json;
    toggleButton(runButton);

    let movieList = document.querySelector("#movieList");
    let movieCheckbox = document.querySelectorAll("#movieCheckbox td");
    let sum = 0;
    for (let category in list) {
        let i;
        for (i=0; i<list[category].length; i++) {
            allList.push(list[category][i]);
            let name = list[category][i].name.slice(3);
    
            let option = document.createElement("option");
            option.value = sum+i;
            option.text = name;
            if (category == "long") {
                movieList.insertBefore(option,document.querySelector("option[value='game']"));
            }
            else if (category == "game") {
                movieList.insertBefore(option,document.querySelector("option[value='short']"));
            }
            else if (category == "short") {
                movieList.insertBefore(option,document.querySelector("option[value='etc']"));
            }
            else if (category == "etc") {
                movieList.appendChild(option);
            }

            let label = document.createElement("label");
            label.className = "color-white";
            let input = document.createElement("input");
            input.type = "checkbox";
            input.value = sum+i;
            input.addEventListener("change", event => {
                if (event.target.checked == true) {
                    userSelect.push(event.target.value);
                }
                else {
                    let idx = userSelect.indexOf(event.target.value);
                    if (idx > -1) userSelect.splice(idx, 1);
                }
            });
            label.appendChild(input);
            label.appendChild(document.createTextNode(name.slice(0,-7)));
            movieCheckbox[sum+i].appendChild(label);
        }
        sum += i;
    }
});

let result = document.querySelector("#result");
for (i=0; i<36; i++) {
    let item = document.createElement("div");
    item.className = "item";
    let img = document.createElement("img");
    img.src = "";
    let title = document.createElement("p");
    title.className = "shadow-white bold";
    title.innerText = "";
    item.appendChild(img);
    item.appendChild(title);
    result.appendChild(item);
}

let radios = document.querySelectorAll("#formatSelect input");
for (let radio of radios) {
    radio.addEventListener("change", event => {
        format = event.target.value;
        let labels = document.querySelectorAll("#numSelect label");
        let inputs = document.querySelectorAll("#numSelect input");
        let duration = document.querySelector("#durationSelect");
        if (format == "jpg") {
            labels[0].style.display = "none";
            labels[1].style.display = "none";
            labels[2].style.display = "none";
            labels[3].style.display = "inline";
            labels[4].style.display = "inline";
            labels[5].style.display = "inline";
            labels[6].style.display = "inline";
            duration.style.display = "none";
            inputs[3].checked = true;
            count = 6;
        }
        else if (format == "webp") {
            labels[0].style.display = "inline";
            labels[1].style.display = "inline";
            labels[2].style.display = "inline";
            labels[3].style.display = "none";
            labels[4].style.display = "none";
            labels[5].style.display = "none";
            labels[6].style.display = "none";
            duration.style.display = "block";
            inputs[0].checked = true;
            count = 1;
        }
    });
}

radios = document.querySelectorAll("#movieSelect input[type='radio']");
for (let radio of radios) {
    radio.addEventListener("change", event => {
        movieSelect = event.target.value;
        if (movieSelect == "list") {
            document.querySelector("#movieList").style.display = "inline";
            document.querySelector("#movieCheckbox").style.display = "none";
        }
        else if (movieSelect == "checkbox") {
            document.querySelector("#movieList").style.display = "none";
            document.querySelector("#movieCheckbox").style.display = "inline";
        }
    });
}

document.querySelector("#movieList").addEventListener("change", event => {
    movie = event.target.value;
});

radios = document.querySelectorAll("#numSelect input");
for (let radio of radios) {
    radio.addEventListener("change", event => {
        count = parseInt(event.target.value);
    });
}

radios = document.querySelectorAll("#durationSelect input");
for (let radio of radios) {
    radio.addEventListener("change", event => {
        duration = parseInt(event.target.value);
    });
}

radios = document.querySelectorAll("#columnSelect input");
for (let radio of radios) {
    radio.addEventListener("change", event => {
        column = parseInt(event.target.value);
        let styleSheet = getStyleSheet("myCSS");
        let rule = getCSSRule(styleSheet.rules, ".item");

        if (column == 2) {
            rule.style["width"] = "49%";
        }
        else if (column == 3) {
            rule.style["width"] = "32%";
        }
    });
}

runButton.addEventListener("click", () => {
    toggleButton(runButton);
    let items = result.querySelectorAll(".item");
    clear(items);
    
    let time = Date.now();
    let promises = [];
    for (let i=0; i<count; i++) {
        let rand, title, cut;
        let image = items[i].querySelector("img");
        let p = items[i].querySelector("p");

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
            if (userSelect.length > 0) {
                rand = userSelect[getRandomInt(0, userSelect.length)];
            }
            else {
                rand = getRandomInt(0, allList.length);
            }
            title = allList[rand];
        }

        if (format == "jpg") {
            cut = getRandomInt(1, title.cut+1).toString().padStart(5,"0");
            promises.push(loadImage(image, `${cloud}/${title.name}/${cut}.jpg`));
        }
        else if (format == "webp") {
            cut = getRandomInt(1, title.cut+1-duration).toString().padStart(5,"0");
            promises.push(fetch("https://rosenrose.co/webp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: urlEncode({
                    time: time,
                    num: i+1,
                    title: title.name,
                    cut: cut,
                    duration: duration
                })
                }).then(response => {
                    console.log(response.headers.get("Content-Type"));
                    return response.blob();
                })
                .then(blob => {
                    console.log(blob);
                    image.src = URL.createObjectURL(blob);
                    image.setAttribute("click-event",`${title.name.slice(3,-7)}_${cut}-${(parseInt(cut)+duration-1).toString().padStart(5,"0")}.webp`);
                    image.addEventListener("click",imgSave);
                })
            );
        }
        
        if ((movieSelect=="list" && (movie=="ghibli"||(isNaN(movie) && list[movie].length>1))) ||
            (movieSelect=="checkbox" && userSelect.length!=1)) {
            p.innerText = title.name.slice(3,-7);
        }
        else {
            p.innerText = "";
        }
    }

    Promise.all(promises).then(() => toggleButton(runButton));
});

function imgSave() {
    saveAs(event.target.src, event.target.getAttribute("click-event"));
};

function urlEncode(obj) {
    return Object.entries(obj).map(([key,val]) => `${key}=${encodeURIComponent(val)}`).join("&");
}

function loadImage(image, url) {
    return new Promise(resolve => {
        image.src = url;
        image.addEventListener("load", () => resolve());
    });
}

function toggleButton(button) {
    if (button.disabled) {
        button.disabled = false;
        button.innerText = "뽑기!";
    }
    else {
        button.disabled = true;
        button.innerText = "로딩...";
    }
}

function clear(items) {
    for (let item of items) {
        let img = item.querySelector("img");
        img.src = "";
        if (img.hasAttribute("click-event")) {
            img.removeAttribute("click-event");
            img.removeEventListener("click", imgSave);
        }
        item.querySelector("p").innerText = "";
    }
}

function getRandomInt(minInclude, maxExclude) {
    return Math.floor(Math.random() * (maxExclude - minInclude)) + minInclude;
}

function getStyleSheet(title) {
    for(let sheet of document.styleSheets) {
        if(sheet.title == title) {
            return sheet;
        }
    }
}

function getCSSRule(rules, selector_text) {
    for(let rule of rules) {
        if(rule.selectorText == selector_text) {
            return rule;
        }
    }
}

function saveAs(uri, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); // Firefox requires the link to be in the body
        link.download = filename;
        link.href = uri;
        link.click();
        document.body.removeChild(link); // remove the link when done
    } else {
        location.replace(uri);
    }
}
