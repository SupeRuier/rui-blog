---
title: 具身调度与部署：运行时框架总览
tabTitle: 运行时框架总览
description: Global Master—Robot Agent 的具身 Multi-Agent 调度框架：目标架构、控制面边界、单机器人时序与预留接口。
order: "20"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: RUNTIME · MULTI-AGENT · SCHEDULING · DEPLOYMENT
cardMeta: Runtime · Multi-Agent Scheduling
summary: Global Master—Robot Agent 的具身 Multi-Agent 调度框架：目标架构、控制面边界、时序与预留接口。
pinned: 置顶 · 框架总览
footer: Embodied Runtime Framework
---

::: note
框架草案 V0.2，只描述**真实运行时的调度与部署**，不含模型训练与数据生产链路。核心判断是：**Global Master—Robot Agent 本质上就是具身场景中的 Multi-Agent 调度结构**——Global Master 类似 Supervisor / Manager Agent，每个 Robot Agent 类似一个具备独立工具与执行环境的 Worker Agent；区别在于机器人任务是**长时、异步、有物理安全约束**的，不能照搬纯软件 Agent 的同步 tool call。现阶段从**单机器人端侧 Harness** 做起，云端 Global Master 只预留**控制面接口**，先不实现多机器人调度；将来把任务入口换成 Master，不需要改动机器人内部执行链。标为「公开参照」的是可核验的公开工作，其余为本文提出的设计。
::: note
框架草案 V0.2。本文只描述**真实运行时的调度与部署**，不含模型训练与数据生产链路。

核心判断：**Global Master—Robot Agent 本质上就是具身场景中的 Multi-Agent 调度结构。** Global Master 类似 Supervisor / Manager Agent；每个 Robot Agent 类似一个具备独立工具与执行环境的 Worker Agent。区别在于机器人任务是**长时、异步、有物理安全约束**的，不能照搬纯软件 Agent 的同步 tool call。

现阶段从**单机器人端侧 Harness** 做起；云端 Global Master 只预留**控制面接口**，先不实现多机器人调度。标为「公开参照」的是可核验的公开工作，其余为本文提出的设计。
:::

::: tldr
**Global Master—Robot Agent 就是具身场景中的 Multi-Agent 调度结构。** Global Master 相当于 Supervisor / Manager Agent，负责高层任务分配；每个 Robot Agent 相当于一个具备独立工具与执行环境的 Worker Agent，在本体侧自主完成局部规划与执行。

它和纯软件 Multi-Agent 的差别只有三点，但每一点都改变设计：任务**长时**、**异步**、**带物理安全约束**。因此不能照搬同步 tool call——软件里「失败就重试」几乎无成本，物理系统里一次重试意味着第二次抓取、第二次移动、第二次可能的碰撞，而且不可回滚。

由此得到本文的工程结论：**从单机器人端侧 Harness 做起，云端只预留控制面接口。**

- 云端 Master 只处理**低频、全局的控制面信息**，不碰 VLA、action chunk、ROS Topic 与高频循环；
- 边缘侧整体**就是一个 Robot Agent**，其真正核心是 **System 2 Harness**；Sys1 / RobotBackend / ROS 都是它可调用的执行能力；
- 现阶段用户直接调用 Robot Agent；将来把任务入口换成 Global Master，**不需要改动机器人内部执行链**——这正是先搭 Harness 的价值。

网络中断时，边缘端仍应能完成当前安全动作、暂停或取消 Policy、进入安全状态，并在恢复通信后继续上报。
:::

::: question
一条真实任务从上层进入、到本体执行、再回到反馈，中间由哪些层与组件承担？云端 Master 应该停在哪一层？
:::

## 01 · 核心模型：具身场景的 Multi-Agent 调度

把 Global Master 和 Robot Agent 放在一起看，它对应的就是 Multi-Agent 系统里最经典的一层结构——**Manager 分配任务，Worker 自主完成**：

