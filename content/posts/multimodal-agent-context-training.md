---
title: 待完善：多模态 Agent 的 Rollout、推理上下文与训练对齐
tabTitle: 待完善：多模态 Agent 上下文与训练
description: 从 Raw Rollout 到推理上下文，再到 SFT 与 RL：用三个节点、三条边比较多模态 Agent 的上下文构造与训练数据。
order: "10"
date:
meta: MULTIMODAL AGENT · CONTEXT · TRAINING
cardMeta: Multimodal Agent · Context & Training
summary: 三个节点、三条边：原始交互如何装配为推理上下文，又如何变成训练样本与监督信号。
footer: Multimodal Agent · Context & Training
---

**本文尚未完全整理完成，内容仍在继续梳理。**

::: tldr
持续看图、调用工具的 Agent 会产生完整交互历史，模型每次推理则接收其中经过选择和加工的一部分。交互到学习的链路包含三个部分：**原始 Rollout、实际推理上下文、训练样本与监督信号**。

三者通过三条数据关系连接：**Raw Rollout → Inference Context → Training**，以及提供动作标签和奖励的 **Raw Rollout → Training**。图像留存、分辨率、观测时机与压缩策略共同决定第一条边如何构造模型输入。

最关键的对齐是**信息可见性**：训练输入应遵守推理时的信息边界。完整轨迹的成功结果可以提供奖励，却不能提前出现在模型选择动作时的上下文里。轨迹级奖励、逐轮训练样本与窗口化视觉历史可以同时存在，不能只用「Trajectory RL」概括全部设计。

**上下文前缀连续性决定了训练重放的工程形态**：严格追加的历史便于合成一条因果序列；压缩、删图或重构后的输入则需要按每次调用复现。这个区别来自上下文构造方式，文本与多模态 Agent 都可能采用其中任一种。
:::

Computer Use、GUI、Browser 与视觉工具调用 Agent 的动作多为点击、输入或工具调用。[具身 Policy](embodied-models.html)则对接连续控制接口。两类系统都需要从不断增长的观测历史中构造预算有限的模型输入，再将交互结果转化为训练监督。

<figure class="frontier-figure"><div class="context-flow-canvas"><img src="../assets/multimodal-context-training.svg" alt="Raw Rollout 通过 Context Construction 形成 Inference Context，再通过 Training Data Construction 进入 Training；Rollout 另外提供 Labels 和 Rewards。"></div><figcaption><strong>总览 · 三个节点与三条边</strong>。节点描述数据的形态，边描述数据如何被选择、加工和监督；六者共同组成比较维度。窄屏可横向滚动查看。</figcaption></figure>

## 交互到训练的六个维度

| 节点或边 | 数据与转换职责 |
| --- | --- |
| ① Raw Rollout | 保存观测、动作、工具结果、状态和媒体引用 |
| ①→② Context Construction | 从当前可用历史中选择、压缩并装配输入 |
| ② Inference Context | 一次调用实际接收的消息、图像、工具定义和状态 |
| ②→③ Training Data Construction | 重建输入、切分训练序列并设置 Loss Mask |
| ③ Training | 按选定序列与优化单位执行 SFT 或 RL |
| ①→③ Labels / Rewards | 将动作示范、过程反馈和任务结果转为监督 |

历史保留策略与学习方式属于不同维度：Full History、Sliding Window 控制可见信息，SFT、RL 定义学习目标。窗口化上下文既可以用于 SFT，也可以用于由完整轨迹奖励驱动的 RL。

## 原始记录与实际模型输入

记 `H_t` 为第 t 次决策前已发生的历史，`f_v` 为版本 v 的上下文构造器，则当前输入是 `C_t = f_v(H_t)`。`H_t` 可以很大，`C_t` 受模型预算和任务需求约束。历史图像可能仍保存在日志中，却已被从请求中移除；一段工具输出可能只剩摘要；当前截图也可能经过缩放或裁剪。

