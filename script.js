//GLOBAL VARIABLES
let fontFamilyLocal,
  fontSizeLocal,
  themeLocal,
  lastScrollPositionLocal,
  lastFetchedLocal;

// Initial Loading
const initialLoadingOverlay = document.querySelector(".initialLoadingOverlay");

// Navigation Toggling
const nav = document.querySelector(".navBtn");
const settingWindow = document.querySelector(".container .window");
const selectLang = document.querySelector("#langSelect");
const quranPreview = document.querySelector(".quranResult");
const searchSubmit = document.querySelector(".searchSubmit");
const ayahValue = document.querySelector("#ayahSearch");
const afterSearchIcons = document.querySelector(".afterSearchIcons");

// autoPlay manipulation
const playTools = document.querySelector(".tools .icons");
const playBtn = document.querySelector(".playPause");
let idVerseLocationCounter = 0;
let hibernateIntOnCount = 0;
let hibernateInt;
let currentScroll = 0;
let playPause = false;
let currentAudIdx = 0;

// Changing Theme
const theme = document.querySelector("#theme");
const container = document.querySelector(".container");
const themeTemplate = document.createElement("div");

// Changing Font Family
const fontList = document.querySelector("#font");

// Changing Font Size
const fontResizer = document.querySelector("#fontSize");

//Clear Local Storage
const clear = document.querySelector(".clear");

nav.addEventListener(
  "click",
  () => {
    settingWindow.style.transform = "translateX(0)";

    nav.nextElementSibling
      .querySelector(".closer")
      .addEventListener("click", () => {
        settingWindow.style.transform = "translateX(200%)";
      });
  },
  true
);

// Loading Page Show/Hide
function loadingPage() {
  const elem = document.querySelector(".loading");
  elem.style.display = "grid";

  setTimeout(() => {
    elem.style.display = "none";
  }, 3000);
}

window.addEventListener("load", () => {
  const loadedSettings = saveToLocal();
  let splitUrlAndIdx = [];
  if (loadedSettings.lastFetched) {
    splitUrlAndIdx = loadedSettings.lastFetched.split(",");
    selectLang[splitUrlAndIdx[1]].selected = true;
  }

  container.style.background = loadedSettings.theme ?? "deepskyblue";
  theme.style.background = loadedSettings.theme ?? "deepskyblue";
  document.body.style.background = loadedSettings.theme ?? "deepskyblue";

  setTimeout(() => {
    fetchQuranJson(splitUrlAndIdx[0] ?? "/QuranData/quran.json");
  }, 1200);

  setTimeout(() => {
    initialLoadingOverlay.style.display = "none";
  }, 2500);
});

function updateFromLocal() {
  const loadedSettings = saveToLocal();
  const verses = document.querySelectorAll(".verses");

  verses.forEach((verse) => {
    verse.style.fontFamily = loadedSettings.fontFamily ?? "Uthmanic";
    verse.style.fontSize = loadedSettings.fontSize + "px" ?? "1rem";
  });

  setTimeout(() => {
    quranPreview.scrollTop = loadedSettings.lastScrollPosition ?? 0;
  }, 500);
}

selectLang.addEventListener("change", (e) => {
  const localURLs = [
    "/QuranData/quran.json",
    "/QuranData/quran_bn.json",
    "/QuranData/quran_en.json",
  ];
  fetchQuranJson(localURLs[e.target.selectedIndex]);
  lastFetchedLocal = localURLs[e.target.selectedIndex];
  localStorage.setItem(
    "lastFetchedLocal",
    localURLs[e.target.selectedIndex] + "," + e.target.selectedIndex
  );
  saveToLocal();
});

function fetchQuranJson(url) {
  fetch(url)
    .then((res) => res.json())
    .then((data) => revealQuran(url, data))
    .catch((err) => console.log(err));
}

function revealQuran(verifier, book) {
  if (verifier.includes("bn")) {
    revealQuraninBN(book);
  } else if (verifier.includes("en")) {
    revealQuraninEN(book);
  } else {
    revealQuraninAR(book);
  }
}