| 维度 | 纯软件 Multi-Agent | 具身 Multi-Agent |
| --- | --- | --- |
| Manager | Supervisor / Manager Agent | Global Master / Fleet Control Plane |
| Worker | Worker Agent（有独立工具集） | Robot Agent（有独立工具集 **+ 本体 + 执行环境**） |
| 任务粒度 | 短、同步 tool call | 长时、异步、有物理后果 |
| 失败代价 | 重试几乎无成本 | 重试 = 第二次物理动作，**不可回滚** |
| 状态所在 | 上下文与存储里 | 一部分在**物理世界**，无法回滚 |
| 安全约束 | 权限与沙箱 | 权限 + 物理安全 + 设备损耗 + 人工接管 |
| 控制频率 | 无硬实时要求 | 高频控制**必须留在本地** |

这种 Manager–Worker 结构在具身领域已有公开参照：RoboOS 用 Brain–Cerebellum 分层把云端大脑与端侧技能库分开[@1]；Harness 化的具身 Agent 也给出了另一种分层切法[@8]。

**三点差异决定了架构，而不是细节差异：**

1. **长时。** 一个任务可能持续数分钟到数小时，中间会经历失败、恢复、重规划。同步请求-响应模型在这里不成立，必须有任务生命周期与状态机。
2. **异步。** 下发与执行解耦，结果可能在很久之后返回，**也可能在取消之后才返回**。迟到结果的处理必须写死在协议里，不能靠约定。
3. **物理安全约束。** 动作有不可逆的物理后果。安全不能作为调度的一个分支挂在高频循环上，必须是独立的、能在任何时刻抢占的层。

因此「把纯软件 Agent 的 tool call 换成机器人 API」这种照搬是不成立的：软件 Agent 可以把重试当默认策略，具身系统不能。

**结论：先做单机器人端侧 Harness，云端只预留控制面接口。** 这个顺序的好处是——将来接入 Global Master 时，只是把「任务入口」换掉，机器人内部的执行链不需要重构。

## 02 · 完整目标架构

<figure class="arch-map">
  <figcaption>总览 · 目标架构：云端控制面与模型服务、单机器人边缘端、实现层、ROS 2 与物理执行</figcaption>
  <div class="am-stack">
    <div class="am-tier">
      <div class="am-tier-label">云端<em>低频 · 全局</em></div>
      <div class="am-tier-body">
        <div class="am-group">
          <strong>可选 · Global Master / Fleet Control Plane</strong>
          <div class="am-nodes">
            <div class="am-node">Global Master<em>多机器人任务分配</em></div>
            <div class="am-node">Robot Registry<em>能力 · 在线状态 · 位置</em></div>
            <div class="am-node">Global Memory<em>全局任务与跨机器人状态</em></div>
          </div>
        </div>
        <div class="am-group">
          <strong>Sys2 Model Service</strong>
          <div class="am-nodes">
            <div class="am-node">Model Router<em>Planner / Critic / VQA</em></div>
            <div class="am-node">VLM / LLM / World Model</div>
            <div class="am-node">Model Serving<em>OpenAI API / HTTP / gRPC，可用 FlagScale</em></div>
          </div>
        </div>
      </div>
    </div>
    <div class="am-tier">
      <div class="am-tier-label">边缘端<em>单机器人 = 一个 Robot Agent</em></div>
      <div class="am-tier-body">
        <div class="am-node am-wide">Robot Control Plane Interface<em>注册 · 接收任务 · 心跳 · 取消 · 状态 · 结果上报</em></div>
        <div class="am-group">
          <strong>System 2 Harness —— 真正的 Agent / Harness 核心</strong>
          <div class="am-nodes">
            <div class="am-node">Task Manager<em>任务生命周期与状态机</em></div>
            <div class="am-node">Orchestrator<em>主调度循环</em></div>
            <div class="am-node">Context / Memory<em>目标 · 计划 · 历史 · 失败信息</em></div>
            <div class="am-node">Planner Client<em>Prompt 组装与结果解析</em></div>
            <div class="am-node">Monitor / Critic<em>成功 · 失败 · 超时 · 异常</em></div>
            <div class="am-node">Policy / Skill Scheduler<em>选择技能与执行策略</em></div>
          </div>
        </div>
        <div class="am-split">
          <div class="am-node">System 1 Policy Serving<em>VLA / WAM / 专用 Policy<br>Observation + Subtask → Action Chunk</em></div>
          <div class="am-node">Local Safety Supervisor<em>限位 · 碰撞 · 超时 · 急停 · 网络失联保护</em></div>
        </div>
        <div class="am-node am-wide">RobotBackend<em>统一真机与仿真接口</em></div>
      </div>
    </div>
    <div class="am-tier">
      <div class="am-tier-label">实现层<em>RobotBackend 的具体实现</em></div>
      <div class="am-tier-body">
        <div class="am-nodes">
          <div class="am-node">ROS2Backend</div>
          <div class="am-node">DirectSDKBackend</div>
          <div class="am-node">SimulatorBackend</div>
        </div>
      </div>
    </div>
    <div class="am-tier">
      <div class="am-tier-label">ROS 2 层</div>
      <div class="am-tier-body">
        <div class="am-nodes">
          <div class="am-node">Topic / Service / Action<em>TF2 · ros2_control</em></div>
          <div class="am-node">Robot Driver / Adapter</div>
        </div>
      </div>
    </div>
    <div class="am-tier">
      <div class="am-tier-label">物理执行层</div>
      <div class="am-tier-body">
        <div class="am-nodes">
          <div class="am-node">厂商 SDK / 私有协议</div>
          <div class="am-node">真实机器人<em>相机 · 机械臂 · 夹爪 · 底盘</em></div>
          <div class="am-node">CALVIN / LIBERO<em>Isaac Sim / Gazebo</em></div>
        </div>
      </div>
    </div>
  </div>
  <div class="am-legend">
    <span><b class="am-solid"></b>实线：现阶段需要实现的单机器人闭环</span>
    <span><b class="am-dashed"></b>虚线：未来多机器人调度的预留口</span>
  </div>
