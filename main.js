import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlkQbekO4OcFR8pyOBVRg0Vrimc4eliUI",
  authDomain: "shibaurasai2026.firebaseapp.com",
  projectId: "shibaurasai2026",
  storageBucket: "shibaurasai2026.firebasestorage.app",
  messagingSenderId: "114412669622",
  appId: "1:114412669622:web:255a3ab1374b33b8ff7417",
  measurementId: "G-24DV15W8KD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// IDs are retained so existing collection URLs and saved progress still work.
const itemList = [
  {
    "id": "wallet",
    "name": "すいかのポーチ",
    "unknown": "？？？",
    "image": "images/すいかのポーチ.png",
    "shadowImage": "images/すいかのポーチsd.png",
    "message": "すいかのポーチを発見！"
  },
  {
    "id": "key",
    "name": "ちいさな花束",
    "unknown": "？？？",
    "image": "images/ちいさな花束.png",
    "shadowImage": "images/ちいさな花束sd.png",
    "message": "ちいさな花束を発見！"
  },
  {
    "id": "bear",
    "name": "真珠のストラップ",
    "unknown": "？？？",
    "image": "images/真珠のストラップ.png",
    "shadowImage": "images/真珠のストラップsd.png",
    "message": "真珠のストラップを発見！"
  },
  {
    "id": "item4",
    "name": "雪だるまのスノードーム",
    "unknown": "？？？",
    "image": "images/雪だるまのスノードーム.png",
    "shadowImage": "images/雪だるまのスノードームsd.png",
    "message": "雪だるまのスノードームを発見！",
    "rotateLeft": true
  },
  {
    "id": "item5",
    "name": "お星さまのヘアピン",
    "unknown": "？？？",
    "image": "images/お星さまのヘアピン.png",
    "shadowImage": "images/お星さまのヘアピンsd.png",
    "message": "お星さまのヘアピンを発見！"
  },
  {
    "id": "item6",
    "name": "パンダのお弁当",
    "unknown": "？？？",
    "image": "images/パンダのお弁当.png",
    "shadowImage": "images/パンダのお弁当sd.png",
    "message": "パンダのお弁当を発見！"
  }
];

const items = Object.fromEntries(itemList.map((item) => [item.id, item]));

const catalogItems = itemList;

let currentCatalogDetailIndex = 0;

window.addEventListener("load", async () => {
  renderItems();
  renderCatalogIndex();
  bindCatalogDetailSwipe();
  bindLegacyButtons();
  bindPopup();
  bindNavigation();

  try {
    await signInAnonymously(auth);
    console.log("匿名ログイン成功");
  } catch (error) {
    console.log(error);
  }

  loadFoundItems();
  updateScore();
  collectItemFromUrl();
});

function renderItems() {
  const itemGrid = document.getElementById("items");

  itemGrid.innerHTML = itemList.map((item) => {
    return `
      <button class="item-card" type="button" data-item-id="${item.id}" ${item.locked ? "disabled" : ""}>
        <span class="item-image-frame">
          ${renderItemImage(item)}
        </span>
        <span id="${item.id}" class="item-name">${item.unknown}</span>
      </button>
    `;
  }).join("");

}

function renderCatalogIndex() {
  const catalogCards = document.getElementById("catalogCards");

  if (!catalogCards) {
    return;
  }

  catalogCards.innerHTML = catalogItems.map((item) => {
    const found = localStorage.getItem(item.id) === "true";
    const image = `<img class="catalog-card-image${item.rotateLeft ? " rotate-left" : ""}" src="${found ? item.image : item.shadowImage}" alt="">`;

    return `
      <button class="catalog-card" type="button" data-catalog-item-id="${item.id}">
        <span class="catalog-card-image-frame">${image}</span>
        <span class="catalog-card-name">${found ? item.name : item.unknown}</span>
      </button>
    `;
  }).join("");
}

function bindNavigation() {
  document.querySelectorAll("[data-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const view = link.dataset.view;

      if (view === "map") {
        event.preventDefault();
        return;
      }

      showView(view);
    });
  });

  window.addEventListener("hashchange", () => {
    showView(location.hash === "#catalog" ? "catalog" : "home");
  });

  showView(location.hash === "#catalog" ? "catalog" : "home");

  document.getElementById("catalogCards").addEventListener("click", (event) => {
    const card = event.target.closest("[data-catalog-item-id]");
    if (card) showCatalogDetail(card.dataset.catalogItemId);
  });
}

