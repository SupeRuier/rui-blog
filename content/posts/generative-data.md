---
title: Diffusion 与 Flow Matching 驱动的数据增强
tabTitle: 生成式数据增强
description: Diffusion 与 Flow Matching 驱动的生成式数据增强。
order: "03"
meta: GENERATIVE DATA · FRAMEWORK
cardMeta: Generative Data   # 首页卡片右上角，比文章页眉短
summary: 条件生成、参考图引导、对象插入，以及稀有目标和复杂场景的可控生成。
footer: Generative Data
---

::: note
框架草稿：关注生成模型如何服务数据生产，而非生成模型本身的完整综述。
:::

生成式数据增强的目标，是以可控方式补充真实数据中稀缺、昂贵或组合空间过大的样本。生成质量只是第一步，条件可控性、场景一致性和下游有效性同样重要。

## 主要任务

- 框选、Mask、文本和参考图条件生成
- 对象插入、移除与局部场景编辑
- 稀有目标、复杂布局和长尾组合生成
- [Diffusion](https://arxiv.org/abs/2006.11239)[@1] 与 [Flow Matching](https://arxiv.org/abs/2210.02747)[@2] 的生成路径设计

## 如何评价

数据增强不能只依赖视觉观感。需要同时检查几何和语义一致性、生成多样性、标签可用性，以及加入训练后对真实测试集和长尾场景的实际收益。

## 参考文献 {#references}

1. [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)，2020。扩散生成的基础方法。
2. [Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)，2022。连续流匹配的基础方法。
