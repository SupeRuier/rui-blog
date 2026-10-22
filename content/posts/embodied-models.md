---
title: 待完善：具身 Policy 的输入、动作表示与执行接口
tabTitle: 待完善：具身 Policy
description: 具身 Policy 的语言、视觉 Prompt 与本体输入，跨本体动作表示及执行接口：明确模型层与系统层的边界。
order: "07"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: EMBODIED MODEL · FRAMEWORK
cardMeta: Embodied Model   # 首页卡片右上角，比文章页眉短
summary: Policy / VLA 的语言与视觉 Prompt 输入、跨本体动作表示、Action Chunk 与底层控制接口。
footer: Embodied Model
---

**本文尚未完全整理完成，内容仍在继续梳理。**

具身模型通过观测、语言或视觉指令与本体状态预测动作，再由执行接口将动作转换为机器人命令。数据形式、训练目标、动作表示与控制约束共同决定 Policy 的能力边界。

<figure class="rsi-mini"><figcaption>总览 · 数据形式 → 训练目标 → 动作接口 → 评测方式</figcaption><div class="rsi-mini-branches rsi-four"><div><strong>数据形式</strong><span>原始观测、语言 / 视觉 Prompt、本体状态与动作标注</span></div><div><strong>训练目标</strong><span>预测动作 / Action Chunk、未来状态，或对齐视觉指代</span></div><div><strong>动作接口</strong><span>动作空间、控制频率、chunk 时长、超时与取消语义</span></div><div><strong>评测方式</strong><span>给定正确子目标与视觉锚点的成功率、泛化与数据效率</span></div></div></figure>

::: tldr
Policy / VLA 根据子目标与当前观测预测动作，其设计包含四个相互约束的部分：**数据形式、训练目标、动作接口、评测方式**。输入条件不必只有文字；在原始 RGB 上标出目标物体、交互点或放置区域的 Visual Prompt，可以把难以用语言稳定表达的空间指代变成 Policy 可直接消费的视觉锚点。

四个核心判断：

- **动作表示与数据标注强耦合**。关节、末端位姿与 URR 描述不同的动作语义；Action Chunk 描述时间组织；控制器负责把它们变成当前本体的命令。三个维度需要分别核对。
- **Policy 与控制器运行在不同时间尺度**。模型预测多长、实际执行多长、何时接受新观测，共同决定系统响应速度；底层伺服闭环与视觉 Policy 的重规划也要分别看。
- **Visual Prompt 是指令接口，不是普通观测增强**。框、十字标记或 Mask 需要与相机、时刻和子目标绑定；Policy 也需要在训练中学会把标记关联到动作，而不能假设任意 VLA 会自动理解叠加图形。
- **接口约定比网络结构更常成为失败来源**：坐标系、单位、动作范围、超时与取消语义如果没约定清楚，「模型不行」的结论往往站不住。

System 2 与 Harness 负责调用时机、运行时治理和反馈组织，也可以把子目标编译成结构化 Visual Prompt；Policy 层负责在给定语言意图、视觉锚点与当前观测下生成动作。两层的能力与失败需要分别评测。
:::

## 主要形态

