const userSelect = new Set();
const allList = [];
const promises = [];
const movieList = document.querySelector("#movieList");
const movieCheckbox = document.querySelector("#movieCheckbox");
const runButton = document.querySelector("#run");
const result = document.querySelector("#result");
const cloud = "https://d2wwh0934dzo2k.cloudfront.net/ghibli";
const fps = 12;
const webpWidth = 720;
const gifWidth = 360;
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });
const padLength = 5;

fetch("https://webp-cloudrun-osuiaeahvq-an.a.run.app/");
fetch("list.json")
  .then((response) => response.json())
  .then((json) => {
    list = json;
    let sum = 0;

    for (let category in list) {
      let i;
      for (i = 0; i < list[category].length; i++) {
        allList.push(list[category][i]);
        let name = list[category][i].name.slice(3);

        let option = document.createElement("option");
        option.value = sum + i;
        option.text = name;
        movieList.querySelector(`option[value='${category}']`).appendTemp(option);

        let template = document.querySelector("#movieCheckboxTemplate").content.cloneNode(true);
        let input = template.querySelector("input");
        input.value = sum + i;
        input.nextSibling.textContent = name.slice(0, name.indexOf("(") - 1);
        movieCheckbox.querySelectorAll("td")[sum + i].append(template.firstElementChild);
      }
      sum += i;
    }
    appendRestore();
    movieCheckbox.addEventListener("change", (event) => {
      if (event.target.checked) {
        userSelect.add(event.target.value);
      } else {
        userSelect.delete(event.target.value);
      }
    });
  });

document.querySelector("#formatSelect").addEventListener("change", (event) => {
  format = event.target.value;
  let movieSelect = document.querySelectorAll("#movieSelect label");
  let countSelect = document.querySelector("#countSelect");
  let rulePC = getCSSRule("myCSS", "#run");
  let ruleMobile = getCSSRule("myCSS", "#run", "(max-width: 768px)");

  if (format != "slider") {
    selectAttribute(
      `.${format}`,
      "hidden",
      false,
      true,
      ...document.querySelectorAll("#webpNum, #jpgNum")
    );
  }
  toggleAttribute(
    "style.display",
    format == "jpg" ? "none" : "",
    ...document.querySelectorAll("#durationSelect, #webpFormatSelect")
  );
  document.querySelector("#share").hidden = format != "jpg";
  document.querySelector("#sliderSelect").hidden = format != "slider";
  runButton.style.display = format == "slider" ? "none" : "";
  toggleAttribute(
    "hidden",
    format == "slider",
    movieSelect[1],
    countSelect,
    document.querySelector("#columnSelect"),
    result
  );

  if (format == "jpg") {
    [...document.querySelectorAll("#jpgNum input")]
      .find((radio) => radio.checked)
      .dispatchEvent(new InputEvent("change", { bubbles: true }));
    if (runButton.textContent.startsWith("오전")) {
      toggleRunButton();
      rulePC.style["font-size"] = "3.5em";
      ruleMobile.style["font-size"] = "2.5em";
    }
  } else if (format == "webp") {
    [...document.querySelectorAll("#webpNum input")]
      .find((radio) => radio.checked)
      .dispatchEvent(new InputEvent("change", { bubbles: true }));
  } else if (format == "slider") {
    movieSelect[0].click();
  }
});

document.querySelector("#movieSelect").addEventListener("change", (event) => {
  if (event.target.type == "radio") {
    movieSelect = event.target.value;
    selectAttribute(`.${movieSelect}`, "style.display", "", "none", movieList, movieCheckbox);
  }
});