</figure>

读图的三条要点：

- **默认路径不经过云端 Master。** 用户或上层业务系统直接把任务下给边缘任务接口；Global Master 是**可选入口**，现阶段不实现多机器人调度。
- **真正需要实现的单机器人闭环**是 `Robot Control Plane Interface → System 2 Harness → Sys1 Policy + RobotBackend → ROS 2 / SDK → 真机或仿真`，并由 `Local Safety Supervisor` 旁路兜底。
- **云端的虚线只有一条**：Global Master ↔ Robot Control Plane Interface。这条线上跑的是 `TaskEnvelope` 与 `RobotStatus`，而不是动作。
- **两侧都有公开实现可参照**：服务侧可以把 VLM / VLA 的加载、推理与 Serving 串成工具链[@2]，端侧 Policy 的输入与部署接口也有公开示例[@3]。

## 03 · 云端 Master 停在哪一层

Global Master **只处理低频、全局的控制面信息**。它下发的单位是「任务」，不是「动作」；它接收的单位是「状态」，不是「观测流」。

**下发方向 —— `TaskEnvelope`：**

| 字段 | 含义 |
| --- | --- |
| `task_id` | 全局唯一标识，同时充当幂等键 |
| `global_goal` | 高层目标描述（不含具体动作） |
| `assigned_robot` | 指派给哪个 Robot Agent |
| `priority` | 优先级，用于抢占与排队 |
| `deadline` | 截止时间 |
| `constraints` | 安全、工作空间、时间窗等约束 |
| `cancellation_token` | 取消凭据，用于事后取消与迟到结果识别 |

**上报方向 —— `RobotStatus`：**

| 字段 | 含义 |
| --- | --- |
| `robot_id` | 机器人标识 |
| `capabilities` | 能力清单，直接影响 Master 的分配决策 |
| `online_state` | 在线状态 |
| `task_state` | 任务状态 |
| `current_subtask` | 当前子任务 |
| `progress` | 进度 |
| `failure_reason` | 失败原因 |
| `final_result` | 最终结果 |

**它不应该做的事**（这五条是这一节的纪律）：

