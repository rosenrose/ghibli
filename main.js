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
    if (typeof mutex == "undefined") {
        mutex = true;
    }
    if (mutex) {
        mutex = false;
        toggleButton(document.querySelector("#run"));
        let items = result.querySelectorAll(".item");
        clear(itmes);

        promises = [];
        for (let i=0; i<count; i++) {
            let randMovie;
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
            let randCut = getRandomInt(0, list.movies[randMovie].cut.length);

            let cut = list.movies[randMovie].cut[randCut].toString().padStart(5,"0");            
            let title = list.movies[randMovie].name;
            let image = items[i].querySelector("img");
            promises.push(loadImage(image, `https://d2wwh0934dzo2k.cloudfront.net/ghibli/${title}/${cut}.jpg`));
            if ((movieSelect == "list" && movie == -1) || (movieSelect == "checkbox" && userSelect.length != 1)) {
                items[i].querySelector("p").innerText = title.slice(3,-7);
            }
            else {
                items[i].querySelector("p").innerText = "";
            }
        }
        Promise.all(promises).then(() => {
            mutex = true;
            toggleButton(document.querySelector("#run"));
        })
    }
});

// document.querySelector("#webp").addEventListener("click", () => {
//     let randMovie = getRandomInt(0, list.movies.length);
//     let title = list.movies[randMovie].name;
//     let randCut = getRandomInt(0, list.movies[randMovie].cut.length-60);
//     let randCuts = list.movies[randMovie].cut.slice(randCut, randCut+60);

//     fetch("http://3.34.46.170:8080/webp", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: `count=${count}&title=${encodeURIComponent(title)}&cuts=${randCuts.toString()}`
//     }).then(response => console.log(response));
// });

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

function clear(items) {
    for (let i=count; i<items.length; i++) {
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