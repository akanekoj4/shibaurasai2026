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

const itemList = [
  {
    id: "wallet",
    name: "財布",
    unknown: "？？？",
    image: "images/wallet.png",
    shadowImage: "images/walletshadow.png",
    message: "財布を発見！"
  },
  {
    id: "key",
    name: "鍵",
    unknown: "？？",
    image: "images/key.png",
    shadowImage: "images/keyshadow.png",
    message: "鍵を発見！"
  },
  {
    id: "bear",
    name: "ぬいぐるみ",
    unknown: "？？？？？",
    image: "images/bear.png",
    shadowImage: "images/bearshadow.png",
    message: "ぬいぐるみを発見！"
  },
  {
    id: "item4",
    name: "アイテム4",
    unknown: "？？？？",
    image: "",
    shadowImage: "",
    message: "アイテムを発見！",
    locked: true
  },
  {
    id: "item5",
    name: "アイテム5",
    unknown: "？？？？",
    image: "",
    shadowImage: "",
    message: "アイテムを発見！",
    locked: true
  },
  {
    id: "item6",
    name: "アイテム6",
    unknown: "？？？？",
    image: "",
    shadowImage: "",
    message: "アイテムを発見！",
    locked: true
  }
];

const items = Object.fromEntries(itemList.map((item) => [item.id, item]));

const catalogItems = itemList.map((item) => ({
  id: item.id,
  name: item.name,
  // Figma の図鑑目次ノード（23:93）にある固定ラベル。
  catalogLabel: "○○○○",
  // 透明背景の画像を追加するときは、ここへ "images/xxx.png" を設定します。
  catalogImage: ""
}));

window.addEventListener("load", async () => {
  renderItems();
  renderCatalogIndex();
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
    const image = item.catalogImage
      ? `<img class="catalog-card-image" src="${item.catalogImage}" alt="">`
      : `<span class="catalog-card-placeholder" aria-hidden="true"></span>`;

    return `
      <button class="catalog-card" type="button" data-catalog-item-id="${item.id}">
        <span class="catalog-card-image-frame">${image}</span>
        <span class="catalog-card-name">${item.catalogLabel}</span>
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

  document.querySelectorAll("[data-catalog-item-id]").forEach((card) => {
    card.addEventListener("click", () => {
      // 図鑑ページ実装時に、この data-catalog-item-id をページ遷移先として使います。
    });
  });
}

function showView(view) {
  if (view === "map") {
    return;
  }

  const isCatalog = view === "catalog";
  document.getElementById("homeScreen").hidden = isCatalog;
  document.getElementById("catalogScreen").classList.toggle("is-active", isCatalog);
  document.getElementById("catalogScreen").setAttribute("aria-hidden", String(!isCatalog));
  document.body.classList.toggle("catalog-view", isCatalog);

  document.querySelectorAll("[data-view]").forEach((link) => {
    const isActive = link.dataset.view === view;
    link.classList.toggle("active", isActive);
    link.toggleAttribute("aria-current", isActive);
  });
}

function renderItemImage(item) {
  if (!item.shadowImage) {
    return `<span id="${item.id}Image" class="image-placeholder" aria-hidden="true"></span>`;
  }

  return `<img id="${item.id}Image" src="${item.shadowImage}" alt="${item.name}">`;
}

function bindLegacyButtons() {
  const buttonMap = {
    getWalletButton: "wallet",
    getKeyButton: "key",
    getBearButton: "bear"
  };

  Object.entries(buttonMap).forEach(([buttonId, itemId]) => {
    const button = document.getElementById(buttonId);

    if (button) {
      button.addEventListener("click", () => {
        getItem(itemId);
      });
    }
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
  const itemName = params.get("item");

  if (items[itemName] && !items[itemName].locked) {
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
  }

  document.querySelector(`[data-item-id="${itemName}"]`)?.classList.add("found");
}

function updateScore() {
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
    }

    document.querySelector(`[data-item-id="${item.id}"]`)?.classList.remove("found");
  });

  updateScore();
}