复现推理需要保留两类可关联的信息：**原始交互证据**，以及**构造实际请求所需的状态与规则**。后者包括媒体版本、压缩结果、消息选择、工具 Schema 和模型模板。原始截图与动作不足以精确重建当时的 `C_t`；由模型生成的摘要也需要保存实际产物，重新生成可能改变输入。

Pi 把这层关系显式写成 `AgentMessage[] → transformContext → convertToLlm → Message[]`：前一步可以裁剪和注入上下文，后一步转换成模型消息格式[@4]。DeepSeek Harness 则用 `Session.deriveMessages()` 从事件日志投影模型可见消息，图像卸载与压缩是这一投影过程的组成部分[@6][@7]。两者都说明：**会话存储格式与模型输入格式可以不同**。

## 上下文构造中的四项图像策略

图像密集任务的上下文构造由四项策略共同控制。这些策略作为 `f_v` 的配置随推理请求记录，支持训练重建与效果归因。

| 参数 | 需要记录的选择 | 会影响什么 |
| --- | --- | --- |
| `image_retention_policy` | 全量、仅当前、最近 K 张、按预算或任务选择；淘汰顺序 | 历史视觉证据是否仍可用 |
| `image_resolution_policy` | 原图、缩放、局部裁剪、Patch 与 Detail 设置 | 小目标、文字与坐标精度 |
| `observation_policy` | 自动或按需截图、截图频率、一次执行多少动作 | 动作之间哪些环境变化可见 |
| `compaction_policy` | 触发阈值、摘要、占位符、工具结果清理 | 长程状态如何保留与失真 |

这四项可以同时生效：保留最近三张图、把旧文本压成摘要，并在需要读小字时裁剪局部。文本历史、视觉证据和摘要状态分别占用预算，也具有不同的信息保真度。

接口约束同样影响上下文构造。OpenAI Computer Use 用调用结果与新截图继续交互，Responses 支持压缩后的上下文延续[@1][@2]。Claude 的截图缩放、历史裁剪与服务端工具结果清理受到模型接口约束，并影响缓存和 Thinking 的保留[@3]。这些运行时机制与模型训练算法分别属于数据链路的不同环节。

## 训练样本如何复现推理输入

完成一条轨迹后，可以从各个历史前缀重建 `C_t`，再与目标响应 `y_t` 配对。需要独立标记两件事：**哪些内容作为条件输入**，以及**哪些输出位置承担 Loss**。以前的 Assistant 动作可以留在上下文里，却不参与本次监督；图像和工具结果也可以作为条件，而非让模型预测的目标。

| 序列组织方式 | 一个训练样本包含什么 | 常见监督范围 |
| --- | --- | --- |
| Transition / Turn | 一次推理输入与当前响应；输入本身可以包含长历史 | 当前响应 |
| Windowed | 有界的多轮片段，或长文本历史加有限视觉窗口 | 当前轮或窗口内若干轮 |
| Trajectory | 一条多轮交互序列，按各步因果前缀预测 | 多个 Assistant Turn，失败或无效标签可单独屏蔽 |

**序列组织与奖励归属相互独立**：逐轮样本可以共享整条轨迹的任务奖励，整轨迹数据文件也可以被切成多个训练序列。RL 的完整定义还包含任务奖励、过程奖励、Advantage 与重要性比率各自的计算单位。

Fara 1.5 是一个具体例子：推理保留文本会话历史与最近三张截图；训练以轨迹中的每一步构造样本，并只对最近三轮的思考和动作计算交叉熵[@8]。WebChain 则把同类交互提供为整轨迹 Trace SFT 或滑动窗口 Seed/Demo SFT，并明确 Assistant 内容与其他内容的 Loss Mask[@9]。**原始轨迹相同，训练序列仍可以不同。**

## Context 前缀连续性与训练重放 {#prefix-continuity}

