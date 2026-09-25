---
title: System 2 与 System 1 的执行契约：以 FlagOS-Robo 为例
tabTitle: System 2 与 System 1 的执行契约
description: 以 FlagOS-Robo 为例看 System 2 与 System 1 的执行契约：目标、反馈、取消、超时、幂等与降级的接口语义。
order: "10"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: ROBO DEPLOYMENT · CASE STUDY
cardMeta: Robo Deployment · Case Study   # 首页卡片右上角，比文章页眉短
summary: 目标、执行、反馈、取消、超时与降级的接口语义，以及公开设计与个人判断的分界。
footer: Robo Deployment
---

::: note
公开资料 case study。本文评估的是架构与接口，不是已经跑通的真机复现实验；「公开设计」「工程判断」「待验证」分别说明。
:::

::: tldr
一个公开案例能支撑的结论，取决于它公开到了哪一层。本文把内容分成三层并始终标明：**公开设计**（文档与论文明确写出的）、**工程判断**（我基于公开架构提出的接口方案）、**待验证**（既不在文档里、也没有验证过，例如调用频率、ROS Action 映射、断网恢复）。

在两个可核验的公开设计之上——FlagOS-Robo 的 VLM / VLA 训练与 Serving 工具链，以及 RoboOS 的 Brain–Cerebellum 分层与共享记忆——本文要问的是：**System 2 与 System 1 之间的执行契约应该长什么样**。

接口语义里最容易被跳过的是**幂等与降级**：物理动作重复执行有真实代价（碰撞、物体损坏、设备磨损），所以「失败就重试」不能是默认策略；而云端不可达时的能力阶梯也必须预先定义，否则断网等于停机。
:::

::: question
一个公开案例中的目标、执行、反馈、取消、超时、幂等与降级，这些接口语义应当如何理解与设计？
:::

