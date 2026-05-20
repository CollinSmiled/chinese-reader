from segmentation import segment_text
from hsk import get_hsk_level
from dict import get_dict_entries
from pinyin import get_pinyin
from pinyin_convert import convert_pinyin


def analyze_text(text: str) -> list[dict]:
    tokens = segment_text(text)
    results = []

    for word in tokens:
        if not word:
            continue

        if not any("\u4e00" <= char <= "\u9fff" for char in word):
            results.append({
                "type": "text",
                "text": word,
            })
            continue

        dictionary_entries = get_dict_entries(word) or []

        result_entry = {
            "type": "word",
            "word": word,
            "hsk_level": get_hsk_level(word),
            "dictionary": [
                {**entry, "pinyin": convert_pinyin(entry["pinyin"])}
                for entry in dictionary_entries
            ]
        }

        if not dictionary_entries:
            generated = get_pinyin(word)
            if generated:
                result_entry["generated_pinyin"] = convert_pinyin(generated)

        results.append(result_entry)

    return results
