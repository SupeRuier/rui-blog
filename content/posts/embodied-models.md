---
title: 具身 Policy 的输入、动作表示与执行接口
tabTitle: 具身 Policy
description: 具身 Policy 的输入、动作表示与执行接口：只分析模型层，明确与系统层的边界。
order: "07"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: EMBODIED MODEL · FRAMEWORK
cardMeta: Embodied Model   # 首页卡片右上角，比文章页眉短
summary: Policy / VLA 接收什么输入、如何表达动作，以及与系统层的时间尺度约束。
footer: Embodied Model
---

::: note
框架草稿：以模型的数据接口和动作输出为主，不展开模型榜单。
:::

具身模型连接感知、语言和动作。这里更关心模型消费什么数据、预测什么目标，以及输出如何接入机器人，而不是逐一比较网络结构。

## 主要形态

- VLA：从视觉、语言和状态直接预测动作或 Action Chunk，例见[OpenVLA](https://arxiv.org/abs/2406.09246)[@1]
- WAM / World Model：显式建模动作条件下的未来状态或视觉变化，世界模型控制例见[DreamerV3](https://arxiv.org/abs/2301.04104)[@2]；DreamerV3 不等同于 VLA
- 层级模型：高层产生目标、子任务或技能，低层 Policy 完成控制（可参看[层级 VLA 调度研究](https://arxiv.org/abs/2606.10267)[@3]）

## 动作表示

动作既可以是关节或末端位姿，也可以是轨迹、3D Point Flow、技能调用或其他中间表示。表示方式决定了训练数据的标注结构，也决定了模型与控制系统之间的接口。

后续将沿着“数据形式—训练目标—动作接口—评测方式”整理具身模型。

## 参考文献 {#references}

1. [OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/abs/2406.09246)，2024。视觉语言动作模型实例。
2. [Mastering Diverse Domains through World Models (DreamerV3)](https://arxiv.org/abs/2301.04104)，2023。环境预测与控制实例。
3. [What Matters in Orchestrating Robot Policies](https://arxiv.org/abs/2606.10267)，2026。高层与低层策略协作。
