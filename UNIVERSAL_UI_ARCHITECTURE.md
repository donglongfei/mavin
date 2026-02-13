# Mavin Universal UI Architecture

## 设计原则

**一个界面，适应所有场景**

Mavin 不是多个产品的集合，而是一个**自适应的数字伴侣**，通过以下机制适应不同用户和场景：

1. **Display Modes**（显示模式）：控制 Mavin 在屏幕上的呈现方式
2. **Interaction Modes**（交互模式）：定义 Mavin 的行为和响应方式
3. **Context Awareness**（情境感知）：根据用户、任务、环境自动调整

---

## 核心架构：三层系统

```
┌─────────────────────────────────────────────────────────┐
│                    Universal Shell                       │
│  (统一外壳：始终存在，管理所有模式和状态)                    │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Display Mode │   │Interaction   │   │  Context     │
│   Layer      │   │  Mode Layer  │   │  Engine      │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Layer 1: Display Modes（显示模式层）

### 三种显示状态

#### 1. **Focus Mode**（专注模式）
- **视觉**：占据屏幕右侧 1/3，数字人全身像 + 交互界面
- **用途**：深度对话、图像生成、复杂任务
- **场景示例**：
  - Sarah 生成角色设计："XiaoMai, I need inspiration..."
  - Timmy 请求帮助："XiaoMai! I don't get this..."

```
┌─────────────────────────────────────────────┐
│                                    ┌────────┤
│                                    │ Mavin  │
│      Main Content Area             │ Avatar │
│                                    │        │
│                                    │ Chat   │
│                                    │ Area   │
└────────────────────────────────────┴────────┘
```

#### 2. **Companion Mode**（伙伴模式）
- **视觉**：缩小到右下角（150x200px），只显示头像 + 状态
- **用途**：后台监听、被动记录、不干扰主任务
- **场景示例**：
  - Leo 上课时："XiaoMai shrinks to the bottom right corner"
  - Sarah 在 Photoshop 工作时："She shrinks to Ghost Mode"

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│      Full Screen Workspace                  │
│                                             │
│                                    ┌────┐   │
│                                    │🤖 │   │
└────────────────────────────────────┴────┘───┘
```

#### 3. **Ghost Mode**（幽灵模式）
- **视觉**：半透明悬浮球（80x80px），只在需要时显示
- **用途**：完全不干扰，仅在有重要提示时出现
- **场景示例**：
  - Sarah 专注绘画时
  - Leo 需要极度安静的考试环境

```
┌─────────────────────────────────────────────┐
│                                             │
│      Full Screen Workspace                  │
│                                             │
│                                         ⚪  │
│                                    (半透明)  │
└─────────────────────────────────────────────┘
```

### 模式切换规则

| 触发条件 | 切换方向 | 动画时长 |
|---------|---------|---------|
| 用户点击头像 | Companion → Focus | 0.3s |
| 用户说 "XiaoMai" | Ghost → Focus | 0.4s |
| 用户说 "Hide" / 点击最小化 | Focus → Companion | 0.3s |
| 用户说 "Disappear" | Companion → Ghost | 0.2s |
| 系统检测到需要提示 | Ghost → Companion (3s后自动返回) | 0.2s |

---

## Layer 2: Interaction Modes（交互模式层）

### 四种交互行为

#### 1. **Active Listening**（主动监听）
- **行为**：持续监听语音，实时转录
- **视觉反馈**：音频波形、"Listening..." 状态
- **适用场景**：Leo 的课堂记录

#### 2. **Passive Monitoring**（被动监控）
- **行为**：后台监听，仅在检测到关键词时响应
- **视觉反馈**：状态灯闪烁（绿色 = 监听中）
- **适用场景**：Leo 上课时不想被打扰，但需要记录

#### 3. **Conversational**（对话式）
- **行为**：多轮对话，等待用户输入后响应
- **视觉反馈**：眼神接触、点头、手势
- **适用场景**：Sarah 的创意头脑风暴、Timmy 的作业辅导

#### 4. **Proactive**（主动式）
- **行为**：主动提出建议、提醒、问题
- **视觉反馈**：举手、弹出气泡
- **适用场景**：检测到 Leo 困惑时主动解释、提醒 Sarah 保存文件

### 交互模式矩阵

| 场景 | Display Mode | Interaction Mode | 输入方式 | 输出方式 |
|-----|-------------|-----------------|---------|---------|
| Leo 上课 | Companion | Passive Monitoring | 麦克风（远场） | 文字气泡（静音） |
| Leo 提问 | Focus | Conversational | 语音（耳语） | 文字气泡 |
| Sarah 头脑风暴 | Focus | Conversational | 语音（正常） | 语音 + 图像 |
| Sarah 绘画 | Ghost | Passive Monitoring | 无 | 无（除非紧急） |
| Timmy 作业 | Focus | Conversational + Proactive | 语音 + 摄像头 | 语音 + 动画 |

---

## Layer 3: Context Engine（情境引擎）

### 自动适应机制

#### 1. **User Profile**（用户画像）
```json
{
  "user_id": "leo_123",
  "role": "student",
  "preferences": {
    "default_display_mode": "companion",
    "voice_volume": "whisper",
    "notification_style": "text_only"
  },
  "schedule": {
    "current_activity": "Physics 101 Lecture",
    "location": "classroom"
  }
}
```

#### 2. **Environment Detection**（环境检测）
- **噪音水平**：高噪音 → 切换到文字输出
- **光线条件**：暗光 → 降低屏幕亮度
- **摄像头检测**：检测到书本 → 自动启用 OCR
- **日历集成**：上课时间 → 自动进入 Passive Monitoring

