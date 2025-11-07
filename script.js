//GLOBAL VARIABLES
let fontFamilyLocal,
  fontSizeLocal,
  themeLocal,
  lastScrollPositionLocal,
  lastFetchedLocal,
  lastPositionOfFloatingWindow,
  lastReadDetails,
  bookmarks = '';

// Initial Loading
const initialLoadingOverlay = document.querySelector('.initialLoadingOverlay');

// Bookmark Wrapper
const bookmarkWrapper = document.querySelector('.bookmarkWrapper');
const bookmarkWrapperBtn = document.querySelector('.bookmark');


// Navigation Toggling
const nav = document.querySelector('.navBtn');
const settingWindow = document.querySelector('.container .window');
const selectLang = document.querySelector('#langSelect');
const quranPreview = document.querySelector('.quranResult');
const searchSubmit = document.querySelector('.searchSubmit');
const ayahValue = document.querySelector('#ayahSearch');
const afterSearchIcons = document.querySelector('.afterSearchIcons');

// Button to fetch more ayahs
const loadMore = document.querySelector('.loadMore');
const loadedTotal = document.querySelector('.loadedTotal');


// GoTo Button
const goBtn = document.querySelector('.go');
const clearBtn = document.querySelector('.clear');
const ayahName = document.querySelector('.floatingWindow #ayahName');
const ayahNumber = document.querySelector('.floatingWindow #ayahNumber');
let currentVerseIndex = 0;
let currentVerseInfo;



// Changing Theme
const theme = document.querySelector('#theme');
const container = document.querySelector('.container');
const themeTemplate = document.createElement('div');

// Changing Font Family
const fontList = document.querySelector('#font');

// Changing Font Size
const fontResizer = document.querySelector('#fontSize');

// Clear Local Storage
const reset = document.querySelector('.reset');

// Container of Bookmarks
const bookmarkList = document.querySelector('.bookmarkList');




// On DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const loadedSettings = saveToLocal();
  let splitUrlAndIdx = [];
  if (loadedSettings.lastFetched) {
    splitUrlAndIdx = loadedSettings.lastFetched.split(",");
    selectLang[splitUrlAndIdx[1]].selected = true;
  }

  container.style.background = loadedSettings.theme ?? 'deepskyblue';
  theme.style.background = loadedSettings.theme ?? "deepskyblue";
  document.body.style.background = loadedSettings.theme ?? "deepskyblue";


  if (loadedSettings.lastReadDetails) {
    const lastReadDetails = JSON.parse(loadedSettings.lastReadDetails);

    const lastReadEl = document.querySelector('.lastRead');
    const referenceAyah = lastReadEl.querySelector('bdi');
    referenceAyah.textContent = lastReadDetails.lastReadAyahText;
    referenceAyah.nextElementSibling.innerHTML = `<p>${lastReadDetails.lastReadChapterName} :</p><p>${lastReadDetails.lastReadAyahNumber}</p><span onclick="lastReadCloseBtn(this)" class="lastReadCloseBtn">&times;</span>`;

  }

  if (loadedSettings.bookmarks) {
    bookmarkList.innerHTML = JSON.parse(loadedSettings.bookmarks);
    bookmarks = JSON.parse(loadedSettings.bookmarks);
  } else {
    bookmarkList.innerHTML = "You don't have any saved bookmark yet!";
  }


  setTimeout(() => {
    fetchQuranJson(splitUrlAndIdx[0] ?? "QuranData/quran.json");
  }, 1200)

  setTimeout(() => {
    initialLoadingOverlay.style.display = "none";
  }, 2500)


  if (loadedSettings.floatingWindowPosition) {
    const floatingPositionLeftAndTop = loadedSettings.floatingWindowPosition.split(" + ");
    floatingWindow.style.left = floatingPositionLeftAndTop[0] + "px" || "";
    floatingWindow.style.top = floatingPositionLeftAndTop[1] + "px" || "";
  }
});




// Observe all the ayahs
function observeAyahs(elem) {
  const observer = new IntersectionObserver(ayahs => {
    ayahs.forEach(ayah => {
      if (ayah.isIntersecting) {
        ayah.target.classList.add("intersecting");
        detectAyahToTranslate();
        detectCurrentChapterToListen(ayah);
      } else {
        ayah.target.classList.remove("intersecting");
      }
    });
  });
  elem.forEach(el => {
    observer.observe(el);
  });
}




// Fetch Bangla Version

let bnVersion;
(function() {
  fetch('/QuranData/quran_bn.json')
    .then(res => res.json())
    .then(book => {
      bnVersion = translateThisToBN(book);
    });
})();

function translateThisToBN(book) {
  let translation = [];

  book.forEach(obj => {
    obj.verses.forEach(translated => {
      translation.push(translated.translation);
    })
  })
  return function() {
    return translation;
  }
}

// Fetch English Version

let enVersion;
(function() {
  fetch('/QuranData/quran_en.json')
    .then(res => res.json())
    .then(book => {
      enVersion = translateThisToEN(book);
    });
})();

