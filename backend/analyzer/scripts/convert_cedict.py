import re
import json
from collections import defaultdict
from pathlib import Path

INPUT_PATH = Path(__file__).parent.parent / "data" / "raw" / "cedict_ts.u8"
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "processed" / "cc_cedict.json"

def convert():
    dictionary = defaultdict(list)

    pattern = re.compile(r"(\S+)\s+(\S+)\s+\[(.*?)\]\s+/(.+)/")

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("#"):
                continue

            match = pattern.match(line)
            if not match:
                continue

            traditional, simplified, pinyin, definitions = match.groups()

            definitions_list = definitions.split("/")

            entry = {
                "traditional": traditional,
                "pinyin": pinyin,
                "definitions": definitions_list
            }

            dictionary[simplified].append(entry)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dict(dictionary), f, ensure_ascii=False)

    print("Done. Total words:", len(dictionary))


if __name__ == "__main__":
    convert()