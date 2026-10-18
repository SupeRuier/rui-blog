#!/usr/bin/env python3
"""把 diagrams/*.mmd 渲染成 assets/*.svg。

为什么是「构建时渲染 + 提交 SVG」而不是运行时加载 mermaid：
  - 站点保持零前端依赖，页面不需要 1MB 的 JS，也不依赖外部 CDN；
  - GitHub Actions 的构建不需要无头浏览器，部署速度不受影响；
  - SVG 是静态资产，断网、打印、全文检索都正常。

代价：改了 diagrams/*.mmd 之后必须重新跑一次本脚本并提交产出的 SVG。
mermaid-cli 只用 npx 临时拉取，不写进 package.json；渲染复用本机 Chrome，
因此不会下载 Chromium（见 diagrams/puppeteer.json）。
"""

import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIAGRAMS = ROOT / "diagrams"
ASSETS = ROOT / "assets"
CONFIG = DIAGRAMS / "mermaid-config.json"
PUPPETEER = DIAGRAMS / "puppeteer.json"
MERMAID_CLI = "@mermaid-js/mermaid-cli@11"


def render(src: pathlib.Path, out: pathlib.Path) -> None:
    env = {
        **__import__("os").environ,
        # 复用本机 Chrome，别去下载 Chromium
        "PUPPETEER_SKIP_DOWNLOAD": "1",
        "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD": "1",
    }
    cmd = [
        "npx", "-y", MERMAID_CLI,
        "-i", str(src), "-o", str(out),
        "-c", str(CONFIG), "-p", str(PUPPETEER),
        "-t", "neutral", "-b", "transparent",
    ]
    print(f"  ↻ {src.name} → {out.name}")
    subprocess.run(cmd, check=True, env=env, cwd=ROOT,
                   stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)


def normalize(path: pathlib.Path, name: str) -> None:
    """mermaid 每个文件都用同一个 id `my-svg`：即便现在用 <img> 引用不会冲突，
    一旦有人改成内联就会互相覆盖样式，所以统一改成按文件名唯一的 id。"""
    svg = path.read_text(encoding="utf-8")
    svg = svg.replace("my-svg", f"mermaid-{name}")
    path.write_text(svg, encoding="utf-8")

    box = re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', svg)
    if not box:
        sys.exit(f"✗ {path.name}: 找不到 viewBox")
    w, h = round(float(box.group(3))), round(float(box.group(4)))
    if 'width="100%"' in svg:
        print(f"    ⚠ {path.name}: 仍是 width=100%，检查 useMaxWidth 配置")
    print(f"    {path.name}: {w}×{h}")


def main() -> None:
    if not shutil.which("npx"):
        sys.exit("✗ 需要 npx（Node.js）")
    ASSETS.mkdir(exist_ok=True)
    sources = sorted(DIAGRAMS.glob("*.mmd"))
    if not sources:
        sys.exit("✗ diagrams/ 下没有 .mmd")
    for src in sources:
        out = ASSETS / f"{src.stem}.svg"
        render(src, out)
        normalize(out, src.stem)
    print("✓ 完成。记得把 assets/*.svg 一起提交。")


if __name__ == "__main__":
    main()