function translateThisToEN(book) {
  let translation = [];
  book.forEach(obj => {
    obj.verses.forEach(translated => {
      translation.push(translated.translation);
    })
  })
  return function() {
    return translation;
  }
}


nav.addEventListener('click', () => {
  settingWindow.style.transform = 'translateX(0)';

  nav.nextElementSibling.querySelector('.closer').addEventListener('click', () => {
    settingWindow.style.transform = 'translateX(150%)';
  })
}, true);




// Floating Window Handling
const floatingWindow = document.querySelector('.floatingWindow');
const translateBNENSeparate = document.querySelector('.translateBNENSeparate');
floatingWindow.addEventListener('touchmove', (e) => {
  let targetElem = e.touches[0].target;
  let leftValue = e.touches[0].clientX;
  let topValue = e.touches[0].clientY;
  targetElem.style.outlineWidth = '3px';
  targetElem.style.background = 'rgba(255,255,255,0.7)';
  targetElem.style.transform = 'scale(.5)';
  targetElem.style.left = leftValue + "px"
  targetElem.style.top = topValue + "px";

  localStorage.setItem('lastPositionOfFloatingWindow', leftValue + " + " + topValue);
  saveToLocal();
});



floatingWindow.addEventListener("touchend", (e) => {
  detectAyahToTranslate();
  let targetElem = e.changedTouches[0].target;
  targetElem.style.outlineWidth = '2px'
  targetElem.style.background = '';
  targetElem.style.transform = 'scale(1)';
});




function floatingWindowOnActive() {
  const verseInfo = document.querySelectorAll('.verseInfo');
  currentVerseInfo = verseInfo;

  let createOptionsFromAyahNames = Array.from(verseInfo).map(el => {
    return `<option>${el.querySelector("li > strong").textContent}</option>`
  }).join("");
  ayahName.innerHTML = createOptionsFromAyahNames;

  // Run only once
  let lengthOfAyah = verseInfo[0].nextElementSibling.querySelectorAll('div .ayah').length;
  ayahNumber.placeholder = lengthOfAyah;

  // Run on each selection
  ayahName.addEventListener("change", (e) => {
    if (verseInfo[ayahName.selectedIndex] !== undefined) {
      let lengthOfAyah = verseInfo[ayahName.selectedIndex].nextElementSibling.querySelectorAll('div .ayah').length;
      ayahNumber.placeholder = lengthOfAyah;
      currentVerseIndex = ayahName.selectedIndex;
    }
  });

  floatingWindow.addEventListener('click', (e) => {
    e.stopPropagation();
    e.target.querySelectorAll('*').forEach(el => el.style.display = "block");
    e.target.classList.add("active");

    translateBNENSeparate.style.opacity = 1;

  });
}



goBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  currentVerseInfo[currentVerseIndex].nextElementSibling.querySelectorAll("div .ayah").forEach((ayah, i) => {
    if (i === (ayahNumber.valueAsNumber - 1)) {
      window.location.replace(`#${ayah.id}`);
      quranPreviewScrollFix();
    }
  });
});





clearBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  ayahNumber.value = "";
});






// bnQuran / enQuran Selection for any ayah
const bnQuran = document.querySelector('.bnQuran');
const enQuran = document.querySelector('.enQuran');

function detectAyahToTranslate() {
  const intersecting = document.querySelectorAll('.intersecting');

  intersecting.forEach(ayah => {
    const floatRect = floatingWindow.getBoundingClientRect();
    const ayahRect = ayah.getBoundingClientRect();
    if (ayahRect.bottom > floatRect.y && ayahRect.top < floatRect.y) {
      const ayahID = ayah.id.split("ayah");
      ayah.style.background = "rgba(255,255,255,0.01)";
      ayah.classList.add('intersectable');
      ayahTranslator(ayahID);
      detectAyahToSaveInLastRead(ayah);
    } else {
      ayah.style.background = "";
      ayah.classList.remove('intersectable');
    }
  });
}





let currentAyah;
let currentAyahID;
let previousTranslatedAyah;
let onceTranslatedAyahs = [];

function ayahTranslator(ayahID) {
  const intersectable = document.querySelectorAll(".intersectable");
  currentAyah = intersectable[intersectable.length - 1];
  previousTranslatedAyah = document.querySelector('#ayah' + ayahID[1]);
  currentAyahID = ayahID[1];
}



function reloadThisAyahBackToAR(elem) {

  onceTranslatedAyahs.forEach(onceTranslate => {
    if (elem.parentNode.id === ("ayah" + onceTranslate.currentAyahID) && onceTranslate.previousTranslatedAyahContent.includes("audio")) {
      elem.parentNode.style.fontSize = '1.5rem';
      elem.parentNode.innerHTML = onceTranslate.previousTranslatedAyahContent;
    }
  });
}





function createAyahReloadSpanEl(currentAyahEl) {
  let reloadPreviousAyahBtn = document.createElement('span');
  reloadPreviousAyahBtn.classList.add("reloadPreviousAyahBtn");
  reloadPreviousAyahBtn.textContent = '↺';
  reloadPreviousAyahBtn.setAttribute('onclick', 'reloadThisAyahBackToAR(this)');
  currentAyahEl.appendChild(reloadPreviousAyahBtn);
}