function revealQuraninAR(book) {
  let chapterCount = 0;
  const quran = Array.from(book)
    .map((ayah) => {
      const ayahContainer = document.createElement("div");
      let verseCount = 0;
      chapterCount++;
      for (const oneVerse of ayah.verses) {
        verseCount++;
        let li = document.createElement("li");
        let span = document.createElement("span");
        li.innerHTML = oneVerse.text;
        li.classList.add("ayah");
        span.classList.add("audioBtn");
        span.innerHTML = `<audio data-source="https://everyayah.com/data/Alafasy_128kbps/${
          chapterCount.toString().length < 2
            ? "00" + chapterCount
            : chapterCount.toString().length < 3
            ? "0" + chapterCount
            : chapterCount
        }${
          verseCount.toString().length < 2
            ? "00" + verseCount
            : verseCount.toString().length < 3
            ? "0" + verseCount
            : verseCount
        }.mp3"></audio>`;
        li.appendChild(span);
        ayahContainer.appendChild(li);
      }
      return `
      <div class="grid">
          <div class="verseInfo d-grid">
            <li>Name : <strong>${ayah.name}</strong></li>
            <li>Type: <strong>${
              ayah.type === "meccan" ? "مكية" : "مدنية"
            }</strong></li>
            <li>Total Verse: ${ayah.total_verses}</li>
          </div>
          <div class="verses">
          ${ayahContainer.innerHTML}
          </div>
      </div>`;
    })
    .join("");
  quranPreview.innerHTML = '<div class="loading"></div>' + quran;
  ayahSearch();
  loadingPage();
  playSingleAudio();
  updateFromLocal();
}

function revealQuraninBN(book) {
  const quran = Array.from(book)
    .map((ayah) => {
      const ayahContainer = document.createElement("div");

      for (const oneVerse of ayah.verses) {
        let li = document.createElement("li");
        li.innerHTML = oneVerse.translation;
        li.classList.add("ayah");
        ayahContainer.appendChild(li);
      }
      return `
      <div class="grid">
          <div class="verseInfo d-grid">
            <li>নাম : <strong>${ayah.translation}</strong></li>
            <li>নূযুল: <strong>${
              ayah.type === "meccan" ? "মাক্কী" : "মাদানী"
            }</strong></li>
            <li>আয়াত সংখ্যা: ${ayah.total_verses}</li>
          </div>
          <div class="verses" style="font-size: 0.9rem">
          ${ayahContainer.innerHTML}
          </div>
      </div>`;
    })
    .join("");
  quranPreview.innerHTML = '<div class="loading"></div>' + quran;
  ayahSearch();
  loadingPage();
  playSingleAudio();
  updateFromLocal();
}

function revealQuraninEN(book) {
  const quran = Array.from(book)
    .map((ayah) => {
      const ayahContainer = document.createElement("div");

      for (const oneVerse of ayah.verses) {
        let li = document.createElement("li");
        li.innerHTML = oneVerse.translation;
        li.classList.add("ayah");
        ayahContainer.appendChild(li);
      }
      return ` 
        <div class="grid">
          <div class="verseInfo d-grid">
            <li>Name : <strong>${ayah.translation}</strong></li>
            <li>Type: <strong>${
              ayah.type === "meccan" ? "Meccan" : "Medinan"
            }</strong></li>
            <li>Total Verse: ${ayah.total_verses}</li>
          </div>
          <div class="verses" style="font-size: 0.9rem">
          ${ayahContainer.innerHTML}
          </div>
      </div>`;
    })
    .join("");
  quranPreview.innerHTML = '<div class="loading"></div>' + quran;
  ayahSearch();
  loadingPage();
  playSingleAudio();
  updateFromLocal();
}

