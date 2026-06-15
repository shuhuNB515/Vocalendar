# 「言程」Vocalendar — 智能语音日程管家

> **Voice-First 智能日历管理工具** — 只需开口说话，即可轻松规划和管理全天行程。

**命名释义**：「言」代表语音交互（Vocal），「程」代表日程安排（Calendar）。寓意用户只需通过简单的言语，即可轻松规划和管理全天的行程。

---

## 核心功能

### 一句话极速建日程
说出 *"帮我记一下，明天下午三点在星巴克和李总谈合同"*，系统自动提取时间、地点、事件并生成日程。

### 对话式查询与播报
提问 *"我今天下午有什么安排？"* 或 *"下周五有空吗？"*，系统通过语音合成自然地播报日程。

### 流畅的修改与删除
支持上下文理解的口语化修改：*"把刚才那个会议推迟半小时"* 或 *"取消明天上午的所有日程"*。

### 智能语音主动提醒
事件发生前通过温和的语音播报提醒，取代传统生硬的闹钟铃声。

---

## 适用场景

- **职场精英** — 通勤路上快速梳理一天工作
- **驾驶人群** — 开车时安全、合规地记录待办事项
- **视障人士/老年人** — 跨越数字鸿沟，无需看屏幕和打字

---

## 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite 6 | 构建工具 |
| Tailwind CSS 3 | 样式 |
| Zustand | 状态管理 |
| React Router v7 | 路由 |
| date-fns | 日期处理 |
| Lucide React | 图标 |
| Web Speech API | 语音录制 |

### 后端
| 技术 | 用途 |
|------|------|
| FastAPI | Web 框架 |
| SQLAlchemy | ORM |
| aiosqlite | 异步 SQLite 驱动 |
| python-jose | JWT 认证 |
| passlib + bcrypt | 密码加密 |
| cryptography (Fernet) | API Key 加密存储 |
| httpx | 异步 HTTP 客户端 |
| OpenAI Whisper API | 语音识别 (ASR) |
| OpenAI GPT API | 自然语言理解 (NLP) |

---

## 项目结构

```
Vocalendar/
├── src/                        # 前端源码
│   ├── components/             # UI 组件
│   │   ├── Calendar.tsx        # 月历视图
│   │   ├── Navbar.tsx          # 底部导航栏
│   │   ├── ReminderToast.tsx   # 提醒浮层
│   │   ├── ScheduleCard.tsx    # 日程卡片
│   │   ├── VoiceButton.tsx     # 语音按钮
│   │   └── VoiceResultCard.tsx # 语音解析结果卡片
│   ├── pages/                  # 页面
│   │   ├── Home.tsx            # 主页（语音交互+日历）
│   │   ├── Schedule.tsx        # 日程管理
│   │   ├── Settings.tsx        # 设置（API Key 配置）
│   │   ├── Login.tsx           # 登录
│   │   └── Register.tsx        # 注册
│   ├── store/                  # Zustand 状态管理
│   │   ├── authStore.ts        # 认证状态
│   │   ├── scheduleStore.ts    # 日程状态
│   │   ├── voiceStore.ts       # 语音状态
│   │   └── keyStore.ts         # API Key 状态
│   ├── types/                  # TypeScript 类型定义
│   ├── utils/                  # 工具函数
│   │   ├── api.ts              # API 请求封装
│   │   └── date.ts             # 日期工具
│   ├── App.tsx                 # 路由配置
│   └── main.tsx                # 入口
├── backend/                    # 后端源码
│   └── app/
│       ├── routers/            # API 路由
│       │   ├── auth.py         # 认证（注册/登录）
│       │   ├── schedules.py    # 日程 CRUD
│       │   ├── voice.py        # 语音处理（ASR+NLP）
│       │   └── keys.py         # API Key 管理
│       ├── database.py         # 数据库连接
│       ├── models.py           # 数据模型
│       ├── schemas.py          # Pydantic 模式
│       └── main.py             # FastAPI 入口
└── package.json
```

---

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.10
- npm >= 9

### 前端

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 后端

```bash
# 安装 Python 依赖
pip install -r backend/requirements.txt

# 启动后端服务
cd backend
uvicorn app.main:app --reload --port 8000
```

### API Key 配置

启动后在 **设置页面** 中配置以下 API Key（通过前端传入后端加密存储）：

- **ASR Key** — OpenAI Whisper API Key（语音识别）
- **NLP Key** — OpenAI GPT API Key（自然语言理解）
- **TTS Key** — 语音合成 API Key

---

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/schedules/` | 获取日程列表 |
| POST | `/api/schedules/` | 创建日程 |
| PUT | `/api/schedules/{id}` | 更新日程 |
| DELETE | `/api/schedules/{id}` | 删除日程 |
| POST | `/api/voice/process` | 语音处理（ASR+NLP） |
| GET | `/api/keys/status` | 查询 API Key 状态 |
| POST | `/api/keys/save` | 保存 API Key |
| POST | `/api/keys/test` | 测试 API Key |

---

## 设计风格

- **主色调**：深靛蓝 `#1E3A5F` + 暖橙 `#FF8C42`
- **字体**：Noto Serif SC / Noto Sans SC
- **设计理念**：Voice-First，语音交互优先，视觉辅助

---

## License

MIT