function showView(view) {
  if (view === "map") {
    return;
  }

  const isCatalog = view === "catalog";
  document.getElementById("homeScreen").hidden = isCatalog;
  document.getElementById("catalogDetailScreen").classList.remove("is-active");
  document.getElementById("catalogDetailScreen").setAttribute("aria-hidden", "true");
  document.getElementById("catalogScreen").classList.toggle("is-active", isCatalog);
  document.getElementById("catalogScreen").setAttribute("aria-hidden", String(!isCatalog));
  document.body.classList.toggle("catalog-view", isCatalog);

  document.querySelectorAll("[data-view]").forEach((link) => {
    const isActive = link.dataset.view === view;
    link.classList.toggle("active", isActive);
    link.toggleAttribute("aria-current", isActive);
  });
}

function showCatalogDetail(itemId) {
  const itemIndex = catalogItems.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    return;
  }

  currentCatalogDetailIndex = itemIndex;
  renderCatalogDetail(catalogItems[itemIndex]);

  document.getElementById("catalogScreen").classList.remove("is-active");
  document.getElementById("catalogScreen").setAttribute("aria-hidden", "true");
  document.getElementById("catalogDetailScreen").classList.add("is-active");
  document.getElementById("catalogDetailScreen").setAttribute("aria-hidden", "false");
  document.body.classList.add("catalog-view");
  renderCatalogPageIndicator();
}

function renderCatalogPageIndicator() {
  const indicator = document.getElementById("catalogPageIndicator");
  indicator.setAttribute("aria-label", `図鑑 ${currentCatalogDetailIndex + 1} / ${catalogItems.length} ページ`);
  indicator.innerHTML = catalogItems.map((item, index) => (
    `<button class="catalog-page-dot${index === currentCatalogDetailIndex ? " is-current" : ""}" type="button" data-catalog-page-index="${index}" aria-label="${index + 1}ページへ移動"${index === currentCatalogDetailIndex ? " aria-current=\"page\"" : ""}></button>`
  )).join("");

  indicator.querySelectorAll("[data-catalog-page-index]").forEach((button) => {
    button.addEventListener("click", () => {
      showCatalogDetail(catalogItems[Number(button.dataset.catalogPageIndex)].id);
    });
  });
}

function renderCatalogDetail(catalogItem) {
  const item = items[catalogItem.id];
  const found = localStorage.getItem(item.id) === "true";
  const detailScreen = document.getElementById("catalogDetailScreen");
  const image = document.getElementById("catalogDetailImage");
  const title = document.getElementById("catalogDetailTitle");
  const description = document.getElementById("catalogDetailDescriptionText");
  const badge = document.getElementById("catalogDetailBadge");
  const badgeOuter = document.getElementById("catalogDetailBadgeOuter");
  const badgeInner = document.getElementById("catalogDetailBadgeInner");
  const badgeText = document.getElementById("catalogDetailBadgeText");

  detailScreen.classList.toggle("is-found", found);
  detailScreen.classList.toggle("is-unfound", !found);
  image.src = found ? item.image : item.shadowImage;
  image.alt = found ? item.name : "未発見のアイテム";
  image.classList.toggle("rotate-left", Boolean(item.rotateLeft));
  title.textContent = found ? item.name : "○○○○";
  description.textContent = found ? `${item.name}をみつけた！` : "○○○○○○\n○○";
  badgeOuter.src = found
    ? "images/figma-catalog-found-badge-outer.svg"
    : "images/figma-catalog-unfound-badge-outer.svg";
  badgeInner.src = found
    ? "images/figma-catalog-found-badge-inner.svg"
    : "images/figma-catalog-unfound-badge-inner.svg";
  badgeText.textContent = found ? "GET!" : "???";
}

function bindCatalogDetailSwipe() {
  const detailScreen = document.getElementById("catalogDetailScreen");
  let startX = null;

  detailScreen.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
  });

  detailScreen.addEventListener("pointerup", (event) => {
    if (startX === null) {
      return;
    }

    const distance = event.clientX - startX;
    startX = null;

    if (Math.abs(distance) < 48) {
      return;
    }

    const direction = distance < 0 ? 1 : -1;
    const nextIndex = (currentCatalogDetailIndex + direction + catalogItems.length) % catalogItems.length;
    showCatalogDetail(catalogItems[nextIndex].id);
  });

  detailScreen.addEventListener("pointercancel", () => {
    startX = null;
  });
}

