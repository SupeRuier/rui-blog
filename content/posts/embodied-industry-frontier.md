---
title: 具身业界前沿：有实证价值的进展
description: 按时间记录具身智能的数据、泛化、长程能力与商业化接口进展，区分公开结果与技术判断。
date: 2026-10-16
meta: EMBODIED AI · INDUSTRY FRONTIER · LIVING NOTE
cardMeta: Embodied AI · Living Note   # 首页卡片右上角，比文章页眉短
summary: 从数据与泛化，到长程工作流、持续运行与 Policy API：带日期的能力及商业化进展。
pinned: 置顶 · 持续更新
footer: Embodied Industry Frontier · Living Note
order: "13"
---

::: tldr
具身智能的前沿进展同时发生在三个层面：**模型如何获得能力、系统能够连续承担多复杂的工作、能力如何被交付给开发者与客户**。

- **数据与适应**：Dyna-2、Helix 2.5 和 GPT-Policy 分别提供预训练规模、未见环境泛化与上下文适应的证据。
- **长程能力**：Dyna-2.1 将移动、操作、记忆与恢复接成一小时工作流；Figure F.03 的百小时级物流直播展示重复作业的持续运行能力。工作流复杂度与运行时长是两条独立的改善轴。
- **商业化接口**：Pi API 将数据上传、微调与托管推理交给外部开发者。它体现机器人基础模型服务化的产品路径，其商业价值仍取决于接入成本、服务可靠性与客户收益。

能力证据、系统耐久性与商业化接口分别评价。时间线记录事件或发布的时间，正文保留关键结果、技术含义和适用边界。
:::

<figure class="frontier-timeline"><figcaption><strong>前沿进展时间线</strong> · 更新于 2026-10-16</figcaption><ol><li><a href="#figure-endurance"><time datetime="2026-05">2026-05</time><span class="timeline-kind">能力 · 持续运行</span><strong>Figure F.03 百小时级物流直播</strong><span>重复包裹操作由单次演示延伸到跨日运行，直播最终延续至约 200 小时。</span></a></li><li><a href="#dyna-2"><time datetime="2026-08">2026-08</time><span class="timeline-kind">数据 · 规模效应</span><strong>Dyna-2 百万小时 Ego 预训练</strong><span>人类视频规模的收益传递到机器人后训练与实机表现。</span></a></li><li><a href="#gpt-policy"><time datetime="2026-09-16">2026-09-16</time><span class="timeline-kind">适应 · 上下文</span><strong>GPT-Policy</strong><span>固定通用 VLM 通过视觉参考与受约束工具获得新任务行为。</span></a></li><li><a href="#helix-25"><time datetime="2026-09-17">2026-09-17</time><span class="timeline-kind">能力 · 泛化</span><strong>Helix 2.5 未见家庭评测</strong><span>Index 预训练提高 30 个未见家庭中的任务成功率。</span></a></li><li><a href="#dyna-21"><time datetime="2026-09-29">2026-09-29</time><span class="timeline-kind">能力 · 长程工作流</span><strong>Dyna-2.1 一小时洗衣工作流</strong><span>移动、操作、分支决策、记忆与恢复进入同一连续过程。</span></a></li><li><a href="#pi-api"><time datetime="2026-10-13">2026-10-13</time><span class="timeline-kind">商业化 · 模型服务</span><strong>Pi API beta</strong><span>外部开发者通过托管服务完成数据上传、微调、推理与迭代。</span></a></li></ol></figure>

日期按公开材料的精度保留：Figure 为直播事件月份，Dyna-2 为官方发布月份，其余为发布日期。文章更新日期与事件日期分别标注。以下收录对照实验、公开长时演示与可核验的服务接口；它们提供的证据强度不同，结论随相应条件成立。

## 商业化接口 {#commercialization}

### Pi API：机器人基础模型的服务化交付 {#pi-api}

::: date 2026-10-13
发布时间 · 2026 年 10 月 13 日
:::

**关键进展。**Physical Intelligence 发布 Pi API beta，开发者可以上传机器人数据，使用 π 管理的计算与训练设施微调模型，再通过托管网关调用模型推理。官方展示的迭代链路是「采集示范 → 上传与微调 → 真机测试 → 根据失败补数据」；多数合作应用使用云端托管推理，部分应用也暴露了网络连接问题[@5]。

