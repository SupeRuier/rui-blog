---
title: 主动学习：从样本选择到数据价值闭环
tabTitle: 主动学习
description: 主动学习：在预算约束下选择样本，以标注反馈和下游模型评测验证数据价值。
order: "00"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: ACTIVE LEARNING · FRAMEWORK
cardMeta: Active Learning   # 首页卡片右上角，比文章页眉短
summary: 预算约束下的样本选择、长尾覆盖、标注反馈与下游模型验证。
footer: Active Learning
---

::: note
框架草稿：从经典机器学习问题出发，整理博士阶段持续关注的主动学习研究主线。
:::

我在 GitHub 整理的 [awesome-active-learning](https://github.com/SupeRuier/awesome-active-learning) 不只是论文清单，还按问题场景、选样策略、理论、实践和应用组织资料[@1]。它引出的基本问题很朴素：标注贵、预算有限，而未标注样本对目标任务的贡献并不相同，能否让模型主动决定下一批请专家标什么？

## 经典问题设定

给定少量已标注集合、一个较大的未标注数据池和有限的查询预算，训练一个初始模型，按策略选择一批候选交给人工 / 领域专家（oracle）标注，更新模型后继续下一轮。最终目标是用更少标注达到相近或更好的泛化表现[@3]。这是**模型—选样—专家—再训练**的迭代式机器学习架构，不是简单按难度排序的一次性数据清洗。

## 选样策略：先看四类问题

[项目的池式分类框架](https://github.com/SupeRuier/awesome-active-learning/blob/master/contents/pb_classification.md)可粗分为：**信息量**（不确定性、模型间分歧、模型变化）；**代表性**（分布覆盖、聚类和密度）；**预期改进**（选择可能真正降低误差的样本）；**学习评分**（直接学习样本价值）[@2]。批量选择还应处理样本间冗余，目标和标注成本不同也会改变策略选择。

## 怎样验证它有用

固定测试集与标注预算，画出模型表现随累计标注量变化的学习曲线，与随机采样和简单基线比较；同时报告查询耗时、标注成本、选择偏差及不同数据分布上的效果。后续再讨论如何把这套经典闭环迁移到视觉长尾挖掘和更大规模的数据价值评估；博士阶段的具体研究成果需要逐篇核对，不在这份初步框架中预设结论。

## 参考文献 {#references}

1. [Everything about Active Learning (awesome-active-learning)](https://github.com/SupeRuier/awesome-active-learning)，Rui He，项目总览与问题导向资料库。
2. [Pool-Based Active Learning for Classification](https://github.com/SupeRuier/awesome-active-learning/blob/master/contents/pb_classification.md)，项目中的池式选样分类。
3. [Active Learning Literature Survey](https://minds.wisconsin.edu/handle/1793/60660)，Burr Settles，2009。经典主动学习设定与策略综述。