bnQuran.addEventListener("click", (e) => {
  e.stopPropagation();
  const previousTranslatedAyahContent = previousTranslatedAyah.innerHTML;
  onceTranslatedAyahs.push({ previousTranslatedAyahContent, currentAyahID });
  currentAyah.textContent = bnVersion()[parseInt(currentAyahID)];
  currentAyah.style.fontSize = '.95rem';

  createAyahReloadSpanEl(currentAyah);
});



enQuran.addEventListener("click", (e) => {
  e.stopPropagation();
  const previousTranslatedAyahContent = previousTranslatedAyah.innerHTML;
  onceTranslatedAyahs.push({ previousTranslatedAyahContent, currentAyahID });

  currentAyah.textContent = enVersion()[parseInt(currentAyahID)];
  currentAyah.style.fontSize = '1rem';

  createAyahReloadSpanEl(currentAyah);
});





let lastReadAyahSaver;

function detectAyahToSaveInLastRead(ayah) {
  lastReadAyahSaver = ayah;
  const lastReadAyahNumber = lastReadAyahSaver.dataset.ayah;
  const lastReadChapterName = lastReadAyahSaver.parentNode.parentNode.parentNode.querySelector('li strong').textContent;
  const lastReadAyahText = lastReadAyahSaver.textContent;

  localStorage.setItem('lastReadDetails', JSON.stringify({ lastReadAyahText, lastReadChapterName, lastReadAyahNumber }));
  saveToLocal();
}




function lastReadCloseBtn(elem) {
  elem.parentNode.parentNode.innerHTML = '';
}


// Scroll Fixing
function quranPreviewScrollFix() {
  return quranPreview.scrollTop = (quranPreview.scrollTop - 33.5);
}


// Copy Ayah / Bookmark Ayah
const copyThisAyah = document.querySelector('.copyThisAyah');
const bookmarkThisAyah = document.querySelector('.bookmarkThisAyah');

copyThisAyah.addEventListener('click', (e) => {
  e.stopPropagation();
  // lastReadAyahSaver - variable is extracted here
  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  textarea.value = lastReadAyahSaver.textContent;
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(document.body.lastChild);
});


// 3 Functions from Bookmark page

function goToThis(el) {
  const chapterName = document.querySelectorAll('.verseInfo li strong');
  const nameFromElToMatch = el.parentNode.parentNode.querySelector('bdi + div').textContent.split(':')[1].trim();
  const numberFromElToMatch = el.parentNode.parentNode.querySelector('bdi + div').textContent.split(':')[0];
  chapterName.forEach(chapter => {
    if (chapter.textContent === nameFromElToMatch) {
      chapter.closest('.grid').querySelectorAll('.verses li').forEach(verse => {
        if (Number(verse.dataset.ayah) === parseInt(numberFromElToMatch)) {
          window.location.replace("#" + verse.id);
          quranPreviewScrollFix();
        }
      });
    }
  });

  setTimeout(() => {
    bookmarkWrapper.style.display = "none";
  }, 50);
}





function addTextareaValue(selectedAyahFromLocal, el, arrOfLocal) {
  const ayahText = selectedAyahFromLocal;

  const textIdxStartFrom = ayahText.indexOf('Add Note here...">') + 18;
  const textIdxEndFrom = ayahText.indexOf('</textarea>');

  let textareaValueToMatch = "";
  for (let i = textIdxStartFrom; i < textIdxEndFrom; i++) {
    textareaValueToMatch += ayahText[i];
  }

  el.addEventListener("blur", (e) => {
    const localValueChanged = arrOfLocal.map((bookmark) => {
      if (ayahText === bookmark) {
        return ayahText.replace(textareaValueToMatch, `${e.target.value}`);
      }
      return bookmark;
    }).join("<hr>");


    localStorage.setItem('bookmarks', JSON.stringify(localValueChanged));
    saveToLocal();
  });
}





function addNote(el) {
  const local = saveToLocal();
  el.parentNode.nextElementSibling.removeAttribute("readonly");
  el.parentNode.nextElementSibling.style.outline = "3px solid rgba(255,255,255,0.4)";
  el.parentNode.nextElementSibling.select();

  const ayahToMatchWithLocal = el.parentNode.parentNode.querySelector("bdi").textContent;
  const arrOfLocal = JSON.parse(local.bookmarks).split(`<hr>`);

  arrOfLocal.forEach(bookmark => {
    const toMatch = new RegExp(ayahToMatchWithLocal);
    if (toMatch.test(bookmark)) {
      addTextareaValue(bookmark, el.parentNode.nextElementSibling, arrOfLocal);
    }
  });

  el.parentNode.nextElementSibling.addEventListener('blur', (e) => {
    e.target.setAttribute('readonly', 'true');
    e.target.style.outline = "";
  });
}





const checkingEl = document.createElement('div');

