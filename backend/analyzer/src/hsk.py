import json
from pathlib import Path
from functools import lru_cache

DATA_PATH = Path(__file__).parent.parent / "data" / "processed" / "hsk30_vocabulary.json"

@lru_cache(maxsize=1)
def load_hsk_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
    
def get_hsk_level(word: str) -> int | None:
    hsk_data = load_hsk_data()
    return hsk_data.get(word)

if __name__ == "__main__":
    print(get_hsk_level("调节"))
    print(get_hsk_level("人工智能"))
    print(get_hsk_level("不存在"))