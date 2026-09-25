---
title: Robot Agent System 2：规划、执行与系统闭环
tabTitle: Robot Agent System 2
description: 从认知、编排、执行与反馈四个平面理解 Robot Harness，以及 Robot Agent System 2 的规划、执行与系统闭环。
order: "08"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: ROBOT AGENT · FRAMEWORK
cardMeta: Robot Agent   # 首页卡片右上角，比文章页眉短
summary: 从主循环与四类调度协议出发，理解 Robot Harness 的认知、控制、执行、反馈与能力演化闭环。
footer: Robot Agent
---

::: tldr
谈到 Robot Agent 的 System 2，多数讨论停在「Planner 要更聪明」。但决定系统能否工作的，通常是**它怎样被接入一个持续运行的物理闭环**：规划结果要被绑定到可执行能力、在合适时刻下发、执行中受监控、状态变化后失效，并按真实结果决定继续、重试、重规划还是安全停止。承担这些职责的系统层，本文称为 **Robot Harness**。

全文用三件事组织这套认知：

1. **主循环**——用「谁决策、何时决策、依据什么状态、输出什么决策」四问替代模块罗列；
2. **四个平面**——认知、控制、执行、反馈，界定 Harness 的职责边界；
3. **一条从目标到反馈的完整执行轨迹**——把上面的职责还原到时间顺序上，逐步标出介入的平面与典型失败。

三个核心判断：**反馈必须改变控制流**，否则系统只是在重复执行；**Memory 不是存储模块，而是状态跨时间的持久化协议**；**Harness 既是可靠性边界，也是评测单位**。

四层评测概览保留在本文，但判分接口与逐层失败归因交给《Robot Agent 评测：从模型能力到系统调度》。
:::

::: question
Planner、Harness、工具、Policy 与环境如何分工？反馈在什么条件下才真正改变控制流？
:::

谈到机器人的 System 2，人们首先想到的往往是一个“更会思考”的大模型：理解任务、拆解步骤、判断进度，并在失败后重新规划。但把视线从模型拉到整个机器人系统，就会发现真正决定 System 2 能否工作的，通常不是 Planner 单次回答得多聪明，而是它怎样被接入一个持续运行的物理闭环。

规划结果不会自己变成机器人动作。它需要被绑定到可执行能力，在合适的时刻下发，在执行过程中接受监控，在状态变化后失效，并根据真实结果决定继续、重试、重规划还是安全停止。承担这些职责的系统层，可以统一称为 **Robot Harness**。

> Robot Agent 不是“Planner 加 VLA”的简单串联，而是一套跨越认知、编排、执行和反馈的运行时系统。

<figure class="rsi-mini"><figcaption>总览 · 一个主循环，四个平面：Harness 的职责边界</figcaption><div class="rsi-mini-branches rsi-four"><div><strong>认知面 · 把任务变成决策</strong><span>目标理解、任务分解、工具选择、进度判断、失败解释</span></div><div><strong>控制面 · 决定谁能在何时做什么</strong><span>能力绑定、参数校验、权限与安全约束、取消与超时</span></div><div><strong>执行面 · 把抽象意图落到物理能力</strong><span>Skill / Policy / Controller 调用、切换开销、状态一致性</span></div><div><strong>反馈面 · 把结果变成可决策状态</strong><span>观测与事件聚合、完成性判定、迟到结果识别、回写 Memory</span></div></div></figure>

## 从双系统模型到双系统机器人

在机器人语境中，System 1 与 System 2 对应两种不同时间尺度上的能力：

- **System 1 面向连续控制：**根据当前观测快速输出动作或 action chunk，典型实现包括 VLA、模仿学习或强化学习 Policy、传统控制器与预定义 Skill。
- **System 2 面向任务级认知：**理解长程目标、分解任务、选择工具、判断进度、解释失败并调整计划，典型实现包括 LLM/VLM Planner、Agent、Critic 或 World Model。

System 1 运行得快，但通常只对局部动作负责；System 2 看得更远，却无法以大模型的推理速度直接承担实时控制。一个可运行的 Robot Agent 因此不是两层，而是至少三层：

::: note
**用户目标／任务约束**<br>↓<br>**System 2：认知与决策**<br>↓ Plan / Subtask / Tool Call<br>**Robot Harness：编排与运行时**<br>↓ 绑定、调度、参数与安全约束<br>**System 1：Policy / Skill / Controller**<br>↓<br>**机器人与物理环境**<br>↳ Observation / Event / Result → Harness → System 2
:::

