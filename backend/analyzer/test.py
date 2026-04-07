import jieba

text = "我来到北京清华大学"
tokens = jieba.lcut(text)
print(tokens)