function ayahSearch() {
  const ayahList = document.querySelectorAll(".ayah");
  const verses = document.querySelectorAll(".verses");
  const resultItemsCount = document.querySelector(".resultItemsCount");

  ayahList.forEach((ayah, i) => ayah.setAttribute("ID", `ayah${i}`));
  verses.forEach((verse, i) => verse.setAttribute("ID", `verse${i}`));

  if (!ayahValue.value) {
    return;
  }

  const wrapFiltered = [];
  const searchFiltered = Array.from(ayahList)
    .filter((ayah) => {
      return ayah.textContent.includes(ayahValue.value);
    })
    .forEach((ayah) => {
      const contentSafer = ayah.innerHTML
        .toString()
        .replace(
          ayahValue.value,
          `<span style="color:yellow">${ayahValue.value}</span>`
        );

      wrapFiltered.push(ayah.getAttribute("id"));
      ayah.style.setProperty("background", "rgba(0, 0, 0, .2)");
      ayah.style.setProperty("border", "1px solid rgba(255,255,255,0.3)");
      ayah.innerHTML = contentSafer;
    });

  window.location.replace("#" + wrapFiltered[0]);
  quranPreview.scrollTop = quranPreview.scrollTop - 33.5;
  currentTargetNumber(wrapFiltered[0]);
  lastScrollPositionLocal = quranPreview.scrollTop;
  localStorage.setItem("lastScrollPositionLocal", quranPreview.scrollTop);
  saveToLocal();

  let iDLocationCounter = 0;
  if (wrapFiltered.length > 0) {
    afterSearchIcons.style.setProperty("visibility", "visible");
    afterSearchIcons.addEventListener("click", (e) => {
      e.stopPropagation();
      if (wrapFiltered.length > iDLocationCounter && iDLocationCounter > -1) {
        if (e.target.src.includes("down")) {
          iDLocationCounter++;
          window.location.replace("#" + wrapFiltered[iDLocationCounter]);
          quranPreview.scrollTop = quranPreview.scrollTop - 33.5;
          currentTargetNumber(wrapFiltered[iDLocationCounter]);
          lastScrollPositionLocal = quranPreview.scrollTop;
          localStorage.setItem(
            "lastScrollPositionLocal",
            quranPreview.scrollTop
          );
          saveToLocal();
        } else {
          if (iDLocationCounter > -1) {
            iDLocationCounter--;
            window.location.replace("#" + wrapFiltered[iDLocationCounter]);
            quranPreview.scrollTop = quranPreview.scrollTop - 33.5;
            currentTargetNumber(wrapFiltered[iDLocationCounter]);
            lastScrollPositionLocal = quranPreview.scrollTop;
            localStorage.setItem(
              "lastScrollPositionLocal",
              quranPreview.scrollTop
            );
            saveToLocal();
          }
        }
      } else {
        iDLocationCounter = 0;
        window.location.replace("#" + wrapFiltered[iDLocationCounter]);
        quranPreview.scrollTop = quranPreview.scrollTop - 33.5;
        currentTargetNumber(wrapFiltered[iDLocationCounter]);
        lastScrollPositionLocal = quranPreview.scrollTop;
        localStorage.setItem("lastScrollPositionLocal", quranPreview.scrollTop);
        saveToLocal();
      }
    });
  }

  function currentTargetNumber(id) {
    const extractNum = id.replace("ayah", "");
    afterSearchIcons.setAttribute("data-currentTarget", extractNum);
  }

  resultItemsCount.innerHTML = `Found :<br> ${wrapFiltered.length} verse(s)`;
  ayahValue.value = "";
}

searchSubmit.addEventListener("click", ayahSearch);

// Settings Manipulation

function changeFont(e) {
  const fonts = ["Uthmanic", "QuranicArabic", "jannatLT", "decoType"];
  const verses = document.querySelectorAll(".verses");
  verses.forEach((verse) => {
    verse.style.fontFamily = fonts[e.target.selectedIndex];
    fontFamilyLocal = fonts[e.target.selectedIndex];
    localStorage.setItem("fontFamilyLocal", fonts[e.target.selectedIndex]);
    saveToLocal();
  });
}

fontList.addEventListener("change", changeFont);

function resizeFont(e) {
  quranPreview
    .querySelectorAll(".verses")
    .forEach((verse) => (verse.style.fontSize = `${e.target.value}px`));
  fontSizeLocal = e.target.value;
  localStorage.setItem("fontSizeLocal", e.target.value);
  saveToLocal();
}

fontResizer.addEventListener("input", resizeFont);

theme.addEventListener("click", (e) => {
  e.stopPropagation();
  themeTemplate.innerHTML = `<span data-color="deepskyblue"></span><span data-color="#000"></span><span data-color="#1f62ff"></span><span data-color="#00a120"></span><span data-color="#baba00"></span><span data-color="#b200d1"></span>`;
  themeTemplate.classList.add("themeTemplates");
  theme.parentNode.appendChild(themeTemplate);

  const templates = themeTemplate.querySelectorAll("span");

  templates.forEach((template) => {
    template.addEventListener("click", (e) => {
      container.style.background = e.currentTarget.dataset.color;
      theme.style.background = e.currentTarget.dataset.color;
      document.body.style.background = e.currentTarget.dataset.color;
      themeLocal = e.currentTarget.dataset.color;

      localStorage.setItem("themeLocal", e.currentTarget.dataset.color);
      saveToLocal();
    });
  });
});

settingWindow.addEventListener("click", () => {
  if (theme.parentNode.lastElementChild.classList.contains("themeTemplates")) {
    theme.parentNode.removeChild(theme.parentNode.lastElementChild);
  }
});

playTools.addEventListener("click", (e) => {
  e.stopPropagation();

  let autoScroll = currentScroll;

  if (e.target.src.includes("left")) {
    idVerseLocationCounter++;
    window.location.replace("#verse" + idVerseLocationCounter);
  } else if (e.target.src.includes("right")) {
    if (!idVerseLocationCounter <= 0) {
      idVerseLocationCounter--;
      window.location.replace("#verse" + idVerseLocationCounter);
    }
  } else if (e.target.src.includes("scroll")) {
    if (hibernateIntOnCount === 0) {
      e.target.style.opacity = "0.8";
      quranPreview.scrollTop = currentScroll;
      hibernateIntOnCount++;

      lastScrollPositionLocal = autoScroll;

      localStorage.setItem("lastScrollPositionLocal", autoScroll);
      saveToLocal();
      hibernateInt = setInterval(() => {
        quranPreview.scrollTop = autoScroll;
        autoScroll += 1;
      }, 50);
    } else {
      hibernateIntOnCount = 0;
      e.target.style.opacity = "1";
      clearInterval(hibernateInt);
      currentScroll = quranPreview.scrollTop;
    }
  } else {
    playQuran();
  }
});

