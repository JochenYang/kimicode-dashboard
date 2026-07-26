# Kimi Code Usage Dashboard

本地隐私安全的 Kimi Code CLI Token 用量看板。只读取 `usage.record` 中的**模型名、时间、Token 数量**，以及 `config.toml` 里受限的模型别名映射。

**不会**显示或记录：提示词、回复正文、代码、API Key、Provider 凭据。

## 功能

- 统计普通输入（`inputOther`）、模型输出（`output`）、缓存读取（`inputCacheRead`）、缓存创建（`inputCacheCreation`）
- 时间范围：今天 / 近 7 天 / 近 30 天 / 全部
- 每日趋势、模型统计、缓存命中率、最近请求
- 简体中文 / English，自动识别系统语言，可在界面切换
- 按 [Kimi API Platform](https://platform.kimi.ai/) 官方标价估算费用
- 兼容 `config.toml` 模型别名、`KIMI_MODEL_NAME`、`__kimi_env_model__`
- 自动识别 `KIMI_CODE_HOME`、`~/.kimi-code`、Windows `%USERPROFILE%\.kimi-code`，也可手动指定目录

## 默认扫描目录

| 平台 | 路径 |
| --- | --- |
| macOS / Linux | `~/.kimi-code` |
| Windows | `%USERPROFILE%\.kimi-code` |

也可设置环境变量 `KIMI_CODE_HOME`，或在界面中选择其他数据目录。

## 快速开始

需要 Node.js 18+。

```bash
cd kimicode-dashboard
npm install
npm run build    # 构建 React + Ant Design 前端
npm start        # 启动本地 API + 静态页面
```

浏览器打开 `http://127.0.0.1:3847/`。

开发模式（前端热更新 + API 代理）：

```bash
# 终端 1
npm run dev:api
# 终端 2
npm run dev
```

```bash
# 指定数据目录与端口
node src/server.js --home "C:\Users\you\.kimi-code" --port 3847 --no-open
```

前端基于 **React + Tailwind + shadcn/ui 风格组件**（Radix + CVA），含：
- Linear 风格暗色主题 + 青绿强调色
- 细滚动条
- 近一年日消耗热力图
- Framer Motion 入场动效（尊重 `prefers-reduced-motion`）
- 表格数字列右对齐、等宽数字

## 数据来源

扫描 `<home>/sessions/**/wire.jsonl`，仅解析：

```json
{
  "type": "usage.record",
  "model": "provider/model",
  "usage": {
    "inputOther": 0,
    "output": 0,
    "inputCacheRead": 0,
    "inputCacheCreation": 0
  },
  "usageScope": "turn",
  "time": 0
}
```

仅累计 `usageScope === "turn"`，避免与 session 汇总重复计数。

模型映射仅读取 `config.toml` 中的 `default_model` 与 `[models."…"]` 的 `provider` / `model` / `display_name`，并识别环境变量 `KIMI_MODEL_NAME`（对应记录里的 `__kimi_env_model__`）。密钥类字段在解析前会被剥离。

## 费用估算

官方标价（USD / 1M tokens，以 platform.kimi.ai 为准）：

| 模型 | Cache hit | Input | Output |
| --- | ---: | ---: | ---: |
| kimi-k3 | 0.30 | 3.00 | 15.00 |
| kimi-k2.7-code | 0.19 | 0.95 | 4.00 |
| kimi-k2.6 | 0.16 | 0.95 | 4.00 |
| kimi-k2.5 | 0.10 | 0.60 | 3.00 |
| kimi-k2* | 0.15 | 0.60 | 2.50 |

非 Kimi 模型会回退到 K2.6 标价，并在界面标记为「估算」。

## 测试

```bash
npm test
```

## 隐私承诺

- 不上传任何数据（纯本地 HTTP，默认绑定 `127.0.0.1`）
- 不解析消息正文、工具参数内容、日志全文
- 不读取或展示 API Key / Provider 凭据