**交付方式。**开发者提供机器人、场景与任务数据，π 提供基础模型、适配计算和推理服务。模型能力通过稳定接口进入不同垂直应用，客户可以独立推进数据与评测循环。相较自行维护模型训练设施，这条路径把部分基础设施建设转为持续服务依赖。

**边界。**当前为 beta，公开案例证明了接口与早期合作路径，尚不能据此判断大规模服务的成本、延迟保障与客户经济收益。云端推理仍需与本地控制、断连处理和动作有效期衔接。

::: my-take
Pi API 体现了一种**机器人基础模型服务化**的商业模式：模型方集中积累通用能力与训练设施，应用方围绕硬件、任务数据和客户流程形成差异化。可持续价值来自适配效率、持续模型升级与可靠交付。API beta 已经呈现这种分工，但定价方式、收入规模与盈利能力仍需后续商业证据。
:::

## 长程能力与持续运行 {#long-horizon}

### Dyna-2.1：从单项技能推进到一小时工作流 {#dyna-21}

::: date 2026-09-29
发布时间 · 2026 年 9 月 29 日
:::

**关键结果。**Dyna 公布 Taku 自主执行一小时洗衣房工作流的不剪辑演示。洗衣循环包含约 79 个物理步骤与 13 个工作流决策点，系统需要在不同工位之间移动，协调洗衣、烘干、折叠和上架，并依据设备状态选择后续步骤[@6]。

**能力推进。**全身控制器跟踪 URR 目标轨迹，Dyna-2 Policy 执行操作，VLM Orchestrator 监控工作流并维护文本状态。局部操作恢复与跨步骤重试、换方案由不同层共同承担。其新增价值是将多种技能、条件分支和长时状态连接为完整业务过程；更长的无人值守时间取决于这些环节共同可靠，而非单个技能的成功率[@6]。

**边界。**一小时演示是特定工作流的系统能力证据，并非跨站点长班次可靠率。约 79 步与单步可靠率的交互图用于说明误差累积，其中示意概率不能写成实测工作流成功率。持续部署的干预间隔与退化情况需要独立记录和评测。

### Figure F.03：百小时级包裹作业直播 {#figure-endurance}

::: date 2026-05
直播事件 · 2026 年 5 月；制作方复盘发布于 2026 年 7 月 20 日
:::

**关键结果。**Figure 的 F.03 / Helix-02 包裹作业直播从 8 小时目标延长，跨过 100 小时后最终延续至约 200 小时。现场直播制作方 Think Foundry 的复盘记录了多台 F.03 加入、机器人轮换与电池热更换；任务集中于反复处理输送线上的包裹。官方回放提供可长时间观察的作业记录[@7][@8]。

**能力里程碑。**百小时级公开运行把证据从短动作片段扩展到长期重复执行，使硬件耐久性、补能与持续作业组织进入观察范围。它与 Dyna-2.1 推进的是不同能力轴：Figure 强调固定任务的持续运行，Dyna 强调多阶段工作流的状态保持与分支衔接。二者分别降低「能否一直做」与「能否把整件事做完」的不确定性。

**边界。**直播累计时长、单台机器人运行时长、单次任务成功率和无人干预时长是不同口径。制作方的「无故障」表述不能直接转换成零操作错误或零人工干预；多机轮换也不能写成单台机器人不间断运行 200 小时。公开画面提供能力证据，完整可靠性结论仍需要错误、干预、停机与有效吞吐日志。

## 数据量 {#data-scale}

### Dyna-2：百万小时 Ego 数据出现 Human-to-Robot Scaling {#dyna-2}

::: date 2026-08
发布时间 · 2026 年 8 月
:::

Dyna-2 是基于视频扩散骨干和 Flow Matching 训练的 World-Action Model。其预训练数据主要是头戴式、第一视角的人类日常双手操作视频，规模超过 **100 万小时**；通过 3D hand pose 得到 wrist trajectory 与 grasp signal 作为伪动作监督，并构造 1K、10K、100K、1M 小时的嵌套数据档位。模型预训练阶段不使用机器人轨迹，也没有专门做 human–robot 视觉或运动学对齐[@1]。

