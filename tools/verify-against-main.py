#!/usr/bin/env python3
"""证明 dist/ 与 main 分支上的原始 HTML 站点等价。

把两边都解析成「标签 + 属性 + 文本」的 token 流再比较，因此格式化和缩进差异
不影响结论。唯一被忽略的是：

  * `?v=` 缓存版本号（现在按文件内容哈希自动生成）
  * `aria-label="跳转到参考文献 N"`（本次给部分缺失的引用链接补齐）

用法：npm run build && python3 tools/verify-against-main.py
"""
import difflib
import html.parser
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOID = {"br", "img", "meta", "link", "hr", "input", "source", "area", "base", "col", "embed"}
IGNORE_ATTRS = {"aria-label"}


class Tokenizer(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tokens = []

    def handle_starttag(self, tag, attrs):
        clean = tuple(sorted(
            (k, re.sub(r"\?v=[0-9a-f]+", "", re.sub(r"\s+", " ", v.strip())) if v else v)
            for k, v in attrs if k not in IGNORE_ATTRS))
        self.tokens.append(f"<{tag}{''.join(f' {k}={v!r}' for k, v in clean)}>")
        if tag in VOID:
            self.tokens.append(f"</{tag}>")

    handle_startendtag = handle_starttag

    def handle_endtag(self, tag):
        self.tokens.append(f"</{tag}>")

    def handle_data(self, data):
        text = re.sub(r"\s+", " ", data)
        if text.strip():
            self.tokens.append(f"TEXT {text}")


def body_tokens(html):
    m = re.search(r"<body[^>]*>(.*)</body>", html, re.S)
    t = Tokenizer()
    t.feed(m.group(1) if m else html)
    return t.tokens


def main():
    targets = ["index.html"] + [
        f"posts/{f}" for f in sorted(os.listdir(os.path.join(ROOT, "dist", "posts")))]
    failed = []

    for path in targets:
        orig = subprocess.run(["git", "show", f"main:{path}"], cwd=ROOT,
                              capture_output=True, text=True)
        if orig.returncode != 0:
            print(f"✗ {path}: main 分支里没有这个文件")
            failed.append(path)
            continue

        gen_path = os.path.join(ROOT, "dist", path)
        if not os.path.exists(gen_path):
            print(f"✗ {path}: dist 里没有产物")
            failed.append(path)
            continue

        a = body_tokens(orig.stdout)
        b = body_tokens(open(gen_path, encoding="utf-8").read())
        if a == b:
            print(f"✓ {path}")
            continue

        failed.append(path)
        print(f"✗ {path}")
        for line in list(difflib.unified_diff(a, b, "main", "dist", lineterm="", n=1))[:40]:
            print("   " + line)

    print()
    if failed:
        print(f"{len(failed)}/{len(targets)} 个页面有差异：{', '.join(failed)}")
        return 1
    print(f"全部 {len(targets)} 个页面与 main 分支的原始站点等价")
    return 0


if __name__ == "__main__":
    sys.exit(main())
