from analyzer import analyze_text

if __name__ == "__main__":
    text = """光怪陆离满是低语的梦境迅速支离破碎，熟睡中的周明瑞只觉脑袋抽痛异常，仿佛被人用棒子狠狠抡了一下，不，更像是遭尖锐的物品刺入太阳穴并伴随有搅动！
　　嘶……迷迷糊糊间，周明瑞想要翻身，想要捂头，想要坐起，可完全无法挪动手脚，身体似乎失去了控制。"""
    result = analyze_text(text)
    for item in result:
        print(item)