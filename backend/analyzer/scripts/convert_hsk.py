import csv
import json

hsk_dict = {}



with open("../data/raw/hsk30_vocabulary.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row["Simplified"].strip()
        level_str = row["Level"].strip()

        if not word or not level_str:
            continue

        if level_str == "7-9":
            level = 7
        else:
            try:
                level = int(level_str)
            except ValueError:
                raise ValueError(f"Unexpected level value: {level_str}")

        hsk_dict[word] = level

with open("../data/processed/hsk30_vocabulary.json", "w", encoding="utf-8") as f:
    json.dump(hsk_dict, f, ensure_ascii=False, indent=2)

print("Success")