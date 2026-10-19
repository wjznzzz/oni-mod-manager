# -*- coding: utf-8 -*-
"""ONI Mod Manager 启动入口。

用法::

    python app.py                 # 启动服务并自动打开浏览器
    # 访问 http://127.0.0.1:9420

首次运行会自动在项目根目录生成 ``config.json``（含默认路径，密钥留空）。
"""
import threading

from onimod import __version__, create_app
from onimod.config import DATA_DIR

HOST = "127.0.0.1"
PORT = 9420

app = create_app()


def _open_browser() -> None:
    import time
    import webbrowser
    time.sleep(1.5)
    webbrowser.open(f"http://{HOST}:{PORT}")


def main() -> None:
    print("=" * 60)
    print(f"  缺氧(ONI) 创意工坊模组下载与搬运工具 v{__version__}")
    print("  Oxygen Not Included Mod Manager")
    print("=" * 60)
    print(f"  访问地址: http://{HOST}:{PORT}")
    print(f"  数据目录: {DATA_DIR}")
    print("=" * 60)

    threading.Thread(target=_open_browser, daemon=True).start()
    app.run(host=HOST, port=PORT, debug=False, threaded=True)


if __name__ == "__main__":
    main()
