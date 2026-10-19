# -*- coding: utf-8 -*-
"""通用小工具：文件名清洗、目录大小、安全解压（防 zip-slip）。"""
from __future__ import annotations

import re
import shutil
import zipfile
from pathlib import Path

_ILLEGAL_CHARS = re.compile(r'[\\/*?:"<>|]')


def sanitize_filename(name: str, fallback: str = "mod") -> str:
    """把任意字符串清理成可用作文件名的形式。"""
    cleaned = _ILLEGAL_CHARS.sub("_", str(name or "")).strip()
    return cleaned or fallback


def dir_size(path) -> int:
    """递归统计目录总字节数。"""
    total = 0
    try:
        for entry in Path(path).rglob("*"):
            if entry.is_file():
                total += entry.stat().st_size
    except OSError:
        pass
    return total


def _is_within(base: Path, target: Path) -> bool:
    """target 是否落在 base 目录内（已解析符号链接与 ..）。"""
    try:
        target.resolve().relative_to(base.resolve())
        return True
    except ValueError:
        return False


def _has_single_root(names) -> bool:
    """zip 内所有条目都在同一个顶层目录下时返回 True。

    注意：不能用 ``os.path.commonprefix`` —— 它是纯字符串前缀，
    会把 ``mod1/`` 与 ``mod10/`` 误判成同一目录。
    """
    stripped = [n for n in names if n.strip("/")]
    if not stripped:
        return False
    tops = {n.split("/")[0] for n in stripped}
    if len(tops) != 1:
        return False
    top = next(iter(tops))
    for name in stripped:
        if not (name == top or name == top + "/" or name.startswith(top + "/")):
            return False
    # 必须真的有子条目，否则「只有一个文件」也会被当成目录
    return any(n.startswith(top + "/") for n in stripped)


def safe_extract_zip(zip_path, extract_to, strip_root: bool = True) -> Path:
    """把 zip 安全解压到 ``extract_to``。

    - 防目录穿越（zip-slip）：任何逃出目标目录的条目直接报错。
    - ``strip_root=True`` 时去掉多余的单层顶层目录，对齐创意工坊包结构。
    """
    extract_to = Path(extract_to)
    extract_to.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(str(zip_path), "r") as zf:
        names = zf.namelist()
        prefix = ""
        if strip_root and _has_single_root(names):
            prefix = names[0].split("/")[0] + "/"

        for member in zf.infolist():
            rel = member.filename
            if prefix and rel.startswith(prefix):
                rel = rel[len(prefix):]
            if not rel or rel.endswith("/"):
                continue
            target = (extract_to / rel).resolve()
            if not _is_within(extract_to, target):
                raise ValueError(f"压缩包包含非法路径: {member.filename}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)

    return extract_to