function removeThisBookmark(el) {
  const local = saveToLocal();
  const arrOfLocal = JSON.parse(local.bookmarks).split(`<hr>`).filter(Boolean);
  const ayahToMatchWithLocal = el.parentNode.parentNode.querySelector("bdi").textContent;
  const ayahNameToMatchWith = el.parentNode.parentNode.querySelector('bdi + div').textContent.split(":")[1].trim();
  const ayahNumberToMatchWith = Number(el.parentNode.parentNode.querySelector('bdi + div').textContent.split(":")[0]);

  checkingEl.classList.add('checkingEl');
  checkingEl.innerHTML = `<h3>Are you sure?<h3><div class="d-flex justify-content-evenly"><span>Yes</span><span>No</span></div>`;
  el.parentNode.parentNode.appendChild(checkingEl);

  checkingEl.querySelector('div').addEventListener("click", (e) => {
    if (e.target.tagName === "SPAN" && e.target.textContent === 'Yes') {
      arrOfLocal.forEach((bookmark, i, thisArr) => {

        const toMatchAyah = new RegExp(ayahToMatchWithLocal);
        const toMatchAyahName = new RegExp(ayahNameToMatchWith);
        const toMatchAyahNumber = new RegExp(ayahNumberToMatchWith);

        if (toMatchAyah.test(bookmark) && toMatchAyahName.test(bookmark) && toMatchAyahNumber.test(bookmark)) {
          arrOfLocal.splice(i, 1);
          bookmarkList.querySelectorAll('li')[i].remove();
        }
      });

      const arrOfLocalJoining = arrOfLocal.join("<hr>");
      localStorage.setItem('bookmarks', JSON.stringify(arrOfLocalJoining));
      saveToLocal();
      el.parentNode.parentNode.removeChild(el.parentNode.parentNode.lastChild);
    } else {
      el.parentNode.parentNode.removeChild(el.parentNode.parentNode.lastChild);
    }
  });
}






bookmarkThisAyah.addEventListener('click', (e) => {
  e.stopPropagation();

  // lastReadAyahSaver - variable is extracted here
  const lastReadAyahNumber = lastReadAyahSaver.dataset.ayah;
  const lastReadChapterName = lastReadAyahSaver.parentNode.parentNode.parentNode.querySelector('li strong').textContent;
  const lastReadAyahText = lastReadAyahSaver.textContent;

  const newBookmarkEl = document.createElement('li');
  newBookmarkEl.innerHTML = `<div class="pos-rel">
                <bdi>${lastReadAyahText}</bdi>
                <div>${lastReadAyahNumber} : ${lastReadChapterName}</div>
                <div class="bookmarkTools d-flex">
                  <img onclick="goToThis(this)" src="/img/edit.svg" alt=""><img onclick="addNote(this)" src="/img/note.svg" alt=""><img onclick="removeThisBookmark(this)" src="/img/xMark.svg" alt="">
                </div>
                <textarea readonly placeholder="Add Note here...">Add Notes...</textarea>
              </div>`;


  bookmarks += "<hr>" + newBookmarkEl.outerHTML;
  bookmarkList.appendChild(newBookmarkEl);
  globalNotice('Bookmark saved!');
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  saveToLocal();
});




bookmarkWrapperBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  bookmarkWrapper.style.display = 'block';
});



const closeBtnForBookmark = document.querySelector('.closeBtnForBookmark');
closeBtnForBookmark.addEventListener('click', (e) => {
  e.stopPropagation();
  bookmarkWrapper.style.display = 'none';
});





document.body.addEventListener('click', (e) => {
  if (floatingWindow.classList.contains("active")) {
    floatingWindow.classList.remove("active");
    floatingWindow.querySelectorAll('*').forEach(el => {
      el.style.display = 'none';
    });
  }
});



// Loading Page Show/Hide
function loadingPage() {
  const elem = document.querySelector('.loading');
  elem.style.display = 'grid';

  setTimeout(() => {
    elem.style.display = 'none';
  }, 3000);
}





function setCommonColor(el, colorFor) {
  const loadedSettings = saveToLocal();

  const elem = el;
  elem.style[colorFor] = loadedSettings.theme ?? "deepskyblue";
}


function globalNotice(text) {
  const elem = document.createElement('div');
  const loadedSettings = saveToLocal();

  elem.textContent = text;
  elem.style.color = loadedSettings.theme ?? "deepskyblue";
  elem.classList.add('globalNotice');
  document.body.prepend(elem);

  setTimeout(() => {
    document.body.removeChild(document.body.firstChild);
  }, 2500)
}



function updateFromLocal() {
  const loadedSettings = saveToLocal();
  const verses = document.querySelectorAll('.verses');

  verses.forEach(verse => {
    verse.style.fontFamily = loadedSettings.fontFamily ?? 'Uthmanic';
    verse.style.fontSize = loadedSettings.fontSize + "px" ?? "1rem";
  });

  setTimeout(() => {
    quranPreview.scrollTop = loadedSettings.lastScrollPosition ?? 0;
  }, 500)
}




selectLang.addEventListener('change', (e) => {
  const localURLs = ["QuranData/quran.json", "QuranData/quran_bn.json", "QuranData/quran_en.json"];
  fetchQuranJson(localURLs[e.target.selectedIndex]);
  lastFetchedLocal = localURLs[e.target.selectedIndex];
  localStorage.setItem('lastFetchedLocal', localURLs[e.target.selectedIndex] + "," + e.target.selectedIndex);
  saveToLocal();
});




