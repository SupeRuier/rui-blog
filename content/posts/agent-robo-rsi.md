---
title: 待完善：Agent RSI 与 Robo RSI：持续自我改进的闭环
tabTitle: 待完善：Agent RSI 与 Robo RSI
description: RSI Unified Taxonomy V1.0：用一套 WHAT、WHEN、HOW、WHERE、CAPABILITY、GOVERNANCE 框架分析 Agent 与 Robo RSI。
order: "09"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: AGENT RSI · ROBO RSI · UNIFIED TAXONOMY V1.0
cardMeta: Agent RSI · Robo RSI   # 首页卡片右上角，比文章页眉短
summary: WHAT / WHEN / HOW / WHERE / CAPABILITY / GOVERNANCE 六轴框架，比较软件 Agent 与具身 Agent 的自我改进。
footer: Agent RSI · Robo RSI
---

**本文尚未完全整理完成，内容仍在继续梳理。**

::: note
RSI Unified Taxonomy V1.0：只保留一套通用分类。Robo / Embodied RSI 是同一框架中带有物理交互、动作策略、本体差异及物理成本与安全约束的实例；六轴用于定位和比较研究方法。
:::

::: tldr
「持续自我改进」这个说法在软件 Agent 与具身系统里被用得很宽：一次任务内的反思、失败重试、Prompt 微调、Skill 库扩充、Policy 微调、乃至架构搜索，都被冠以 RSI。混在一起讨论，结论就无法比较。

本文用一套固定的六轴把位置问清楚：**WHAT**（改什么）、**WHEN**（何时改）、**HOW**（经验如何变成改进）、**WHERE**（经验来自何处）、**CAPABILITY**（单次更新产生哪种能力变化）、**GOVERNANCE**（是否值得持久化与上线）。

三个核心判断：

- **数据回传不等于自我改进。** 采集、日志、失败样本入库都只是输入；只有经验确实改变了未来的系统状态、且该改变在后续任务上被验证为能力变化，才构成一次改进。
- **CAPABILITY 的三种变化不能混写**：Enhancement（已会 → 更好）、Acquisition（原本不会 → 会）、Generalization（已有能力 → 新分布仍有效）。只保留成功轨迹并提高成功率，不是从失败中学习。
- **Robo 不是第二套 taxonomy**，而是同一框架中带物理交互、动作策略、本体差异与物理成本的实例。
- **功能分类与 RSI 分类回答不同问题。** Agentic Robotics 的 Model / Data / Environment / Harness 四域说明 Agent 在哪里发挥作用；本文六轴说明经验如何形成、验证并持久化为能力变化。前者不能替代后者。

文末给出跨案例对照与这套框架的适用边界。
:::

::: question
系统如何从经验中持续改变自身，并证明改变带来能力增长？
:::

