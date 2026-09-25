---
title: FlagOS-Robo 部署案例：System 2 与 System 1 如何交互
tabTitle: FlagOS-Robo 部署案例
description: FlagOS-Robo 与 RoboOS 的部署案例：System 2 Agent 与 System 1 Policy/Skill 的交互、端云切分与评估边界。
order: "10"
meta: ROBO DEPLOYMENT · CASE STUDY
cardMeta: Robo Deployment · Case Study   # 首页卡片右上角，比文章页眉短
summary: 基于 FlagOS-Robo 与 RoboOS 的公开资料，评估端云切分、任务调度、Policy / Skill 接口及验证缺口。
footer: Robo Deployment
---

::: note
公开资料 case study，2026-09-15。本文评估的是架构与接口，不是已经跑通的真机复现实验；「公开设计」「工程判断」「待验证」分别说明。
:::

[FlagOS](https://flagos.io/Home) 是面向多种 AI 芯片的系统软件栈，不能直接等同于机器人 Agent Runtime[@1]。其领域项目 [FlagOS-Robo](https://docs.flagos.io/projects/FlagOS-Robo/en/latest/flagos-robo-user-guide.html) 把 VLM / VLA 的数据加载、训练、推理、Serving 和评测串起来，支持端到云部署[@2][@3]；与之关联的 [RoboOS](https://github.com/FlagOpen/RoboOS) 则给出了 Brain–Cerebellum 的分层 Agent 系统[@4]。评估 System 2 与 System 1 的交互，需要把「模型能部署」与「任务能闭环执行」分开。

## 公开设计：端云怎么切

[RoboOS 论文](https://arxiv.org/html/2505.03673v2) 中，云端 Embodied Brain 处理全局任务、任务分解、工具调用和错误纠正；机器人端 Cerebellum Skill Library 执行 VLA、导航或专家技能；Shared Memory 保存空间关系、任务反馈、工具调用历史与机器人状态。FlagScale 是模型训练 / 推理入口，FlagOS-Robo 给出 VLM / VLA 的 Serving 示例。这是「云端高层认知 + 机器人端技能执行」的一种具体切分，但不能据此断言 ROS 控制器、完整 Harness 或所有技能的部署位置都已由 FlagOS-Robo 统一实现。

## System 2 Agent 与 System 1 的交互

论文描述的链路是：收到全局任务后，Brain 从 Shared Memory 取得场景、状态与技能信息，先生成子任务图；Monitor 按图的依赖关系分配可并行或串行的任务；每个子任务由 Agent 根据反馈和部分记忆选择并调用 Skill / Tool；执行失败时，Agent 可继续检索空间信息、换工具或恢复执行，执行结果再写回 Memory[@4]。这更像「先形成计划图、执行中局部闭环」：不能把它简化为每个控制周期都重新生成完整计划，也没有证据说明高层 Planner 始终按固定频率调用。

在此框架里，System 1 不只是一种 VLA：Cerebellum 可以包含 VLA Policy、导航与传统专家技能。System 2 发的是子任务和工具选择，System 1 / Skill 发回进度、成功、失败和环境变化；动作生成和高频控制仍要与高层任务调度区分。[PI0 Serving 示例](https://github.com/flagos-ai/FlagScale/blob/main/examples/pi0/README.md) 明确了图像键、机器人状态、任务 instruction 等 Policy 输入[@5]，但示例级 Serving 不等于已公布统一的 Agent↔Policy 协议。

## 工程判断：真正落地还缺哪些契约

如果把这套结构接入一台真实机器人，我会首先定义子任务 / Skill 调用的 goal、feedback、result、cancel 与超时语义；固定 observation、机器人状态和任务 ID 在云端 Brain、边缘调度器与 Policy 服务之间的归属；让 Planner 低频或由关键事件触发，Monitor / 完成判定可更频繁运行，高频控制留在机器人本地。这里是基于公开架构提出的接口方案，**不是** FlagOS-Robo 已公开实现的调用频率、ROS Action 映射或网络故障恢复机制。

## 评价与验证边界

FlagOS-Robo 适合作为 VLM / VLA 的跨硬件训练、Serving 与评测底座；RoboOS 提供了更完整的任务图、子任务 Agent、Skill Library 和共享记忆参考实现。但两者连用时，仍需验证跨服务端到端时延、图像上行与 VLM 推理成本、Policy 返回动作的时限、技能完成判定、取消 / 重规划、断网降级以及多机器人并发。论文报告的快速命令响应是通信链路指标，不能直接当作「观测→VLM 规划→Policy 动作→真机反馈」全链路时延。最终应以同任务集的 System 2 开 / 关对照、任务完成率、恢复率及端到端 Trace / Replay 检验收益。

## 参考文献 {#references}

1. [FlagOS: Overview](https://docs.flagos.io/en/latest/overview.html)，官方文档。跨硬件系统软件概览。
2. [FlagOS-Robo: User Guide](https://docs.flagos.io/projects/FlagOS-Robo/en/latest/flagos-robo-user-guide.html)，官方文档。VLM / VLA 工具链与 Serving。
3. [FlagOS-Robo](https://github.com/flagos-ai/FlagOS-Robo)，官方项目仓库。
4. [RoboOS: A Hierarchical Embodied Framework for Cross-Embodiment and Multi-Agent Collaboration](https://arxiv.org/html/2505.03673v2)，2025。Brain–Cerebellum 系统设计。
5. [FlagScale: π0 Serving Example](https://github.com/flagos-ai/FlagScale/blob/main/examples/pi0/README.md)，官方示例。Policy 输入与部署参考。