function renderItemImage(item) {
  if (!item.shadowImage) {
    return `<span id="${item.id}Image" class="image-placeholder" aria-hidden="true"></span>`;
  }

  return `<img id="${item.id}Image" class="${item.rotateLeft ? "rotate-left" : ""}" src="${item.shadowImage}" alt="未発見のアイテム">`;
}

function bindLegacyButtons() {
  const controls = document.querySelector(".legacy-controls");
  controls.querySelectorAll("[data-collect-item]").forEach((button) => button.remove());
  itemList.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.collectItem = item.id;
    button.textContent = `${item.name}を拾う`;
    button.addEventListener("click", () => getItem(item.id));
    controls.prepend(button);
  });

  document.getElementById("resetButton")?.addEventListener("click", resetData);
}

function loadFoundItems() {
  itemList.forEach((item) => {
    if (localStorage.getItem(item.id) === "true") {
      showFoundItem(item.id);
    }
  });
}

function collectItemFromUrl() {
  const params = new URLSearchParams(location.search);
  // Keep storage IDs stable while accepting readable NFC URLs.
  const urlItemIds = new Map([
    ["watermelon-pouch", "wallet"],
    ["bouquet", "key"],
    ["pearl-strap", "bear"],
    ["snow-globe", "item4"],
    ["star-hairpin", "item5"],
    ["panda-bento", "item6"]
  ]);
  const urlItem = params.get("item");
  const itemName = urlItemIds.get(urlItem) ?? urlItem;

  if (Object.hasOwn(items, itemName) && !items[itemName].locked) {
    getItem(itemName);
  }
}

function getItem(itemName) {
  showFoundItem(itemName);
  localStorage.setItem(itemName, "true");
  saveToFirebase(itemName);
  updateScore();
  showPopup(items[itemName]);
}

function showFoundItem(itemName) {
  const item = items[itemName];
  const itemText = document.getElementById(itemName);
  const itemImage = document.getElementById(`${itemName}Image`);

  if (!item || !itemText || !itemImage) {
    return;
  }

  itemText.textContent = item.name;

  if (itemImage.tagName === "IMG" && item.image) {
    itemImage.src = item.image;
    itemImage.alt = item.name;
  }

  document.querySelector(`[data-item-id="${itemName}"]`)?.classList.add("found");
}

function updateScore() {
  renderCatalogIndex();
  const collectibleItems = itemList.filter((item) => !item.locked);
  const foundCount = collectibleItems.filter((item) => {
    return localStorage.getItem(item.id) === "true";
  }).length;
  const totalCount = collectibleItems.length;
  const percentage = totalCount === 0 ? 0 : (foundCount / totalCount) * 100;

  document.getElementById("score").textContent = `${foundCount} / ${totalCount}`;
  document.getElementById("scoreProgress").style.width = `${percentage}%`;
}

function bindPopup() {
  document.getElementById("popupCloseButton")?.addEventListener("click", hidePopup);
}

function showPopup(item) {
  const popup = document.getElementById("popup");
  const title = document.getElementById("popupTitle");
  const image = document.getElementById("popupItemImage");

  if (!popup || !title || !image) {
    return;
  }

  title.textContent = `${item.name}をみつけた！`;
  image.src = item.image || item.shadowImage;
  image.alt = item.name;
  image.classList.toggle("rotate-left", Boolean(item.rotateLeft));
  popup.setAttribute("aria-hidden", "false");
  popup.classList.add("show");
}

function hidePopup() {
  const popup = document.getElementById("popup");

  if (!popup) {
    return;
  }

  popup.classList.remove("show");
  popup.setAttribute("aria-hidden", "true");
}

async function saveToFirebase(itemName) {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        [itemName]: true,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    console.log(error);
  }
}

function resetData() {
  itemList.forEach((item) => {
    const itemText = document.getElementById(item.id);
    const itemImage = document.getElementById(`${item.id}Image`);

    localStorage.removeItem(item.id);

    if (itemText) {
      itemText.textContent = item.unknown;
    }

    if (itemImage?.tagName === "IMG" && item.shadowImage) {
      itemImage.src = item.shadowImage;
      itemImage.alt = "未発見のアイテム";
    }

    document.querySelector(`[data-item-id="${item.id}"]`)?.classList.remove("found");
  });

  updateScore();
}
