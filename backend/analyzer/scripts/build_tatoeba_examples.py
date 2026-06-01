import argparse
import json
import sys
from pathlib import Path

from opencc import OpenCC

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.dict import get_dict_entries
from src.hsk import get_hsk_level
from src.pinyin import get_pinyin
from src.segmentation import is_chinese_word, segment_text


DEFAULT_INPUT = ROOT / "data" / "raw" / "tatoeba" / "sentence_pairs.tsv"
DEFAULT_OUTPUT = ROOT / "data" / "processed" / "tatoeba_examples.jsonl"

converter = OpenCC("t2s")


def count_chinese_chars(value: str) -> int:
    return sum(1 for char in value if "\u3400" <= char <= "\u9fff")


def is_noisy(chinese: str, english: str) -> bool:
    char_count = count_chinese_chars(chinese)

    if char_count < 4 or char_count > 45:
        return True
    if len(english) < 4 or len(english) > 180:
        return True
    if any(char.isdigit() for char in chinese):
        return True
    if any(name.lower() in chinese.lower() or name.lower() in english.lower() for name in ["muiriel", "ck"]):
        return True

    return False


def build_terms(chinese: str) -> list[dict]:
    terms_by_word: dict[str, dict] = {}

    for word in segment_text(chinese):
      if not is_chinese_word(word):
          continue

      entries = get_dict_entries(word)
      hsk_level = get_hsk_level(word)
      pinyin = entries[0]["pinyin"] if entries else get_pinyin(word)

      terms_by_word[word] = {
          "term": word,
          "pinyin": pinyin,
          "hskLevel": hsk_level,
      }

    return list(terms_by_word.values())


def build_example(row: str) -> dict | None:
    parts = row.rstrip("\n").split("\t")
    if len(parts) < 4:
        return None

    source_id, chinese_original, translation_id, english = parts[:4]
    source_id = source_id.lstrip("\ufeff")
    if not source_id or not chinese_original or not translation_id or not english:
        return None
    if is_noisy(chinese_original, english):
        return None

    chinese_simplified = converter.convert(chinese_original)
    terms = build_terms(chinese_simplified)
    if not terms:
        return None

    known_hsk = [term["hskLevel"] for term in terms if term["hskLevel"] is not None]

    return {
        "source": "tatoeba",
        "sourceSentenceId": source_id,
        "translationSentenceId": translation_id,
        "chineseOriginal": chinese_original,
        "chineseSimplified": chinese_simplified,
        "english": english,
        "pinyin": get_pinyin(chinese_simplified),
        "charCount": count_chinese_chars(chinese_simplified),
        "wordCount": len(terms),
        "estimatedHskLevel": max(known_hsk) if known_hsk else None,
        "terms": terms,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build processed Tatoeba examples for backend import.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=5000)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    seen = 0

    with args.input.open("r", encoding="utf-8") as source, args.output.open("w", encoding="utf-8") as target:
        for row in source:
            seen += 1
            example = build_example(row)
            if not example:
                continue

            target.write(json.dumps(example, ensure_ascii=False) + "\n")
            written += 1

            if written % 500 == 0:
                print(f"Built {written} examples from {seen} rows...")

            if written >= args.limit:
                break

    print(f"Done. Built {written} examples from {seen} rows into {args.output}.")


if __name__ == "__main__":
    main()
