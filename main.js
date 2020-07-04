format = "jpg";
movieSelect = "list";
movie = -1;
userSelect = [];
count = 6;
fetch("./list.json").then(response => response.json())
    .then(json => {
    list = json;
    toggleButton(document.querySelector("#run"));

    let movieList = document.querySelector("#movieList");
    let movieCheckbox = document.querySelectorAll("#movieCheckbox td");
    for (let i=0; i<list.movies.length; i++) {
        let name = list.movies[i].name.slice(3);

        let option = document.createElement("option");
        option.value = i;
        option.text = name;
        movieList.appendChild(option);

        let label = document.createElement("label");
        label.className = "color-white";
        let input = document.createElement("input");
        input.type = "checkbox";
        input.value = i;
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
        movieCheckbox[i].appendChild(label);
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
        if (format == "jpg") {
            labels[0].style.display = "none";
            labels[1].style.display = "none";
            labels[2].style.display = "inline";
            labels[3].style.display = "inline";
            labels[4].style.display = "inline";
            labels[5].style.display = "inline";
            inputs[2].checked = true;
            count = 6;
        }
        else if (format == "webp") {
            labels[0].style.display = "inline";
            labels[1].style.display = "inline";
            labels[2].style.display = "none";
            labels[3].style.display = "none";
            labels[4].style.display = "none";
            labels[5].style.display = "none";
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
    movie = parseInt(event.target.value);
});

radios = document.querySelectorAll("#numSelect input");
for (let radio of radios) {
    radio.addEventListener("change", event => {
        count = parseInt(event.target.value);
    });
}

radios = document.querySelectorAll("#columnSelect input");
for (let radio of radios) {
    radio.addEventListener("change", event => {
        column = parseInt(event.target.value);
        let styleSheet = getStyleSheet("myCSS");
        let rule = getCSSRule(styleSheet.rules, ".item");

        if (column == 3) {
            rule.style["max-width"] = "32%";
        }
        else if (column == 2) {
            rule.style["max-width"] = "49%";
        }
    });
}

document.querySelector("#run").addEventListener("click", () => {
    let runButton = document.querySelector("#run")
    toggleButton(runButton);
    let items = result.querySelectorAll(".item");
    if (format == "jpg") {
        clear(items, count);
    }
    else if (format == "webp") {
        clear(items, 0);
    }
    
    let time = Date.now();
    promises = [];
    for (let i=0; i<count; i++) {
        let randMovie, randCut;
        if (movieSelect == "list") {
            if (movie == -1) {
                randMovie = getRandomInt(0, list.movies.length);
            }
            else {
                randMovie = movie;
            }
        }
        else if (movieSelect == "checkbox") {
            if (userSelect.length > 0) {
                randMovie = userSelect[getRandomInt(0, userSelect.length)];
            }
            else {
                randMovie = getRandomInt(0, list.movies.length);
            }
        }
        if (format == "jpg") {
            randCut = getRandomInt(0, list.movies[randMovie].cut.length);
        }
        else if (format == "webp") {
            randCut = getRandomInt(0, list.movies[randMovie].cut.length-60);
        }
        let cut = list.movies[randMovie].cut[randCut];
        let title = list.movies[randMovie].name;
        let image = items[i].querySelector("img");

        if (format == "jpg") {
            promises.push(loadImage(image, `https://d2wwh0934dzo2k.cloudfront.net/ghibli/${title}/${cut.toString().padStart(5,"0")}.jpg`));
        }
        else if (format == "webp") {
            promises.push(fetch("https://rosenrose.co/webp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: urlEncode({
                    time: time,
                    num: i+1,
                    title: title,
                    cut: cut
                })
                }).then(response => response.blob())
                .then(blob => items[i].querySelector("img").src = URL.createObjectURL(blob))
            );
        }
        
        if ((movieSelect == "list" && movie == -1) || (movieSelect == "checkbox" && userSelect.length != 1)) {
            items[i].querySelector("p").innerText = title.slice(3,-7);
        }
        else {
            items[i].querySelector("p").innerText = "";
        }
    }

    Promise.all(promises).then(() => {
        toggleButton(document.querySelector("#run"));
    })
});

function urlEncode(obj) {
    let list=[];
    for (let key in obj) {
        list.push(`${key}=${encodeURIComponent(obj[key])}`)
    }
    return list.join("&");
}

function loadImage(image, url) {
    return new Promise(resolve => {
        image.src = url;
        image.addEventListener("load", () => {
            resolve();
        });
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

function clear(items, start) {
    for (let i=start; i<items.length; i++) {
        items[i].querySelector("img").src = "";
        items[i].querySelector("p").innerText = "";
    }
}

function getRandomInt(minInclude, maxExclude) {
    return Math.floor(Math.random() * (maxExclude - minInclude)) + minInclude;
}

function getStyleSheet(unique_title) {
    for(let sheet of document.styleSheets) {
        if(sheet.title == unique_title) {
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