function fetchQuranJson(url) {
  fetch(url)
    .then(res => res.json())
    .then(data => revealQuran(url, data))
    .catch(err => console.log(err));
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


let lengthIncreaser = 0;

function revealQuraninAR(book) {
  const Quran = [...book];
  lengthIncreaser = 38;

  function fetchQuran() {
    let ayahArray = [];
    let chapterCount = 0;
    for (let ayah = 0; ayah < lengthIncreaser; ayah++) {
      let verseCount = 0;
      chapterCount++;
      let verse = "";
      for (const oneVerse of book[ayah].verses) {
        verseCount++;
        verse += `<li data-ayah="${verseCount}" class="ayah pos-rel">${oneVerse.text}<span class="audioBtn"><audio data-source="https://everyayah.com/data/Alafasy_128kbps/${chapterCount.toString().length  < 2 ? "00"+chapterCount : chapterCount.toString().length  < 3 ? "0"+chapterCount: chapterCount}${verseCount.toString().length  < 2 ? "00"+verseCount : verseCount.toString().length  < 3 ? "0"+verseCount: verseCount}.mp3"></audio></span></li>`;
      }

      ayahArray.push(`
      <div class="grid">
          <div class="verseInfo d-grid">
            <li>Name : <strong>${book[ayah].name}</strong></li>
            <li>Type: <strong>${book[ayah].type === 'meccan'? 'مكية' : 'مدنية'}</strong></li>
            <li>Total Verse: ${book[ayah].total_verses}</li>
          </div>
          <div class="verses">
          <div>${verse}</div>
          </div>
      </div>`)
    }
    quranPreview.innerHTML = '<div class="loading"></div>' + ayahArray.join("");
    const listOfAyahLoaded = document.querySelectorAll('.audioBtn');
    loadedTotal.textContent = listOfAyahLoaded.length;
    const listOfAyahsForObserve = document.querySelectorAll('.ayah');


    floatingWindowOnActive();
    observeAyahs(listOfAyahsForObserve);
    ayahSearch();
    playSingleAudio();
  }

  fetchQuran();


  const loadedSettings = saveToLocal();
  const toLoadWholeQuran = document.createElement('div');
  toLoadWholeQuran.textContent = "Load Entirely";
  toLoadWholeQuran.style.color = loadedSettings.theme ?? "deepskyblue";
  toLoadWholeQuran.classList.add('toLoadWholeQuran');
  loadMore.appendChild(toLoadWholeQuran);

  let dropDownToggler = false;

  loadMore.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!dropDownToggler && lengthIncreaser < 114) {
      toLoadWholeQuran.classList.add('visible');
      dropDownToggler = true;
    } else {
      dropDownToggler = false;
      toLoadWholeQuran.classList.remove('visible');
      if (e.target.textContent.includes("More")) {
        if (lengthIncreaser < 113) {
          lengthIncreaser += 38;
          fetchQuran();
        } else {
          globalNotice('The Whole Quran has loaded successfully!');
          loadMore.remove(toLoadWholeQuran);
        }

      } else {
        globalNotice('It may take upto 3 seconds or more...');

        setTimeout(() => {
          lengthIncreaser = 114;
          fetchQuran();
          loadMore.remove(toLoadWholeQuran);
        }, 800)
      }
    }

    document.body.onclick = () => {
      toLoadWholeQuran.classList.remove('visible');
      dropDownToggler = false;
    }
  });

  loadingPage();
  updateFromLocal();
}



function revealQuraninBN(book) {
  const quran = Array.from(book).map(ayah => {
    const ayahContainer = document.createElement('div');

    for (const oneVerse of ayah.verses) {
      let li = document.createElement('li');
      li.innerHTML = oneVerse.translation;
      li.classList.add('ayah')
      ayahContainer.appendChild(li);
    }
    return `
      <div class="grid">
          <div class="verseInfo d-grid">
            <li>নাম : <strong>${ayah.translation}</strong></li>
            <li>নূযুল: <strong>${ayah.type === 'meccan'? "মাক্কী" : "মাদানী"}</strong></li>
            <li>আয়াত সংখ্যা: ${ayah.total_verses}</li>
          </div>
          <div class="verses" style="font-size: 0.9rem">
          ${ayahContainer.innerHTML}
          </div>
      </div>`
  }).join("");
  quranPreview.innerHTML = '<div class="loading"></div>' + quran;
  ayahSearch();
  loadingPage();
  playSingleAudio();
  updateFromLocal();
}