- 直接调用端侧 VLA；
- 直接发送 action chunk；
- 直接调用 ROS Topic；
- 直接控制机械臂；
- 参与高频控制循环。

一旦突破其中任何一条，云端就变成了实时链路的一部分，**网络抖动会直接变成物理风险**，边缘端的自治能力也随之失效。

这也是安全必须独立成层的原因。大规模真机编排的公开实践同样把安全约束作为系统设计的一部分，而不是事后加在调度逻辑里的一个判断[@5]。

**因此网络中断时，边缘端仍然要能：**

1. 完成当前安全动作；
2. 暂停或取消 Policy；
3. 进入安全状态；
4. 恢复通信后继续上报。

这四条是「云端只做控制面」这个设计换来的收益。反过来说，如果断网后机器人只能停下来等指令，那么无论云端架构多完整，这套系统都还不具备真实部署条件。

## 04 · Robot Agent 的定义：整个边缘侧就是一个 Agent

在这套设计里，**边缘侧整体**才是一个 Robot Agent：

```text
Robot Agent
├── Control Plane Interface
├── System 2 Harness      ← 真正的 Agent / Harness 核心
├── System 1 Policy
├── RobotBackend
├── Safety Supervisor
└── ROS 2 / SDK / Simulator
```

其中 **System 2 Harness 是 Agent 本体**；Sys1 Policy、RobotBackend 与 ROS 2 层都属于**它可以调用的执行能力**，而不是并列的智能体。这条区分很重要：它决定了「谁负责决策、谁负责执行」在归因时不会含糊。

于是两种拓扑是同一个结构：

```text
未来多机器人：              当前单机器人：
Global Master              用户 / 上层业务系统
    ├── Robot Agent A           └── Robot Agent A
    ├── Robot Agent B
    └── Robot Agent C
```

**关键性质：把任务入口从「用户」换成「Global Master」，不需要改动机器人内部执行链。** 这正是先做端侧 Harness 的理由——多机器人调度是在**已有的、稳定的任务入口协议之上**加一层，而不是在每个机器人内部再加一层协调逻辑。

## 05 · 单机器人总时序

下面只画一个机器人。Global Master 是可选入口，不涉及多个 Agent 之间的协调。

**建立阶段（一次性）**

| 步 | 链路 | 内容 |
| --- | --- | --- |
| 1 | 用户 / 业务系统 → Global Master → 边缘任务接口 | 提交全局任务；Master 下发 `TaskEnvelope`，接口回确认 |
| 1′ | 用户 / 业务系统 → 边缘任务接口（**当前单机模式**） | 直接提交机器人任务 |
| 2 | 边缘任务接口 → Sys2 Harness | 创建任务并启动状态机 |
| 3 | Harness → RobotBackend → ROS 2 → 真机 / 仿真 | 获取初始观测，逐层返回标准化 `Observation` |
| 4 | Harness → 云端 Sys2 模型 | 目标 + 观测 + 可用 Policy + 历史 |
| 5 | 云端模型 → Harness | `next_subtask` + `success_condition`，Harness 保存计划与当前子任务 |

**子任务循环（每个 subtask 一次）**

| 步 | 链路 | 内容 | 频次 |
| --- | --- | --- | --- |
| 6 | Harness → RobotBackend → ROS 2 → 硬件 | 获取最新观测 | 高频 |
| 7 | Harness → 端侧 Sys1 Policy | `Observation` + `current_subtask` | 高频 |
| 8 | Sys1 → Harness | `Action Chunk` | 高频 |
| 9 | Harness → RobotBackend | `execute_action(action_chunk)` | 高频 |
| 10 | RobotBackend → ROS 2 / SDK → 硬件 | 执行动作并回传反馈 | |
| 11 | Harness 内部 **Monitor / Critic** 判定执行状态 | 见下面四个分支 | |

**Monitor 的四个分支**——这是整条时序里信息量最大的部分：