- VLA：从视觉、语言和状态直接预测动作或 Action Chunk，例见[OpenVLA](https://arxiv.org/abs/2406.09246)[@1]
- Visual-prompted VLA：除当前观测与简短动作意图外，再接收框、点、十字标记或 Mask 等空间锚点。Point-VLA 将首帧目标框作为整段轨迹的固定视觉指令[@10]；VP-VLA 则由上层 Planner 在关键事件后更新目标物体与放置区域[@11]
- WAM / World Model：显式建模动作条件下的未来状态或视觉变化，世界模型控制例见[DreamerV3](https://arxiv.org/abs/2301.04104)[@2]；DreamerV3 不等同于 VLA
- 层级模型：高层产生目标、子任务或技能，低层 Policy 完成控制（可参看[层级 VLA 调度研究](https://arxiv.org/abs/2606.10267)[@3]）
- 具身基座模型：以统一架构覆盖理解与动作的公开实现，例见 [WALL-X / WALL-OSS](https://github.com/X-Square-Robot/wall-x)[@5]

## 动作表示

动作既可以是关节或末端位姿，也可以是轨迹、3D Point Flow、技能调用或其他中间表示。表示方式决定了训练数据的标注结构，也决定了模型与控制系统之间的接口。

**动作空间的选择直接影响数据加工与执行成本**：关节位置可以从遥操作记录里读出；从关节记录构造末端位姿需要正运动学与标定，执行末端目标则需要控制映射；Point Flow 等表示通常需要额外的估计或生成过程。更抽象的表示将部分本体差异交给数据转换与底层控制器处理。

动作接口包含三个独立维度：**单步动作语义、预测的时间组织、本体执行映射**。URR、末端位姿和关节目标定义单步语义，Action Chunk 定义时间组织，IK、伺服或学习控制器完成执行映射。一个 Policy 可以同时输出任务空间表示与多步 Action Chunk，再由本体专属控制器执行。

**Action Chunk（一次预测多步）** 把若干步动作打包成一次推理输出，降低了对推理频率的要求。若执行器完整执行一个 chunk 才接收新预测，那么这段时间相对视觉 Policy 是开环的；底层关节伺服仍可以闭环。重叠预测、提前重规划或 Real-Time Chunking 可以改变这个边界。因此真正需要记录的是**预测时域与实际执行时域**，不能只凭 chunk 长度判断系统多久重新看一次环境。

**技能调用**让模型输出技能名与参数，连续控制交给既有控制器。它将部分动作学习负担转移到技能库建设，能力边界取决于技能覆盖与组合能力。

> **动作表示越接近原始控制，越依赖数据量；越接近符号与技能，越依赖技能库的覆盖与组合能力。**

## 跨本体统一动作空间的语义与执行映射

跨本体训练首先遇到的是监督接口不一致：同样是「把手移到杯柄旁」，不同机器人可能记录不同数量的关节，也可能记录末端位姿或人体运动。把这些向量补成相同长度，只完成了张量对齐；还需要约定每个分量的物理含义、参考系和时间间隔。

Dyna URR、RynnBrain 1.1 和 Cosmos 3 都以共享动作表示连接异构数据与本体。三者的区别在于**共享哪些语义，以及由哪一层处理本体差异**。

| 方案 | 统一的内容 | 如何容纳本体差异 | 下游接口 |
| --- | --- | --- | --- |
| Dyna-2.1 · URR[@6] | 局部一致坐标系中的腕、肘、胸与 footprint 位姿 | 按存在或可观测的身体组件组织表示 | Policy 动作解码为 URR 目标轨迹，由全身控制器跟踪 |
| RynnBrain 1.1 · RynnBrain-VLA[@7] | 81 维动作超集，包含关节、末端、夹爪、手、躯干和头 | 本体专属 Mask 激活可用维度，Loss 只作用于激活部分 | 按本体对接控制接口；G1 另有 SONIC latent 输出 |
| Cosmos 3[@8][@9] | Ego / Effector 相对位姿与抓握状态等共享几何组件 | 不同领域组合成不同长度向量，由领域相关投影接入模型 | Action 作为模态用于 Policy、正向动力学与逆动力学任务 |

共同几何语义、动作超集与 Mask 可以组合使用：前者定义分量的含义，后两者处理向量布局与可用分量。统一空间的覆盖范围仍受数据、身体组件和控制接口约束。

### URR：保留任务空间目标，把关节协调交给控制器

Dyna 的 URR（Unified Robot Representation）描述身体组件在任务空间中的位姿。**一个时刻的 URR 是目标配置，多个时刻才组成运动轨迹**；Policy 输出的 URR 目标轨迹因此可以具有 Action Chunk 的时间组织方式。遥操作、人体视频与 UMI 数据先进入这一接口，推理输出再解码为同类目标[@6]。

UMI 等部分观测数据可以只提供可用组件的监督，缺失的肘和胸不应被补造为真值。人体视频中的全身追踪同样具有估计误差，统一接口仍需保留组件的可观测性与标签可信度。

目标轨迹还需要变成可执行命令。Dyna 使用仿真中训练的 RL 全身控制器，将 URR 目标转成 100 Hz 的关节目标与轮速；它处理动力学、不可行目标和不同身体目标的优先级[@6]。**URR 并不要求必须用 RL**，IK 或其他控制方案也可以承接任务空间目标；Dyna 的选择体现的是具体机器人的跟踪与动力学需求。

### RynnBrain：动作超集与显式 Mask

RynnBrain-VLA 的 81 维由 Arm-Joint 14D、Arm-EEF 18D、Gripper 2D、Hand 40D、Torso 4D、Head 3D 组成，同时容纳关节空间与任务空间。不同本体选择其中的可用维度，训练时屏蔽其余维度[@7]。这是一种直接的异构批次接口，但维度共享本身不保证运动学和控制语义完全一致。

G1 采用混合接口：14 维手部输出位于统一空间内，64 维 SONIC latent 位于该空间外，两者交给 SONIC 全身控制器[@7]。统一训练空间与最终执行命令因此可以具有不同的布局。

### Cosmos 3：共享几何组件，Action 也是世界模型的模态

Cosmos 3 将 Ego 与 Effector 的相对运动编码为 9D：3D 平移加 6D 连续旋转表示；这里 **9D 是编码长度，旋转的物理自由度仍为 3**。抓握状态则用夹爪开合或手指状态表达。官方示例中，自动驾驶为 9D，单臂 DROID / UMI 为末端 9D 加夹爪 1D，人体第一视角动作由 Ego、双腕与指尖组件组成 57D[@8][@9]。

这些动作描述连续视觉状态间的变化，并组织为时间序列。与 URR 的身体目标配置相比，Cosmos 的相对位姿表示尤其需要保留起始姿态、参考系与采样间隔。它还把 Action 与视频等模态共同建模，使同一接口能够服务动作预测、动作条件下的未来预测，以及从视觉变化估计动作[@8]。

### 新本体接入的数据与控制边界

新本体接入涉及**数据映射、动作 Schema、Policy 与控制器**四个层面。如果原有任务空间组件仍能表达目标，新增关节的协调可以主要由控制器处理；新末端执行器带来新的任务语义时，则可能需要扩展表示。固定超集超出已有维度时也需要适配或扩展。两类设计都必须重新验证可达性与跟踪误差，共享表示本身不能保证零样本迁移。

## 输入数据与观测范围

输入空间通常由五部分组成，每一部分都有对应的设计问题：

- **视觉观测**：单帧、多帧还是多视角。单帧在遮挡下容易失效；多帧提供运动信息但抬高上下文成本。
- **语言条件**：粒度是关键。任务级指令（「收拾桌子」）难以验证，子目标级条件（「抓住杯柄」）既更容易被判分，也更容易被 System 2 绑定到具体能力。
- **视觉 Prompt**：在原始图像坐标中用框、点、十字标记或 Mask 指定目标、交互锚点与空间约束。它承载的是「对哪里做什么」，需要与无标记的当前观测区分，并声明使用哪一路相机、生成时刻和有效期。
- **本体状态**：关节角、末端位姿、夹爪开合。在需要精确接触的任务上，仅靠视觉通常不够，而本体状态是低成本的高价值输入。
- **历史与力觉**：历史动作、触觉、力矩。它们提升接触丰富任务的表现，但不是所有平台都能提供。

### Visual Prompt：把空间指代变成可操作的 Policy 输入

文字适合表达动作意图与语义约束，却不擅长稳定指定「八个相似瓶子中的这一个」、无纹理桌面上的一个落点，或陌生类别的目标实例。Visual Prompt 将这部分信息留在图像空间：语言只表达 `pick`、`place` 等高层意图，目标框、交互点或放置区域则提供像素级指代。Point-VLA 在六类真实操作任务中使用最小文字加目标框，相比详细文字指令显著提高了易混淆物体与精确位置任务的成功率；同一 Policy 通过文字与视觉指令混合训练，仍可接受纯文字输入[@10]。

对上层规划调度而言，这提供了比自然语言描述更易操作的中间接口。Planner 不必生成脆弱的方位长句，而可以输出**子目标 + 视觉锚点 + 空间约束**；感知模块再把对象名或指点转换为像素区域，Harness 负责校验并绑定到 Policy 调用。VP-VLA 展示了这一动态版本：上层把长任务拆成阶段，用十字标记表示抓取对象中心、用框表示放置区域，并在夹爪开合等交互状态变化时更新 Prompt[@11]。因此 Visual Prompt 既是 Policy 输入，也是 System 2 与 System 1 之间可检查、可回放的描述接口。

两项工作也暴露了不同的时序选择：Point-VLA 使用**每个 Episode 一次生成、整段复用的首帧 Prompt**，成本低但目标移动或阶段切换后可能过期；VP-VLA 使用**事件触发、随子目标更新的 Prompt**，更适合多阶段任务，但依赖 Planner、分割器和完成事件的正确性。工程接口至少需要明确以下字段：

| 字段 | 需要回答的问题 |
| --- | --- |
| `intent / subgoal` | 当前是抓取、放置、推动，还是其他原子能力？ |
| `prompt_type + geometry` | 点、框、十字标记还是 Mask；坐标如何归一化？ |
| `camera + frame_id` | 标记属于哪一路相机、哪一帧，能否与当前观测对齐？ |
| `role` | 标记表示目标物体、交互锚点，还是目标区域 / 空间约束？ |
| `validity + refresh_trigger` | Prompt 在何时失效；按时间、场景变化还是执行事件刷新？ |
| `source + confidence` | 来自人工、VLM、检测 / 分割模型还是追踪器；低置信度如何拒绝或回退？ |

直接在 RGB 上叠加图形并不自动构成可靠接口。Point-VLA 的结果表明，保留全局场景的框叠加比只给文字坐标或遮掉框外区域更有效，并通过平移与局部外观增强减少绝对坐标和训练外观过拟合[@10]。VP-VLA 则发现辅助 Grounding Loss、关键帧监督和 Prompt 几何都会影响模型是否真正使用标记；把标记直接覆盖在主观测上还可能干扰原始视觉特征[@11]。更稳妥的输入契约是同时保留**原始观测**与**Visual Prompt 图**，并用配对训练或显式 Grounding Objective 建立标记到动作的对齐。

### 两种架构流程：静态指代与动态调度

<figure class="frontier-figure"><a href="../assets/point-vla-training-pipeline.jpg" title="查看 Point-VLA 原始流程图"><img src="../assets/point-vla-training-pipeline.jpg" alt="Point-VLA 训练流程：输入示范 Episode 和文字指令，MLLM 在首帧生成目标框，经 CutMix 与平移增强后，将固定 Visual Prompt 与各时刻机器人观测共同输入 Policy，预测后续 Action Chunk。"></a><figcaption><strong>Point-VLA 官方流程图</strong> · MLLM 从示范 Episode 生成首帧目标框；增强后的固定 Visual Prompt 与整段当前观测配对，用于训练 Action Chunk 预测。来源：Point-VLA 项目页与论文 Figure 3<a class="citation" href="#ref-10" aria-label="跳转到参考文献 10">[10]</a>。</figcaption></figure>

Point-VLA 把 Grounding 放在 Episode 级数据构造与调用入口：目标框只在首帧生成一次，随后与 `#0 … #t … #n` 的当前观测并行送入 Policy。图中的 CutMix 改变框内外观，Translation 改变框的位置，两者分别抑制外观记忆和绝对坐标记忆。它适合单一目标在一段轨迹中保持有效的任务；如果目标或操作阶段发生变化，外层系统需要重新生成 Prompt 或启动新的 Policy 调用[@10]。

<figure class="frontier-figure"><a href="../assets/vp-vla-system-pipeline.png" title="查看 VP-VLA 原始架构图"><img src="../assets/vp-vla-system-pipeline.png" alt="VP-VLA 双系统架构：System 2 Planner 用冻结 VLM 把用户请求拆成子任务并识别目标对象和位置，再由 SAM 或用户生成十字标记与边界框；Visual Prompt 和原始图像进入 System 1 VLA，同时预测 Grounding 坐标与 Action Chunk。"></a><figcaption><strong>VP-VLA 官方架构图</strong> · System 2 将用户目标编译成当前子任务、对象与位置，通过 SAM 或人工输入生成 Visual Prompt；System 1 同时优化 Grounding 与 Action Chunk。来源：VP-VLA 官方仓库与论文 Figure 3<a class="citation" href="#ref-11" aria-label="跳转到参考文献 11">[11]</a>。</figcaption></figure>

VP-VLA 把同一思路升级成运行时接口。冻结 VLM 负责子任务分解与当前阶段判断，SAM 将对象名和目标位置转换为十字标记与区域框，原始图像和 Prompt 图作为两路输入进入 VLA；Grounding Head 预测标记坐标，Action Head 输出 Action Chunk。夹爪开合等事件触发 System 2 重新判断阶段，使视觉锚点从抓取对象切换到放置区域。这里的关键不是多放一张图片，而是把 **Planner 的符号决策 → 可检查的视觉约束 → Policy 动作**连成显式数据流[@11]。

### 性能结果与 Benchmark 的覆盖盲区

两篇工作的结果都支持 Visual Prompt，但证据强度并不相同，也不能只比较论文中的最终平均成功率。

| 工作 | 主要结果 | 能说明什么 | 还不能说明什么 |
| --- | --- | --- | --- |
| Point-VLA[@10] | 六类真机任务平均成功率从 Text VLA 的 32.4% 提升到 92.5%；其中 clutter picking 为 43.3% → 94.3%，相同蛋槽中的目标抓取为 10.0% → 86.7%，无纹理桌面放置为 30.0% → 95.0% | 在文字指代困难或无法表达精确位置时，像素级框选可以显著缩小 Policy 的目标搜索空间；同一空间信息用图像框表达，也优于把坐标写进文字 | 任务只有六类、十二个场景，每个场景三十次试验；没有系统改变相似干扰项数量、相似度和遮挡程度，因此还看不到优势如何随指代歧义增长 |
| VP-VLA[@11] | RoboCasa 平均 48.8% → 53.8%，SimplerEnv 为 50.0% → 58.3%；真机垃圾分类的 OOD 成功率为 63.3% → 85.0%，新颜色鸡蛋为 29.2% → 75.0%，OOD 蛋槽位置为 55.0% → 68.75% | 动态 Prompt、任务分解和 Grounding 训练可以共同改善 OOD 目标选择与多阶段执行；关键阶段更新锚点比静态地同时显示全部目标更合理 | 完整方法同时改变 Planner 分解、SAM Grounding、Prompt 表示、辅助 Loss 与触发逻辑，主结果不能全部归因于 Visual Prompt；多数任务也不是“同类别大量近似实例中指定任意一个” |

Point-VLA 已经覆盖了这一判断的**小规模版本**：在相似瓶子 clutter、相同物体矩阵与蛋槽格点中，Visual Prompt 的提升远大于普通 OOD 物体识别；其表示消融还显示，在 disturbed egg picking 上，图像框为 80%，相同坐标写进文字只有 37%，说明收益不只是多给了位置信息，而与信息进入 Policy 的模态有关[@10]。但现有结果仍没有回答更重要的 scaling 问题：当同类实例从 2 个增加到 8、16、32 个，外观差异逐渐缩小，文字描述长度和关系链不断增长时，Text Prompt 与 Visual Prompt 的性能差距是否持续扩大。

VP-VLA 的证据更偏系统级。它在 RoboCasa 的平均提升为 5 个百分点，去掉 Grounding Loss 后从 53.8% 降到 49.4%，直接把标记盖在主 RGB 上则为 50.8%；这说明 Prompt 对齐和输入组织有贡献，但增益小于 Point-VLA 的强指代歧义任务[@11]。更合理的解释是：通用 benchmark 中相当一部分任务仍可由类别、颜色和固定布局解决，Visual Prompt 不是主要瓶颈；只有进入大量近似项、同类项和任意精确落点时，显式指示才应成为主导接口。

要验证这一点，Benchmark 应把**指代难度**而不只是任务成功率作为自变量：

- **干扰项规模**：同类实例数从少到多，并报告成功率随实例数的退化曲线；
- **视觉相似度**：同类别不同外观、近似外观、几乎相同外观分层测试；
- **语言可分性**：目标是否能用类别、属性、相对位置唯一描述，以及唯一描述所需的关系链长度；
- **场景动态性**：Prompt 生成后目标是否移动、被遮挡或发生阶段切换，比较静态与事件触发更新；
- **Grounding 来源**：人工 Oracle、自动检测 / 分割和带噪 Prompt 分开报告，把接口上限与自动 Grounding 误差拆开；
- **分层指标**：同时记录目标选择正确率、Prompt 跟随率、抓取 / 放置执行成功率与端到端成功率。

最值得观察的不是单一平均分，而是 `Visual Prompt 增益 = Success_visual - Success_text` 随干扰项数量、视觉相似度和语言不可分性的变化。如果这一差值随歧义强度单调扩大，才能直接支持 Visual Prompt 是上层规划调度在复杂场景中的必要描述接口，而不只是另一种输入增强。

**归一化与坐标系必须显式约定**。这一条看起来是工程细节，实际上决定了同一份数据能否跨本体复用：动作的参考系（世界 / 基座 / 末端）、单位（弧度 / 角度、米 / 毫米）、以及动作范围，如果没有在数据 schema 里写死，跨本体迁移时几乎必然出错。

## 时间尺度与执行接口

Policy 的推理频率通常远低于控制器频率——Policy 可能在 10 Hz 量级，而底层控制器在 100–1000 Hz。这意味着中间必然存在一个执行层，负责插值、限幅与闭环，而不是把模型输出直接送给电机。

由此产生三条约束：

1. **延迟必须小于 chunk 的执行时长**。否则会出现「动作还没算完就已经过期」，系统实际执行的是基于旧观测的动作。
2. **接口契约应由执行层保证，而不是由模型自己保证**。动作范围、单位、超时、取消语义属于运行时约束；把它们寄希望于模型「学会不越界」是错误的分工。
3. **开环时长是与任务匹配的设计量**。抓取这类短动作可以由一个 chunk 覆盖；长程任务必须在中间插入重新观测，否则一次扰动会积累到最后。

部署侧的公开示例可以作为接口形态的参考[@4]。

## 与系统层的边界

这条边界不清，归因就会错。两边的职责可以这样划分：

| 层面 | 负责 |
| --- | --- |
| Policy / VLA | 给定**正确的子目标、视觉锚点**与当前观测，产生可执行动作；报告 Prompt 不可用或执行失败 |
| System 2 / Harness | 何时调用、调用哪个 Policy；生成或请求 Visual Prompt；校验相机、帧与有效期；处理超时、取消与反馈 |

分界处的典型症状是双向的：**把 Policy 能力不足记成调度问题**，会引导团队去优化 Prompt 和流程；**把接口契约缺失记成模型问题**，会引导团队去堆数据和换模型。两种都白费力气。判断时应逐级控制变量：先以人工给定的正确子目标与视觉锚点替换上层输出，再分别替换自动 Grounding 和 Policy。若正确锚点仍不能改善成功率，瓶颈更可能在 Policy 或执行侧；若人工锚点有效而自动锚点无效，问题在 Planner、感知 Grounding 或坐标绑定。这条判据以及更完整的五层归因框架见[评测一文](robot-agent-evaluation.html)；系统层自身的组织方式见 [Robot Agent System 2](robot-agent-system2.html)。

## 评测方式

Policy 层的评测要刻意与系统层分开，否则数字不可解释：

- **给定正确子目标与正确视觉锚点的成功率**——这是最能代表 Visual-Prompted Policy 能力的口径，因为高层规划与 Grounding 误差已被排除；同时保留纯文字条件，检查混合训练是否损伤原有指令能力；
- **Grounding 接口消融**——分别测试人工 / 自动锚点、静态 / 事件更新、原始观测 + 独立 Prompt 图 / 直接叠加，以及过期、错位和错误标记下的拒绝与恢复；
- **跨场景、跨物体、跨本体泛化**——同一能力在分布外是否仍成立；
- **OOD 与干扰**：遮挡、光照变化、动态物体；
- **数据效率**：达到同一成功率需要多少条演示。这一项常被忽略，但它直接决定数据成本；
- **失败模式分类**：是抓偏、滑落、还是根本没到位置——失败类型比成功率更有指导性。

一条纪律：**既不能用系统端到端成功率代替 Policy 能力，也不能从系统成功率反推 Policy 能力**。两者之间隔着调度质量、接口可靠性与环境随机性，是评测那一篇要处理的问题。

::: my-take
Policy 的可复用性取决于**接口约定**。动作坐标系、单位、动作范围、预测与执行时域、超时和取消语义，共同决定数据能否跨本体使用，以及失败能否被正确归因。

Visual Prompt 将 Policy 的输入接口从「一句自然语言」扩展为**语义意图 + 可执行空间约束**。这比让上层 Planner 发明越来越精细的方位描述更适合调度：接口可视、可校验、可回放，也能把目标选择错误与动作执行错误分开。但它不会消除 Grounding 问题，只是把 Grounding 从 Policy 内部的隐式能力，变成 Planner、感知模块与 Harness 必须共同维护的显式契约。

现有 Benchmark 很可能低估了这一接口的相对价值。类别和颜色已经足以唯一指代目标时，文字输入仍然有效；真正拉开差距的应是**大量同类或近似实例、语言无法经济地唯一指代、而上层又能直接给出视觉锚点**的场景。后续评测应围绕歧义强度画退化曲线，而不是只在若干固定任务上报告平均成功率。

跨本体统一动作空间需要同时建立**共同语义、时间组织和执行映射**。URR 目标轨迹、81 维超集与几何动作模态将本体差异放在不同位置；其价值取决于视觉监督、动作标签与实际执行的一致性，以及新本体接入时需要重新学习的部分。
:::

## 参考文献 {#references}

1. [OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/abs/2406.09246)，2024。视觉语言动作模型实例。
2. [Mastering Diverse Domains through World Models (DreamerV3)](https://arxiv.org/abs/2301.04104)，2023。环境预测与控制实例。
3. [What Matters in Orchestrating Robot Policies](https://arxiv.org/abs/2606.10267)，2026。高层与低层策略协作。
4. [FlagScale: π0 Serving Example](https://github.com/flagos-ai/FlagScale/blob/main/examples/pi0/README.md)，官方示例。Policy 输入与部署参考。
5. [WALL-X / WALL-OSS](https://github.com/X-Square-Robot/wall-x)，项目仓库。具身基座模型的公开实现。
6. [Dyna-2.1: A Physical Agent for End-to-End Workflows](https://www.dyna.co/dyna-2.1)，2026。URR 数据接口与全身控制器。
7. [RynnBrain 1.1: Towards More Capable and Generalizable Embodied Foundation Model](https://arxiv.org/html/2607.17977v1)，2026。§4.2–4.3：81 维动作空间、Mask 与 G1 特例。
8. [Cosmos 3: Omnimodal World Models for Physical AI](https://arxiv.org/abs/2606.02800)，2026。统一几何动作表示与动作模态建模。
9. [Cosmos 3 Action Generation Cookbook](https://github.com/NVIDIA/cosmos/blob/main/cookbooks/cosmos3/generator/action/README.md)，官方实现。动作分量、维度与采样设置。
10. [Point What You Mean: Visually Grounded Instruction Policy](https://arxiv.org/abs/2512.18933)，2026；[项目页](https://yuhang-harry.github.io/Point-VLA/)。以框、点等视觉指代扩展 VLA 输入，支持静态首帧 Grounding、纯文字兼容与自动数据标注。
11. [VP-VLA: Visual Prompting as an Interface for Vision-Language-Action Models](https://arxiv.org/abs/2603.22003)，2026；[官方仓库](https://github.com/JIA-Lab-research/VP-VLA)。以事件驱动的 Visual Prompt 连接 System 2 Planner 与 System 1 Controller，并通过辅助 Grounding Objective 对齐视觉锚点与动作。