function revealQuraninEN(book) {
  const quran = Array.from(book).map(ayah => {
    const ayahContainer = document.createElement('div');

    for (const oneVerse of ayah.verses) {
      let li = document.createElement('li');
      li.innerHTML = oneVerse.translation;
      li.classList.add('ayah');
      ayahContainer.appendChild(li);
    }
    return ` 
        <div class="grid">
          <div class="verseInfo d-grid">
            <li>Name : <strong>${ayah.translation}</strong></li>
            <li>Type: <strong>${ayah.type === "meccan"? "Meccan" : "Medinan"}</strong></li>
            <li>Total Verse: ${ayah.total_verses}</li>
          </div>
          <div class="verses" style="font-size: 0.9rem">
          ${ayahContainer.innerHTML}
          </div>
      </div>`
  }).join("");
  quranPreview.innerHTML = '<div class="loading"></div>' + quran;
  ayahSearch();
  loadingPage();
  playSingleAudio();
  updateFromLocal();
}





function ayahSearch() {
  const ayahList = document.querySelectorAll('.ayah');
  const verses = document.querySelectorAll('.verses');
  const resultItemsCount = document.querySelector('.resultItemsCount');

  ayahList.forEach((ayah, i) => ayah.setAttribute('ID', `ayah${i}`));
  verses.forEach((verse, i) => verse.setAttribute('ID', `verse${i}`));

  if (!ayahValue.value) {
    return;
  }

  const wrapFiltered = [];
  const searchFiltered = Array.from(ayahList)
    .filter(ayah => {
      return ayah.textContent.includes(ayahValue.value);
    }).forEach(ayah => {
      const contentSafer = ayah.innerHTML.toString().replace(ayahValue.value, `<span style="color:yellow">${ayahValue.value}</span>`);

      wrapFiltered.push(ayah.getAttribute('id'));
      ayah.style.setProperty('background', 'rgba(0, 0, 0, .2)');
      ayah.style.setProperty('border', '1px solid rgba(255,255,255,0.3)');
      ayah.innerHTML = contentSafer;
    });

  window.location.replace("#" + wrapFiltered[0]);
  quranPreviewScrollFix();
  currentTargetNumber(wrapFiltered[0]);
  lastScrollPositionLocal = quranPreview.scrollTop;
  localStorage.setItem('lastScrollPositionLocal', quranPreview.scrollTop);
  saveToLocal();

  let iDLocationCounter = 0;
  if (wrapFiltered.length > 0) {
    afterSearchIcons.style.setProperty('visibility', 'visible');
    afterSearchIcons.addEventListener("click", (e) => {
      e.stopPropagation();
      if (wrapFiltered.length > iDLocationCounter && iDLocationCounter > -1) {
        if (e.target.src.includes("down")) {
          iDLocationCounter++;
          window.location.replace("#" + wrapFiltered[iDLocationCounter]);
          quranPreviewScrollFix();
          currentTargetNumber(wrapFiltered[iDLocationCounter]);
          lastScrollPositionLocal = quranPreview.scrollTop;
          localStorage.setItem('lastScrollPositionLocal', quranPreview.scrollTop);
          saveToLocal();
        } else {
          if (iDLocationCounter > -1) {
            iDLocationCounter--;
            window.location.replace("#" + wrapFiltered[iDLocationCounter]);
            quranPreviewScrollFix();
            currentTargetNumber(wrapFiltered[iDLocationCounter]);
            lastScrollPositionLocal = quranPreview.scrollTop;
            localStorage.setItem('lastScrollPositionLocal', quranPreview.scrollTop);
            saveToLocal();
          }
        }
      } else {
        iDLocationCounter = 0;
        window.location.replace("#" + wrapFiltered[iDLocationCounter]);
        quranPreviewScrollFix();
        currentTargetNumber(wrapFiltered[iDLocationCounter]);
        lastScrollPositionLocal = quranPreview.scrollTop;
        localStorage.setItem('lastScrollPositionLocal', quranPreview.scrollTop);
        saveToLocal();
      }
    });
  }




  function currentTargetNumber(id) {
    const extractNum = id.replace("ayah", "");
    afterSearchIcons.setAttribute('data-currentTarget', extractNum);
  }

  resultItemsCount.innerHTML = `Found :<br> ${wrapFiltered.length} verse(s)`;
  ayahValue.value = "";
}

searchSubmit.addEventListener('click', ayahSearch);




// Settings Manipulation

function changeFont(e) {
  const fonts = ['Uthmanic', 'QuranicArabic', 'jannatLT', 'decoType'];
  const verses = document.querySelectorAll('.verses');
  verses.forEach(verse => {
    verse.style.fontFamily = fonts[e.target.selectedIndex];
    fontFamilyLocal = fonts[e.target.selectedIndex];
    localStorage.setItem('fontFamilyLocal', fonts[e.target.selectedIndex]);
    saveToLocal();
  });
}

fontList.addEventListener('change', changeFont);




function resizeFont(e) {
  quranPreview.querySelectorAll('.verses').forEach(verse => verse.style.fontSize = `${e.target.value}px`);
  fontSizeLocal = e.target.value;
  localStorage.setItem('fontSizeLocal', e.target.value);
  saveToLocal();
}

fontResizer.addEventListener('input', resizeFont);