| 分支 | 条件 | 动作 |
| --- | --- | --- |
| **Subtask 成功** | 后置条件满足 | 标记完成，退出当前循环 |
| **可恢复的小偏差** | 子任务仍可行 | 保持 subtask，继续调用 VLA；**不打扰云端** |
| **Policy 失败或环境改变** | 子目标不再可行 | 带上失败信息与最新观测，请求 replan |
| **安全异常** | 限位 / 碰撞 / 超时 / 失联 | `cancel` / `emergency_stop`，由 RobotBackend 与本地安全监督器停止 |

第二个分支值得单独强调：**能由本地解决的小偏差不应该上升到云端。** 如果每次抓取偏移都触发一次 replan，云端就变成了高频链路的一部分，而这是第 03 节明令禁止的。

**收尾阶段**

| 步 | 链路 | 内容 |
| --- | --- | --- |
| 12 | Harness → 云端模型 | 当前结果 + 任务历史，请求下一步 |
| 13 | 云端模型 → Harness | `next_subtask` 或 `task_done` |
| 14a | 仍有下一子任务 → 更新 `current_subtask`，回到循环 |
| 14b | 任务结束 → 边缘任务接口 → Master（或直接返回用户） | 上报成功、失败与执行摘要 |

## 06 · 五个预留的云端控制面接口

现阶段即使不实现 Global Master，也可以先把这五个接口定义出来：

```text
register_robot(robot_profile)
heartbeat(robot_status)
submit_task(task_envelope)
cancel_task(task_id)
report_task_result(task_result)
```

**但这五个接口只由 `Robot Control Plane Interface` 消费，不能直接侵入 Harness 内部。** 端侧系统始终保持这条层级：

```text
外部任务来源（用户 / 未来：Global Master）
        ↓
Robot Control Plane Interface
        ↓
System 2 Harness
        ↓
Sys1 Policy + RobotBackend
```

这条约束的意义是：**任务来源的变化被封在接口层，不会渗透到调度与执行链路。** 以后加入 Global Master，本质上只是把「任务来源」从用户替换成云端 Manager，而 Sys2、Sys1、ROS 2 与真机控制链都不需要重构。

## 07 · 逻辑视图：七个运行阶段落在哪些组件上

架构图回答「有哪些层与组件」；把它们按运行阶段展开，回答的是「哪一步归谁、在哪一步最容易断」：

| 阶段 | 责任组件 | 产出 | 最典型的失败 |
| --- | --- | --- | --- |
| 01 任务接入 | Control Plane Interface → Task Manager | 可执行目标、任务 ID、幂等键 | 同一目标重复接入，被执行两次 |
| 02 认知规划 | Planner Client → 云端 Sys2 模型 | 计划、`next_subtask`、`success_condition` | 子目标引用不存在的能力；目标客观无解却已开始分解 |
| 03 契约校验 | Policy / Skill Scheduler + Local Safety Supervisor | 通过校验的可执行指令，或拒绝理由 | 参数合法但语义不符；坐标系与单位没有约定 |
| 04 编排调度 | Orchestrator（配合 Task Manager 状态机） | 技能选择与执行序列 | 超时未生效；技能切换开销失控；小偏差被上升为 replan |
| 05 执行控制 | Sys1 Policy Serving → RobotBackend | Action Chunk 与执行结果 | 动作没算完就已过期；卡住被误判为「仍在执行」 |
| 06 反馈归因 | Monitor / Critic + Context / Memory | 完成判定与失败归属 | 迟到结果被当成当前状态；把 Policy 失败记成调度失败 |
| 07 记忆状态 | Context / Memory（+ 云端 Global Memory） | 可跨任务复用的状态与失败规则 | 只记结果不记条件，下次在不成立的场景里复用结论 |

其中 04 阶段的编排对象是**异构的 Policy 与技能集合**——记忆驱动的异构 Policy 编排已有公开路线可参照[@4]。

**七个阶段里只有 02 与 06 需要真正的语义推理**，其余都应该是确定性的：能用状态机、队列、超时计时器和校验器解决的，就不该交给模型。