quranPreview.addEventListener("scroll", (e) => {
  lastScrollPositionLocal = e.target.scrollTop;

  localStorage.setItem("lastScrollPositionLocal", e.target.scrollTop);
  saveToLocal();
});

function playSingleAudio() {
  const audios = document.querySelectorAll(".audioBtn");
  audios.forEach((audio) => {
    audio.addEventListener("click", (e) => {
      e.stopPropagation();
      audio.children[0].src = audio.children[0].dataset.source;
      audio.children[0].play();
      audio.style.setProperty("background-image", 'url("/img/pauseBtn.svg")');

      let int;
      audio.children[0].addEventListener("loadedmetadata", () => {
        // Extract pixel progress
        const progressBy =
          (audio.parentNode.offsetWidth / (audio.children[0].duration * 1000)) *
          100;
        let countProgress = 0;
        //Extract percent progress
        let percentProgress = (progressBy * 100) / audio.parentNode.offsetWidth;
        int = setInterval(() => {
          audio.parentNode.style.background = `linear-gradient(to left, rgba(0,0,0,0.1) ${countProgress}%, rgba(255,255,255,0.1) 5%)`;
          countProgress += percentProgress;
          if (countProgress > 105) {
            clearInterval(int);
          }
        }, 100);
      });

      audio.children[0].addEventListener("ended", () => {
        audio.style.setProperty("background-image", 'url("/img/playBtn.svg")');
      });
    });
  });
}

function playQuran() {
  const audSource = [];
  const audios = document.querySelectorAll("[data-source]");
  audios[0].pause();
  audios[0].currentTime = 0;
  audios.forEach((aud) => {
    audSource.push(aud.dataset.source);
  });
  let int;

  function playNext() {
    playOneByOne();
    clearInterval(int);
  }

  if (playPause === false) {
    playPause = true;

    function playOneByOne() {
      if (currentAudIdx < audSource.length) {
        audios[0].src = audSource[currentAudIdx];

        audios[0].play().catch((err) => console.log(err));

        playBtn.src = "/img/pauseBtn.svg";

        if (currentAudIdx > 0) {
          quranPreview.scrollTop +=
            audios[currentAudIdx].parentNode.parentNode.offsetHeight;
        }

        audios[0].addEventListener("loadedmetadata", () => {
          // Extract pixel progress
          const progressBy =
            (audios[0].parentNode.offsetWidth /
              (audios[currentAudIdx].duration * 1000)) *
            100;
          let countProgress = 0;
          //Extract percent progress
          let percentProgress =
            (progressBy * 100) / audios[0].parentNode.offsetWidth;
          int = setInterval(() => {
            if (countProgress > 101) {
              return;
            }
            audios[
              currentAudIdx - 1
            ].parentNode.parentNode.style.background = `linear-gradient(to left, rgba(0,0,0,0.1) ${
              countProgress > 101 ? "100" : countProgress
            }%, rgba(255,255,255,0.1) 5%)`;
            countProgress += percentProgress;
          }, 100);
        });
        currentAudIdx++;
      }
    }
  } else {
    audios[0].pause();
    currentAudIdx = 0;
    playPause = false;
    playBtn.src = "/img/playBtn.svg";
    clearInterval(int);
  }
  playOneByOne();
  audios[0].addEventListener("ended", playNext);
}

function saveToLocal() {
  const localSubmitBtn = document.querySelector('[name="settingForm"]');

  localSubmitBtn.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  const settings = {};

  settings.fontFamily =
    localStorage.getItem("fontFamilyLocal") ?? fontFamilyLocal;
  settings.fontSize = localStorage.getItem("fontSizeLocal") ?? fontSizeLocal;
  settings.theme = localStorage.getItem("themeLocal") ?? themeLocal;

  settings.lastScrollPosition =
    localStorage.getItem("lastScrollPositionLocal") ?? lastScrollPositionLocal;
  settings.lastFetched =
    localStorage.getItem("lastFetchedLocal") ?? lastFetchedLocal;

  return settings;
}

clear.addEventListener("click", () => {
  localStorage.clear();
  window.location.reload();
});