theme.addEventListener('click', (e) => {
  e.stopPropagation()
  themeTemplate.innerHTML = `<span data-color="deepskyblue"></span><span data-color="#000"></span><span data-color="#1f62ff"></span><span data-color="#00a120"></span><span data-color="#baba00"></span><span data-color="#b200d1"></span>`;
  themeTemplate.classList.add("themeTemplates");
  theme.parentNode.appendChild(themeTemplate);

  const templates = themeTemplate.querySelectorAll('span');

  templates.forEach(template => {
    template.addEventListener("click", (e) => {
      document.body.style.background = e.currentTarget.dataset.color;
      container.style.background = e.currentTarget.dataset.color;
      theme.style.background = e.currentTarget.dataset.color;
      themeLocal = e.currentTarget.dataset.color;

      localStorage.setItem('themeLocal', e.currentTarget.dataset.color);
      saveToLocal();
    });
  });
});




settingWindow.addEventListener('click', () => {
  if (theme.parentNode.lastElementChild.classList.contains('themeTemplates')) {
    theme.parentNode.removeChild(theme.parentNode.lastElementChild);
  }
});




function goToNextChapter() {
  idVerseLocationCounter++;
  window.location.replace("#verse" + idVerseLocationCounter);
  quranPreviewScrollFix();
}




function goToPreviousChapter() {
  if (!idVerseLocationCounter <= 0) {
    idVerseLocationCounter--;
    window.location.replace("#verse" + idVerseLocationCounter);
    quranPreviewScrollFix();
  }
}



let speed = 1;
const plus = document.querySelector('.plusAutoScroll');
const minus = document.querySelector('.minusAutoScroll');

plus.addEventListener('click', (e) => {
  e.stopPropagation();
  if (speed < 6) {
    speed++;
  }
});

minus.addEventListener('click', (e) => {
  e.stopPropagation();
  if (speed > 1) {
    speed--;
  }
});




function startAutoScroll() {
  const elToShowSpeed = document.querySelector('.minusAutoScroll');

  const colorToDefine = document.body.style.background;
  const colorNames = ['deepskyblue', 'black', 'deepBlue', 'green', 'yellow', 'pink'];

  colorNames.forEach(color => {
    if (elToShowSpeed.classList.contains(color)) {
      elToShowSpeed.classList.remove(color);
    }
  });

  elToShowSpeed.parentNode.querySelectorAll('span')
    .forEach(span => span.style.display = 'grid');

  switch (colorToDefine) {
    case 'deepskyblue':
      elToShowSpeed.classList.add("deepskyblue");
      break;
    case 'rgb(0,0,0)':
      elToShowSpeed.classList.add("black");
      break;
    case 'rgb(31, 98, 255)':
      elToShowSpeed.classList.add("deepBlue");
      break;
    case 'rgb(0, 161, 32)':
      elToShowSpeed.classList.add("green");
      break;
    case 'rgb(186, 186, 0)':
      elToShowSpeed.classList.add("yellow");
      break;
    case 'rgb(178, 0, 209)':
      elToShowSpeed.classList.add("pink");
      break;
  }


  currentScroll = quranPreview.scrollTop;
  let autoScroll = currentScroll || 0;

  if (hibernateIntOnCount === 0) {
    quranPreview.scrollTop = currentScroll;
    hibernateIntOnCount++;

    lastScrollPositionLocal = autoScroll;

    localStorage.setItem('lastScrollPositionLocal', autoScroll);
    saveToLocal();
    hibernateInt = setInterval(() => {
      quranPreview.scrollTop = autoScroll;
      autoScroll += speed;
      elToShowSpeed.setAttribute('data-speed', speed + "x");
    }, 50);
  } else {

    elToShowSpeed.parentNode.querySelectorAll('span')
      .forEach(span => span.style.display = 'none');

    hibernateIntOnCount = 0;
    clearInterval(hibernateInt);
    currentScroll = quranPreview.scrollTop;
  }
}


const playTools = document.querySelector('.tools .icons');

playTools.addEventListener("click", (e) => {
  e.stopPropagation();

  if (e.target.dataset.tool === 'left') {
    goToNextChapter();
  } else if (e.target.dataset.tool === 'right') {
    goToPreviousChapter();
  } else if (e.target.dataset.tool === "playPause") {
    playQuran();
  }
});



const autoScrollEl = document.querySelector('.autoScroll');
autoScrollEl.querySelector('[data-tool="scroll"]').addEventListener('click', startAutoScroll);



quranPreview.addEventListener('scroll', (e) => {
  lastScrollPositionLocal = e.target.scrollTop;

  localStorage.setItem('lastScrollPositionLocal', e.target.scrollTop);
  saveToLocal();
});



function playSingleAudio() {
  const audios = document.querySelectorAll('.audioBtn');
  audios.forEach(audio => {

    audio.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.navigator.onLine) {
        audio.children[0].src = audio.children[0].dataset.source;
        audio.children[0].play();
        audio.style.setProperty('background-image', 'url("img/pauseBtn.svg")');

        let int;
        audio.children[0].addEventListener('loadedmetadata', () => {
          // Extract pixel progress
          const progressBy = (audio.parentNode.offsetWidth / (audio.children[0].duration * 1000)) * 100;
          let countProgress = 0;
          //Extract percent progress
          let percentProgress = progressBy * 100 / audio.parentNode.offsetWidth;
          int = setInterval(() => {
            audio.parentNode.style.background = `linear-gradient(to left, rgba(0,0,0,0.1) ${countProgress}%, rgba(255,255,255,0.1) 5%)`;
            countProgress += percentProgress;
            if (countProgress > 105) {
              clearInterval(int);
            }
          }, 100);
        });
        audio.children[0].addEventListener('ended', () => {
          audio.style.setProperty('background-image', 'url("img/playBtn.svg")');
        });

      } else {
        globalNotice('You are offline!')
      }
    });
  });
}