**Prefix Continuity（上下文前缀连续性）**描述相邻模型调用能否共享同一个不变的历史前缀。设 `C_t` 是第 t 次调用的实际输入，`y_t` 是本次响应，`o_{t+1}` 是后续观测或工具结果。严格追加时，下一次输入可表示为：

```text
C_{t+1} = C_t ⊕ y_t ⊕ o_{t+1}
```

其中 `⊕` 表示按模型输入格式追加。连续性需要在实际 Token、图像输入及其位置结构上成立：消息列表仍在增长，不代表模型可见的前缀保持不变。旧图像被卸载、工具结果被截断、历史被摘要替换，或 System Prompt 与工具定义发生变化，都可能打断前缀连续性。

### 前缀连续时：整轨迹序列能够复现逐步输入

如果每一步只追加响应和新观测，最终序列中 `y_t` 之前的因果前缀就对应当时的 `C_t`。经过固定模板转换、媒体编码和 Loss Mask 设置后，多轮动作可以在一条训练序列中接受监督，避免为每一步重复构造全部历史。这是追加式文本工具调用 Agent 的一种自然实现，同样适用于保留完整视觉历史的多模态 Agent。

因此，「原始 Rollout 可以直接训练」成立的条件是：**记录包含实际输入所需的信息，上下文投影是稳定追加的，训练模板与监督范围已经确定**。仅有观测和动作日志仍不足以替代这些加工步骤。

### 前缀重构时：每次调用需要自己的输入快照

压缩或裁剪改变了先前输入，最终历史就不再包含所有时刻实际使用的前缀。例如，仅保留当前截图的两次决策可以写成：

```text
第 1 次调用： [任务, 图像 I1]                 → 动作 a1
第 2 次调用： [任务, 历史动作 a1, 图像 I2]    → 动作 a2

直接拼接：   [任务, 图像 I1, 动作 a1, 图像 I2] → 动作 a2
```

直接拼接会让 `a2` 在训练时看到已经从推理输入中移除的 `I1`。同理，使用最终摘要回填较早步骤，可能把之后才获得的信息提前暴露。**正确的重放对象是每次生成动作时的上下文，而非轨迹结束时的最新上下文。**

按调用构造 `(C_t, y_t)` 的 Transition / Turn 样本最直接；窗口化样本也可以采用同样规则。Fara 1.5 的近期截图输入与窗口化 Loss，以及 Xiaomi-GUI-0 的当前截图和有界响应历史，体现了按局部输入组织训练的实现[@8][@11]。如果仍要把多步放入同一个计算批次，需要使用独立序列，或能准确复现各步可见范围的注意力与位置处理。

### 工程影响：输入重放、缓存与 RL 概率对齐

| 工程环节 | 稳定追加的上下文 | 压缩、裁剪或重构的上下文 |
| --- | --- | --- |
| 训练数据 | 可将多个动作组织为一条共享前缀的因果序列 | 按调用保存或重建输入；增加重复历史与媒体处理成本 |
| 输入复现 | 固定模板和追加日志可重建历史前缀 | 需要实际摘要、媒体版本、保留范围和构造器版本 |
| 推理缓存 | 不变前缀有利于 KV Cache 与前缀缓存复用 | 改写位置之后的缓存通常需重新计算，具体取决于缓存机制 |
| 监督 Mask | 区分输入与承担 Loss 的输出 | 还需控制历史内容的可见性；仅屏蔽旧输出 Loss 不会隐藏旧图像 |
| RL 更新 | 同样需要对齐行为策略生成时的输入 | 每轮概率计算尤其需要绑定原始 `C_t`，避免上下文重建造成比率偏差 |

在 RL 中，轨迹奖励与逐轮样本仍可组合。若算法使用新旧策略的重要性比率，二者必须对应**同一输入条件与同一输出动作**；用重构后的另一份上下文计算新策略概率，会把输入变化混入策略更新。保存行为策略版本、生成时输入引用与相应 Log Probability，有助于核对这条关系。

