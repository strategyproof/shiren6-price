document.addEventListener("DOMContentLoaded", function () {
  // ページが読み込まれたときに全ての道具を表示
  fetch("prices.csv")
    .then((response) => response.text())
    .then((data) => {
      const results = parseCSV(data);
      displayResults(results);
    })
    .catch((error) => console.error("Error fetching CSV:", error));

  // 値段を入力するフォームにフォーカスを当てる
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
  const price = document.getElementById("price").value;
  const priceTarget = document.querySelector(
    'input[name="price_target"]:checked'
  )?.value;
  const category = document.querySelector(
    'input[name="category"]:checked'
  )?.value;
  const state = document.querySelector('input[name="state"]:checked')?.value;
  const isNonDefault = document.getElementById("isNonDefault").checked;

  fetch("prices.csv")
    .then((response) => response.text())
    .then((data) => {
      const results = parseCSV(
        data,
        price,
        priceTarget,
        category,
        state,
        isNonDefault
      );
      displayResults(results);
    })
    .catch((error) => console.error("Error fetching CSV:", error));
}

function parseCSV(data, price, priceTarget, category, state, isNonDefault) {
  const rows = data.split("\n").slice(1);
  return rows
    .map((row) => {
      // カンマを含む数値を正しく処理するために、正規表現を使用してパース
      const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
      return [...row.matchAll(regex)].map((match) =>
        match[0].replace(/"/g, "")
      );
    })
    .filter((item) => {
      const matchesPrice =
        !price ||
        (priceTarget === "すべて" &&
          (item[4].replace(/,/g, "") === price ||
            item[5].replace(/,/g, "") === price)) ||
        (priceTarget === "買値" && item[4].replace(/,/g, "") === price) ||
        (priceTarget === "売値" && item[5].replace(/,/g, "") === price);
      const matchesCategory =
        !category || category === "すべて" || item[0] === category;
      const matchesState =
        !state ||
        state === "すべて" ||
        (state === "ふつう" && item[3] === "-") ||
        item[3] === state;
      const matchesNonDefault = !isNonDefault || item[7] !== "1";
      return (
        matchesPrice && matchesCategory && matchesState && matchesNonDefault
      );
    });
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
    if (item[7] === "1") row.classList.add("artificial");

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

    row.innerHTML = `
      <td>${item[0]}</td>
      <td>${item[1]}</td>
      <td>${item[2]}</td>
      <td>${item[3]}</td>
      <td>${item[4]}</td>
      <td>${item[5]}</td>
      <td>${item[6] || ""}</td>
    `;

    tbody.appendChild(row);
  });

  resultsDiv.appendChild(table);
}
