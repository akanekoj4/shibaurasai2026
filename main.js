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

const items = {
  wallet: {
    name: "財布",
    unknown: "？？",
    imageId: "walletImage",
    image: "images/wallet.png",
    message: "✨ 財布を発見！"
  },
  key: {
    name: "鍵",
    unknown: "？",
    imageId: "keyImage",
    image: "images/key.png",
    message: "🔑 鍵を発見！"
  },
  bear: {
    name: "ぬいぐるみ",
    unknown: "？？？？？",
    imageId: "bearImage",
    image: "images/bear.png",
    message: "🧸 ぬいぐるみを発見！"
  }
};

window.addEventListener("load", async () => {
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

document.getElementById("getWalletButton").addEventListener("click", () => {
  getItem("wallet");
});

document.getElementById("getKeyButton").addEventListener("click", () => {
  getItem("key");
});

document.getElementById("getBearButton").addEventListener("click", () => {
  getItem("bear");
});

document.getElementById("resetButton").addEventListener("click", resetData);

function loadFoundItems() {
  Object.keys(items).forEach((itemName) => {
    if (localStorage.getItem(itemName) === "true") {
      showFoundItem(itemName);
    }
  });
}

function collectItemFromUrl() {
  const params = new URLSearchParams(location.search);
  const itemName = params.get("item");

  if (items[itemName]) {
    getItem(itemName);
  }
}

function getItem(itemName) {
  showFoundItem(itemName);
  localStorage.setItem(itemName, "true");
  saveToFirebase(itemName);
  updateScore();
  showPopup(items[itemName].message);
}