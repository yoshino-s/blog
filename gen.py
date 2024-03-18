# list recrusive files in `pages`

import os


for dirpath, dirnames, filenames in os.walk('pages'):
    for file in filenames:
        path = os.path.join(dirpath, file).removeprefix("pages")
        print(f"https://blog.yoshino-s.online{path}")