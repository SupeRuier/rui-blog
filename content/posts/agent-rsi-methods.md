---
title: Agent RSI：方法文献目录
tabTitle: Agent RSI 方法文献目录
description: Agent RSI 的方法文献目录：记忆、Prompt、Skill / Code 与 Harness。
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: AGENT RSI · METHODS · INDEX
back: agent-robo-rsi.html#agent-rsi
backLabel: ← 返回 Agent RSI 主文章
footer: Agent RSI · Methods
order: "13"
section: references                # 归入首页底部的「方法文献目录」栏，不进主列表
summary: 记忆、Prompt、Skill / Code 与 Harness 的可追溯来源与证据强度。
cardMeta: Agent RSI · Methods
---

::: note
方法索引 mock · 首批代表工作，不是穷尽清单；只记录更新对象与反馈方式。六轴 taxonomy、持久性和能力验证的解释留在[主文章](agent-robo-rsi.html)。
:::

阅读顺序可以先看**更新了什么**：短期反思、跨试次记忆、Prompt、可执行 Skill / Code，还是整个 Agent Harness。它们不能仅凭论文标题中的「self-improvement」就视为同一种递归自我改进。

## 反思与记忆

::: list method-list
- [Reflexion: Language Agents with Verbal Reinforcement Learning ↗](https://arxiv.org/abs/2303.11366)[@1]<span>反思文本与 episodic memory · 任务反馈 → 后续尝试；不更新模型权重，需区分试次内改进与持久部署。</span>
:::

## Prompt 与程序化技能

::: list method-list
- [GEPA: Reflective Prompt Evolution ↗](https://arxiv.org/abs/2507.19457)[@2]<span>Prompt / 系统配置 · 执行反馈与文本反思 → 候选提示词搜索；不等于模型参数更新。</span>
- [Voyager: An Open-Ended Embodied Agent ↗](https://arxiv.org/abs/2305.16291)[@3]<span>可执行 Skill Library · 环境反馈、错误与自检 → 新代码技能；Minecraft 软件环境中的开放式探索实例。</span>
:::

## 代码与 Harness 设计

::: list method-list
- [A Self-Improving Coding Agent (SICA) ↗](https://arxiv.org/abs/2504.15228)[@4]<span>Agent 自身代码与工具流程 · 编码任务评测 → 自主修改并验证系统。</span>
- [Automated Design of Agentic Systems (ADAS) ↗](https://arxiv.org/abs/2408.08435)[@5]<span>Agent 设计 / Harness Code · Meta Agent Search 在候选系统档案中搜索；需单独检查优化器本身是否变化。</span>
:::

## 综述与框架入口

::: list method-list
- [A Survey of Self-Evolving Agents ↗](https://arxiv.org/abs/2507.21046)[@6]<span>What / When / How / Where 视角；用于交叉核对术语和分类。</span>
- [Self-Improvements in Modern Agentic Systems: A Survey ↗](https://arxiv.org/abs/2607.13104)[@7]<span>系统层面的自我改进分类；与方法列表的外延交叉检查。</span>
- [Recursive Harness Self-Improvement ↗](https://arxiv.org/abs/2607.15524)[@8]<span>Harness 与模型共同演进的研究视角；此处列为框架资料，不作为已复现方法。</span>
- [Harness Engineering for Self-Improvement ↗](https://lilianweng.github.io/posts/2026-07-04-harness/)[@9]<span>Harness 组件和自我改进闭环的讨论入口。</span>
:::

## 后续扩充记录什么

每项新工作只增一条短记录：WHAT 更新对象、反馈 / Verifier、WHEN 更新频率、是否跨任务持久化，以及 improvement mechanism 自身是否被修改。详细机制和是否实现 capability acquisition 留到主文章或单篇深读中验证。

## 参考文献 {#references}

1. [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)，2023。
2. [GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning](https://arxiv.org/abs/2507.19457)，2025。
3. [Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/abs/2305.16291)，2023。
4. [A Self-Improving Coding Agent](https://arxiv.org/abs/2504.15228)，2025。
5. [Automated Design of Agentic Systems](https://arxiv.org/abs/2408.08435)，2024。
6. [A Survey of Self-Evolving Agents: What, When, How, and Where to Evolve on the Path to Artificial Super Intelligence](https://arxiv.org/abs/2507.21046)，2025。
7. [Self-Improvements in Modern Agentic Systems: A Survey](https://arxiv.org/abs/2607.13104)，2026。
8. [Recursive Harness Self-Improvement](https://arxiv.org/abs/2607.15524)，2026。
9. [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)，2026，博客文章。
