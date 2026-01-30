# 🌊 Semantic Flow

> **AI 驱动的英语写作训练应用** — 用语义间隔法提升你的地道表达

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek%20V3-blue)](https://deepseek.com/)

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
| ↕️ **拖拽排序** | 自由调整 Deck 顺序 |
| 💾 **状态持久化** | 练习状态自动保存，刷新不丢失 |

### UI 特色
- 📰 **经济学人风格** — 衬线字体 + 米白背景，沉浸式阅读体验
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
在 Supabase SQL Editor 中执行：
- `supabase/schema.sql` — 创建表结构
- `supabase/seed.sql` — 导入示例数据 (可选)

### 4. 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000 🎉

---

## 📁 项目结构

```
semantic-flow/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API 路由
│   │   │   ├── decks/       # Deck CRUD
│   │   │   ├── cards/       # Card 管理
│   │   │   ├── evaluate/    # AI 评估
│   │   │   └── generate-deck/ # AI 生成
│   │   └── page.tsx         # 主页面
│   ├── components/          # UI 组件
│   │   ├── Flashcard.tsx    # 卡片核心组件
│   │   ├── Sidebar.tsx      # 侧边栏 (含拖拽)
│   │   └── GenerateDeckDialog.tsx
│   └── lib/                 # 工具库
│       ├── supabase.ts      # 数据库客户端
│       └── ai.ts            # AI 接口
├── supabase/
│   ├── schema.sql           # 数据库架构
│   └── seed.sql             # 示例数据
└── README.md
```

---

## 🎯 使用指南

### 创建新 Deck
1. 点击侧边栏 **+** 按钮
2. 选择 **AI Generate New Deck**
3. 输入主题（如 "IELTS Writing Task 2 - Environment"）
4. AI 自动生成 5-10 张训练卡片

### 练习流程
1. 选择 Deck → 点击 **Begin Translation**
2. 输入你的英文翻译 → 点击 **Submit**
3. 查看 AI 评分和改进建议
4. 对比 Native 参考句
5. 点击 **Next Card** 继续

### 管理卡片
- **拖拽排序**: 抓住左侧 ⋮⋮ 图标拖动
- **重命名/删除**: 点击 Deck 右侧 ⋯ 菜单
- **卡片转移**: 在卡片页面点击转移图标

---

## 📄 License

[MIT](LICENSE) © 2025 Leslie Valentine

---

<p align="center">
  <strong>Write with Native Precision</strong><br>
  <sub>用地道的方式，表达每一个想法</sub>
</p>