[FlagOS](https://flagos.io/Home) 是面向多种 AI 芯片的系统软件栈，不能直接等同于机器人 Agent Runtime[@1]。其领域项目 [FlagOS-Robo](https://docs.flagos.io/projects/FlagOS-Robo/en/latest/flagos-robo-user-guide.html) 把 VLM / VLA 的数据加载、训练、推理、Serving 和评测串起来，支持端到云部署[@2][@3]；与之关联的 [RoboOS](https://github.com/FlagOpen/RoboOS) 则给出了 Brain–Cerebellum 的分层 Agent 系统[@4]。评估 System 2 与 System 1 的交互，需要把「模型能部署」与「任务能闭环执行」分开。

<figure class="rsi-mini"><figcaption>本文的证据分级 · 三类内容不混写</figcaption><div class="rsi-mini-branches"><div><strong>公开设计</strong><span>官方文档与论文明确写出的架构、模块与接口示例</span></div><div><strong>工程判断</strong><span>我基于公开架构提出的接口方案，标注为判断而非事实</span></div><div><strong>待验证</strong><span>调用频率、ROS Action 映射、断网恢复、端到端时延</span></div></div></figure>

## 公开设计：端云怎么切

[RoboOS 论文](https://arxiv.org/html/2505.03673v2) 中，云端 Embodied Brain 处理全局任务、任务分解、工具调用和错误纠正；机器人端 Cerebellum Skill Library 执行 VLA、导航或专家技能；Shared Memory 保存空间关系、任务反馈、工具调用历史与机器人状态。FlagScale 是模型训练 / 推理入口，FlagOS-Robo 给出 VLM / VLA 的 Serving 示例。这是「云端高层认知 + 机器人端技能执行」的一种具体切分，但不能据此断言 ROS 控制器、完整 Harness 或所有技能的部署位置都已由 FlagOS-Robo 统一实现。

## System 2 Agent 与 System 1 的交互

论文描述的链路是：收到全局任务后，Brain 从 Shared Memory 取得场景、状态与技能信息，先生成子任务图；Monitor 按图的依赖关系分配可并行或串行的任务；每个子任务由 Agent 根据反馈和部分记忆选择并调用 Skill / Tool；执行失败时，Agent 可继续检索空间信息、换工具或恢复执行，执行结果再写回 Memory[@4]。这更像「先形成计划图、执行中局部闭环」：不能把它简化为每个控制周期都重新生成完整计划，也没有证据说明高层 Planner 始终按固定频率调用。

在此框架里，System 1 不只是一种 VLA：Cerebellum 可以包含 VLA Policy、导航与传统专家技能。System 2 发的是子任务和工具选择，System 1 / Skill 发回进度、成功、失败和环境变化；动作生成和高频控制仍要与高层任务调度区分。[PI0 Serving 示例](https://github.com/flagos-ai/FlagScale/blob/main/examples/pi0/README.md) 明确了图像键、机器人状态、任务 instruction 等 Policy 输入[@5]，但示例级 Serving 不等于已公布统一的 Agent↔Policy 协议。

## 工程判断：真正落地还缺哪些契约

如果把这套结构接入一台真实机器人，我会首先定义子任务 / Skill 调用的 goal、feedback、result、cancel 与超时语义；固定 observation、机器人状态和任务 ID 在云端 Brain、边缘调度器与 Policy 服务之间的归属；让 Planner 低频或由关键事件触发，Monitor / 完成判定可更频繁运行，高频控制留在机器人本地。这里是基于公开架构提出的接口方案，**不是** FlagOS-Robo 已公开实现的调用频率、ROS Action 映射或网络故障恢复机制。

## 接口语义清单：七个必须写死的字段

把上面那套结构接到真实机器人上，我会先定义下面这张清单。它是**工程判断**，不是 FlagOS-Robo 已公开的实现细节。

| 语义 | 需要定义的核心内容 | 不定义会怎样 |
| --- | --- | --- |
| **goal** | 子任务的可验证目标描述、任务 ID、版本号 | 无法判断是否完成；重试会重复执行 |
| **feedback** | 进度、中间观测、部分结果的**内容与上报频率** | 高层只能等结束才知道进展，无法提前干预 |
| **result** | 终态（成功 / 失败 / 超时 / 取消）+ 证据 + 可恢复标记 | 失败原因无法分层归因 |
| **cancel** | 取消何时生效、是否可中断、中断后的资源回收 | 撤销之后动作仍在执行，状态错乱 |
| **超时** | 由谁计时、超时归属哪一方、迟到结果如何处置 | 迟到结果被当作当前状态，状态机被污染 |
| **幂等** | 同一 goal 重复下发是否安全、是否带幂等键去重 | 重试导致物理动作被执行两次 |
| **降级** | 云端不可达时的本地兜底与能力阶梯 | 断网即停机，或任务被静默丢弃 |

其中 goal / feedback / result / cancel 属于通用 Agent 接口设计，后三项是**物理系统额外要求的**，也是本文想强调的部分。

## 幂等与降级：物理系统里最容易被跳过的一环

软件 Agent 里「失败就重试」几乎是无成本的默认策略；到了物理系统，这条默认策略不成立。一次重复执行意味着第二次抓取、第二次移动、第二次可能碰撞——代价是真实的，而且不可回滚。

因此重试必须建立在两个前提上：

1. **幂等键**：每次 goal 下发携带唯一键，执行端对重复键直接返回上一次结果，而不是重新执行；
2. **按目标状态判断而非按动作重放**：「物体是否已经在目标位置」比「再执行一次放置动作」更安全。前者可在任意时刻重新求值，后者假定环境回到了之前的状态。

这两条都属于工程判断，公开材料里没有说明它们是否已被实现。

**降级**同样需要预先设计，而且要落到**能力阶梯**上，而不是一句「断网后进入安全模式」：

- 云端 Brain 不可达时，机器人端能否独立完成已加载的技能？能完成哪些、不能完成哪些？
- 只能执行预定义技能时，任务队列如何处理——挂起、丢弃，还是转交人工？
- 断网期间产生的状态变化，在恢复后如何与云端 Shared Memory **对账**？离线期间物体被移动过，云端记忆已经过期。

这几问没有标准答案，但它们必须在部署前逐条回答。一个系统是否真的可部署，很大程度上就看它有没有回答过这些问题。

## 评价与验证边界

FlagOS-Robo 适合作为 VLM / VLA 的跨硬件训练、Serving 与评测底座；RoboOS 提供了更完整的任务图、子任务 Agent、Skill Library 和共享记忆参考实现。但两者连用时，仍需验证跨服务端到端时延、图像上行与 VLM 推理成本、Policy 返回动作的时限、技能完成判定、取消 / 重规划、断网降级以及多机器人并发。论文报告的快速命令响应是通信链路指标，不能直接当作「观测→VLM 规划→Policy 动作→真机反馈」全链路时延。最终应以同任务集的 System 2 开 / 关对照、任务完成率、恢复率及端到端 Trace / Replay 检验收益。

::: my-take
我认为这类公开案例的读法比结论更重要：**把「文档写了的」「我推断的」「还没验证的」三层明确分开**。

FlagOS-Robo 的文档能支撑「VLM / VLA 有跨硬件训练与 Serving 工具链」这一层；RoboOS 论文能支撑「Brain–Cerebellum 分层与共享记忆」这一层；而端到端时延、取消语义、幂等与断网降级在物理系统上的实际表现，目前都还没有公开证据。把第一层当作第三层的结论，是这个领域最常见、也最难被发现的过度引用——因为它读起来完全像是事实陈述。
:::

## 参考文献 {#references}

1. [FlagOS: Overview](https://docs.flagos.io/en/latest/overview.html)，官方文档。跨硬件系统软件概览。
2. [FlagOS-Robo: User Guide](https://docs.flagos.io/projects/FlagOS-Robo/en/latest/flagos-robo-user-guide.html)，官方文档。VLM / VLA 工具链与 Serving。
3. [FlagOS-Robo](https://github.com/flagos-ai/FlagOS-Robo)，官方项目仓库。
4. [RoboOS: A Hierarchical Embodied Framework for Cross-Embodiment and Multi-Agent Collaboration](https://arxiv.org/html/2505.03673v2)，2025。Brain–Cerebellum 系统设计。
5. [FlagScale: π0 Serving Example](https://github.com/flagos-ai/FlagScale/blob/main/examples/pi0/README.md)，官方示例。Policy 输入与部署参考。
