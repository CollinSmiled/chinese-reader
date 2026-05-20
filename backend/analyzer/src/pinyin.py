from pypinyin import lazy_pinyin, Style

def get_pinyin(word: str) -> str:
    return " ".join(lazy_pinyin(word, style=Style.TONE, v_to_u=True))

if __name__ == "__main__":
    print(get_pinyin("你好"))