import json
from pathlib import Path
from functools import lru_cache
from .hsk import get_hsk_level

DICT_PATH = Path(__file__).parent.parent / "data" / "processed" / "cc_cedict.json"


@lru_cache(maxsize=1)
def load_dict():
    with open(DICT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
    
def get_dict_entries(word: str):
    return load_dict().get(word)

# def get_word_info(word: str):
#     return{
#         "word": word,
#         "level": get_hsk_level(word),
#         "dict_entries": get_dict_entries(word)
#     }

# if __name__ == "__main__":
#     test_words = ["你好", "行", "螺旋桨"]

#     for w in test_words:
#         print("WORD:", w)
#         print(get_word_info(w))
#         print("-" * 40)
