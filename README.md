# 🌊 Semantic Flow

> **AI 驱动的英语写作训练应用** — 用语义间隔法提升你的地道表达

[![Live Demo](https://img.shields.io/badge/Demo-semantic--flow.vercel.app-blue)](https://semantic-flow.vercel.app)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek%20V3-blue)](https://deepseek.com/)

---

## 🆕 v2.1 更新日志 (2025-01-30)

### 🧠 Knowledge Vault (知识库)
全新的"元认知中心"，帮助用户从"做题"升级为"复盘+积累"：

- **打卡光环 (Streak Ring)** — 侧边栏圆环进度条，显示今日练习进度和连续打卡天数
- **三色仪表盘** — 红/黄/绿状态卡片展示掌握程度分布
  - 🔴 Critical Gaps (需攻克) — 得分 < 5
  - 🟡 Refining (进阶中) — 得分 5-7.9  
  - 🟢 Mastered (已掌握) — 得分 ≥ 8
- **话题折叠流** — 按 Deck 分组的卡片列表，展开查看详情
- **静态详情页** — 查看上次输入、AI 反馈，一键强制复习

### 🎯 AI 提示词优化
- 回归 **B2-C1 Native Precision** 风格
- 严格话题相关性约束
- 提供 Natural/Formal 双译文参考

### 🔧 Bug 修复
- 修复 RLS 认证问题导致的 401/500 错误
- 修复 `last_score` 小数存储问题
- 优化评估 API 错误处理

---

## ✨ 核心理念

**"先翻译，再对照，差距即成长"**

1. 📝 看到中文概念，用英语表达你的翻译
2. 🤖 AI 实时评估，指出与地道表达的差距
3. 🎯 对比 Native 参考句，强化记忆
4. 🔄 语义间隔复习，让表达真正内化

---

## 🚀 功能特性

### 核心功能
| 功能 | 描述 |
|------|------|
| 🎴 **AI 生成卡片** | 输入任意主题，DeepSeek V3 自动生成训练卡片 |
| 📤 **上传自定义卡片** | 支持手动添加中英对照内容 |
| 🔀 **智能合并** | 相似主题自动合并 (Jaccard 80%+ 匹配) |
| 📊 **进度追踪** | 每日练习统计 + 卡片进度记忆 |
| 🧠 **Knowledge Vault** | 知识库仪表盘，掌握程度可视化 |
| ↕️ **拖拽排序** | 自由调整 Deck 顺序 |
| 💾 **状态持久化** | 练习状态自动保存，刷新不丢失 |

### UI 特色
- 📰 **经济学人风格** — 衬线字体 + 米白背景，沉浸式阅读体验
- 🔥 **打卡光环** — 圆环进度条 + 连续天数显示
- 🎚️ **水平进度条** + 页码跳转
- 🔄 **Refresh 按钮** — 支持重新练习单张卡片
- 📱 **侧边栏折叠** — 更大的练习空间

---

## 🛠️ 技术栈

```
Frontend:   Next.js 16 + TypeScript + Tailwind CSS + Shadcn/UI
Backend:    Supabase (PostgreSQL + RLS)
AI:         DeepSeek V3 (via OpenAI-compatible API)
DnD:        @dnd-kit/core + @dnd-kit/sortable
Auth:       Supabase Auth + @supabase/ssr
```

---

## 📦 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/Leslievalentine/semantic-flow.git
cd semantic-flow
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件：
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# DeepSeek API (OpenAI 兼容模式)
OPENAI_API_KEY=your_deepseek_api_key
OPENAI_BASE_URL=https://api.deepseek.com
```

### 3. 初始化数据库
在 Supabase SQL Editor 中按顺序执行：
1. `supabase/schema-v2.sql` — 创建表结构 + RLS 策略
2. `supabase/memory-engine-migration.sql` — 添加记忆引擎字段
3. `supabase/vault-migration.sql` — 添加知识库字段
4. `supabase/fix-score-type.sql` — 修复分数类型

### 4. 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000 🎉

---

## 🌐 部署指南

### Vercel 部署 (推荐)

1. **连接 GitHub 仓库**
   - 在 [vercel.com](https://vercel.com) 导入项目

2. **配置环境变量**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`

3. **部署**
   - Vercel 会自动构建和部署

### Supabase 配置
确保在 Supabase Dashboard → Authentication → URL Configuration 中：
- Site URL: 你的生产环境 URL
- Redirect URLs: 添加 `https://your-domain.com/auth/callback`

---

## 📁 项目结构

```
semantic-flow/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API 路由
│   │   │   ├── decks/       # Deck CRUD
│   │   │   ├── cards/       # Card 管理
│   │   │   ├── vault/       # 知识库 API
│   │   │   ├── evaluate/    # AI 评估
│   │   │   └── generate-deck/ # AI 生成
│   │   ├── vault/           # 知识库页面
│   │   └── page.tsx         # 主页面
│   ├── components/          # UI 组件
│   │   ├── Flashcard.tsx    # 卡片核心组件
│   │   ├── Sidebar.tsx      # 侧边栏 (含拖拽)
│   │   ├── StreakRing.tsx   # 打卡光环
│   │   ├── StatusCard.tsx   # 状态卡片
│   │   └── TopicAccordion.tsx # 话题折叠
│   └── lib/                 # 工具库
│       ├── supabase.ts      # 浏览器客户端
│       ├── server-auth.ts   # 服务端认证
│       └── ai.ts            # AI 接口
├── supabase/
│   ├── schema-v2.sql        # 数据库架构
│   ├── memory-engine-migration.sql
│   ├── vault-migration.sql
│   └── fix-score-type.sql
└── README.md
```

---

## 🎯 使用指南

### 创建新 Deck
1. 点击侧边栏 **+** 按钮
2. 选择 **AI Generate New Deck**
3. 输入主题（如 "Climate Change"）
4. AI 自动生成 5 张训练卡片

### 练习流程
1. 选择 Deck → 点击 **Begin Translation**
2. 输入你的英文翻译 → 点击 **Submit**
3. 查看 AI 评分和改进建议
4. 对比 Native 参考句
5. 点击 **Next Card** 继续

### 查看知识库
1. 点击侧边栏 **Knowledge Vault**
2. 查看三色状态卡片
3. 点击任意卡片进入分级列表
4. 点击卡片查看详情和历史反馈

---

## 📄 License

[MIT](LICENSE) © 2025 Leslie Valentine

---

<p align="center">
  <strong>Write with Native Precision</strong><br>
  <sub>用地道的方式，表达每一个想法</sub>
</p>
