---
title: Robo RSI：方法文献目录
tabTitle: Robo RSI 方法文献目录
description: Robo RSI 的方法文献目录：数据、Policy、奖励与 Skill / Harness 的具身持续改进路线。
meta: ROBO RSI · METHODS · INDEX
index: false          # 不作为首页卡片，只从父文章内链进入
back: agent-robo-rsi.html#robo-rsi
backLabel: ← 返回 Robo RSI 主文章
footer: Robo RSI · Methods
---

::: note
方法索引 mock · 首批代表工作，不是穷尽清单。下面只记录改进对象、数据 / 反馈来源及适用边界；[主文章](agent-robo-rsi.html)负责解释六轴框架与验证标准。
:::

读具身自我改进的工作，先分清**数据生产**、**Policy 更新**、**奖励生成**和**Skill / Harness 演化**。产生更多数据不自动等于执行系统已自我更新；只从成功轨迹中学习，也不能自动证明具备 zero-success 的新能力习得。

## 经验生产与数据闭环

::: list method-list
- [RoboCat ↗](https://arxiv.org/abs/2306.11706)[@1]<span>多任务 / 多本体机器人策略 · 模型生成后续训练数据并进行适配；自生成数据是改进循环的基础模块。</span>
- [AutoRT ↗](https://arxiv.org/abs/2401.12963)[@2]<span>自主指令与真机数据采集 · VLM / LLM 指导机器人群体采集；主要是经验生产，不单独当作持久自更新方法。</span>
:::

## Policy / 模型更新

::: list method-list
- [SOAR ↗](https://arxiv.org/abs/2407.20635)[@3]<span>目标条件 Policy · 自主 Rollout 与自监督改进；要核对成功筛选的依赖，不能把失败采集等同于失败学习。</span>
- [Self-Improving Embodied Foundation Models ↗](https://arxiv.org/abs/2509.15155)[@4]<span>具身基础模型 · steps-to-go 预测用于构建奖励和成功检测，再用于后续自我改进。</span>
- [RISE ↗](https://arxiv.org/abs/2602.11075)[@5]<span>机器人 Policy · 组合世界模型中的想象 Rollout 与优势估计；需分别验证模型预测和真实任务结果。</span>
- [Q-Planning ↗](https://q-planning.github.io/)[@11]<span>冻结 BC / VLA Policy，持续更新外挂的 off-policy Q-function · Q 对 Policy 采样的 action chunks 评分并加权执行，成功与失败 deployment rollouts 都进入 Replay Buffer 更新 Q。LIBERO-10 从 93% 提升至 99%，RoboTwin 从 83.8% 提升至 91.4%；真机 stack-cups 从 40% 提升至 90%，insert-wallet 从 25% 提升至 80%。它明确利用失败反馈，但不能突破 BC 几乎不可能采样到的动作边界，因此主要属于 capability refinement，而非已证明的 zero-success acquisition。</span>
:::

## 奖励与学习信号

::: list method-list
- [Eureka ↗](https://arxiv.org/abs/2310.12931)[@6]<span>奖励函数代码 · LLM 生成、测试并演化 RL 奖励；改进的是学习信号，不是机器人直接改自己的 Harness。</span>
:::

## Skill / Code / Harness 演化

::: list method-list
- [Voyager（跨域参照） ↗](https://arxiv.org/abs/2305.16291)[@7]<span>Minecraft 中的可执行 Skill Library · 展示非参数技能积累，但不是物理真机实验。</span>
- [SHAPER ↗](https://arxiv.org/abs/2608.11350)[@8]<span>文本技能与 Context / Code Harness · Rollout 反馈驱动可复用的技能和上下文演化，模型权重保持固定。</span>
- [RoboRSI ↗](https://github.com/nssmd/RoboRSI)[@9]<span>分层 Skill Tree 与多角色 Harness · 失败根因定位 → 局部代码修订 → 仿真 no-regression gate → 版本复用；效果以项目自身报告为准。</span>
:::

## 基础设施参照，不计作独立 RSI

::: list method-list
- [Thea: Towards the Harness of Embodied Agents ↗](https://arxiv.org/abs/2608.11246)[@10]<span>具身 Agent Harness、工具与任务评价 · 提供执行 / 评估底座；若没有跨轮持久更新，不单独判为 RSI 方法。</span>
:::

## 后续扩充记录什么

新工作优先填 WHAT（Policy / Data / Reward / Skill / Harness）、Rollout 所在环境、Verifier、是否跨轮保留，及能力是 refinement 还是 acquisition。另记录对 zero-success / failed rollout 的处理：只依赖成功样本、能复用失败、通过探索获得信号，还是需要外部示教。严格区分仿真成绩与真机闭环。

## 参考文献 {#references}

1. [RoboCat: A Self-Improving Generalist Agent for Robotic Manipulation](https://arxiv.org/abs/2306.11706)，2023。
2. [AutoRT: Embodied Foundation Models for Large Scale Orchestration of Robotic Agents](https://arxiv.org/abs/2401.12963)，2024。
3. [Autonomous Improvement of Instruction Following Skills via Foundation Models](https://arxiv.org/abs/2407.20635)，2024。
4. [Self-Improving Embodied Foundation Models](https://arxiv.org/abs/2509.15155)，2025。
5. [RISE: Self-Improving Robot Policy with Compositional World Model](https://arxiv.org/abs/2602.11075)，2026。
6. [Eureka: Human-Level Reward Design via Coding Large Language Models](https://arxiv.org/abs/2310.12931)，2023。
7. [Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/abs/2305.16291)，2023。
8. [Self-Evolving Embodied Agents via Skill-Harness Evolution (SHAPER)](https://arxiv.org/abs/2608.11350)，2026。
9. [RoboRSI](https://github.com/nssmd/RoboRSI)，项目仓库与自述技术报告。
10. [Towards the Harness of Embodied Agents (Thea)](https://arxiv.org/abs/2608.11246)，2026。
11. [Beyond Imitation: Self-Improving Robot Policies via Off-Policy Q-Planning](https://arxiv.org/abs/2608.21204)，2026。
