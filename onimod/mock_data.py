# -*- coding: utf-8 -*-
"""离线降级数据。

没有配置 Steam Web API Key（或接口暂时不可用）时，前端降级展示这些「示例模组」，
界面上会同时给出「未配置 API Key」提示条 —— 它们**不是**实时数据，点下载会失败。
"""
from __future__ import annotations

MOCK_MODS = [
    {"id": "2898047283", "title": "Pliers - 智能管道工具", "author": "Ony", "subscriptions": 523000, "description": "允许玩家直接连接/断开管道和电线，无需拆除重建。缺氧必备模组之一。"},
    {"id": "2751875589", "title": "Bigger Camera Zoom Out", "author": "Cairath", "subscriptions": 412000, "description": "允许更远距离的视角缩放，方便管理大型基地。"},
    {"id": "2023371359", "title": "Blueprints - 蓝图系统", "author": "Ony", "subscriptions": 389000, "description": "允许玩家保存和加载建筑蓝图，快速复制建筑布局。"},
    {"id": "2032321333", "title": "Gas Overlay", "author": "Cairath", "subscriptions": 356000, "description": "增强气体覆盖层，显示更详细的气体信息。"},
    {"id": "1999390725", "title": "Build Over Plants", "author": "Aze", "subscriptions": 298000, "description": "允许在植物上直接建造，自动铲除植物。"},
    {"id": "1732910213", "title": "No Drop - 禁止掉落", "author": "Aze", "subscriptions": 267000, "description": "禁止复制人从梯子上掉落物品。"},
    {"id": "1712140000", "title": "Wounded Go To Med Bed", "author": "Cairath", "subscriptions": 245000, "description": "受伤复制人自动前往医疗床，提升自动化管理。"},
    {"id": "1700000001", "title": "Sweep By Type", "author": "Aze", "subscriptions": 234000, "description": "按类型一键清扫，大幅提升清扫效率。"},
    {"id": "2583586889", "title": "Research Queue", "author": "pether.pg", "subscriptions": 213000, "description": "科技研究队列，可预设研究顺序。"},
    {"id": "2895420001", "title": "Better Info Cards", "author": "Aki", "subscriptions": 189000, "description": "增强信息卡显示，更多实用数据一目了然。"},
    {"id": "2895420002", "title": "Material Color", "author": "Sw33t", "subscriptions": 178000, "description": "为不同材料建造的物体添加颜色区分。"},
    {"id": "1999000001", "title": "Chained Deconstruction", "author": "Ony", "subscriptions": 165000, "description": "连锁拆除，一键拆除相连的同类建筑。"},
    {"id": "1999000002", "title": "Suppress Notifications", "author": "Aze", "subscriptions": 156000, "description": "屏蔽重复通知，减少屏幕干扰。"},
    {"id": "1999000003", "title": "Falling Sand", "author": "Cairath", "subscriptions": 145000, "description": "优化沙子下落物理效果，更真实的模拟。"},
    {"id": "1999000004", "title": "Customizable Speed", "author": "Aki", "subscriptions": 134000, "description": "自定义游戏速度，支持更多速度选项。"},
    {"id": "2898047001", "title": "Plan Buildings Without Materials", "author": "Ony", "subscriptions": 123000, "description": "无材料规划建筑，方便前期规划布局。"},
    {"id": "1999000005", "title": "Show Building Ranges", "author": "pether.pg", "subscriptions": 112000, "description": "显示建筑影响范围，建造更精确。"},
    {"id": "1999000006", "title": "Drag Tool Area", "author": "Aze", "subscriptions": 101000, "description": "拖拽工具增强，支持更多拖拽操作。"},
]


def get_mock_mods(keyword: str = "", count: int = 12) -> list:
    """按关键词过滤示例数据（标题 / 描述 / 作者）。"""
    data = MOCK_MODS
    if keyword:
        lowered = keyword.lower()
        data = [
            m for m in data
            if lowered in m["title"].lower()
            or lowered in m["description"].lower()
            or lowered in m["author"].lower()
        ]
    return [dict(m) for m in data[:count]] if count else [dict(m) for m in data]