中间的 Harness 既不是 Planner 的 prompt wrapper，也不只是 ROS 节点或工具列表。它是位于语言级意图与连续物理执行之间的**运行时桥接层**：把高层决策变成受约束、可观测、可中断的执行过程，再把物理世界的结果组织成下一轮决策可以消费的状态。

这一「高层认知 + 中间编排 + 低层执行」的分层不是本文独有的划分。RoboOS 用 Brain–Cerebellum 结构组织跨本体与多 Agent 协作，把具身大脑与实时小脑分层部署 [@10]；对分层 VLA Agent 的系统性研究也表明，编排方式本身会带来稳定的性能差异 [@9]，而不是被底层 Policy 的能力完全决定。这两点合起来支持本文的立场：**Harness 是一个独立的设计变量，而不是 Policy 的附属品。**

## 理解 Harness：不要先数模块，要先看主循环

常见架构图会列出 Planner、Memory、Verifier、Monitor、Skill Registry、Context Manager 和 Recovery。这样的图说明系统“拥有什么”，却没有说明系统“怎样运行”。同一组模块完全可以组成不同的 Agent。

判断一套 Harness 架构，首先应该回答四个问题：

- **谁做决策：**统一 Agent、专用 Planner，还是 Planner、Critic、Verifier 多角色协作？
- **何时做决策：**固定时间、固定 action chunk、子任务完成、工具返回，还是异常发生时？
- **依据什么状态：**当前观测、滑动窗口、结构化世界状态、计划游标、摘要记忆，还是完整 transcript？
- **输出什么决策：**下一条自然语言目标、完整计划、结构化 Tool Call、代码，还是 Done / Retry / Replan？

这四个问题共同定义 Harness 的**主循环**。一个足够通用的骨架是：

::: note
**Trigger** → Build State → Model Decision → Ground & Validate → Dispatch → Observe Result → Update State → **Continue / Retry / Replan / Stop**
:::

主循环决定控制权如何移动，Memory、Verifier 和 Monitor 则是插入其中的副循环。一旦触发策略、状态推进或决策接口改变，系统的运行语义也会改变。Harness 的核心不是框里有哪些模块，而是**谁在什么时刻，拿什么状态，做什么决策**。

## 四种典型的规划—执行协议

沿着“高层决策如何生成、何时刷新、怎样推进”，目前的系统大致可以归纳为四类 rollout protocol。它们不是按能力高低排序，而是四种不同的运行方式。

