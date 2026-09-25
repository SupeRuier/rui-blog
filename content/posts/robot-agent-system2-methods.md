---
title: Robot Agent System 2：方法文献目录
tabTitle: Robot Agent System 2 方法文献目录
description: Robot Agent System 2 与 Robot Harness 的方法文献目录：调度协议、Planner–Policy 接口、执行反馈、记忆与恢复。
meta: ROBOT AGENT · SYSTEM 2 · LITERATURE INDEX
index: false          # 不作为首页卡片，只从父文章内链进入
back: robot-agent-system2.html
backLabel: ← 返回 System 2 主文章
footer: Robot Agent System 2 · Literature
---

::: note
基于 Embodied System 2 survey 整理 · 按高层调度方式与 Harness 完整度归类。这里列举具体系统和可核验边界；宏观架构、主循环与评测方法见[主文章](robot-agent-system2.html)。
:::

本目录关注的不是所有带语言或推理模块的机器人模型，而是高层决策如何进入执行、何时再次介入、执行结果如何返回，以及系统是否具备状态、验证、恢复和工具运行时。单纯输出动作的端到端 VLA 不自动视为 Robot Harness。

## 技术起点：从 Skill 选择到反馈式规划

::: list method-list
- [SayCan / Do As I Can, Not As I Say ↗](https://arxiv.org/abs/2204.01691)[@1]<span>逐步 Skill 选择 · 将语言模型的任务相关性与机器人 value function 的 affordance 结合；属于 Agentic next-skill 的早期形式，但尚无通用 Tool protocol、长期记忆与完整恢复运行时。</span>
- [Inner Monologue ↗](https://arxiv.org/abs/2207.05608)[@2]<span>反馈驱动 next-step replanning · 把成功检测、场景描述或人类反馈写回语言模型上下文，证明环境反馈可以改变后续计划。</span>
- [Code as Policies ↗](https://arxiv.org/abs/2209.07753)[@3]<span>一次性程序化计划 · LLM 生成调用感知、几何与控制 API 的 Python 程序；奠定 Code-as-Policy 表达，但原始主路径并非持续修复的 Coding-Agent loop。</span>
- [SayPlan ↗](https://arxiv.org/abs/2307.06135)[@4]<span>结构化全局计划 · 以分层 3D Scene Graph 支持按需检索、计划生成、空间与语义可行性检查，偏 Full-Plan / Plan-Execute。</span>
:::

## 方案一：固定频率／固定边界文本调度

::: list method-list
- [WALL-OSS / WALL-X ↗](https://github.com/X-Square-Robot/wall-x)[@5]<span>每次 action inference 先生成一条自然语言 Subtask，再将它作为 flow-action policy 的条件；属于显式文本桥接，但无独立 Memory、Progress、Plan List 与恢复模块。</span>
- [MiniCPM-RobotManip ↗](https://github.com/OpenBMB/MiniCPM-Robot)[@6]<span>固定 action-chunk 边界 · 多视角历史与原始指令 → Subtask token → action head；VLM 与动作头耦合在同一 checkpoint，更换任一侧通常需要重新适配或训练。</span>
- [LingBot-VA 2.0 ↗](https://technology.robbyant.com/lingbot-va-v2)[@7]<span>低频规划、高频视频动作控制 · Planner 将 task goal、新观测和 robot state 转为 Subtask Context，Executor 在 action-chunk 边界读取最新上下文；公开实现尚未完整披露 Planner runtime。</span>
- [WALL-WM Event Mode ↗](https://arxiv.org/abs/2606.01955)[@8]<span>事件边界的 next-event 文本与 remaining-time 预测 · 论文描述 event-aligned variable-length action segment；开源真机路径尚不能复现完整文本调度链路，需要区分论文架构与代码能力。</span>
:::

## 方案二与三：Next-Goal、Full-Plan 与执行游标

::: list method-list
- [VoLo Agent ↗](https://chicychen.github.io/VoLo/)[@9]<span>同时提供两种可比较模式：next_goal 按 action chunk 周期生成下一步；sub_goal 在任务开始生成完整子目标列表，并由周期 Monitor 检查、恢复或重规划。</span>
- [Vesta ↗](https://research.nvidia.com/labs/gear/vesta/)[@10]<span>Agentic next-subtask + memory harness · Planner 在高层决策点输出 Observation → Progress → Reasoning → Action，其中 Action 是交给 GR00T Actor 的文本 Subtask；历史帧与 past-subtask cache 再注入后续决策。</span>
- [VLAs-as-Tools ↗](https://arxiv.org/abs/2605.13119)[@11]<span>每个 decision step 根据最新状态生成一个 tool-family 与 scene-grounded Subtask，VLA 执行 bounded horizon 并返回 progress；没有预先生成并按游标遍历的完整计划。</span>
- [ALRM ↗](https://tiiuae.github.io/ALRM/)[@12]<span>Goal、Observation 与 Skills 驱动的 Planner / Executor 架构 · 通过 Tool-as-Policy 或 Code-as-Policy 把子任务转为动作，执行结果作为新 Observation 回灌。</span>
:::

## 方案四：Agentic ReAct / Coding-Agent Harness

::: list method-list
- [THEA ↗](https://github.com/EIT-HAI/Thea)[@13]<span>Embodied Agent Harness · 每轮至多选择一个 Tool，执行后由 Evaluation as Exit Codes 判断 post-condition；Resident、Refreshed 与 Accumulated Context 将 Scene Graph、安全证据和 Tool Result 带入下一轮。</span>
- [RPent ↗](https://github.com/RLinf/RPent)[@14]<span>事件驱动的 Primitive / VLA Tool Call · 成功轨迹形成 task-specific memory，失败模式形成 global memory；部署时检索模板并继续根据新观测逐步决策。</span>
- [PhyAgentOS ↗](https://github.com/PhyAgentOS/PhyAgentOS-core)[@15]<span>Session 驱动的工具运行时 · SessionVerifier 根据 success criteria 与证据包裁决 success、failure 或 replan，并通过 Tool Registry、Preflight Check 和 Epistemic Memory 组织执行。</span>
- [CaP-X / CaP-Agent0 ↗](https://github.com/capgym/cap-x)[@16]<span>代码—执行—视觉差分—代码修正闭环 · Coding Agent 在 sandbox 中组合感知、抓取、IK、运动规划与控制 API；成功程序可编译成 Skill，CaP-RL 另提供可验证奖励训练。</span>
- [RoboClaw ↗](https://github.com/RoboClaw-Robotics/RoboClaw)[@17]<span>跨数据采集、Policy 训练与部署的生命周期 Harness · VLM Agent 通过 MCP 风格工具选择 Policy / Skill，根据环境证据重试、切换或重规划，部署轨迹继续回流训练。</span>
- [ASPIRE ↗](https://github.com/NVlabs/ASPIRE)[@18]<span>多模态 trace 驱动的 Code-as-Policy 修复 · Coding Agent 生成或修改程序，执行后诊断失败并重新运行；成功程序进入持续 Skill Library。</span>
- [RoboRSI ↗](https://robo-rsi.com/blog/2-roborsi-research-preview/)[@19]<span>Manager → Planner → Engineer → Robot / Simulator → Reviewer 的任务、代码与证据闭环，围绕 Skill Tree 进行规划、实现、归因与版本化复用；目前应按研究预览而非完整开源实现理解。</span>
- [RoboHarness: Memory-Driven Orchestration ↗](https://arxiv.org/abs/2607.18060)[@20]<span>Coding-Agent Planner / Router 编排异构 VLA、RL 与 TAMP Policy，并通过 Policy Card、linked multimodal memory 与 Memory Bridge 处理跨 Policy handoff；目前未找到官方代码。</span>
:::

## 怎样继续扩充这份目录

新增系统时优先记录：Rollout Protocol、Trigger Policy、State Representation 与 Decision Interface；再记录 Planner 输入输出、Policy / Tool adapter、Termination、Memory、Verifier、Recovery、Safety、开源范围与真机证据。论文中提出的架构、公开代码真实运行的链路和项目页展示的 demo 必须分层描述。

尤其需要避免三种混淆：模型内部产生 Subtask 不自动等于外部 Harness；普通 Tool Call 不自动等于持续积累上下文的 ReAct；最终任务成功率也不能替代 Planner、Harness 与 Policy 的分层评测。

## 参考文献 {#references}

1. [Do As I Can, Not As I Say: Grounding Language in Robotic Affordances](https://arxiv.org/abs/2204.01691)，2022。
2. [Inner Monologue: Embodied Reasoning through Planning with Language Models](https://arxiv.org/abs/2207.05608)，2022。
3. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753)，2022。
4. [SayPlan: Grounding Large Language Models using 3D Scene Graphs for Scalable Robot Task Planning](https://arxiv.org/abs/2307.06135)，2023。
5. [WALL-X / WALL-OSS](https://github.com/X-Square-Robot/wall-x)，项目仓库。
6. [MiniCPM-Robot](https://github.com/OpenBMB/MiniCPM-Robot)，项目仓库。
7. [LingBot-VA 2.0](https://technology.robbyant.com/lingbot-va-v2)，技术页面与报告。
8. [WALL-WM: World Action Language Learning](https://arxiv.org/abs/2606.01955)，2026。
9. [VoLo: Vision-Language-Action Agents for Long-Horizon Tasks](https://arxiv.org/abs/2606.07723)，2026。
10. [Vesta: A Generalist Hierarchical Agent for Robot Tasks](https://arxiv.org/abs/2606.20905)，2026。
11. [VLAs-as-Tools](https://arxiv.org/abs/2605.13119)，2026。
12. [ALRM](https://arxiv.org/abs/2601.19510)，2026。
13. [Towards the Harness of Embodied Agents (THEA)](https://arxiv.org/abs/2608.11246)，2026。
14. [RPent](https://arxiv.org/abs/2607.08448)，2026。
15. [PhyAgentOS](https://arxiv.org/abs/2607.16636)，2026。
16. [CaP-X / CaP-Agent0](https://arxiv.org/abs/2603.22435)，2026。
17. [RoboClaw](https://arxiv.org/abs/2603.11558)，2026。
18. [ASPIRE](https://arxiv.org/abs/2607.00272)，2026。
19. [RoboRSI Research Preview](https://robo-rsi.com/blog/2-roborsi-research-preview/)，2026。
20. [RoboHarness: Memory-Driven Orchestration of Heterogeneous Policies](https://arxiv.org/abs/2607.18060)，2026。