<figure class="frontier-figure"><img src="../assets/dyna2-original.jpg" alt="Dyna-2 官方发布图，由大量第一视角人类操作视频画面组成 Dyna-2 字样。"><figcaption><strong>官方原图</strong> · Dyna-2 的大规模人类第一视角操作视频视觉。来源：Dyna Robotics<a class="citation" href="#ref-1" aria-label="跳转到参考文献 1">[1]</a>。</figcaption></figure>

<figure class="frontier-figure"><img src="../assets/dyna2-scaling.svg" alt="Dyna-2 从一千到一百万小时人类第一视角视频预训练时，十四项机器人任务的平均归一化得分从百分之二十升至百分之五十三。"><figcaption>图 1 · 人类 Ego 预训练规模与实机后训练性能。数值来自 Dyna 官方报告；本图重新绘制。</figcaption></figure>

**关键结果。**在未参与预训练的机器人数据上，离线动作预测指标随人类视频规模单调改善，且 10K→100K 小时附近出现明显拐点。进一步固定每项任务的机器人后训练数据与训练方案，在 14 项、3 类机器人本体的盲测中，平均归一化实机得分随预训练规模从 **20%→28%→45%→53%** 上升；1M 小时模型在 14 项任务中的 9 项最好。瓶盖旋拧只用了约 10 分钟机器人示范，其成功率仍随人类预训练规模提升至 50%；锁孔转钥匙则直到 1M 小时档才达到 90% 成功率[@1]。

**它证明了什么。**这项工作的价值不是单纯刷新数据量，而是在控制变量下提供了较强证据：大规模人类第一视角操作视频能够形成跨本体迁移的 scaling law，并最终反映到机器人后训练与实机性能。消融还表明，未来视频预测是关键——action-only 方案没有稳定随规模改善；固定动作标注数据后，只增加 video-only 数据仍能提升未见机器人数据上的泛化。因此，更准确的结论是**具备世界动态预测目标的大规模 Ego 视频预训练，可以成为机器人策略的新 scaling axis**，而不是“只要堆任意人类视频就会自动得到机器人能力”。

**边界。**实机任务仍使用少量任务相关机器人数据进行后训练；离线 cross-embodiment scaling 也不等同于完全 zero-shot 控制。报告来自公司自身，任务、数据与模型尚未完整开放，第三方复现仍然缺失。

## 泛化性能 {#generalization}

### Helix 2.5：Index 预训练支撑 30 个家庭的 Zero-shot 泛化 {#helix-25}

::: date 2026-09-17
发布时间 · 2026 年 9 月 17 日
:::

Helix 2.5 先在 Figure 的人类行为数据集 **Index** 上从随机初始化预训练，再分别适配整理客厅、折毛巾和铺床三类全身任务。Index 通过面向全球用户的数据采集 App 获得真实人类活动视频；Figure 披露其上线四个月后已覆盖 108 个国家、44,000 余名周活跃采集者与 1,600 万段视频，并通过过滤、反作弊、去重、重平衡和分层文本标注形成训练数据[@2]。

<figure class="frontier-figure"><img src="../assets/helix25-original.png" alt="Figure 官方图表：Helix 2.5 在三十个未见家庭中，从头训练策略的总成功率为百分之八，Index 预训练策略为百分之五十六，并列出毛巾、玩具和铺床三项结果。"><figcaption><strong>官方原图（Figure 1）</strong> · Index 预训练对 30 个未见家庭 Zero-Shot Success 的贡献。来源：Figure<a class="citation" href="#ref-3" aria-label="跳转到参考文献 3">[3]</a>。</figcaption></figure>

**评测设置。**30 个湾区家庭、室内布局和被操作物体均未出现在任务数据中；到达评测家庭后不采集数据、不微调、不适应，也不使用评测 rollout 选择 checkpoint。三个任务分别要求完成全部物体整理、全部毛巾折叠入篮或完整铺床，不给部分分；同一任务使用同一个固定 checkpoint 覆盖全部家庭[@3]。