movieList.addEventListener("change", (event) => {
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

document.querySelector("#jpgNum").addEventListener("change", (event) => {
  jpgCount = parseInt(event.target.value);
});
document.querySelector("#webpNum").addEventListener("change", (event) => {
  webpCount = parseInt(event.target.value);
});
document.querySelector("#durationSelect").addEventListener("change", (event) => {
  duration = parseInt(Number(event.target.value) * fps);
});
document.querySelector("#webpFormatSelect").addEventListener("change", (event) => {
  webpFormat = event.target.value;
});
document.querySelector("#columnSelect").addEventListener("change", (event) => {
  column = parseInt(event.target.value);
  let rule = getCSSRule("myCSS", ".item");
  if (column == 2) {
    rule.style["width"] = "48%";
  } else if (column == 3) {
    rule.style["width"] = "32%";
  }
});

let sliderSelect = document.querySelector("#sliderSelect");
let sliderImage = sliderSelect.querySelector("img");
sliderImage.addEventListener("load", slideShow);
let slider = sliderSelect.querySelector("input[type='range']");
slider.addEventListener("change", (event) => {
  if (isNaN(movie)) {
    alert("작품 하나를 선택해주세요.");
  } else {
    let cut = event.target.value;
    sliderSelect.querySelector("#goto").value = parseInt(cut);
    sliderImage.src = `${cloud}/${allList[movie].name}/${cut.padStart(padLength, "0")}.jpg`;
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
sliderSelect.querySelector("#goto").addEventListener("input", (event) => {
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
forwardBtn.addEventListener("click", (event) => {
  let status = event.target.textContent;
  if (status == "▶") {
    if (backwardBtn.textContent == "II") {
      backwardBtn.textContent = "◀";
    }
    event.target.textContent = "II";
    slider.stepUp(frame);
    slider.dispatchEvent(new InputEvent("change"));
  } else if (status == "II") {
    event.target.textContent = "▶";
  }
});
backwardBtn.addEventListener("click", (event) => {
  let status = event.target.textContent;
  if (status == "◀") {
    if (forwardBtn.textContent == "II") {
      forwardBtn.textContent = "▶";
    }
    event.target.textContent = "II";
    slider.stepDown(frame);
    slider.dispatchEvent(new InputEvent("change"));
  } else if (status == "II") {
    event.target.textContent = "◀";
  }
});

document
  .querySelector("#slider_webp")
  .append(document.querySelector("#itemTemplate").content.cloneNode(true));
let webpItem = document.querySelector("#slider_webp figure");
webpItem.className = "";
webpItem.querySelector(".itemImg").addEventListener("load", () => {
  run_webp.textContent = "움짤";
  run_webp.disabled = false;
  webpItem.querySelector(".loading").style.display = "none";
});
webpItem.querySelector(".loading").style.display = "none";

let rub_webp = document.querySelector("#run_webp");
rub_webp.addEventListener("click", () => {
  if (isNaN(movie)) {
    alert("작품 하나를 선택해주세요.");
  } else {
    run_webp.textContent = "로딩...";
    run_webp.disabled = true;
    webpItem.querySelector(".loading").style.display = "";

    cut = parseInt(slider.value);
    let lastCut = cut + duration - 1;
    let max = parseInt(slider.max);
    if (lastCut > max) {
      lastCut = max;
    }
    let title = allList[movie];
    let trimName = title.name.slice(3, title.name.indexOf("(")).trim();

    getWebp(
      {
        time: Date.now().toString(),
        title: title.name,
        cut,
        duration: lastCut - cut + 1,
        trimName,
        webpFormat,
        requestTo: "browser",
      },
      webpItem
    ).catch((err) => {
      webpItem.querySelector("figcaption").textContent = "전송 실패";
    });
  }
});

runButton.addEventListener("click", () => {
  toggleRunButton();
  clear();
  let items = result.querySelectorAll(".item");

  for (let i = 0; i < (format == "jpg" ? jpgCount : webpCount); i++) {
    let [loading, image] = items[i].querySelectorAll("img");
    let caption = items[i].querySelector("figcaption");
    let title = getRandomMovie();
    let trimName = title.name.slice(3, title.name.indexOf("(")).trim();
    let cut;

    if (format == "jpg") {
      cut = getRandomInt(1, title.cut + 1)
        .toString()
        .padStart(padLength, "0");
      image.src = `${cloud}/${title.name}/${cut}.jpg`;
    } else if (format == "webp") {
      cut = getRandomInt(1, title.cut + 1 - duration);
      getWebp(
        {
          title: title.name,
          cut,
          duration,
          trimName,
          webpFormat,
          requestTo: "server",
          from: "ghibli",
          PAD_LENGTH: padLength,
        },
        items[i]
      ).catch((err) => {
        caption.textContent = "전송 실패";
      });
    }
    promises.push(
      new Promise((resolve) => {
        image.onload = (event) => {
          if (
            (movieSelect == "list" &&
              (movie == "ghibli" || (isNaN(movie) && list[movie].length > 1))) ||
            (movieSelect == "checkbox" && userSelect.size != 1)
          ) {
            caption.textContent =
              format == "jpg" ? trimName : `${trimName} (${event.target.dataset.size})`;
          } else {
            caption.textContent = format == "jpg" ? "" : event.target.dataset.size;
          }
          loading.style.display = "none";
          resolve();
        };
      })
    );
  }

  Promise.all(promises).then(() => {
    resetRunButton();
    promises.length = 0;
  });
});

document.querySelector("#sourceBtn").addEventListener("click", () => {
  let source = [...document.querySelectorAll("figure.item")]
    .map((item) => {
      let template = document.querySelector("#shareTemplate").content.cloneNode(true);

      let [p1, p2] = template.querySelectorAll("p");
      p1.querySelector("img").src = item.querySelector(".itemImg").src;
      p2.textContent = item.querySelector("figcaption").textContent;

      return template.firstElementChild.innerHTML.trim().replace(/\n\s+/g, "\n");
    })
    .join("\n");
  textarea = document.querySelector("#source");
  textarea.value = source;
  textarea.select();
  selection = document.getSelection();

  if (textarea.value) {
    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.writeText(selection.toString()).then(() => {
          alert("복사되었습니다.");
        });
      }
    });
  }
});

document.querySelectorAll("input[checked], select").forEach((input) => {
  input.dispatchEvent(new InputEvent("change", { bubbles: true }));
});

async function getWebp(params, item) {
  const { time, title, cut, duration, trimName, webpFormat, requestTo } = params;
  const img = item.querySelector(".itemImg");
  const caption = item.querySelector("figcaption");
  const bar = item.querySelector("progress");

  caption.textContent = `0/${duration} 다운로드`;
  bar.max = duration * 2;
  bar.value = 0;
  bar.hidden = false;

  const lastCut = cut + duration - 1;
  let outputName = `${trimName}_${cut.toString().padStart(padLength, "0")}-${lastCut
    .toString()
    .padStart(padLength, "0")}.${webpFormat}`;
  outputName = encodeURIComponent(outputName);

  URL.revokeObjectURL(img?.src); // 장면 선택 모드
  img.src = "";

  if (requestTo == "browser") {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
      ffmpeg.FS("mkdir", "webp");
    }
    ffmpeg.setProgress((progress) => {
      showProgress(caption, bar, progress);
    });
    // ffmpeg.setLogger((log) => {
    //   caption.textContent = log.message.split("=");
    // });

    ffmpeg.FS("mkdir", `webp/${time}`);
    const downloadPromises = [];
    let downloadCount = 1;

    for (let i = 0; i < duration; i++) {
      const filename = `${(cut + i).toString().padStart(padLength, "0")}.jpg`;

      downloadPromises.push(
        new Promise((resolve) => {
          fetchFile(`${cloud}/${title}/${filename}`).then((file) => {
            ffmpeg.FS("writeFile", `webp/${time}/${filename}`, file);
            showDownload(caption, bar, duration, downloadCount++);
            resolve();
          });
        })
      );
    }

    const command =
      webpFormat === "webp"
        ? ["-vf", `scale=${webpWidth}:-1`, "-loop", "0", "-preset", "drawing", "-qscale", "90"]
        : [
            "-lavfi",
            `split[a][b];[a]scale=${gifWidth}:-1,palettegen[p];[b]scale=${gifWidth}:-1[g];[g][p]paletteuse`,
          ];

    await Promise.all(downloadPromises);
    //prettier-ignore
    await ffmpeg.run(
      "-framerate", "12",
      "-pattern_type", "glob",
      "-i", `webp/${time}/*.jpg`,
      ...command,
      `webp/${time}/output.${webpFormat}` //output에서 utf-8 지원 안됨(FS는 가능)
    );

    const output = ffmpeg.FS("readFile", `webp/${time}/output.${webpFormat}`);
    // console.log(output);
    createWebp({ buffer: [output.buffer], img, caption, bar, webpFormat, outputName });
    clear_ffmpeg(ffmpeg);
  } else if (requestTo == "server") {
    // const socket = io("ws://localhost:3000/");
    const socket = io("wss://webp-cloudrun-osuiaeahvq-an.a.run.app/");
    let buffer = [];

    socket.emit("webp", params, () => {
      createWebp({ buffer, img, caption, bar, webpFormat, outputName });
    });
    socket.on("progress", (progress) => {
      // console.log("server", progress);
      showProgress(caption, bar, progress);
    });
    socket.on("download", (count) => {
      showDownload(caption, bar, duration, count);
    });
    socket.on("transfer", (chunk) => {
      // console.log(chunk);
      buffer.push(chunk);
    });
  }
}

function showProgress(caption, bar, progress) {
  if ("frame" in progress) {
    // const { frame, time, speed } = progress;
    const frame = parseInt(progress.frame);
    caption.textContent = `${((frame / (bar.max / 2)) * 100).toFixed(1)}% / frame=${frame}`;
    bar.value = bar.max / 2 + parseInt(frame);
  } else {
    if (!progress.ratio || !progress.time) {
      return;
    }
    caption.textContent = `${(progress.ratio * 100).toFixed(1)}% / ${
      progress.time?.toFixed(2) || 0
    }s`;
    bar.value = bar.max / 2 + Math.round((bar.max / 2) * progress.ratio);
  }
}

function showDownload(caption, bar, duration, count) {
  caption.textContent = `${count}/${duration} 다운로드`;
  bar.value += 1;
}

function createWebp(props) {
  const { buffer, img, bar, outputName, webpFormat } = props;
  const blob = new Blob(buffer, { type: `image/${webpFormat}` });

  img.src = URL.createObjectURL(blob);

  let size = blob.size / 1024;
  if (size > 1000) {
    size /= 1024;
    size = `${size.toFixed(1)}MB`;
  } else {
    size = `${size.toFixed(1)}KB`;
  }

  img.dataset.size = size;
  bar.hidden = true;

  if (!img.dataset.name) {
    img.addEventListener("click", (event) => {
      let name = event.target.dataset.name;
      if (name) {
        saveAs(event.target.src, name);
      }
    });
  }

  img.dataset.name = decodeURIComponent(outputName);
}

function clear_ffmpeg(ffmpeg) {
  ffmpeg
    .FS("readdir", "webp")
    .filter((dir) => !dir.startsWith("."))
    .forEach((dir) => {
      ffmpeg
        .FS("readdir", `webp/${dir}`)
        .filter((file) => !file.startsWith("."))
        .forEach((file) => {
          ffmpeg.FS("unlink", `webp/${dir}/${file}`);
        });
      ffmpeg.FS("rmdir", `webp/${dir}`);
    });
}

window.addEventListener("error", (event) => {
  if (event.error.message == "응답시간 초과") {
    resetRunButton();
    document.querySelectorAll("progress").forEach((progress) => {
      if (!progress.hidden && progress.value != progress.max) {
        progress.hidden = true;
        progress.nextElementSibling.textContent = event.error.message;
      }
    });
  }
});

function resetRunButton() {
  runButton.disabled = false;
  runButton.textContent = "뽑기";
}

function getRandomMovie() {
  if (movieSelect == "list") {
    if (movie == "ghibli") {
      rand = getRandomInt(0, allList.length - 1);
      title = allList[rand];
    } else if (!isNaN(movie)) {
      title = allList[parseInt(movie)];
    } else {
      rand = getRandomInt(0, list[movie].length);
      title = list[movie][rand];
    }
  } else if (movieSelect == "checkbox") {
    if (userSelect.size) {
      rand = [...userSelect][getRandomInt(0, userSelect.size)];
    } else {
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
  } else if (backwardBtn.textContent == "II") {
    setTimeout(() => {
      slider.stepDown(frame);
      slider.dispatchEvent(new InputEvent("change"));
    }, interval);
  }
}

function toggleRunButton() {
  runButton.toggleAttribute("disabled");
  runButton.textContent = runButton.textContent == "뽑기" ? "로딩..." : "뽑기";
}

function clear() {
  result.querySelectorAll(".itemImg").forEach((img) => {
    URL.revokeObjectURL(img.src);
  });
  result.replaceChildren();
  document.querySelector("#source").value = "";

  for (let i = 0; i < (format == "jpg" ? jpgCount : webpCount); i++) {
    let template = document.querySelector("#itemTemplate").content.cloneNode(true);
    result.append(template.firstElementChild);
  }
}

function saveAs(uri, filename) {
  let link = document.createElement("a");
  if (typeof link.download === "string") {
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
  element.forEach((elem) => {
    let obj = elem;
    attribute.forEach((attr, i) => {
      if (i < attribute.length - 1) {
        obj = obj[attr];
      } else {
        obj[attr] = value;
      }
    });
  });
}

function selectAttribute(query, attribute, trueValue, falseValue, ...element) {
  if (typeof attribute == "string") {
    attribute = attribute.split(".");
  }
  element.forEach((elem) => {
    let obj = elem;
    attribute.forEach((attr, i) => {
      if (i < attribute.length - 1) {
        obj = obj[attr];
      } else {
        obj[attr] = elem.matches(query) ? trueValue : falseValue;
      }
    });
  });
}

function getRandomInt(minInclude, maxExclude) {
  return Math.floor(Math.random() * (maxExclude - minInclude)) + minInclude;
}

function getCSSRule(id, query, condition) {
  let sheet = [...document.styleSheets].find((sheet) => sheet.title == id || sheet.href == id);
  let rules = [...sheet.cssRules];
  if (condition) {
    rules = [...rules.find((rule) => rule.conditionText == condition).cssRules];
  }
  return rules.find((rule) => rule.selectorText == query);
}

HTMLElement.prototype.appendTemp = function (...element) {
  if (!this.querySelector("temp")) {
    this.append(document.createElement("temp"));
  }
  this.querySelector("temp").append(...element);
};

function appendRestore() {
  document.querySelectorAll("temp").forEach((temp) => {
    temp.parentNode.after(...temp.children);
    temp.remove();
  });
}

function toggleInput(input, condition) {
  input.disabled = !condition;
  input.parentNode.style.color = condition ? "" : "gray";
}