#### 3. **Task Recognition**（任务识别）
| 检测到的行为 | 自动切换到 | 启用功能 |
|------------|-----------|---------|
| 打开 Photoshop | Ghost Mode | 图像生成工具 |
| 打开 PDF 教材 | Companion Mode | 笔记记录 |
| 举起作业本到摄像头 | Focus Mode | OCR + 作业辅导 |
| 说 "start recording" | Companion Mode | Active Listening |

---

## 统一 UI 组件库

### 核心组件

#### 1. **Mavin Avatar**（数字人组件）
- **状态**：idle, listening, thinking, speaking
- **尺寸**：可缩放（80px - 400px）
- **皮肤**：可切换（专业版、卡通版、极简版）

#### 2. **Context Panel**（情境面板）
- **内容**：当前任务、时间线、快捷操作
- **位置**：Focus Mode 时显示在头像下方
- **自适应**：根据场景显示不同内容
  - Leo：笔记列表 + 关键词高亮
  - Sarah：图像历史 + 调色板
  - Timmy：作业进度 + 奖励星星

#### 3. **Notification Bubble**（通知气泡）
- **类型**：
  - Info（蓝色）：一般信息
  - Hint（黄色）：提示建议
  - Alert（红色）：重要提醒
- **位置**：跟随 Mavin 头像
- **行为**：3 秒后自动消失（除非用户点击）

#### 4. **Input Multimodal**（多模态输入）
- **语音**：持续监听 / 按键说话
- **文字**：底部输入框
- **视觉**：摄像头实时流 + 截图按钮
- **手势**：（可选）挥手、指向

---

## 场景实现映射

### Leo（学生）场景实现

| UX Story 步骤 | Display Mode | Interaction Mode | UI 组件 |
|-------------|-------------|-----------------|---------|
| "XiaoMai wakes up" | Focus → Companion | Conversational | Avatar (waking animation) |
| "Start a new session" | Companion | Passive Monitoring | Status indicator (green) |
| "Live transcript scrolling" | Companion | Active Listening | Transcript overlay (center screen) |
| "Professor mentions Bernoulli" | Companion | Proactive | Notification Bubble (text only) |
| "Class ends" | Companion → Focus | Conversational | Context Panel (review summary) |

### Sarah（艺术家）场景实现

| UX Story 步骤 | Display Mode | Interaction Mode | UI 组件 |
|-------------|-------------|-----------------|---------|
| "I need inspiration" | Focus | Conversational | Avatar (full screen) + Chat |
| "Generate images" | Focus | Conversational | Image gallery (behind avatar) |
| "Make it darker" | Focus | Conversational | Image regeneration animation |
| "Put that in Photoshop" | Focus → Ghost | Proactive | App launcher + Ghost orb |

### Timmy（小孩）场景实现

| UX Story 步骤 | Display Mode | Interaction Mode | UI 组件 |
|-------------|-------------|-----------------|---------|
| "I don't get this" | Focus | Conversational | Avatar (cartoon skin) |
| "Show me the book" | Focus | Conversational + Vision | Camera view + OCR overlay |
| "Which one is bigger?" | Focus | Conversational (Socratic) | Avatar (thinking pose) + Hint bubble |

---

## 技术实现路线图

### Phase 1: 核心架构（2 周）
- [ ] 实现三种 Display Modes 的布局和切换
- [ ] 创建模式切换动画系统
- [ ] 构建状态管理（Context Engine 基础）

### Phase 2: 交互模式（3 周）
- [ ] 集成 Web Speech API（语音输入/输出）
- [ ] 实现 Active Listening 和 Passive Monitoring
- [ ] 添加 Notification Bubble 组件

### Phase 3: 多模态输入（3 周）
- [ ] 摄像头集成 + 截图功能
- [ ] OCR 文字识别（Tesseract.js）
- [ ] 图像理解（调用 Vision API）

### Phase 4: 情境感知（4 周）
- [ ] 用户画像系统
- [ ] 环境检测（噪音、光线）
- [ ] 任务识别（应用检测、日历集成）

### Phase 5: 场景优化（2 周）
- [ ] Leo 场景专属功能（笔记高亮、关键词提取）
- [ ] Sarah 场景专属功能（图像生成、应用集成）
- [ ] Timmy 场景专属功能（卡通皮肤、苏格拉底式引导）

---

## 设计决策记录

### 为什么是"统一 UI"而非"多个界面"？

1. **一致性**：用户不需要学习多套操作逻辑
2. **灵活性**：同一个用户可能在不同场景切换（Leo 既是学生也是创作者）
3. **可扩展性**：新增场景只需添加配置，无需重构 UI
4. **技术效率**：共享组件库，减少重复开发

### 关键设计权衡

| 决策 | 选择 | 理由 |
|-----|-----|-----|
| 模式数量 | 3 种（Focus/Companion/Ghost） | 更多会增加复杂度，更少不够灵活 |
| 默认模式 | Companion | 平衡可见性和干扰度 |
| 切换触发 | 语音 + 点击 | 适应不同场景（课堂不能说话） |
| 皮肤系统 | 可选，非强制 | Timmy 需要卡通风格，但不影响核心功能 |

---

## 下一步行动

1. **Review**：请确认这个架构是否符合您的愿景
2. **Prioritize**：我们从哪个 Phase 开始？建议从 Phase 1（核心架构）
3. **Prototype**：我可以先实现 Display Modes 切换作为 demo

您觉得这个方案如何？需要调整哪些部分？