::: list method-list
1. **01 · 固定频率／固定边界文本调度**<br>Observe → Predict Next Goal → Execute N Chunks → Observe。高层模型按固定秒数、固定 action chunk 或约定边界刷新文本指令。它实现简单，不依赖完善的语义完成检测，适合作为双系统机器人的最小基线；但刷新时机未必与任务语义对齐，过快会浪费推理并造成指令抖动，过慢则可能继续执行已经失效的子目标。WALL-OSS、MiniCPM-RobotManip 等模型内的“先生成 Subtask，再生成动作”更接近这类结构。
2. **02 · Agentic Next-Goal / Next-Subtask**<br>Observe → Decide One Subtask → Execute Until Event → Update → Decide Again。Agent 每次只决定当前最合适的下一步，不要求事先生成完整计划。它天然适应开放环境，但强依赖可靠的事件源、完成检测和状态更新。早期的 [SayCan](https://say-can.github.io/)[@1] 展示了逐 Skill 选择，[Inner Monologue](https://innermonologue.github.io/)[@2] 则把环境反馈写回下一轮规划。
3. **03 · Full-Plan / Plan-Execute**<br>Generate Plan → Save Plan & Cursor → Execute Node → Verify → Advance or Replan。Planner 先生成完整的子目标序列、程序或任务图，Harness 保存计划结构和执行游标。它便于全局约束检查、人工审阅和失败归因，但必须定义节点的前置条件、后置条件，以及局部修改与全量重规划的边界。[SayPlan](https://sayplan.github.io/)[@3] 利用 3D Scene Graph 进行计划生成和可行性验证；[Code as Policies](https://code-as-policies.github.io/)[@4] 用可执行程序隐式表达控制流。
4. **04 · ReAct / Coding-Agent 式长程编排**<br>Model → Tool Call → Tool Result → Append Context → Model。系统持续积累推理、工具调用、执行结果、错误和多模态证据。Agent 不只选择 Subtask，还可以动态调用感知、诊断、代码执行、Policy、仿真或记忆工具。它表达能力强，但同时带来上下文增长、工具安全、长程信用分配和运行时不确定性。调研中的 [THEA](https://github.com/EIT-HAI/Thea)[@5]、[RoboRSI](https://github.com/nssmd/RoboRSI)[@6]、[CaP-X](https://capgym.github.io/)[@7] 和 [ASPIRE](https://github.com/NVlabs/ASPIRE)[@8] 都体现了不同程度的 Agentic Harness 化。
:::

这四类协议可以共享基础设施，却不一定能通过开关几个模块彼此“退化”。固定周期不需要等待语义事件，事件驱动系统却必须处理事件丢失、误判与超时；Full-Plan 必须维护游标，Coding-Agent 则必须维护工具 transcript。工程上更现实的做法，是共享统一状态与执行协议，同时承认各自不同的调度语义。

## Harness 的四个平面

为了避免把系统理解成平铺的模块集合，可以把 Harness 看成认知面、控制面、执行面和反馈面。四者不是流水线上的一次性步骤，而是相互闭合的系统平面。

### 认知面：把任务变成决策

认知面包含 Planner / Agent、Critic、World Model，以及必要的 Memory / Retriever。它消费任务目标、当前状态和历史证据，输出 Plan、Subtask、Tool Call 或恢复决策。这里不一定需要多个大模型：首期可以用一个强 VLM 覆盖 Planner、Critic 与 Completion，验证能力上限；当成本成为瓶颈后，再把高频完成检测、异常识别和摘要下沉到小模型或确定性程序。

### 控制面：决定谁能在什么时候做什么

控制面是 Harness 最核心、也最容易被低估的部分。它维护 Trigger Policy、Task / Session / Plan 状态与执行游标；完成 Skill 注册、参数绑定、权限校验、资源锁、互斥、超时、抢占和优先级；并负责取消、去重、版本检查、迟到响应丢弃、Retry、Fallback、Replan、Human Handoff 与 Safe Stop。

> Agent 负责提出意图，Harness 负责授予和回收执行权。

### 执行面：把抽象意图落到物理能力

执行面并不只包含 VLA。真实系统往往同时管理 learned policy、导航与抓取 Skill、TAMP、行为树、状态机、传统控制器、ROS / ROS 2 与厂商 SDK。Harness 需要用统一的 capability contract 描述这些异构能力：输入参数、适用场景、前置与后置条件、超时、可中断性、安全边界和返回结果。只有这样，“更换 Policy”才不是架构图上的一句话，而是可验证的 adapter 契约。

### 反馈面：把动作结果变成可决策状态

执行层产生的是图像、力、位姿、控制器状态、错误码和轨迹，而 Planner 需要的是“杯子是否抓稳”“柜门是否打开”“计划是否仍可执行”。反馈面通过 Observation 对齐、Progress / Completion / Post-condition 判断、异常检测、证据打包、Trace 与 Replay，把连续物理过程压缩成能够驱动下一次状态转移的证据。

## 闭环的关键：反馈必须改变控制流

“再次读取图像”并不自动等于系统闭环。有效的反馈至少要参与三类判断：

- **有效性：**当前模型响应是否仍对应最新 Observation、Task Turn 和 Plan Version？
- **完成性：**当前 Skill 的后置条件是否满足，是继续、完成，还是证据不足？
- **可恢复性：**失败来自感知、规划、参数绑定、Policy OOD、控制器还是环境扰动，应重试、换技能、重规划还是停止？

因此，执行结果不应只有 `success=true/false`，而应该携带 Task / Turn / Plan Version、Skill、Status、Reason、Progress、Evidence、Recoverable 和 Recommended Transition。结构化反馈让 Harness 能用确定性逻辑处理明确情况，只把真正需要语义推理的部分交给模型，也使失败可以跨 Planner、Harness、Policy 和 Controller 分层归因。

## 一条完整的执行轨迹：从目标到反馈

上面的原则说起来抽象，放到一条轨迹上会清楚很多。下面是一个移动操作类任务（把指定物体取回并放到目标位置）的**示意流程**——它不是某次真实部署的记录，而是一副用来定位职责的骨架。每一步后面标出介入的平面，以及这一步最典型的失败方式。

| # | 环节 | 介入平面 | 典型失败 |
| --- | --- | --- | --- |
| 1 | **目标进入**：把自由文本目标绑定到当前场景与可执行能力集合，判断是否有可执行解释 | 反馈面 → 认知面 | 目标在场景里客观无解，Planner 却已经开始分解 |
| 2 | **任务分解**：产出子目标序列与首个 Tool Call | 认知面 | 子目标引用不存在的能力或物体；顺序与物理约束冲突 |
| 3 | **能力绑定与参数校验**：绑定到具体 Skill / Policy，检查参数类型、可达性、权限与安全约束 | 控制面 | 参数合法但语义不符（目标物体在另一侧）；超出工作空间 |
| 4 | **下发与执行**：调用 Policy / Controller，记录下发时刻与超时预算，并置于可监控、可中断状态 | 执行面 | Policy 本身失败；执行时间超出预算 |
| 5 | **过程监控**：持续检查进度与安全条件，决定继续 / 重试 / 取消 | 控制面 + 执行面 | 只看最终结果，于是「卡住」被误判为「仍在执行」 |
| 6 | **结果与事件回传**：把观测、错误码、迟到结果与部分成功聚合为可决策状态 | 反馈面 | **迟到结果**（已取消的动作事后返回）被当成当前状态，导致状态错乱 |
| 7 | **控制流改变或不变**：据反馈决定继续、重规划、降级或安全停止 | 认知面 | 重规划产出的动作序列与上一次几乎相同——反馈没有改变控制流 |
| 8 | **状态持久化**：把经验、有效的参数绑定与失败原因写入跨任务可复用的状态 | Memory | 只记结果不记条件，下次在完全不同的场景里复用了一个不成立的结论 |

这条轨迹的作用是把「Harness 到底做了什么」变成一张**可逐项核对的清单**。它也能解释 Harness 缺失时的典型症状：如果某个环节在系统里没有明确的职责归属，它大概率会被悄悄塞进 Planner 的 prompt——于是超时、取消、迟到结果与状态一致性这些确定性问题，都被交给了一个概率模型去「注意」。

## Memory 不是一个框，而是状态如何跨时间存在

不同架构中的 Memory 可能是完全不同的机制：滑动窗口保留最近观测；外部 Summary 将历史压缩成 prompt 字段；递归记忆让 Planner 读取 `memory_t` 并输出 `memory_{t+1}`；完整 Transcript 保存多轮工具调用；检索式记忆则从历史任务、Skill 和失败规则中按需召回。

所以架构设计不能只写“有 Memory”，而要回答：谁写、何时写、存什么、谁读、如何遗忘，以及错误记忆如何被纠正。Memory 的真实含义，是状态跨时间、跨步骤甚至跨 rollout 的持久化协议。

## 从任务闭环到能力演化闭环

Robot Agent 至少存在三个嵌套的时间尺度：

- **毫秒—秒，动作闭环：**Policy、Controller 和传感器高频交互，保证局部动作稳定。
- **秒—分钟，任务闭环：**Planner 与 Harness 在子任务边界、工具结果或异常事件上推进计划。
- **小时—天，学习与演化闭环：**系统积累成功轨迹、失败规则、视频和日志，用于 SFT、Agentic RL、Skill 编译、Policy 更新或 Harness 规则改进。

三个闭环必须由同一条可追踪的数据链连接。每次决策至少记录 Task、Runtime Type、Trigger Reason、Observation Version、State、Memory、Decision、Execution Result、Termination 与 Reward。这样数据回流的基本单位才与线上推理协议一致。

::: note
**确定主循环与 inference contract** → 少量 SFT 建立合法接口和非零成功率 → 在真实或仿真 Harness 中 rollout → Agentic RL 优化长程决策与恢复 → 回放、评测、灰度与回滚
:::

SFT 首先解决“模型能否按这套运行时协议行动”，RL 再解决“它能否利用执行反馈做得更好”。如果线上与训练时的状态、动作和工具语义不同，Agentic RL 很容易优化一个并不存在于部署系统中的代理任务。

## 真实部署中，Harness 还是可靠性边界

一旦 System 2 依赖云端模型或多个异步服务，Harness 还要处理模型架构图中看不到的问题：

- 新观测到达后，旧推理请求已经失效，必须能够 Cancel；
- 迟到响应必须携带 Session、Turn 与 Observation Version，不能被机器人误执行；
- 超时重试需要幂等键，避免一个逻辑决策被消费两次；
- Planner、Verifier、Monitor 和后台 Summary 需要不同优先级与 deadline；
- 多机器人之间的 Context、Cache 与执行权限必须隔离；
- 模型、Prompt、Schema、Processor 和 Policy 版本需要进入同一条 Trace；
- 自动恢复必须受最大重试次数、安全 envelope 与人工接管条件约束。

这说明 Harness 同时具有两种身份：对上，它是 Agent 的工具与状态环境；对下，它是机器人的执行治理与安全边界。

## 怎样评价一套 Robot Agent 架构

只看最终任务成功率，会把规划错误、接口错误、执行失败和安全问题混在一起。评测至少应该分成四层：

::: list method-list
1. **Planner：**计划可行率、下一步正确率、Tool Call 合法率与重规划质量。
2. **Harness：**参数绑定正确率、调度延迟、取消成功率、迟到结果识别率与状态一致性。
3. **Execution：**Skill / Policy 成功率、切换开销、控制稳定性、OOD 与超时率。
4. **Closed Loop：**长程任务成功率、恢复率、安全违规率、人工介入率与每成功任务成本。
:::

还需要专门做模块消融：移除 Memory、Verifier、Monitor 或 Recovery 后，主循环是否仍然成立？性能下降来自模块本身，还是接口与调用预算同时发生了变化？只有把系统机制和评测单位对齐，才能区分 Planner 的收益、底层 Policy 的收益与调度策略的系统成本。

本节只保留分层概览。**具体的判分接口、执行轨迹字段与逐层失败归因的做法，见 [Robot Agent 评测：从模型能力到系统调度](robot-agent-evaluation.html)**——那篇回答「怎样测量和归因」，本文回答「怎样运行」。

## 一个更准确的 Robot Agent 心智模型

::: note
**Robot Agent**<br>= System 2 cognition<br>+ Harness runtime<br>+ System 1 execution<br>+ physical feedback<br>+ lifecycle learning
:::

Planner 决定“想做什么”；Harness 决定“现在能否做、由谁做、做到何时、结果是否仍有效”；Policy 与 Controller 决定“动作怎样发生”；Verifier 与环境反馈决定“世界是否真的按预期改变”；数据与训练闭环决定“下一版系统是否会更好”。

因此，Harness 不是附着在强模型旁边的一层胶水，而是 Robot Agent 的系统性主体。它把离散、低频、语言化的 System 2 决策，转化为连续、异步、带约束的物理执行；也把嘈杂的真实世界，转化为模型可以再次推理的状态和证据。

如果说 VLA 让机器人获得了通用动作能力，Planner 让机器人获得了长程任务认知，那么 Harness 解决的就是第三个问题：**怎样让认知与行动在真实世界中持续、可靠地闭合起来。**

## 方法与文献入口

本文保留宏观架构与判断框架；具体系统按照固定边界、Next-Goal、Full-Plan 与 Coding-Agent Harness 分类整理在独立目录中，并标注论文架构、开源实现和真实执行闭环之间的边界。

::: method-link
[查看 Robot Agent System 2 方法文献目录 <span aria-hidden="true">↗</span>](robot-agent-system2-methods.html)<span>Planner–Policy 调度、Robot Harness、执行反馈、记忆与恢复的代表工作</span>
:::

::: my-take
这套系统层讨论里最值得记住的一句是：**反馈必须改变控制流，否则循环只是重复执行。** 判别方法很具体——把两次重规划产出的动作序列放在一起比较，如果几乎相同，那这次「重规划」并没有真正消费反馈。

由此引出一个更一般的判据：判断一个 Robot Agent 是否真的闭环，不要看它有没有 Memory 模块或 Monitor 模块，而要看**同一个失败在相同条件下重演时，系统的后续行为是否稳定地不同**。模块列表可以照抄，这条性质抄不走。
:::

## 参考文献 {#references}

1. [Do As I Can, Not As I Say: Grounding Language in Robotic Affordances](https://arxiv.org/abs/2204.01691)，2022。
2. [Inner Monologue: Embodied Reasoning through Planning with Language Models](https://arxiv.org/abs/2207.05608)，2022。
3. [SayPlan: Grounding Large Language Models using 3D Scene Graphs for Scalable Robot Task Planning](https://arxiv.org/abs/2307.06135)，2023。
4. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753)，2022。
5. [THEA: Towards the Harness of Embodied Agents](https://arxiv.org/abs/2608.11246)，2026。
6. [RoboRSI](https://github.com/nssmd/RoboRSI)，面向机器人技能与执行反馈的多角色自改进系统。
7. [CaP-X / CaP-Agent0](https://capgym.github.io/)，多轮生成、执行与修复机器人代码的 Harness。
8. [ASPIRE](https://github.com/NVlabs/ASPIRE)，基于多模态执行轨迹进行 code-as-policy 生成与修复。
9. [What Matters in Orchestrating Robot Policies: A Systematic Study of Hierarchical VLA Agents](https://arxiv.org/abs/2606.10267)，2026。
10. [RoboOS: A Hierarchical Embodied Framework for Cross-Embodiment and Multi-Agent Collaboration](https://arxiv.org/abs/2505.03673)，2025。
