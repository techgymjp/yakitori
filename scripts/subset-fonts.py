"""画面で使う文字だけに絞ったフォント（fonts/*.woff2）を作る。

アプリはオフラインでも遊べるよう、フォントを同梱している（Google Fonts から読み込まない）。
index.html の文言を変えて新しい文字を使ったときは、これを実行し直す。

    pip install fonttools brotli
    python3 scripts/subset-fonts.py

フォント：Dela Gothic One、Zen Maru Gothic（どちらも SIL Open Font License 1.1）
"""
import os
import string
import subprocess
import tempfile
import urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'fonts')
BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
FONTS = {
    'DelaGothicOne-Regular': 'delagothicone/DelaGothicOne-Regular.ttf',
    'ZenMaruGothic-Medium': 'zenmarugothic/ZenMaruGothic-Medium.ttf',
    'ZenMaruGothic-Bold': 'zenmarugothic/ZenMaruGothic-Bold.ttf',
    'ZenMaruGothic-Black': 'zenmarugothic/ZenMaruGothic-Black.ttf',
}
LICENSE_URL = BASE + 'zenmarugothic/OFL.txt'
DELA_LICENSE_URL = BASE + 'delagothicone/OFL.txt'

os.makedirs(OUT, exist_ok=True)
text = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
chars = set(text) | set(string.printable) | set('０１２３４５６７８９×–—…’“”・〜！？')
chars = ''.join(sorted(c for c in chars if c.isprintable() and ord(c) >= 0x20))

with tempfile.TemporaryDirectory() as tmp:
    text_file = os.path.join(tmp, 'chars.txt')
    open(text_file, 'w', encoding='utf-8').write(chars)
    for name, rel in FONTS.items():
        src = os.path.join(tmp, name + '.ttf')
        urllib.request.urlretrieve(BASE + rel, src)
        dst = os.path.join(OUT, name + '.woff2')
        subprocess.run(['pyftsubset', src, f'--text-file={text_file}', '--flavor=woff2',
                        '--layout-features=*', f'--output-file={dst}'], check=True)
        print(f'{dst}: {os.path.getsize(dst) // 1024} KB')
    urllib.request.urlretrieve(LICENSE_URL, os.path.join(OUT, 'OFL-ZenMaruGothic.txt'))
    urllib.request.urlretrieve(DELA_LICENSE_URL, os.path.join(OUT, 'OFL-DelaGothicOne.txt'))