**关键结果。**在架构、优化、超参数、任务数据和评测全部固定时，官方正文汇总的从头训练策略严格端到端成功率为 **9%**，Index 预训练策略达到 **56%**，提升超过 6 倍；官方 Figure 1 的 Pooled 柱则标为 8%，这里保留原始材料中的两种标注。相较一个代表性的 Helix 02 行为，Helix 2.5 用一半任务特定数据匹配其成功率，同时把部署范围扩展至 30 个未见家庭。随着 Index 预训练数据扩大 8 倍，下游机器人动作预测损失平滑下降，最大档结果可由较小档实验预估，报告的预测误差为全区间变化量的 0.54%[@3]。

**它证明了什么。**这比“在训练房间里完成长任务”向前走了一步：广泛的人类 Ego 数据预训练显著提高了全身 humanoid policy 在未见家庭、布局和物体上的迁移能力，而且这种收益是在严格控制任务数据后测得的。它初步支持“广泛预训练一次、用少量机器人数据定义行为、部署时跨环境泛化”的路线。

**边界。**Zero-shot 指评测环境和物体，而不是任务本身：三类行为仍使用了其他环境收集的 task-specification data 做适配。56% 也说明家庭级全身泛化远未解决；目前只有三类任务、单一公司系统和官方盲测，尚不能外推到任意家庭任务或跨机器人本体。

## 部署时适应 {#deployment-adaptation}

### GPT-Policy：固定通用 VLM 从上下文中获得机器人行为 {#gpt-policy}

::: date 2026-09-16
发布时间 · 2026 年 9 月 16 日
:::

GPT-Policy 将固定的通用 VLM 连接到一组受约束的机器人 Tool：Context Compiler 把任务指令、当前多视角观测、机器人状态和任务参考组织成图文输入，VLM 每轮只产生一个结构化工具请求；执行适配器负责目标解析、轨迹采样、逆运动学残差检查和动作执行，再将新观测与执行或拒绝反馈返回下一轮。模型参数在任务过程中保持不变，适应发生在**上下文和闭环决策**中，而不是权重更新[@4]。

<figure class="frontier-figure"><img src="../assets/gpt-policy-original-figure2.png" alt="GPT-Policy 论文架构图：任务指令、当前观测和任务上下文被组装为模型输入，固定通用 VLM 生成工具请求，机器人工具接口验证并执行，结果返回下一轮决策。"><figcaption><strong>论文原图（Figure 2）</strong> · GPT-Policy 的决策输入、固定 VLM Policy 与 Robot-tool Interface 闭环架构。来源：Cheng et al.<a class="citation" href="#ref-4" aria-label="跳转到参考文献 4">[4]</a>。</figcaption></figure>

**关键结果。**论文在两种真机平台上评估 10 个任务，每个条件仅做 3 次试验。对于 Pick Red Towel 和 Pick Up Notebook，在没有参考视频时均为 **0/3**，加入一段不含机器人动作标签的人类视频后均达到 **2/3**；决策次数分别从 96.3 降至 76.7、从 94.0 降至 66.7，平均执行时间从 24.6 分钟降至 18.9 和 16.1 分钟。对于更依赖接触细节的任务，机器人视频提供程序信息，而对齐的动作参考继续提供增益：开瓶盖从无示范的 0/3、视频的 2/3 提升至视频加动作的 3/3；拔出并重新插入插头则为 0/3、0/3 和 2/3[@4]。

**它证明了什么。**至少在小规模真机实验中，通用 VLM 已能把部署时提供的**程序性视觉上下文**转化为新的工具调用序列：人类视频即使没有机器人动作标签，也能改变策略并带来此前未成功任务的完成案例；当任务涉及精细接触时，跨本体视觉过程不够，机器人动作参考仍然重要。它提供了一条不同于 VLA 参数训练的路线：让通用模型承担低频理解、规划、观察和恢复，把连续运动交给可验证的工具与控制器。

**边界。**这是 test-time / in-context adaptation，不是跨任务持久保存的参数学习，也不能据此声称形成了 Robo RSI。每个条件只有 3 次试验，结果的统计稳定性有限；单任务需要约 24–96 次 VLM 决策和 5–25 分钟，离实时低层控制仍很远。受约束 Tool 内部承担了轨迹生成和 IK 校验，而论文也观察到双臂碰撞，因此“VLM 知道做什么”与“机器人安全、稳定地执行”仍是两层问题。

## 能力与商业化的对照

::: date 2026-10-16
综合判断更新 · 2026 年 10 月 16 日
:::

