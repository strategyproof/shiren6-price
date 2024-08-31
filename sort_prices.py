import csv

# 並び替えの条件
category_order = ["腕輪", "草", "巻物", "杖", "壺"]
state_order = {"ふつう": 0, "祝福": 1, "呪い": 2}

# CSVファイルを読み込む
with open("prices.csv", newline="", encoding="utf-8") as csvfile:
    reader = csv.reader(csvfile)
    header = next(reader)  # ヘッダー行を読み込む
    rows = list(reader)  # データ行をリストに変換

# 並び替えのロジック
rows.sort(
    key=lambda x: (
        category_order.index(x[0]),  # 分類の順序
        int(x[4].replace(",", "")),  # 買値の昇順
        state_order.get(x[3], 3),  # 状態の順序（デフォルトは3で最下位）
    )
)

# 並び替えた結果を新しいCSVファイルに書き込む
with open("sorted_prices.csv", "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(header)  # ヘッダー行を書き込む
    writer.writerows(rows)  # データ行を書き込む

print("並び替えが完了しました。'sorted_prices.csv' を確認してください。")