**框架来源与扩展。**本文的 RSI Unified Taxonomy V1.0 从 Gao 等人的综述 [A Survey of Self-Evolving Agents](https://arxiv.org/pdf/2507.21046)[@1] 所提出的 WHAT（改什么）、WHEN（何时改）、HOW（如何改）出发，而非按 SFT / RL 单一算法划分。原文的 WHERE 主要讨论通用与特定**应用领域**；本文将 WHERE 定义为经验 / 监督的**学习场域和外部交互来源**，进一步单列一次更新的 CAPABILITY、持续更新的 GOVERNANCE，并扩展经验处理与归因、Skill / Code / Harness 以及 Robo RSI 的物理执行和本体约束。原文的领域比较在本文移入后面的系统级问题分析。

执行者在环境中产生经验，改进器利用反馈和归因提出修改；验证与部署门槛决定它能否成为下一轮系统的持久能力。一次任务内的反思或恢复，只说明有**任务内适应**，不能单凭一次成功声称发生了持续 RSI。下面六个维度各回答一个固定问题；图中的节点是二级分类，正文举出典型三级形式。单篇工作可以跨多个节点标注，不要求每个环节都存在。

<figure class="rsi-overview" aria-labelledby="rsi-overview-title">
        <figcaption id="rsi-overview-title">总览 · 一套通用 RSI 分类，六个固定观察轴</figcaption>
        <div class="rsi-loop" aria-label="执行，获得经验，评估与归因，更新，验证，部署，返回执行">执行 <span>→</span> 经验 <span>→</span> 评估 / 归因 <span>→</span> 更新 <span>→</span> 验证 / 部署 <span>↺</span></div>
        <div class="rsi-axis-map">
          <a href="#axis-what"><strong>WHAT</strong><span>系统中什么被改变</span></a><a href="#axis-when"><strong>WHEN</strong><span>时间尺度与触发条件</span></a><a href="#axis-how"><strong>HOW</strong><span>经验如何转化为改进</span></a>
          <a href="#axis-where"><strong>WHERE</strong><span>经验 / 监督来自何处</span></a><a href="#axis-capability"><strong>CAPABILITY</strong><span>单次能力变化</span></a><a href="#axis-governance"><strong>GOVERNANCE</strong><span>安全、可靠与可控</span></a>
        </div>
      </figure>

::: axis axis-what
## 01 · WHAT：系统中的什么被改变

<figure class="rsi-mini"><figcaption>WHAT · 五类更新对象</figcaption><div class="rsi-mini-branches rsi-five"><div><strong>Model / Parameters</strong><span>Foundation、Planner、Critic；Robo 的 Policy / VLA、Controller</span></div><div><strong>Memory / Knowledge</strong><span>情节、语义、轨迹、世界知识与物体可供性</span></div><div><strong>Skill / Tool / Code</strong><span>工具、可执行代码、技能库；物理技能与 Robot API</span></div><div><strong>Harness / Architecture</strong><span>Prompt、上下文、Agent Graph、Planner–Policy–Controller 调度</span></div><div><strong>Learning Infrastructure</strong><span>数据筛选、奖励生成、课程与训练流水线</span></div></div></figure>

WHAT 只回答**被修改的系统组件**，不回答经验来自哪里。参数更新可能落在 Planner、Critic / Verifier / Reward Model 或底层 Policy / VLA、Controller；非参数更新可能落在经验 / 轨迹记忆、可执行 Skill / Code、工具调用路由或 System 2 Planner 与 System 1 Policy 的编排。数据生成、筛选、任务课程和训练流水线也可被改进：改进**学习机制**与只改执行策略应分别记录。自主机器人数据飞轮是这一类的具身重要形式，而不是另设一个 Robo 维度；这条链路的工程侧设计（证据单元、数据分层、归因与门禁）见[具身 Agent 数据飞轮](embodied-data-flywheel.html)。
:::

::: axis axis-when
## 02 · WHEN：何时发生更新

<figure class="rsi-mini"><figcaption>WHEN · 时间尺度与触发机制</figcaption><div class="rsi-mini-branches rsi-five"><div><strong>Intra-task</strong><span>反思、重规划、重试；物理 rollout 内适应</span></div><div><strong>Inter-task</strong><span>任务结束或 episode 间更新</span></div><div><strong>Periodic / Batch</strong><span>积累 N 段经验后离线批量更新</span></div><div><strong>Continual / Online</strong><span>逐步、逐 episode 或 lifelong 更新</span></div><div><strong>Event-triggered</strong><span>失败、未知、低置信度；碰撞 / 执行异常</span></div></div></figure>

WHEN 不描述具体算法。**时间尺度和触发条件可以并列标注**：例如一次碰撞触发本轮恢复，也可能在任务结束后触发训练。Intra-task 的临时重试不自动等于 Inter-task 的持久学习；Continual / Online 描述频繁或长期更新的制度，而不是单独的反馈类型。具身系统要记录更新是否发生在物理 rollout 内、episode 之间，还是安全隔离的周期训练窗口。
:::

::: axis axis-how
## 03 · HOW：经验怎样成为系统改进

<figure class="rsi-mini"><figcaption>HOW · V1.0 固定的五段主干；具体论文可跳步或融合</figcaption><div class="rsi-how-flow"><div><strong>3.1 Experience Acquisition</strong><span>外部任务 / 示范、自生任务、探索、合成经验、已有经验重采样；真机交互</span></div><div><strong>3.2 Evaluation / Feedback</strong><span>环境奖励、成败信号、Verifier、Critic、LLM / VLM Judge、人类反馈；物理任务状态验证</span></div><div><strong>3.3 Processing / Credit Assignment</strong><span>成功筛选、失败诊断、反思与纠错、重标、技能抽取；episode / step / action 归因</span></div><div><strong>3.4 Update Mechanism</strong><span>参数：SFT / RL / 偏好 / 持续学习；非参数：Memory / Skill / Code / Tool / Prompt / Harness / Controller</span></div><div><strong>3.5 Consolidation</strong><span>Replay、记忆整合、技能合并或裁剪、去重、防遗忘</span></div></div></figure>

这五步是分析**经验如何被转化为更新**的主干，不因论文选择 SFT、RL、Prompt 或 Skill 而改变。Experience Acquisition 描述获取方式；WHERE 则描述这些经验或监督依赖的**学习场域与外部交互**，两者不能互换。Evaluation 可只知道整段任务成败，但 Processing 必须追问失败发生在哪个步骤、动作或模块：**成功样本筛选 ≠ 从失败轨迹学习**。更新之后还要整合旧知识与技能，避免新经验覆盖已有能力。
:::

::: axis axis-where
## 04 · WHERE：经验与监督来自何处

<figure class="rsi-mini"><figcaption>WHERE · 学习场域与外部交互，不是「新能力存在哪里」</figcaption><div class="rsi-mini-branches"><div><strong>Offline / Dataset</strong><span>固定数据、Replay Buffer、精选经验；机器人示范与离线轨迹</span></div><div><strong>Interactive Environment</strong><span>Sandbox、自生任务、物理仿真、真机部署与 Robot Fleet</span></div><div><strong>External Interaction</strong><span>人类反馈 / 接管、其他 Agent / Robot、LLM / VLM Teacher、专家策略</span></div></div></figure>

固定数据便于复现，但不能保证覆盖当前策略的失败分布。仿真与真机交互能观察执行后果，却分别面临 sim-to-real 差异以及真机成本与安全问题。外部的示教、人工纠正、教师模型或跨机器人共享经验可以与离线数据和交互式 rollout**同时存在**；WHERE 标注来源，而非把写入 Memory 或权重当成来源。
:::

::: axis axis-capability
## 05 · CAPABILITY：单次更新产生何种能力变化

<figure class="rsi-mini"><figcaption>CAPABILITY · 三种变化不能混写</figcaption><div class="rsi-mini-branches"><div><strong>Enhancement / Refinement</strong><span>已经会 → 成功率、稳健性、效率或执行质量更好</span></div><div><strong>Acquisition</strong><span>原本不会 → 出现可验证的新能力 / 可执行物理技能</span></div><div><strong>Generalization / Transfer</strong><span>已有能力 → 在新任务、物体、环境或机器人本体仍有效</span></div></div></figure>

Enhancement 的前提是**更新前已有成功能力**；Acquisition 则要测试原来不会的任务是否真的从零成功、少量成功、失败诊断、探索或教师监督中获得可执行成功；Generalization / Transfer 关注的是能力越过原始任务或分布仍成立，包括场景、物体和跨本体。对 Robo RSI，**learn from failed rollouts** 与 **zero-success capability acquisition** 比「用了 SFT 还是 RL」更能区分强弱：只保留成功轨迹并提高成功率，不等于利用失败学习了新动作技能。多轮的 capability set 累积属于后面的系统级问题分析，不能混进单次 CAPABILITY。
:::

::: axis axis-governance
## 06 · GOVERNANCE：如何保证安全、可靠与可控

<figure class="rsi-mini"><figcaption>GOVERNANCE · 五类持续自我修改的约束</figcaption><div class="rsi-mini-branches rsi-five"><div><strong>Verification / Regression</strong><span>前后对照、旧任务回归、评估门槛；物理执行验证</span></div><div><strong>Safety / Alignment</strong><span>行为边界、工具权限；物理安全与安全探索</span></div><div><strong>Stability</strong><span>遗忘、漂移、错误累积、奖励或评估器被利用</span></div><div><strong>Resource Constraints</strong><span>算力、数据、人工与交互成本；Robot Hours、设备损耗</span></div><div><strong>Control / Deployment</strong><span>版本、回滚、人工监督、修改范围、安全上线门、审计</span></div></div></figure>

GOVERNANCE 不描述获得了哪一种能力，而是检查改进是否值得**持久化与上线**。更新前后应在目标任务和旧任务上独立验证；评估器被优化器钻空子、错误经验自我放大或灾难性遗忘都可能使「表面提升」失真。真机还必须把物理安全、安全探索、人工接管、机器人运行小时数和设备损耗纳入 gate。限制系统允许自改的组件范围，并保留版本、可追溯的更新理由与回滚路径。
:::

## Robo RSI：不是第二套 taxonomy {#robo-constraints}

<figure class="rsi-mini"><figcaption>具身系统给统一分类增加的四组约束与实例</figcaption><div class="rsi-mini-branches rsi-four"><div><strong>Physical Interaction</strong><span>仿真、真机、fleet 与可观测物理反馈</span></div><div><strong>Policy / Action</strong><span>VLA、Action-level 归因、底层 Controller</span></div><div><strong>Embodiment</strong><span>物体可供性、新场景与跨本体迁移</span></div><div><strong>World Cost &amp; Safety</strong><span>Robot Hours、磨损、碰撞与部署门槛</span></div></div></figure>

标注一篇 Robo 方法时，仍然按 WHAT / WHEN / HOW / WHERE / CAPABILITY / GOVERNANCE 六轴走，只在对应节点注明具身实例。比如同一条**失败 → 诊断 → 修订 → 回放 → 验证 → 上线**链路：失败可能来自真机；归因需要定位物理动作；被改的可能是 VLA 参数，也可能是 Skill / Controller Code 或 Planner–Policy 编排；验收还必须覆盖真实执行的安全与旧任务回归。**仿真成功不是「真机习得能力」的同义词**。

## 与 Agentic Robots 功能分类的关系 {#agentic-robots-taxonomy}

*Towards Agentic Robots: Model, Data, Environment, and Harness* 把 Agentic Robotics 定义为：Agent 根据目标自主规划并协调任务执行，结合环境观察与执行反馈选择 Action、Skill 或 Tool，持续判断进度并在失败时调整；只有动作预测或底层反馈控制，还不足以构成这种 Agentic 能力[@10]。论文进一步按 **Agent 在系统中承担的功能**提出四个领域、十七个非互斥类别：

<figure class="rsi-mini"><figcaption>Agentic Robots · 四个功能领域、十七个非互斥类别</figcaption><div class="rsi-mini-branches rsi-four"><div><strong>Model · 5</strong><span>Training · Perception · Planning · Robot Control · Adaptation</span></div><div><strong>Data · 3</strong><span>Collection · Annotation · Refinement</span></div><div><strong>Environment · 3</strong><span>Reconstruction · Task Generation · Benchmarking</span></div><div><strong>Harness · 6</strong><span>Orchestration · Memory · Monitoring &amp; Recovery · Skills · Infrastructure · Layered Systems</span></div></div></figure>

这是一套**功能坐标系**，不是把每篇工作唯一归档到一个格子。一个系统可以同时做 Data Collection、Model Adaptation 与 Harness Skills；同一套 Harness 也可以同时具备 Orchestration、Memory、Monitoring and Recovery。它与本文六轴互补，但不能一一等同：

| 四域回答的功能问题 | 在 RSI 六轴中还要追问什么 | 不足以证明 RSI 的常见情况 |
| --- | --- | --- |
| **Model**：怎样训练、感知、规划、控制与适应 | WHAT 是否真的修改参数或决策规则；WHEN 是任务内还是跨任务；CAPABILITY 是否变化 | 重规划或条件输入变化只改善本轮执行，没有持久更新 |
| **Data**：怎样采集、标注与筛选经验 | HOW 中监督信号如何形成、失败如何归因；数据改变了哪个更新对象 | 数据被回传或清洗，但没有进入可验证的更新 |
| **Environment**：怎样构建场景、任务、课程与评测 | WHERE 提供什么学习场域；HOW 如何生成训练与验证信号；是否存在冻结评测 | 自动生成了更多任务，却没有证明能力增长或排除评测泄漏 |
| **Harness**：怎样编排、记忆、监控、恢复、复用技能与分层执行 | WHAT 修改 Memory / Skill / Code / Harness 的哪一部分；GOVERNANCE 如何验证、版本化与回滚 | Monitoring and Recovery 只完成任务内纠错，结果未沉淀到后续任务 |

两套 taxonomy 的接口由一句话概括：**四域定位 Agent 在哪里起作用，六轴判断这种作用是否构成持续自我改进。** 尤其在 Harness 中，Orchestration 与 Infrastructure 需要分开：前者决定调用哪个 Model / Policy / Skill / Tool 以及何时交接控制，后者负责把能力暴露为接口并执行服务、通信、运行时检查与版本门禁。Memory 保存可检索的历史与知识，Skills 保存可复用的程序性能力；Layered Systems 则规定 Planner、学习型 Policy 与解析式控制器之间的职责、频率与权限边界。

论文对 Skills 的讨论还给出一条接近 RSI 的演进路径：从生成 Code as Policies，到验证并保存 Skill Library，再到根据执行反馈修订技能并保留新版本，最后把轨迹用于 Policy 或代码生成模型训练[@10]。只有当修订被持久化、在后续任务上验证并通过回归与部署门禁时，这条功能链才跨过本文所定义的 RSI 边界。

## Case Study：从 Harness 演化到 Harness–Policy 双路径演化

PhysicalRSI 与 R²SI 都把 System 2 放在外层，把可执行 Skill / Tool 与底层 Policy 放在内层；两者的关键区别是改进出口的范围。

**PhysicalRSI：主要修改 Harness。** 系统在 RoboDojo 中执行任务，利用观察、动作、成败和失败原因形成 embodied feedback，再由 Foundation Model 改写 Skill、Tool、Memory 或控制代码。候选 Harness 经评测选择后成为下一轮版本，即 `H_k → H_{k+1}`[@11]。按六轴定位：WHAT 主要落在 Skill / Code / Harness；WHEN 是跨 rollout 的轮次更新；HOW 是执行、反思、生成候选、评测、选择与继承；CAPABILITY 同时可能表现为效率 refinement、未见布局上的 generalization，以及原本失败任务上的 acquisition。

**R²SI：同时修改 Harness 与 reactive model。** 外层 Recursion Agent 回看 rollout，提出 Skill 修订，经过 Tool 测试门禁后发布新 Harness；同一批执行记录还被转成训练数据，用于更新内层 reactive model。因此它有两条明确的变化路径：`ΔHarness` 与 `Δθ`[@12]。这比单一 Skill 修订多了一层数据—参数闭环，也使归因更难：结果改善可能来自规划与 Skill，也可能来自底层 Policy，实验需要分别固定其中一条路径。

| 六轴 | PhysicalRSI | R²SI |
| --- | --- | --- |
| WHAT | Skill / Tool / Memory / Control Code / Harness | Harness + reactive model 参数 |
| WHEN | 跨 rollout、按轮次 | 跨 rollout；Skill 发布与模型训练并行存在 |
| HOW | 反思 → 候选改写 → 评测 → 选择与继承 | rollout review → Skill gate → release；记录 → 训练 → `Δθ` |
| CAPABILITY | Refinement、Generalization，部分任务上的 Acquisition | Skill 效率与稳健性提升；模型侧能力变化需单独归因 |
| GOVERNANCE | 候选评测与版本继承 | 测试门禁、版本发布与组件消融 |

两项工作都比“任务内失败后重试”更接近持续 Robo RSI，因为修改被保存并用于后续 rollout。但公开证据主要来自 RoboDojo 仿真；它能证明仿真环境中的跨轮改进，不能直接替代真机安全、设备磨损、sim-to-real 与现场回归验证。另一个边界是“递归”：改进器反复改被执行的 Harness 或 Policy，不等于已经证明改进器自身的学习机制也获得了可归因的提升。

## 跨案例对照：同一套六轴，七类不同的系统 {#cross-case}

六轴的价值在于能把方法横向摆开。下表按同一套轴定位几类公开工作。**定位依据是公开标题与自述，不是复现实验**，因此 CAPABILITY 一列写的是「结构上可能出现的变化类型」，不是效果评价。

| 系统 | WHAT | WHEN | HOW | CAPABILITY（结构上） | 主要边界 |
| --- | --- | --- | --- | --- | --- |
| Voyager [@2] | Skill / Code 库（非参数） | Inter-task、事件触发 | 自动课程 + 环境反馈 + 可执行代码 | Acquisition | Minecraft 环境；不涉及物理安全 |
| Reflexion [@4] | Memory / Prompt | Intra-task | 言语化反思后重试 | 任务内适应（非持久能力） | 单任务内的恢复，不等于跨任务学习 |
| GEPA [@5] | Prompt | Periodic / Batch | 反思式 Prompt 演化 | Enhancement | 优化对象是提示，不是系统结构 |
| SICA [@6] | 自身代码与工具 | Inter-task | 自修改 + 基准反馈 | Enhancement，部分 Acquisition | 改进器与被改进者同体，回归风险高 |
| ADAS [@7] | Agent 架构 / Harness | 外层搜索 | 元代理搜索并评估新设计 | Acquisition（新架构） | 搜索成本高，评价高度依赖基准 |
| RoboCat [@8] | 参数（Policy） | Inter-task / Periodic | 自主采集 + 微调 | Enhancement + 跨本体 Transfer | 需要真机采集与安全约束 |
| RISE [@9] | 参数（Policy） | Periodic | 世界模型支撑的策略改进 | Enhancement | 依赖世界模型的保真度 |

从这张表能读出三件事：

1. **同一格里的方法效果可以差很多。** 六轴是定位工具，不是效果预测器——比较两种方案时必须先固定其他轴。
2. **Intra-task 与 Inter-task 是最容易被合并的一栏。** Reflexion 属于前者：反思改善了本次任务的重试，但如果没有持久化并影响下一次任务，它不构成持续 RSI。
3. **WHAT 落在非参数对象上时，GOVERNANCE 的压力通常更大。** Prompt / Memory / Skill / Code / Harness 的改动没有参数更新那样明确的版本边界，回归验证与回滚都更难做。

## 这套 taxonomy 的适用边界 {#taxonomy-limits}

把六轴当成万能分类会出问题。它至少有五处不覆盖：

1. **不预测收益。** 它只说改了什么、何时改、怎么改，不说这次改动值不值得；同一格内的方法效果差异可以非常大。
2. **不处理多主体互相改进。** 多个 Agent 互相提供经验、互相修改时，WHAT 与 WHERE 会同时落在多个主体上，六轴只能靠重复标注来表达，描述力有限。
3. **对递归改进描述不足。** 「改进器本身也被改进」只能记成「WHAT 落在 Learning Infrastructure 上」的一次标注，无法表达递归层数及其风险累积。
4. **各轴并不独立。** WHERE 会限制 HOW 的可能：经验只来自任务成败信号时，无法做 step 级归因，也就无法支撑依赖细粒度归因的更新机制。把六轴当正交维度会得出错误结论。
5. **持续性要靠另一个问题回答。** 六轴描述单次更新；「多轮之后能力集合是否真的增长」属于 Accumulation 的问题，不能从任何单一轴推出来。

因此这套框架的正确用法是**定位并对齐讨论口径**：先说清一篇工作在六个位置上的坐标，再比较同一位置上的两种方案。它不替代效果验证，也不替代安全论证。

## 系统级问题分析：跨论文与跨轮次 {#topic-analysis}

以下议题不是单篇方法的第七条工程分类轴，而是综述后半部分的横向分析：比较多轮更新前后的 capability set、学习成本和安全边界。尤其**Accumulation** 问的是多轮后整体能力集合是否增长，与 CAPABILITY 的「一次更新改变了什么」不同。

<div class="rsi-topics" aria-label="跨论文研究议题"><div><strong>能力动力学</strong><span>Capability Accumulation、Retention / Catastrophic Forgetting、Forward / Backward Transfer、Zero-success Learning、Failure Utility（舍弃 → 负例 → 重标 → 纠错 → 新能力）</span></div><div><strong>改进深度与规模</strong><span>Autonomy Level、Improvement Scope、Parametric vs Non-parametric RSI、Self-improvement Scalability、Recursive Depth、Open-endedness</span></div><div><strong>具身横向议题</strong><span>Sim-to-Real / Real-to-Sim Loop、Cross-Embodiment Transfer、Fleet-level Self-improvement</span></div></div>

一个实用的判断顺序是：先比较初始是否 zero-success，再看失败轨迹到底被丢弃、重标、诊断还是产生了新技能；随后检查新能力是否保留、能否正向 / 反向迁移，最后观察系统是否开始改自己的学习流水线、能否以合理的 robot-hour 与人工成本长期扩张。这里是**研究问题**，不能把尚未验证的能力积累写成具体论文的实验结论。

## Agent RSI：方法与文献入口 {#agent-rsi}

软件 Agent 的 Trace、工具调用与可执行代码通常更容易回放，Prompt / Memory 与 Skill / Code 都能成为 WHAT 的更新对象。[Voyager](https://arxiv.org/abs/2305.16291) 通过自动课程、环境反馈与可执行 Skill Library 提供了一条非参数化的持续技能积累实例[@2]；但 Minecraft 中的具身 Agent 不等于真实机器人，物理执行安全与跨本体迁移仍需分别验证。正文聚焦分类边界，代表方法放在文献目录。

::: method-link
[查看 Agent RSI 方法文献目录 <span aria-hidden="true">↗</span>](agent-rsi-methods.html)<span>记忆、Prompt、Skill / Code 与 Harness 的代表路线</span>
:::

## Robo RSI：方法与文献入口 {#robo-rsi}

具身执行者可能由 System 2 Planner / Harness 与 System 1 Policy / Skill 共同构成。须分别标注底层 VLA / Controller 的参数或代码更新，以及上层调度、记忆、恢复和技能库的变化。[RoboRSI 项目](https://github.com/nssmd/RoboRSI)提供进一步检索具体方法的入口[@3]；本文 V1.0 则提供统一的六轴分析框架。评估时重点追问：failed rollout 是否真正贡献了能力习得，还是只筛掉坏数据；真机任务是否被物理状态验证，修改后的系统能否在不伤害旧能力与设备的前提下部署。

::: method-link
[查看 Robo RSI 方法文献目录 <span aria-hidden="true">↗</span>](robo-rsi-methods.html)<span>数据、Policy、奖励、Skill / Harness 的代表路线</span>
:::

::: my-take
我认为这一整套讨论里最需要反复强调的是：**数据回传、日志留存、失败样本入库，都不等于发生了自我改进。** 它们只是输入端的动作。

构成一次自我改进，至少需要三步同时成立：经验确实改变了未来的系统状态；该改变在后续任务上被验证为能力变化；并且这种变化在旧任务上没有付出代价。很多自称「数据飞轮」的系统实际只完成了第一步——采集端在持续增长，改进端却没有对应的能力验证。

判断一个系统是否真的在自我改进，有一个很直接的问题可以问：**把这一轮的经验全部丢掉，下一轮的表现会变差吗？** 如果答案是不会，这套循环目前只是数据积累。
:::

## 参考文献 {#references}

1. [Gao et al., A Survey of Self-Evolving Agents: What, When, How, and Where to Evolve on the Path to Artificial Super Intelligence](https://arxiv.org/pdf/2507.21046)，TMLR，2026。本文借鉴其核心分析问题，并对 WHERE 等维度重新定义与扩展。
2. [Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/abs/2305.16291)，2023。可执行技能库和环境反馈。
3. [RoboRSI](https://github.com/nssmd/RoboRSI)，项目仓库。机器人 Agent 的 Harness / Skill 路线资料入口。
4. [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)，2023。
5. [GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning](https://arxiv.org/abs/2507.19457)，2025。
6. [A Self-Improving Coding Agent](https://arxiv.org/abs/2504.15228)，2025。
7. [Automated Design of Agentic Systems](https://arxiv.org/abs/2408.08435)，2024。
8. [RoboCat: A Self-Improving Generalist Agent for Robotic Manipulation](https://arxiv.org/abs/2306.11706)，2023。
9. [RISE: Self-Improving Robot Policy with Compositional World Model](https://arxiv.org/abs/2602.11075)，2026。
10. [Towards Agentic Robots: Model, Data, Environment, and Harness](https://arxiv.org/abs/2610.20442)，2026。本文引用其四域十七类功能分类，以及 Harness 中 Orchestration、Memory、Monitoring and Recovery、Skills、Infrastructure 与 Layered Systems 的边界。
11. [PhysicalRSI 1.0: Recursive Self-Harness for Scaling Embodied Skills](https://mmlab.hk/research/PhysicalRSI)，2026。以 embodied feedback 修订并选择可执行 Harness。
12. [R²SI: Trial and Error, Distilled into Capability](https://r2si.worldscape.io/)，2026。外层 Recursion Agent 同时推动 Skill / Harness 修订与 reactive model 训练。