::: my-take
我认为这套分层里最容易被做错的分工是：**把本该由 Harness 用状态机解决的事，交给云端模型去「注意」**。超时、取消、幂等、迟到结果、安全抢占——这些是确定性问题，正确答案不依赖语义理解，只依赖有没有人负责。

所以判断一套具身调度系统是否成熟，我有一个很朴素的判据：**把 Planner 换成一个更弱的模型，系统会不会立刻崩。** 如果会，说明这条链路里的确定性职责还没有被真正承担起来，模型只是在替系统兜底。
:::

## 08 · 失败先定位到组件，再谈修复

框架的实用性最终体现在归因上。调度的确构成独立方差——对分层 VLA Agent 的系统性研究表明，编排方式本身会带来稳定的性能差异[@6]，而不是被底层 Policy 的能力完全决定；端侧 Policy 只是这条链的一环[@7]。

把 Policy 的失败记成调度问题，会引导团队去优化 Prompt；把接口契约缺失记成模型问题，会引导团队去堆数据。**完整的五层归因判据与判分接口见[评测一文](robot-agent-evaluation.html)**；本文只固定它在框架里的位置：归因发生在 06 阶段的 Monitor / Critic，产出的结论直接决定 02 阶段是否重规划。

## 09 · 与相邻文章的分工

| 文章 | 负责 |
| --- | --- |
| **本文** | 运行时框架与职责划分：目标架构、控制面边界、时序、预留接口 |
| [Robot Agent System 2](robot-agent-system2.html) | System 2 Harness 的内部机制：主循环四问、四个平面、一条执行轨迹 |
| [Robot Agent 评测](robot-agent-evaluation.html) | 怎样测量与归因：判分接口、执行轨迹字段、五层归因 |
| [具身 Policy](embodied-models.html) | Sys1 层：输入、动作表示、时间尺度与执行接口 |
| [System 2 与 System 1 的执行契约](flagos-robo-case-study.html) | 本文框架的一个具体公开实例（端云切分），已降为子页 |

## 开放问题

以下几项是框架目前**没有给出答案**的部分：

- **多机器人调度的具体策略**：抢占、死锁避免与容量规划在具身场景下如何设计；
- **租约与心跳的失效判定**：网络抖动与真实失联如何区分，两种误判的代价分别是多少；
- **断网对账**：离线期间发生的物理状态变化，如何与云端 Global Memory 合并；
- **跨本体技能契约**：同一技能在不同本体上的参数、坐标系与容差如何统一；
- **安全层的权限边界**：Local Safety Supervisor 能在多大范围内**覆盖** Harness 的决策，以及这个范围由谁定义。

## 参考文献 {#references}

1. [RoboOS: A Hierarchical Embodied Framework for Cross-Embodiment and Multi-Agent Collaboration](https://arxiv.org/abs/2505.03673)，2025。Brain–Cerebellum 分层，最接近本文 Manager–Worker 结构的公开参照。
2. [FlagOS-Robo: User Guide](https://docs.flagos.io/projects/FlagOS-Robo/en/latest/flagos-robo-user-guide.html)，官方文档。VLM / VLA 工具链与 Serving。
3. [FlagScale: π0 Serving Example](https://github.com/flagos-ai/FlagScale/blob/main/examples/pi0/README.md)，官方示例。端侧 Policy 输入与部署参考。
4. [RoboHarness: Memory-Driven Orchestration of Heterogeneous Policies](https://arxiv.org/abs/2607.18060)，2026。记忆驱动的异构 Policy 编排。
5. [AutoRT: Embodied Foundation Models for Large Scale Orchestration of Robotic Agents](https://arxiv.org/abs/2401.12963)，2024。大规模真机编排与安全约束。
6. [What Matters in Orchestrating Robot Policies: A Systematic Study of Hierarchical VLA Agents](https://arxiv.org/abs/2606.10267)，2026。编排方式构成独立方差的证据。
7. [OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/abs/2406.09246)，2024。端侧 Policy 实例。
8. [Towards the Harness of Embodied Agents (THEA)](https://arxiv.org/abs/2608.11246)，2026。具身 Agent 的 Harness 化路线。
