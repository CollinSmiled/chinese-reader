# utils/pinyin.py

TONE_MAP = {
    'a': ['ā','á','ǎ','à','a'],
    'e': ['ē','é','ě','è','e'],
    'i': ['ī','í','ǐ','ì','i'],
    'o': ['ō','ó','ǒ','ò','o'],
    'u': ['ū','ú','ǔ','ù','u'],
    'ü': ['ǖ','ǘ','ǚ','ǜ','ü'],
    'v': ['ǖ','ǘ','ǚ','ǜ','ü'],
}

def convert_syllable(syllable: str) -> str:
    """Convert 'pin2' → 'pín'"""
    if not syllable:
        return syllable

    if syllable[-1].isdigit():
        tone = int(syllable[-1])
        syllable = syllable[:-1]
    else:
        return syllable
    if tone == 5:
        return syllable

    for priority in ['a', 'e', 'ou']:
        if priority in syllable:
            vowel = priority[0]
            marked = TONE_MAP[vowel][tone - 1]
            return syllable.replace(vowel, marked, 1)

    for char in reversed(syllable):
        if char in TONE_MAP:
            marked = TONE_MAP[char][tone - 1]
            return syllable[:syllable.rfind(char)] + marked + syllable[syllable.rfind(char)+1:]

    return syllable


def convert_pinyin(pinyin_str: str) -> str:
    syllables = pinyin_str.split()
    return ' '.join(convert_syllable(s) for s in syllables)