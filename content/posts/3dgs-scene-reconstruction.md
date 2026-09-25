---
title: 基于 3DGS 的可编辑世界构建与闭环仿真
tabTitle: 3DGS 可编辑世界构建
description: 基于 3DGS 的可编辑世界构建与闭环仿真：从监督可信到交互可运行的完整链路。
order: "02"
date:                                # 占位，暂不填；填 YYYY-MM-DD 会显示在文章页页眉
meta: 3D RECONSTRUCTION · FRAMEWORK
cardMeta: 3D Reconstruction   # 首页卡片右上角，比文章页眉短
summary: 从「可观看」走向「可编辑、可生产数据、可闭环交互」的重建链路与可信度分级。
footer: 3D Reconstruction
---

::: note
框架草稿：以 Street Gaussians 与 ReconX 对照动态街景重建和稀疏视角补全两类技术背景。
:::

[3D Gaussian Splatting（3DGS）](https://arxiv.org/abs/2308.04079)用可优化的三维高斯作为显式场景表示，将多视角图像拟合成可以快速渲染的新视角[@1]。做可编辑合成时，除了外观质量，还必须考虑动态物体、视角缺失和编辑后的几何一致性。

## Street Gaussians：动态道路场景的显式拆解

[Street Gaussians](https://arxiv.org/abs/2401.01339) 的背景是道路视频中的车辆在运动，而早期动态街景 NeRF 类方案训练和渲染较慢。它把背景与前景车辆组织为不同的高斯点云，给点云附加语义信息，利用可优化的跟踪位姿和时间相关的外观表示处理车辆动态。显式的背景—车辆组合使新视角渲染、车辆替换和位置编辑更自然[@2]；其适用前提仍包括可靠的相机与物体运动估计。

## ReconX：稀疏观测下先补视角、再重建

[ReconX](https://arxiv.org/abs/2408.16767) 面对的是输入视角太少、遮挡区域无法只靠多视角拟合还原的问题。它先由有限视角构建全局点云作为三维结构条件，借助预训练的视频扩散模型生成视角间更连贯的画面，再用**置信度感知的 3DGS 优化**恢复场景[@3]。这里扩散模型负责补齐观测，3DGS 负责最终场景表示；生成的隐藏区域是推断，不等于真实测量。

## 可编辑合成如何评估

Street Gaussians 更关注有动态物体的街景分层和编辑，ReconX 更关注稀疏视角的三维一致补全；二者不是同一数据条件下的直接替代。进一步用于数据生产，可编辑车辆或资产并重新渲染，但应对照保留视角验证新视角质量、物体位置与遮挡一致性；对生成补全区域额外记录不确定性，避免把合成标签误当作真实观测。

## 参考文献 {#references}

1. [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079)，2023。3DGS 基础表示。
2. [Street Gaussians: Modeling Dynamic Urban Scenes with Gaussian Splatting](https://arxiv.org/abs/2401.01339)，2024。动态街景分层与编辑。
3. [ReconX: Reconstruct Any Scene from Sparse Views with Video Diffusion Model](https://arxiv.org/abs/2408.16767)，2024。稀疏视角生成与 3DGS 重建。