输入快照不必把整段历史重复存储：不可变消息、媒体引用与实际压缩产物可以按调用关联，再由确定性的构造规则重放。关键是恢复当时的信息边界，而非选择某一种文件布局。

### 前缀连续性与训练粒度是独立维度

**稳定追加更便于整轨迹合并计算，频繁重构更适合逐调用或窗口化训练**，这是工程上的适配关系。Trajectory-Level Learning 仍可以在一条交互轨迹的多个 `C_t` 上联合优化，前缀不连续并不使轨迹级目标失效；它主要阻止把完整 Rollout 不加处理地当作一条普通追加序列。

文本 Agent 在长程运行中也会压缩或裁剪历史，多模态 Agent 也可以保留完整视觉前缀。因此训练形态需要由**上下文构造、序列计算与奖励归属**共同定义，不能由是否含图像直接推断。

## 代表工作按六个维度比较

「未披露」表示对应公开材料未给出模型训练流程；Harness 的上下文实现不构成底层模型训练方法的证据。

| 工作 | ① Raw Rollout | ①→② 上下文构造 | ② 推理上下文 | ②→③ 训练样本构造 | ③ Training | ①→③ 标签／奖励 |
| --- | --- | --- | --- | --- | --- | --- |
| OpenAI Computer Use[@1][@2] | 调用、截图、执行结果 | 响应链延续；可用 Compaction | 有效历史状态与新观测 | 未披露 | 未披露 | 未披露 |
| Claude Computer Use[@3] | Tool Use / Result、截图 | 按模型约束缩放与清理旧结果 | 保留消息、图像与工具内容 | 未披露 | 未披露 | 未披露 |
| Pi Agent[@4][@5] | 会话消息、工具交互与压缩记录 | 上下文变换、消息转换与压缩 | 转换后的有效历史 | 所调用模型的训练未披露 | 同左 | 同左 |
| DeepSeek Harness[@6][@7] | 事件日志与媒体记录 | 消息投影、图像卸载、压缩 | 投影后的模型消息 | 所调用模型的训练未披露 | 同左 | 同左 |
| Fara 1.5[@8] | Observe–Think–Act 轨迹 | 文本历史与最近三张截图 | 多轮文本与近期视觉 | 逐步建样本；近三轮输出承载 Loss | 窗口化多轮 SFT | 经正确性、效率与交互检查的示范 |
| WebChain[@9] | 截图、动作、网页结构与元数据 | 全 Trace 或窗口化组织 | 取决于所选数据格式与部署 | Trace / Seed SFT；Assistant Mask | SFT 数据格式，非统一训练器 | 验证后的交互示范 |
| OpenWebRL[@10] | 浏览器轨迹、截图、任务结果 | 发布集保存逐轮 Prompt 与历史元数据 | 已序列化的逐轮多模态输入 | 当前响应监督；轨迹关联保留 | Turn SFT，后续在线 RL | 成功示范、格式与任务完成奖励 |
| Xiaomi-GUI-0[@11] | 截图、响应、动作与结果 | 当前截图与有界响应历史 | 任务、当前观测与近期历史 | 三个阶段共享逐轮表示 | SFT → Step RL → Agentic RL | 单响应协议反馈与完整任务反馈 |

这些实现覆盖数据链路的不同环节：Pi 与 DeepSeek 显式分离会话记录与模型请求；Fara 与 WebChain 将视觉窗口和 Loss Mask 落到训练格式；Xiaomi-GUI-0 区分单响应反馈与完整 Rollout 反馈，同时用逐轮表示控制训练序列长度[@11]。

## 标签和奖励可以后验，动作输入必须因果

完整 Rollout 的终局结果可以用于筛选示范或计算任务奖励；校验器可以看到整条轨迹后再判断是否完成。但第 t 次动作的输入必须来自当时可获得的信息。把最终页面、后续成功摘要或教师事后诊断混进 `C_t`，就会让训练学到部署时拿不到的条件。

