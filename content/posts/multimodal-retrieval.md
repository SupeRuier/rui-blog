---
title: 大规模视觉数据的多模态检索与长尾挖掘
tabTitle: 多模态检索与长尾挖掘
description: 大规模视觉数据的多模态检索与长尾挖掘。
order: "01"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: DATA RETRIEVAL · FRAMEWORK
cardMeta: Data Retrieval   # 首页卡片右上角，比文章页眉短
summary: 视觉—语言表征、自监督视觉特征、向量检索，以及道路数据中的长尾发现。
footer: Data Retrieval
---

::: note
框架草稿：用 CLIP、DINOv2 与 Milvus 实现最小可用的文图 / 图图检索。
:::

多模态检索先把图像变成向量，再用相同空间里的查询向量找到相似数据；真正需要区分的是**语义跨模态相似**和**视觉特征相似**。一个简单系统就足以支持道路场景搜索、去重候选和长尾数据挖掘。

## 表征与查询

- [CLIP](https://arxiv.org/abs/2103.00020)：图像编码器与文本编码器对齐到同一空间，文本输入用于**文搜图**；图像输入也可用于语义偏好的**以图搜图**[@1]。
- [DINOv2](https://arxiv.org/abs/2304.07193)：自监督视觉编码器提取图像特征，用于**图搜图**、相似画面聚类与近重复样本发现；原生模型没有与文本对齐，不能直接拿文本向量查 DINOv2 索引[@2]。

## 最小系统方案

离线提取每张图或片段关键帧的 CLIP 图像向量、DINOv2 图像向量及元数据（时间、场景、来源、标注状态），保存模型版本与向量归一化方式。用 [Milvus](https://milvus.io/docs/single-vector-search.md) 为两种向量分别建立索引[@3]：文本查询只搜索 CLIP 图像向量；图像查询可分别搜索 CLIP / DINOv2，再按需求合并或重排。若使用两个字段做混合检索，应分别计算得分并校准，不能把两种模型的原始相似度直接视为同一尺度。

## 检索到数据闭环

Milvus 的[元数据过滤](https://milvus.io/docs/filtered-search.md)可先限定天气、时间、区域或任务，再做近邻检索[@4]。用人工复核的 Top-K 相关性、长尾覆盖和重复率检查结果，将确认的候选回流到标注与训练；检索相似不等于数据价值高，最终仍由下游评测判断。

## 参考文献 {#references}

1. [Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020)，2021。CLIP 文图联合表征。
2. [DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193)，2023。自监督视觉向量。
3. [Milvus: Basic Vector Search](https://milvus.io/docs/single-vector-search.md)，官方文档。向量检索与多字段索引。
4. [Milvus: Filtered Search](https://milvus.io/docs/filtered-search.md)，官方文档。结构化条件过滤。