| 事件／发布时间 | 进展 | 推进的维度 | 证据形态 | 主要边界 |
| --- | --- | --- | --- | --- |
| 2026-05 | Figure F.03 直播 | 固定任务持续运行与系统耐久性 | 官方回放与制作方现场复盘 | 多机轮换；累计直播时长不同于单机无人干预时长 |
| 2026-08 | Dyna-2 | 人类视频规模 → 实机后训练性能 | 厂商规模实验 | 仍需机器人后训练，公开复现有限 |
| 2026-09-16 | GPT-Policy | 视觉上下文 → 新任务行为 | 论文真机实验 | 每条件 3 次试验，依赖工具能力与执行治理 |
| 2026-09-17 | Helix 2.5 | 广泛预训练 → 未见家庭泛化 | 厂商固定任务盲测 | 任务经过适配；家庭级成功率仍有限 |
| 2026-09-29 | Dyna-2.1 | 技能 → 多阶段长程工作流 | 一小时不剪辑演示与系统报告 | 特定流程可行性不同于跨站点可靠率 |
| 2026-10-13 | Pi API beta | 基础模型 → 可调用的训练与推理服务 | 官方接口发布与早期合作应用 | beta 阶段，商业收益和服务保障仍待验证 |

**长程能力需要同时看持续性与复杂度。**重复处理包裹主要考验执行稳定性、补能与异常处置；洗衣工作流还要求跨工位协调、状态记忆和条件分支。时长增长不自动带来任务复杂度增长。

**模型能力与交付能力相互约束。**预训练与上下文适应提供行为基础，工作流组织使技能形成可用流程，API 服务降低应用方接入基础模型的门槛。接口可用后，模型收益仍需在客户的真实流程中转成有效吞吐、更少干预与更低总成本。

相关机制分别见[具身数据体系](embodied-data-pyramid.html)、[具身 Policy](embodied-models.html)、[Robot Agent System 2](robot-agent-system2.html)与[具身系统评测](robot-agent-evaluation.html)。

::: my-take
具身智能的技术价值沿着**能力形成 → 长程运行 → 可规模交付**逐步兑现。数据与模型决定会做什么，控制与工作流决定能否持续完成工作，商业化接口决定这种能力能否被更多应用方复用。

Dyna-2.1 与 Figure 的长时演示属于能力推进，Pi API 属于交付方式与商业模式推进。三者最终需要汇合到同一客户指标：在明确任务和环境约束下，持续产生可验收的工作成果，并减少总体人工与运行成本。
:::

## 参考文献 {#references}

1. [Dyna Robotics, Dyna-2: A 1-Million-Hour Scaling Law for World-Action Models](https://www.dyna.co/dyna-2)，2026-08。
2. [Figure, Introducing Index: Building The World’s Largest and Most Diverse Physical Dataset](https://www.figure.ai/news/introducing-index)，2026-08-25。
3. [Figure, Helix 2.5: Zero-Shot 30-Home Generalization](https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization)，2026-09-17。
4. [Cheng et al., In-Context Robot Learning with VLM Agents](https://cheng-haha.github.io/GPT-Policy/paper.pdf)，2026-09-16。[项目页](https://cheng-haha.github.io/GPT-Policy/)；[代码](https://github.com/cheng-haha/GPT-Policy)。
5. [Physical Intelligence, Frontier Models for Every Robot: Announcing our API beta](https://www.pi.website/blog/api-beta)，2026-10-13。数据上传、微调与云端托管推理。
6. [Dyna Robotics, Dyna-2.1: A Physical Agent for End-to-End Workflows](https://www.dyna.co/dyna-2.1)，2026-09-29。一小时工作流演示与三层系统。
7. [Think Foundry, Producing Figure’s 200-hour F.03 Humanoid Robot Livestream](https://www.thinkfoundry.com/producing-figure-200hour-f03-humanoid-robot-livestream)，2026-07-20。直播制作方对 2026 年 5 月现场事件的第一手复盘。
8. [Figure 官方物流直播回放](https://www.youtube.com/watch?list=PLERkQiTht0NdlYUoQKw4Ca8jr9oYYsyKB&v=382fduEzyRU)，2026-05 直播事件；回放列表由现场制作方复盘链接提供。
