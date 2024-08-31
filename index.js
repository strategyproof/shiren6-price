let parsedData = [];

document.addEventListener("DOMContentLoaded", function () {
  fetch("prices.csv")
    .then((response) => response.text())
    .then((data) => {
      parsedData = parseCSV(data);
      displayResults(parsedData);
    })
    .catch((error) => console.error("Error fetching CSV:", error));

  document.getElementById("price").focus();
});

const formElements = document.querySelectorAll("#search-form input");
formElements.forEach((element) => {
  element.addEventListener("input", handleSearch);
  element.addEventListener("change", handleSearch);
});

// フォームのエンターキーのデフォルト動作を防ぐ
document
  .getElementById("search-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    handleSearch(); // フォーム送信時にも検索をトリガー
  });

document.getElementById("price").addEventListener("input", function (event) {
  // 全角数字を半角数字に変換し、半角数字のみ入力できるようにする
  this.value = this.value
    .replace(/[０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    })
    .replace(/[^0-9]/g, "");

  // 変換後に検索をトリガー
  handleSearch();
});

// エンターキーを押したときに検索をトリガーし、入力値をクリア
document.getElementById("price").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSearch();
    this.value = ""; // 入力値をクリア
  }
});

function handleSearch() {
  const filters = {
    price: document.getElementById("price").value,
    priceTarget: document.querySelector('input[name="price_target"]:checked')
      ?.value,
    category: document.querySelector('input[name="category"]:checked')?.value,
    state: document.querySelector('input[name="state"]:checked')?.value,
    isNonDefault: document.getElementById("isNonDefault").checked,
  };

  const results = filterResults(parsedData, filters);
  displayResults(results);
}

function parseCSV(data) {
  const rows = data.split("\n").slice(1);
  return rows.map((row) => {
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    return [...row.matchAll(regex)].map((match) => match[0].replace(/"/g, ""));
  });
}

function filterResults(data, filters) {
  return data.filter((item) => {
    const matchesPrice = checkPriceMatch(
      item,
      filters.price,
      filters.priceTarget
    );
    const matchesCategory =
      !filters.category ||
      filters.category === "すべて" ||
      item[0] === filters.category;
    const matchesState = checkStateMatch(item, filters.state);
    const matchesNonDefault = !filters.isNonDefault || item[7] !== "1";
    return matchesPrice && matchesCategory && matchesState && matchesNonDefault;
  });
}

function checkPriceMatch(item, price, priceTarget) {
  if (!price) return true;
  const buyPrice = item[4].replace(/,/g, "");
  const sellPrice = item[5].replace(/,/g, "");
  return (
    (priceTarget === "すべて" && (buyPrice === price || sellPrice === price)) ||
    (priceTarget === "買値" && buyPrice === price) ||
    (priceTarget === "売値" && sellPrice === price)
  );
}

function checkStateMatch(item, state) {
  if (!state || state === "すべて") return true;
  return (state === "ふつう" && item[3] === "-") || item[3] === state;
}

function displayResults(results) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>該当する道具が見つかりませんでした。</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>分類</th>
        <th>名前</th>
        <th>回数</th>
        <th>状態</th>
        <th>買値</th>
        <th>売値</th>
        <th>備考</th>
      </tr>
    </thead>
    <tbody>
    </tbody>
  `;

  const tbody = table.querySelector("tbody");

  let previousCategory = null;
  let previousPrice = null;
  results.forEach((item) => {
    const row = document.createElement("tr");
    if (item[3] === "呪い") row.classList.add("cursed");
    if (item[3] === "祝福") row.classList.add("blessed");
    if (item[7] === "1") row.classList.add("non-default");

    // 分類が変わったら新しいクラスを追加
    if (item[0] !== previousCategory) {
      row.classList.add("new-category");
      previousCategory = item[0];
      previousPrice = item[4]; // 買値を保存
    } else if (item[4] !== previousPrice) {
      // 同じ分類で価格が変わった場合
      row.classList.add("new-category"); // new-price から new-category に変更
      previousPrice = item[4];
    }

    // Check if the price matches the search criteria
    const price = document.getElementById("price").value;
    const priceTarget = document.querySelector(
      'input[name="price_target"]:checked'
    )?.value;
    const buyPrice = item[4].replace(/,/g, "");
    const sellPrice = item[5].replace(/,/g, "");

    const buyPriceDisplay =
      price &&
      (priceTarget === "すべて" || priceTarget === "買値") &&
      buyPrice === price
        ? `<span class="highlight">${item[4]}</span>`
        : item[4];
    const sellPriceDisplay =
      price &&
      (priceTarget === "すべて" || priceTarget === "売値") &&
      sellPrice === price
        ? `<span class="highlight">${item[5]}</span>`
        : item[5];

    row.innerHTML = `
      <td>${item[0]}</td>
      <td>${item[1]}</td>
      <td>${item[2]}</td>
      <td>${item[3]}</td>
      <td>${buyPriceDisplay}</td>
      <td>${sellPriceDisplay}</td>
      <td>${item[6] || ""}</td>
    `;

    tbody.appendChild(row);
  });

  resultsDiv.appendChild(table);
}