// autoPlay manipulation
const playBtn = document.querySelector('.playPause');
let idVerseLocationCounter = 0;
let hibernateIntOnCount = 0;
let hibernateInt;
let currentScroll;
let playPause = false;
let currentAudIdx = 0;
let audSource;
let audiosArray;
let audio;
let immediatePause = false;
let restartToUpdateIdx = true;


function playQuran() {
  if (window.navigator.onLine) {
    if (playPause === false) {
      playPause = true;
      immediatePause = false;
      restartToUpdateIdx = false;
      audSource = [];
      const audios = document.querySelectorAll('[data-source]');
      audiosArray = audios;
      audio = audios[0];
      playBtn.src = "img/pauseBtn.svg";
      audios.forEach(aud => {
        audSource.push(aud.dataset.source);
      });

      playOneByOne();
    } else {
      playBtn.src = "img/playBtn.svg";
      playPause = false;
      audio.pause();
      currentAudIdx--
      immediatePause = true;
      restartToUpdateIdx = true;
    }
  } else {
    globalNotice("You are offline!");
  }
}




function highlightCurrentPlaying(idxOfThisAudio, thisAudio) {
  const audio = audiosArray[idxOfThisAudio - 1].parentNode;
  let int;
  const progressBy = (audio.parentNode.offsetWidth / (thisAudio.duration * 1000)) * 100;
  let countProgress = 0;
  let percentProgress = progressBy * 100 / audio.parentNode.offsetWidth;
  int = setInterval(() => {
    audio.parentNode.style.background = `linear-gradient(to left, rgba(0,0,0,0.1) ${countProgress}%, rgba(255,255,255,0.1) 5%)`;
    countProgress += percentProgress;
    if (countProgress > 105 || immediatePause === true) {
      clearInterval(int);
    }
  }, 100);
}



function resizeWindowToCurrentPlaying(idx) {
  const ID = audiosArray[idx - 1].parentNode.parentNode.id;
  window.location.replace("#" + ID);
  quranPreviewScrollFix();
}




function playOneByOne() {
  if (currentAudIdx < audSource.length) {
    audio.src = audSource[currentAudIdx];
    audio.play().catch(err => console.log(err));

    audio.addEventListener('canplay', () => {
      highlightCurrentPlaying(currentAudIdx, audio);
      resizeWindowToCurrentPlaying(currentAudIdx);
    })
    currentAudIdx++;
    audio.addEventListener("ended", playOneByOne);
  }
}




function detectCurrentChapterToListen(ayah) {
  const elem = document.querySelector('.currentChapter > span');
  elem.textContent = ayah.target.parentNode.parentNode.previousElementSibling.querySelector('li > strong').textContent;
  if (restartToUpdateIdx) {
    currentAudIdx = parseInt(ayah.target.parentNode.children[0].id.split('ayah')[1]);
  }
}




function saveToLocal() {
  const localSubmitBtn = document.querySelector('[name="settingForm"]');

  localSubmitBtn.addEventListener("submit", (e) => {
    e.preventDefault();
  })

  const settings = {};

  settings.fontFamily = localStorage.getItem('fontFamilyLocal') ?? fontFamilyLocal;
  settings.fontSize = localStorage.getItem('fontSizeLocal') ?? fontSizeLocal;
  settings.theme = localStorage.getItem('themeLocal') ?? themeLocal;

  settings.lastScrollPosition = localStorage.getItem('lastScrollPositionLocal') ?? lastScrollPositionLocal;
  settings.lastFetched = localStorage.getItem('lastFetchedLocal') ?? lastFetchedLocal;

  settings.floatingWindowPosition = localStorage.getItem('lastPositionOfFloatingWindow') ?? lastPositionOfFloatingWindow;

  settings.lastReadDetails = localStorage.getItem('lastReadDetails') ?? lastReadDetails;

  settings.bookmarks = localStorage.getItem('bookmarks') ?? bookmarks;

  return settings;
}




reset.addEventListener('click', () => {
  localStorage.clear();
});





const versionWrapper = document.querySelector('.version');
const versionInfoBtn = document.querySelector('.versionInfoBtn');
const detailsWrapperEl = document.createElement('div');

versionInfoBtn.addEventListener('click', () => {

  fetch('/QuranData/versions.txt')
    .then(res => res.text())
    .then(versions => {
      detailsWrapperEl.innerHTML = `${versions}`;
      versionWrapper.appendChild(detailsWrapperEl);
    })
    .catch(err => console.log(err));
});




function closeVersionWrapper(el) {
  el.parentNode.parentNode.innerHTML = "";
}