失败动作也有两种角色：它可以作为后续恢复时必须看到的历史，却不一定是应当模仿的标签。Xiaomi-GUI-0 对重复步骤进行标签处理，同时保留相应历史，并构造错误后的纠正与恢复监督[@11]。因此「保留失败轨迹」与「监督模型重复失败动作」需要分开。

## 训练与推理的一致性

训练与推理的对齐包含四个条件：

1. **输入可见性一致**：每个 `C_t` 只使用当时可用的信息；训练与推理采用相同或经过验证的图像选择、缩放和压缩规则。
2. **序列与 Loss 明确**：当前轮、近期窗口或多轮轨迹的监督范围固定，历史响应、工具内容和失败动作的 Mask 可追溯。
3. **监督来源可追溯**：动作示范、过程奖励和任务奖励关联原始记录，教师纠正、模型预测与实际执行动作分别保存。
4. **前缀重放正确**：明确哪些调用保持追加、哪些发生了压缩或重构；各步训练使用该动作生成时的输入，缓存与概率计算保持一致。

验证时应比较历史选择与压缩策略的消融，并同时报告任务成功、恢复能力、视觉 Token 与延迟。只测请求变短，无法判断它是否丢掉关键视觉状态；只测离线动作匹配，也无法判断错误发生后的恢复是否改善。

[自我改进](agent-robo-rsi.html)将经验转化为持久的系统能力，上下文构造与训练样本加工负责其中的信息转换。候选更新再通过[部署数据闭环](embodied-data-flywheel.html)中的评测与准入机制，进入下一轮运行。

::: my-take
多模态 Agent 的关键接口是**从交互历史到模型可见信息的构造规则**。它决定模型能用什么证据，也决定训练需要重建什么输入。轨迹、构造状态与监督来源共同决定一条经验是否能够复用。

训练方法建立在这条信息链路之上：计算可以重排和打包，输入仍须遵守部署时的信息边界。轨迹奖励与逐轮优化能否有效组合，取决于历史状态是否可复现、监督是否对齐，以及反馈是否能归到实际产生它的行为。

Prefix Continuity 将这条原则落实到计算：稳定前缀允许共享历史，重构前缀要求保存并重放逐次输入。训练粒度由信息结构与计算成本共同决定，轨迹级的学习目标则可以跨越这些输入边界。
:::

## 参考文献 {#references}

1. [OpenAI Computer Use](https://developers.openai.com/api/docs/guides/tools-computer-use)，官方文档。调用、截图与后续交互。
2. [OpenAI Responses Compaction](https://developers.openai.com/api/docs/guides/compaction)，官方文档。压缩项与上下文延续。
3. [Claude Computer Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)，官方文档。截图历史、尺寸与工具结果管理。
4. [Pi Agent Core](https://github.com/earendil-works/pi/blob/main/packages/agent/README.md)，官方仓库。`transformContext` 与 `convertToLlm`。
5. [Pi Context Compaction](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/compaction.md)，官方仓库。历史摘要与近期 Token 保留。
6. [DeepSeek Harness Session](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)，官方仓库。事件日志与消息投影。
7. [DeepSeek Harness Compaction](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md)，官方仓库。压缩与图像卸载。
8. [Fara1.5: A Family of Frontier Computer Use Agent Models](https://www.microsoft.com/en-us/research/articles/fara1-5-computer-use-agent/)，Microsoft Research。推理窗口、逐步训练与 Loss Mask。
9. [WebChain](https://huggingface.co/datasets/webagentlab/webchain)，作者数据卡。Trace SFT、Seed/Demo SFT 与监督格式。
10. [OpenWebRL SFT Trajectories](https://huggingface.co/datasets/OpenWebRL/OpenWebRL-SFT-Trajectories)，作者数据卡。逐轮 SFT 数据与后续在线 RL 的关系。
11. [Xiaomi-GUI-0 Technical Report](https://arxiv.org/html/2606.31410v1)，2026。逐轮上下文、分阶段训练、奖励与恢复监督。
