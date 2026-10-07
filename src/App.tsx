import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  ClipboardList,
  Fan,
  Home,
  Lightbulb,
  MessageCircle,
  Mic,
  MicOff,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  UserRound,
  VolumeX,
  WifiOff,
  Wind,
  X,
} from "lucide-react";

type Tab = "home" | "space" | "messages" | "me";
type Detail = "task" | "event" | "device" | "house" | null;
type Scenario = "comfort" | "leave" | "gas" | "qa" | "light";
type PrivacyMode = "standard" | "mute" | "privacy";
const privacyModeNames: Record<PrivacyMode, string> = {
  standard: "标准模式",
  mute: "静音模式",
  privacy: "隐私模式",
};
type Kind =
  | "user"
  | "evidence"
  | "plan"
  | "execution"
  | "result"
  | "answer"
  | "safety"
  | "notice";
type Tone = "primary" | "soft" | "danger";
type Action = { label: string; id: string; tone?: Tone };
type Row = {
  label: string;
  value: string;
  note?: string;
  state?: "ok" | "warn" | "muted";
};
type ChatItem = {
  id: number;
  kind: Kind;
  layout?: "compact-light-success";
  title?: string;
  body?: string;
  rows?: Row[];
  actions?: Action[];
  badge?: string;
  resolved?: boolean;
};
type Task = {
  id: string;
  title: string;
  status: "执行中" | "成功" | "部分失败" | "失败";
  rows: Row[];
};

const demoUserName = "小南";
function greetingForHour(hour: number) {
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 13) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}
const prompts: {
  id: Scenario;
  title: string;
}[] = [
  {
    id: "comfort",
    title: "客厅有点热",
  },
  {
    id: "light",
    title: "打开客厅灯",
  },
  {
    id: "leave",
    title: "执行离家模式",
  },
  {
    id: "qa",
    title: "客厅空调什么型号？",
  },
];

const uid = (() => {
  let current = 0;
  return () => ++current;
})();

function IconTile({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`icon-tile ${className}`}>{children}</span>;
}

function BrandLogo({
  variant = "color",
  className = "",
}: {
  variant?: "color" | "light";
  className?: string;
}) {
  return (
    <span className={`brand-logo ${variant} ${className}`} aria-hidden="true">
      <img src="./brand-logo.png" alt="" />
    </span>
  );
}

function CardActions({
  actions,
  onAction,
  disabled = false,
}: {
  actions?: Action[];
  onAction: (id: string) => void;
  disabled?: boolean;
}) {
  if (!actions?.length) return null;
  return (
    <div className="card-actions">
      {actions.map((action) => (
        <button
          key={action.id}
          disabled={disabled}
          className={`card-action ${action.tone || "soft"}`}
          onClick={() => onAction(action.id)}
        >
          {action.label}
          {action.tone === "primary" && <ArrowRight size={15} />}
        </button>
      ))}
    </div>
  );
}

function DataRows({ rows }: { rows?: Row[] }) {
  if (!rows?.length) return null;
  return (
    <div className="data-rows">
      {rows.map((row, index) => (
        <div className="data-row" key={`${row.label}-${index}`}>
          <div>
            <span className="data-label">{row.label}</span>
            {row.note && <span className="data-note">{row.note}</span>}
          </div>
          <strong
            className={row.state ? `data-value ${row.state}` : "data-value"}
          >
            {row.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ChatCard({
  item,
  onAction,
}: {
  item: ChatItem;
  onAction: (id: string, itemId: number) => void;
}) {
  if (item.kind === "user")
    return <div className="user-bubble">{item.body}</div>;
  if (item.layout === "compact-light-success")
    return (
      <article className="chat-card light-success">
        <span className="light-success-icon" aria-hidden="true"><CircleCheck size={20} /></span>
        <span className="light-success-copy">
          <strong>客厅灯已打开</strong>
          <small>模拟设备回读 · 刚刚</small>
        </span>
        <button onClick={() => onAction("task_detail", item.id)} aria-label="查看任务详情">
          详情 <ChevronRight size={15} />
        </button>
      </article>
    );
  const glyph: Record<Exclude<Kind, "user">, ReactNode> = {
    evidence: <Thermometer size={18} />,
    plan: <Sparkles size={18} />,
    execution: <Clock3 size={18} />,
    result:
      item.badge === "部分失败" || item.badge === "失败" ? (
        <CircleAlert size={18} />
      ) : (
        <CircleCheck size={18} />
      ),
    answer: <BookOpen size={18} />,
    safety: <ShieldAlert size={18} />,
    notice: <MessageCircle size={18} />,
  };
  return (
    <article className={`chat-card ${item.kind}`}>
      <div className="card-topline">
        <span className={`card-icon ${item.kind}`}>{glyph[item.kind]}</span>
        <span className="card-kicker">
          {item.kind === "safety"
            ? "安全事件 · 演示"
            : item.kind === "answer"
              ? "家庭问答"
              : "维家助手"}
        </span>
        {item.badge && (
          <span
            className={`card-badge ${item.kind === "safety" ? "danger" : ""}`}
          >
            {item.badge}
          </span>
        )}
      </div>
      <h3>{item.title}</h3>
      {item.body && <p className="card-body">{item.body}</p>}
      <DataRows rows={item.rows} />
      {item.kind === "execution" && (
        <div className="progress-line">
          <span />
        </div>
      )}
      <CardActions
        actions={item.actions}
        disabled={item.resolved}
        onAction={(id) => onAction(id, item.id)}
      />
    </article>
  );
}

function SectionHeading({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [detail, setDetail] = useState<Detail>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [offline, setOffline] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [acOn, setAcOn] = useState(false);
  const [alertOn, setAlertOn] = useState(false);
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(() => {
    const stored = sessionStorage.getItem("weijia-demo-privacy-mode");
    return stored === "mute" || stored === "privacy" ? stored : "standard";
  });
  const [selectedPrivacyMode, setSelectedPrivacyMode] = useState<PrivacyMode>("standard");
  const [modeHistory, setModeHistory] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem("weijia-demo-mode-history") || "[]");
      return Array.isArray(stored) ? stored.filter((entry): entry is string => typeof entry === "string").slice(0, 3) : [];
    } catch {
      return [];
    }
  });
  const [info, setInfo] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [room, setRoom] = useState("客厅");
  const [messageFilter, setMessageFilter] = useState("全部");
  const [deviceTarget, setDeviceTarget] = useState<"灯" | "空调">("空调");
  const streamRef = useRef<HTMLDivElement>(null);
  const taskRunVersion = useRef(0);

  useEffect(() => {
    sessionStorage.setItem("weijia-demo-privacy-mode", privacyMode);
    sessionStorage.setItem("weijia-demo-mode-history", JSON.stringify(modeHistory));
  }, [privacyMode, modeHistory]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!streamRef.current) return;
    if (tab !== "home" || detail) {
      streamRef.current.scrollTo({ top: 0 });
    } else if (items.length > 0) {
      streamRef.current.scrollTo({
        top: streamRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [items, tab, detail]);

  function append(...next: Omit<ChatItem, "id">[]) {
    const created = next.map((item) => ({ ...item, id: uid() }));
    setItems((previous) => [...previous, ...created]);
    return created;
  }

  function resolveCard(id: number) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, resolved: true } : item,
      ),
    );
  }

  function runTask(type: "comfort" | "leave" | "light", sourceId?: number) {
    const currentRun = ++taskRunVersion.current;
    if (sourceId) resolveCard(sourceId);
    const title =
      type === "comfort"
        ? "客厅空调调节"
        : type === "leave"
          ? "离家模式"
          : "打开客厅灯";
    const taskId = `T-${type === "leave" ? "1028" : type === "light" ? "1027" : "1026"}`;
    if (offline && type !== "leave") {
      setTask({
        id: taskId,
        title,
        status: "失败",
        rows: [
          {
            label: type === "light" ? "客厅主灯" : "客厅空调",
            value: "设备离线",
            state: "warn",
          },
        ],
      });
      append({
        kind: "result",
        title: "设备离线，未执行",
        body: "这台设备目前无法连接。请检查设备或稍后重试；没有设备回读，不会显示操作成功。",
        badge: "失败",
        actions: [{ label: "查看任务详情", id: "task_detail" }],
      });
      return;
    }
    const pending: Row[] =
      type === "leave"
        ? [
            { label: "客厅灯", value: "等待回读" },
            { label: "空调", value: "等待回读" },
            { label: "卧室灯", value: "等待回读" },
            { label: "冰箱 / 网络", value: "保持运行" },
          ]
        : [
            {
              label: type === "light" ? "客厅主灯" : "客厅空调",
              value: "等待回读",
            },
          ];
    setTask({ id: taskId, title, status: "执行中", rows: pending });
    const [running] = append({
      kind: "execution",
      title: `${title}正在执行`,
      body: "指令已受理，正在等待设备状态回传。",
      badge: "执行中",
      rows: pending,
      actions: [{ label: "查看任务详情", id: "task_detail" }],
    });
    window.setTimeout(() => {
      if (currentRun !== taskRunVersion.current) return;
      const rows: Row[] =
        type === "leave"
          ? offline
            ? [
                { label: "客厅灯", value: "离线未执行", state: "warn" },
                { label: "空调", value: "离线未执行", state: "warn" },
                { label: "卧室灯", value: "无响应", state: "warn" },
                { label: "冰箱 / 网络", value: "保持运行", state: "muted" },
              ]
            : [
                { label: "客厅灯", value: "已关闭", state: "ok" },
                { label: "空调", value: "已关闭", state: "ok" },
                { label: "卧室灯", value: "无响应", state: "warn" },
                { label: "冰箱 / 网络", value: "保持运行", state: "muted" },
              ]
          : [
              {
                label: type === "light" ? "客厅主灯" : "客厅空调",
                value: type === "light" ? "已打开" : "制冷 · 26°C",
                state: "ok",
              },
            ];
      const status = type === "leave" ? "部分失败" : "成功";
      setTask({ id: taskId, title, status, rows });
      if (type === "light") setLightOn(true);
      if (type === "comfort") setAcOn(true);
      if (type === "leave" && !offline) {
        setLightOn(false);
        setAcOn(false);
      }
      setItems((previous) =>
        previous.map((item) =>
          item.id === running.id
            ? {
                ...item,
                kind: "result",
                title: type === "leave" ? "离家模式部分完成" : type === "light" ? "客厅灯已打开" : `${title}已完成`,
                layout: type === "light" ? "compact-light-success" : undefined,
                body:
                  type === "leave"
                    ? offline
                      ? "客厅设备离线未执行，卧室灯无响应。请查看分项结果，不会把本次任务显示为成功。"
                      : "卧室灯未响应，其余动作已有回读。请查看失败项，不会把本次任务显示为全部成功。"
                    : "已收到模拟设备回读，下方为设备当前状态。",
                badge: status,
                rows,
                actions: [
                  { label: "查看任务详情", id: "task_detail", tone: "primary" },
                ],
              }
            : item,
        ),
      );
    }, 950);
  }

  function startScenario(type: Scenario, phrase?: string) {
    setTab("home");
    setDetail(null);
    setDemoOpen(false);
    if (privacyMode === "privacy" && type !== "gas") {
      showInfo("隐私模式下对话已暂停", "非安全类云端会话和主动个性化已暂停。你仍可查看空间和消息；如需继续对话，可从“我的”切回标准或静音模式。安全事件演示仍可触发。");
      return;
    }
    if (alertOn) {
      append({
        kind: "safety",
        title: "请先处理厨房燃气告警",
        body: "安全事件仍处于待处理状态。普通问答与设备控制暂时让位于现场处置；演示结束后可在右上角重置数据。",
        badge: "优先处理",
        actions: [
          { label: "查看事件与处置", id: "event_detail", tone: "danger" },
        ],
      });
      return;
    }
    if (type === "gas") {
      setAlertOn(true);
      setAlertAcknowledged(false);
      append({
        kind: "safety",
        title: "厨房燃气报警",
        body: "模拟传感器事件：本地声光告警已触发。阀门状态尚未取得真实回读，请按现场处置指引处理；确认通知不代表险情解除。",
        badge: "待处理",
        rows: [
          { label: "发生位置", value: "厨房" },
          { label: "本地告警", value: "已触发", state: "warn" },
          { label: "阀门状态", value: "待确认", state: "warn" },
        ],
        actions: [
          { label: "查看事件与处置", id: "event_detail", tone: "danger" },
        ],
      });
      return;
    }
    const question =
      phrase || prompts.find((prompt) => prompt.id === type)?.title || "";
    append({ kind: "user", body: question });
    if (type === "comfort") {
      if (offline) {
        append({
          kind: "notice",
          title: "暂时无法确认客厅状态",
          body: "客厅设备离线，当前没有可靠的实时温度和空调状态。请检查设备连接后再试。",
        });
        return;
      }
      append(
        {
          kind: "evidence",
          title: "客厅现在 29.2°C",
          body: `根据客厅温控器最近一次上报，室温偏高；空调目前${acOn ? "运行中" : "关闭"}。`,
          badge: "状态依据",
          rows: [
            { label: "室内温度", value: "29.2°C", note: "客厅温控器 · 刚刚" },
            {
              label: "空调",
              value: acOn ? "已开启" : "已关闭",
              note: "设备回读 · 刚刚",
            },
          ],
          actions: [{ label: "查看空调详情", id: "device_ac" }],
        },
        {
          kind: "plan",
          title: "要把客厅调凉一些吗？",
          body: `建议${acOn ? "将空调调至" : "开启空调并设为"}制冷 26°C。执行前你可以决定是否采用这个方案。`,
          badge: "待确认",
          rows: [
            { label: "作用对象", value: "客厅空调" },
            { label: "计划动作", value: "制冷 · 26°C" },
          ],
          actions: [
            { label: "确认调整", id: "comfort_exec", tone: "primary" },
            { label: "暂不调整", id: "cancel" },
          ],
        },
      );
    } else if (type === "leave") {
      append({
        kind: "plan",
        title: "准备执行离家模式",
        body: "请先确认本次会影响哪些设备。保护设备将保持运行；未确认前不会下发指令。",
        badge: "二次确认",
        rows: [
          { label: "客厅灯、空调", value: "关闭" },
          { label: "卧室灯", value: "关闭" },
          { label: "冰箱、家庭网络", value: "保持运行", state: "muted" },
          { label: "窗帘", value: "未纳入本次演示", state: "muted" },
        ],
        actions: [
          { label: "查看并确认", id: "leave_confirm", tone: "primary" },
          { label: "取消", id: "cancel" },
        ],
      });
    } else if (type === "qa") {
      append({
        kind: "answer",
        title: "客厅空调当前状态与档案",
        body: "以下分别来自设备状态与房屋档案；资料查询不会触发设备操作。",
        badge: "有依据的回答",
        rows: [
          {
            label: "运行状态",
            value: offline ? "无法确认" : acOn ? "运行中" : "已关闭",
            note: offline ? "设备离线" : "设备回读 · 刚刚",
            state: offline ? "warn" : undefined,
          },
          {
            label: "设备型号",
            value: "示例型号 KFR-35",
            note: "房屋档案 · 模拟资料",
          },
          {
            label: "保修",
            value: "示例：至 2027 年 6 月",
            note: "保修凭证 · 模拟资料",
          },
        ],
        actions: [
          { label: "查看房屋资料", id: "house_detail", tone: "primary" },
          { label: "查看设备", id: "device_ac" },
        ],
      });
    } else if (type === "light") {
      runTask("light");
    }
  }

  function handleAction(action: string, itemId: number) {
    if (action === "comfort_exec") runTask("comfort", itemId);
    else if (action === "leave_confirm") {
      resolveCard(itemId);
      setConfirmLeave(true);
    } else if (action === "cancel") {
      resolveCard(itemId);
      append({
        kind: "notice",
        title: "已取消",
        body: "本次没有向设备下发指令。",
      });
    } else if (action === "task_detail") setDetail("task");
    else if (action === "event_detail") setDetail("event");
    else if (action === "house_detail") setDetail("house");
    else if (action === "device_ac") {
      setDeviceTarget("空调");
      setDetail("device");
    }
  }

  function submitInput(event: FormEvent) {
    event.preventDefault();
    if (privacyMode === "privacy") return;
    const value = input.trim();
    if (!value) return;
    setInput("");
    const question = value.replace(/\s+/g, "");
    const roomName = /卧室/.test(question)
      ? "卧室"
      : /厨房/.test(question)
        ? "厨房"
        : /客厅/.test(question)
          ? "客厅"
          : null;
    const answer = (
      title: string,
      body: string,
      options: Partial<Omit<ChatItem, "id" | "kind" | "title" | "body">> = {},
    ) => append(
      { kind: "user", body: value },
      { kind: "answer", title, body, ...options },
    );
    if (alertOn) {
      append(
        { kind: "user", body: value },
        {
          kind: "safety",
          title: "请先处理厨房燃气告警",
          body: "目前有待处理的安全事件。请先查看现场处置状态；普通任务暂不继续。",
          badge: "优先处理",
          actions: [
            { label: "查看事件与处置", id: "event_detail", tone: "danger" },
          ],
        },
      );
      return;
    }
    if (/燃气|泄漏|报警|烟雾/.test(question)) {
      answer(
        "安全状态需要现场确认",
        "对话无法判断真实险情，也不能用文字触发传感器告警。若现场有异常，请优先按现场应急流程处理；右上角“演示场景”可模拟安全事件。",
      );
      return;
    }
    if (/不要|别|不用|不许/.test(question) && /打开|开启|执行|调节|启动/.test(question)) {
      answer("不会执行这项操作", "我已理解你不希望执行该动作；本次没有向任何设备下发指令。所有设备状态仍以演示页面显示为准。");
      return;
    }
    if (/离家|出门|外出/.test(question) && /模式|执行|准备|帮我|要/.test(question)) {
      startScenario("leave", value);
      return;
    }
    if (/灯/.test(question) && /打开|开启|开一下|点亮/.test(question) && !/了吗|吗|么|是否|有没有|状态|是不是|？|\?/.test(question)) {
      if (roomName === "客厅") startScenario("light", value);
      else if (roomName) answer(
        `${roomName}灯暂不能从对话控制`,
        "这套演示家庭只有客厅主灯接入了控制流程。其他房间可查看空间概览，但不能假装已执行设备指令。",
      );
      else answer(
        "想打开哪盏灯？",
        "请说出房间或灯具。当前可演示控制的是客厅主灯。",
        { actions: [{ label: "打开客厅灯", id: "prompt_light" }] },
      );
      return;
    }
    if (/灯|空调|窗帘/.test(question) && /关闭|关掉|关一下|停止/.test(question) && !/了吗|吗|么|是否|有没有|状态|是不是|？|\?/.test(question)) {
      answer(
        "这项关闭操作尚未接入演示",
        "我不会把未执行的指令显示为成功。目前可体验客厅开灯、空调调凉和离家模式；离家模式会先列出影响设备供你确认。",
      );
      return;
    }
    if (/窗帘/.test(question)) {
      answer(
        "窗帘控制能力待确认",
        "当前演示没有接入窗帘状态或控制回读，因此无法确认它是否打开，也不会下发控制指令。",
      );
      return;
    }
    if (/型号|保修|维修|档案|说明书|设备资料/.test(question)) {
      if (roomName && roomName !== "客厅") answer(
        `${roomName}设备资料尚未录入`,
        "目前只有客厅空调的示例档案。缺失的型号、保修和维修记录不会用猜测补全。",
      );
      else startScenario("qa", value);
      return;
    }
    if (/任务|记录|历史|上次|刚才/.test(question)) {
      answer(
        task ? `最近任务：${task.title}` : "目前还没有任务记录",
        task
          ? `当前结果为“${task.status}”。可以打开任务详情查看每台设备的执行和回读。`
          : "这套演示家庭尚未产生设备任务。你可以直接描述想做的事，涉及设备执行时我会展示确认和结果。",
        task ? { rows: task.rows, actions: [{ label: "查看任务详情", id: "task_detail" }] } : {},
      );
      return;
    }
    if (/成员|管理员|权限|谁能/.test(question)) {
      answer(
        "当前家庭身份",
        "演示身份是“未来之家”的家庭管理员。成员和权限管理入口在“我的”页面；当前没有接入真实成员名单。",
      );
      return;
    }
    if (/隐私|数据授权|数据安全/.test(question)) {
      answer(
        "演示数据与授权",
        "当前空间、设备与事件信息均为本地模拟数据。“我的”页面提供隐私与数据授权入口，真实授权流程尚未接入。",
      );
      return;
    }
    if (/天气|室外/.test(question) && !/室内|家里|房间|客厅|卧室|厨房/.test(question)) {
      answer("暂无室外实时信息", "这版演示没有接入天气服务，不能可靠回答室外温度或天气。家中的示例空间温度可以继续问我。");
      return;
    }
    if (/空调/.test(question) && /打开|开启|调|制冷|凉快|降温/.test(question) && !/了吗|吗|么|是否|有没有|状态|是不是|？|\?/.test(question)) {
      if (roomName && roomName !== "客厅") answer(
        `${roomName}空调控制尚未接入`,
        "当前只有客厅空调的演示调节流程。不会对未接入设备模拟执行成功。",
      );
      else if (/\d{2}\s*(?:度|°C|℃)/i.test(question) && !/26\s*(?:度|°C|℃)/i.test(question)) answer(
        "可以先查看客厅空调方案",
        "演示流程目前固定为制冷 26°C，不能按自定义温度执行。你可以继续查看 26°C 的调节方案。",
        { actions: [{ label: "查看调凉方案", id: "prompt_comfort" }] },
      );
      else startScenario("comfort", value);
      return;
    }
    if (/热|闷|凉快|降温/.test(question) && (!roomName || roomName === "客厅")) {
      startScenario("comfort", value);
      return;
    }
    if (/热|闷|凉快|降温/.test(question) && roomName) {
      answer(
        `${roomName}温度可以先查看`,
        offline
          ? "当前设备离线，无法确认这个房间的实时温度。"
          : `${roomName}在演示空间概览中的温度是${roomName === "卧室" ? "25.8" : "26.4"}°C。这个房间尚未接入空调控制流程，我不会替你执行未接入的操作。`,
      );
      return;
    }
    if (/温度|室温|几度|多少度|冷热/.test(question) && roomName) {
      const degree = roomName === "客厅" ? "29.2" : roomName === "卧室" ? "25.8" : "26.4";
      answer(
        `${roomName}温度${offline ? "待确认" : `约 ${degree}°C`}`,
        offline
          ? "当前设备离线，不能把空间概览中的旧数据当成实时温度。"
          : "这是演示空间概览中的模拟读数，仅用于体验问答，不代表真实传感器数据。",
        { rows: [{ label: "空间", value: roomName }, { label: "温度", value: offline ? "待确认" : `${degree}°C` }] },
      );
      return;
    }
    if (/温度|室温|几度|多少度/.test(question) && !roomName) {
      answer(
        "家里的空间温度",
        offline ? "当前设备离线，无法确认实时温度。" : "以下是演示空间概览中的模拟温度，你可以继续指定房间问我。",
        { rows: [
          { label: "客厅", value: offline ? "待确认" : "29.2°C" },
          { label: "卧室", value: offline ? "待确认" : "25.8°C" },
          { label: "厨房", value: offline ? "待确认" : "26.4°C" },
        ] },
      );
      return;
    }
    if (/灯/.test(question) && /状态|开着|开了吗|亮着|亮吗|怎么样|打开了吗|关了吗|关闭了吗/.test(question)) {
      answer(
        roomName && roomName !== "客厅" ? `${roomName}灯状态暂无回读` : "客厅主灯状态",
        roomName && roomName !== "客厅"
          ? "这套演示没有该房间灯具的实时状态。"
          : offline ? "客厅设备离线，当前无法确认灯是否亮着。" : `客厅主灯目前${lightOn ? "已打开" : "已关闭"}；这是模拟设备状态。`,
      );
      return;
    }
    if (/空调/.test(question)) {
      if (roomName && roomName !== "客厅") answer(
        `${roomName}空调状态暂无回读`,
        "这套演示只有客厅空调状态与示例档案。",
      );
      else startScenario("qa", value);
      return;
    }
    if (/家里|家中|全屋|家庭|设备/.test(question) && /怎么样|如何|状态|情况|概况|有哪些|多少|都/.test(question)) {
      answer(
        "未来之家空间概览",
        offline
          ? "客厅设备当前离线，无法确认实时状态；以下是演示家庭已配置的空间。"
          : "已配置客厅、卧室和厨房。客厅温度偏高；下方列出已接入演示的设备状态。",
        {
          rows: [
            { label: "客厅温度", value: offline ? "待确认" : "29.2°C" },
            { label: "客厅空调", value: offline ? "离线" : acOn ? "运行中" : "已关闭" },
            { label: "客厅主灯", value: offline ? "离线" : lightOn ? "已打开" : "已关闭" },
          ],
        },
      );
      return;
    }
    if (/省电|节能|省能源|电费/.test(question)) {
      answer(
        "可以先从空调和照明入手",
        "这套演示家庭的客厅温度偏高，空调目前使用模拟状态。你可以先查看客厅温度与空调状态，再决定是否调节；离家前也可检查灯和空调。这里没有真实用电量，无法估算节省金额。",
        { actions: [{ label: "看看客厅状态", id: "prompt_comfort" }] },
      );
      return;
    }
    if (/你好|您好|在吗|你是谁|你能做什么/.test(question)) {
      answer(
        "你好，我是维家",
        "你可以直接说想了解哪个房间、设备或家庭任务。我能用演示数据回答空间状态、客厅设备和空调资料，也能展示需确认的设备操作流程。",
      );
      return;
    }
    answer(
      "我还缺少回答这个问题的信息",
      "我收到了你的提问，但当前演示家庭没有对应的可靠数据。你可以补充房间、设备或想完成的动作；我会说明能查询什么，以及哪些信息尚未接入。",
    );
  }

  function resetDemo() {
    taskRunVersion.current += 1;
    setItems([]);
    setTask(null);
    setAlertOn(false);
    setAlertAcknowledged(false);
    setAcOn(false);
    setLightOn(false);
    setOffline(false);
    setDetail(null);
    setTab("home");
    setDemoOpen(false);
    setModeOpen(false);
    setPrivacyMode("standard");
    setSelectedPrivacyMode("standard");
    setModeHistory([]);
  }

  function showInfo(title: string, body: string) {
    setInfo({ title, body });
  }

  function openModeSheet() {
    setSelectedPrivacyMode(privacyMode);
    setModeOpen(true);
  }

  function applyPrivacyMode() {
    if (selectedPrivacyMode !== privacyMode) {
      const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
      setModeHistory((previous) => [
        `${time}  ${privacyModeNames[privacyMode]} → ${privacyModeNames[selectedPrivacyMode]}`,
        ...previous,
      ].slice(0, 3));
      setPrivacyMode(selectedPrivacyMode);
      if (selectedPrivacyMode === "privacy") setInput("");
    }
    setModeOpen(false);
  }

  function handleBack() {
    if (detail) {
      setDetail(null);
    } else if (tab === "space" || tab === "messages" || tab === "me") {
      setTab("home");
    } else if (alertOn) {
      setDetail("event");
    } else if (items.length > 0) {
      taskRunVersion.current += 1;
      setItems([]);
      setTask(null);
      setInput("");
    } else {
      showInfo("已在对话首页", "可以从上方切换页面，或直接选择问题开始体验。");
    }
  }

  function handleClose() {
    resetDemo();
    setInput("");
    setConfirmLeave(false);
    setInfo(null);
  }

  const headerTitle = detail
    ? {
        task: "任务详情",
        event: "安全事件",
        device: `客厅${deviceTarget === "灯" ? "主灯" : "空调"}`,
        house: "房屋资料",
      }[detail]
    : {
        home: "对话",
        space: "空间",
        messages: "消息",
        me: "我的",
      }[tab];
  return (
    <div className="site-wrap">
      <main className="phone-frame">
        <div className="phone-status">
          <span>{currentTime.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
          <div className="status-icons">
            <span>●●●</span>
            <span>▰</span>
            <span className="battery">100</span>
          </div>
        </div>
        <header className="app-header ai-header">
          <button
            className="icon-button"
            aria-label="返回"
            onClick={handleBack}
          >
            <ArrowLeft size={21} />
          </button>
          {detail ? (
            <div className="ai-header-title">
              <strong>{headerTitle}</strong>
            </div>
          ) : (
            <nav className="ai-top-tabs" aria-label="主导航">
              <button
                className={tab === "home" ? "active" : ""}
                onClick={() => setTab("home")}
              >
                对话
              </button>
              <button
                className={tab === "me" ? "active" : ""}
                onClick={() => setTab("me")}
              >
                我的
              </button>
            </nav>
          )}
          <div className="ai-header-actions">
            {!detail && (
              <button
                className="icon-button"
                aria-label="演示场景"
                onClick={() => setDemoOpen(true)}
              >
                <MoreHorizontal size={21} />
              </button>
            )}
            <button
              className="icon-button"
              aria-label="关闭会话"
              onClick={handleClose}
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div
          className={`screen-content ${tab === "home" && !detail ? "home-content" : ""}`}
          ref={streamRef}
        >
          {detail === "task" && (
            <div className="detail-page">
              <div className="detail-hero">
                <IconTile
                  className={
                    task?.status === "部分失败" || task?.status === "失败"
                      ? "peach"
                      : "mint"
                  }
                >
                  {task?.status === "部分失败" || task?.status === "失败" ? (
                    <CircleAlert size={22} />
                  ) : (
                    <CircleCheck size={22} />
                  )}
                </IconTile>
                <h1>{task?.title || "暂无任务"}</h1>
                <span
                  className={`pill ${task?.status === "部分失败" || task?.status === "失败" ? "warning" : ""}`}
                >
                  {task?.status || "无记录"}
                </span>
                <p>任务编号 {task?.id || "—"} · 演示数据</p>
              </div>
              <SectionHeading title="设备执行结果" />
              <div className="surface-card">
                <DataRows rows={task?.rows || []} />
              </div>
              <SectionHeading title="任务时间线" />
              <div className="timeline">
                <div>
                  <i />
                  用户发起请求
                </div>
                <div>
                  <i />
                  指令已受理
                </div>
                <div>
                  <i />
                  等待设备回读
                </div>
                <div>
                  <i />
                  {task?.status === "部分失败"
                    ? "收到部分失败结果"
                    : task?.status === "失败"
                      ? "设备未执行"
                      : "已汇总当前结果"}
                </div>
              </div>
              {task?.status === "部分失败" && (
                <button
                  className="wide-secondary"
                  onClick={() =>
                    showInfo(
                      "安全重试",
                      "正式产品只会重试可安全重试的失败项。本演示版展示交互状态，暂不向设备发送指令。",
                    )
                  }
                >
                  查看失败项处理建议 <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
          {detail === "event" && (
            <div className="detail-page event-page">
              <div className="event-banner">
                <ShieldAlert size={25} />
                <span>安全事件 · 模拟</span>
                <h1>厨房燃气报警</h1>
                <p>现场声光告警已触发。请以现场情况为准，并按预案处理。</p>
              </div>
              <SectionHeading title="当前处置状态" />
              <div className="surface-card">
                <DataRows
                  rows={[
                    { label: "燃气传感器", value: "模拟触发", state: "warn" },
                    { label: "本地声光", value: "已触发", state: "warn" },
                    { label: "阀门状态", value: "待现场确认", state: "warn" },
                    {
                      label: "通知",
                      value: alertAcknowledged ? "已读，事件未解除" : "待确认",
                    },
                  ]}
                />
              </div>
              <div className="safety-tip">
                <strong>现场处置指引</strong>
                <p>
                  尽快离开危险区域，避免操作电器开关；按现场预案联系物业或专业人员。确认消息不等于险情解除。
                </p>
              </div>
              <SectionHeading title="事件时间线" />
              <div className="timeline red">
                <div>
                  <i />
                  模拟传感器触发
                </div>
                <div>
                  <i />
                  本地声光告警
                </div>
                <div>
                  <i />
                  阀门状态待确认
                </div>
                <div>
                  <i />
                  {alertAcknowledged
                    ? "用户已确认收到通知"
                    : "等待用户确认通知"}
                </div>
              </div>
              <button
                className="wide-primary danger"
                onClick={() => setAlertAcknowledged(true)}
                disabled={alertAcknowledged}
              >
                {alertAcknowledged ? "已确认收到通知" : "确认收到通知"}
              </button>
            </div>
          )}
          {detail === "device" && (
            <div className="detail-page">
              <div className="device-hero">
                <IconTile className={deviceTarget === "灯" ? "peach" : "sky"}>
                  {deviceTarget === "灯" ? (
                    <Lightbulb size={25} />
                  ) : (
                    <Fan size={25} />
                  )}
                </IconTile>
                <div>
                  <h1>
                    客厅
                    {deviceTarget === "灯" ? "主灯" : "空调"}
                  </h1>
                  <p>
                    {offline
                      ? "设备离线 · 无法确认当前状态"
                      : deviceTarget === "灯"
                        ? lightOn
                          ? "当前已打开"
                          : "当前已关闭"
                        : acOn
                          ? "制冷 · 26°C"
                          : "当前已关闭"}
                  </p>
                </div>
              </div>
              <div className="surface-card">
                <DataRows
                  rows={
                    deviceTarget === "灯"
                      ? [
                          {
                            label: "设备状态",
                            value: offline
                              ? "离线"
                              : lightOn
                                ? "已打开"
                                : "已关闭",
                          },
                          {
                            label: "最后上报",
                            value: offline ? "10 分钟前" : "刚刚",
                          },
                        ]
                      : [
                          {
                            label: "运行状态",
                            value: offline
                              ? "离线"
                              : acOn
                                ? "运行中"
                                : "已关闭",
                          },
                          { label: "目标温度", value: acOn ? "26°C" : "—" },
                          {
                            label: "最后上报",
                            value: offline ? "10 分钟前" : "刚刚",
                          },
                        ]
                  }
                />
              </div>
              <button
                className="wide-primary"
                disabled={offline}
                onClick={() => {
                  setDetail(null);
                  startScenario(deviceTarget === "灯" ? "light" : "comfort");
                }}
              >
                {deviceTarget === "灯" ? "打开客厅灯" : "询问并调节空调"}{" "}
                <ArrowRight size={17} />
              </button>
              <button
                className="wide-secondary"
                onClick={() => setDetail("house")}
              >
                查看设备资料 <ChevronRight size={17} />
              </button>
            </div>
          )}
          {detail === "house" && (
            <div className="detail-page">
              <div className="detail-hero">
                <IconTile className="lavender">
                  <BookOpen size={23} />
                </IconTile>
                <h1>客厅空调档案</h1>
                <p>示例资料 · 仅用于交互演示</p>
              </div>
              <SectionHeading title="设备资料" />
              <div className="surface-card">
                <DataRows
                  rows={[
                    {
                      label: "设备型号",
                      value: "示例型号 KFR-35",
                      note: "设备档案 · 2026-09-20",
                    },
                    { label: "安装位置", value: "客厅" },
                    {
                      label: "保修截止",
                      value: "2027 年 6 月",
                      note: "保修凭证 · 示例",
                    },
                    { label: "维修记录", value: "未录入", state: "muted" },
                  ]}
                />
              </div>
              <div className="source-note">
                <BookOpen size={16} />{" "}
                回答只使用已录入、已授权的家庭资料。缺失字段会标明“未录入”。
              </div>
            </div>
          )}
          {!detail && tab === "home" && (
            <>
              <div className={`ai-home ${items.length ? "has-conversation" : ""}`}>
                <div className="ai-hero">
                  <div className="ai-welcome">
                    <h1>{greetingForHour(currentTime.getHours())}，{demoUserName}</h1>
                    <p>了解空间、控制设备、安排生活</p>
                  </div>
                  <div className="ai-orb" aria-hidden="true">
                    <svg className="ai-orb-mark" viewBox="0 0 100 100" fill="none">
                      <path
                        d="M15 39 31 65 50 24 68 65 85 39"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                {privacyMode !== "standard" && (
                  <button className={`privacy-status ${privacyMode}`} onClick={openModeSheet}>
                    {privacyMode === "mute" ? <VolumeX size={16} /> : <MicOff size={16} />}
                    <span>{privacyModeNames[privacyMode]}已开启 · {privacyMode === "mute" ? "主动语音暂停" : "对话与非安全收音暂停"}</span>
                    <ChevronRight size={16} />
                  </button>
                )}
                <button
                  className="ai-status-preview"
                  onClick={() => setTab("space")}
                >
                  <span className="ai-status-content">
                    <small>空间速览</small>
                    <span className="ai-status-temp">
                      <Thermometer size={16} />
                      <strong>
                        {offline ? "设备状态待确认" : "客厅 29.2°C"}
                      </strong>
                    </span>
                    <span className="ai-status-sub">
                      <Fan size={14} />
                      {offline
                        ? "最后上报于 10 分钟前"
                        : `空调${acOn ? "运行中" : "已关闭"} · 2 台设备在线`}
                    </span>
                  </span>
                  <ChevronRight className="ai-status-arrow" size={18} />
                </button>
                <section className="ai-quick-section" aria-label="快捷提问">
                  <h2>试着问我</h2>
                  <div className="ai-quick-grid">
                    {prompts.map((prompt) => (
                      <button
                        className="ai-action"
                        key={prompt.id}
                        onClick={() => startScenario(prompt.id)}
                      >
                        <span>{prompt.title}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="ai-recommend" aria-label="推荐场景">
                  <h2>推荐场景</h2>
                  <div className="ai-recommend-grid">
                    <button className="ai-recommend-leave" onClick={() => startScenario("leave")}>
                      <span className="ai-recommend-copy">
                        <strong>离家模式</strong>
                        <small>确认设备后执行</small>
                      </span>
                      <span className="ai-recommend-icon" aria-hidden="true"><Home size={30} /></span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                    <button className="ai-recommend-qa" onClick={() => startScenario("qa")}>
                      <span className="ai-recommend-copy">
                        <strong>空调问答</strong>
                        <small>查看状态与型号</small>
                      </span>
                      <span className="ai-recommend-icon" aria-hidden="true"><Fan size={30} /></span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                </section>
              </div>
              {items.length > 0 && (
                <div className="conversation">
                  <div className="conversation-start">
                    <span className="assistant-avatar">
                      <BrandLogo className="avatar-logo" />
                    </span>
                    <span>维家助手</span>
                    <small>今天</small>
                  </div>
                  {items.map((item) => (
                    <ChatCard
                      item={item}
                      key={item.id}
                      onAction={(id, itemId) =>
                        id === "prompt_comfort"
                          ? startScenario("comfort")
                          : id === "prompt_light"
                            ? startScenario("light", "打开客厅灯")
                            : handleAction(id, itemId)
                      }
                    />
                  ))}
                  <div className="conversation-end">
                    {alertOn
                      ? "安全事件待处理，请先查看现场处置状态"
                      : "你可以继续提问，或从上方切换页面"}
                  </div>
                </div>
              )}
            </>
          )}
          {!detail && tab === "space" && (
            <div className="standard-page">
              <SectionHeading title="家里的每个角落" />
              <div className="room-tabs">
                {["全屋", "客厅", "卧室", "厨房"].map((value) => (
                  <button
                    key={value}
                    className={room === value ? "active" : ""}
                    onClick={() => setRoom(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="space-highlight">
                <span>当前空间</span>
                <h1>{room}</h1>
                <p>
                  {offline
                    ? "设备离线，当前状态待确认。"
                    : room === "客厅" || room === "全屋"
                      ? "温度偏高，可以问问维家怎么调节。"
                      : "查看空间状态与已接入设备。"}
                </p>
                <div>
                  <span>
                    <Thermometer size={17} />{" "}
                    {offline
                      ? "待确认"
                      : `${room === "厨房" ? "26.4" : room === "卧室" ? "25.8" : "29.2"}°C`}
                  </span>
                  <span>
                    <Wind size={17} /> CO₂ {offline ? "—" : "824"}
                  </span>
                </div>
                {(room === "客厅" || room === "全屋") && (
                  <button onClick={() => startScenario("comfort")}>
                    问问维家 <ArrowRight size={16} />
                  </button>
                )}
              </div>
              <SectionHeading
                title="设备"
                right={<span className="section-small">模拟状态</span>}
              />
              {room === "客厅" || room === "全屋" ? (
                <>
                  <button
                    className="device-list-item"
                    onClick={() => {
                      setDeviceTarget("灯");
                      setDetail("device");
                    }}
                  >
                    <IconTile className="peach">
                      <Lightbulb size={20} />
                    </IconTile>
                    <span>
                      <strong>客厅主灯</strong>
                      <small>
                        {offline ? "离线" : lightOn ? "已打开" : "已关闭"}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="device-list-item"
                    onClick={() => {
                      setDeviceTarget("空调");
                      setDetail("device");
                    }}
                  >
                    <IconTile className="sky">
                      <Fan size={20} />
                    </IconTile>
                    <span>
                      <strong>客厅空调</strong>
                      <small>
                        {offline ? "离线" : acOn ? "制冷 · 26°C" : "已关闭"}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : (
                <div className="space-empty">该空间的设备尚未接入演示数据</div>
              )}
              <SectionHeading title="常用入口" />
              <button
                className="list-link"
                onClick={() => startScenario("leave")}
              >
                <Home size={19} /> 离家模式 <ChevronRight size={17} />
              </button>
              <button className="list-link" onClick={() => setDetail("house")}>
                <BookOpen size={19} /> 房屋资料 <ChevronRight size={17} />
              </button>
            </div>
          )}
          {!detail && tab === "messages" && (
            <div className="standard-page">
              <SectionHeading title="家里的动态" />
              <div className="filter-tabs">
                {["全部", "告警", "任务", "通知"].map((value) => (
                  <button
                    key={value}
                    className={messageFilter === value ? "active" : ""}
                    onClick={() => setMessageFilter(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {alertOn &&
                (messageFilter === "全部" || messageFilter === "告警") && (
                  <button
                    className="message-item alert"
                    onClick={() => setDetail("event")}
                  >
                    <IconTile className="red">
                      <ShieldAlert size={20} />
                    </IconTile>
                    <span>
                      <strong>厨房燃气报警</strong>
                      <small>
                        {alertAcknowledged
                          ? "通知已读 · 事件仍待处理"
                          : "需要查看现场处置状态"}
                      </small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                )}
              {task &&
                (messageFilter === "全部" || messageFilter === "任务") && (
                  <button
                    className="message-item"
                    onClick={() => setDetail("task")}
                  >
                    <IconTile
                      className={
                        task.status === "部分失败" || task.status === "失败"
                          ? "peach"
                          : "mint"
                      }
                    >
                      <ClipboardList size={20} />
                    </IconTile>
                    <span>
                      <strong>
                        {task.title} · {task.status}
                      </strong>
                      <small>查看执行步骤与设备回读</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                )}
              {(messageFilter === "全部" || messageFilter === "通知") && (
                <button
                  className="message-item"
                  onClick={() =>
                    showInfo(
                      "家庭已连接",
                      "这是演示通知。正式产品将展示真实的家庭绑定和设备接入状态。",
                    )
                  }
                >
                  <IconTile className="lavender">
                    <Bell size={19} />
                  </IconTile>
                  <span>
                    <strong>欢迎来到维家</strong>
                    <small>家庭状态和任务结果会汇集在这里</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              )}
              {messageFilter === "告警" && !alertOn && (
                <div className="empty-state">
                  <ShieldCheck size={30} />
                  <strong>暂无安全告警</strong>
                  <span>可以从“演示场景”模拟一次燃气事件。</span>
                </div>
              )}
              {messageFilter === "任务" && !task && (
                <div className="empty-state">
                  <ClipboardList size={30} />
                  <strong>暂无任务记录</strong>
                  <span>试试在首页发起一次设备任务。</span>
                </div>
              )}
            </div>
          )}
          {!detail && tab === "me" && (
            <div className="standard-page me-page">
              <SectionHeading title="我的维家" />
              <div className="family-card">
                <div className="family-avatar">
                  <img src="/me-avatar.jpg" alt="我的头像" />
                </div>
                <div className="family-info">
                  <small>我的账号</small>
                  <strong>{demoUserName}</strong>
                  <span>未来之家 · 家庭管理员</span>
                </div>
                <Home className="family-mark" size={18} aria-hidden="true" />
              </div>
              <button className="mode-summary" onClick={openModeSheet}>
                <span className="mode-summary-icon">
                  {privacyMode === "standard" ? <Mic size={19} /> : privacyMode === "mute" ? <VolumeX size={19} /> : <MicOff size={19} />}
                </span>
                <span className="mode-summary-copy">
                  <strong>当前模式 · {privacyModeNames[privacyMode]}</strong>
                  <small>{privacyMode === "standard" ? "语音与感知按已授权能力工作" : privacyMode === "mute" ? "主动语音暂停，文字与页面仍可用" : "非安全收音与对话已暂停"}</small>
                </span>
                <span className="mode-summary-action">切换 <ChevronRight size={15} /></span>
              </button>
              <SectionHeading title="家庭与消息" />
              <button className="ai-service-link" onClick={() => setTab("space")}>
                <Home size={20} />
                <span><strong>空间</strong><small>查看房间与设备状态</small></span>
                <ChevronRight size={17} />
              </button>
              <button className="ai-service-link" onClick={() => setTab("messages")}>
                <MessageCircle size={20} />
                <span><strong>消息</strong><small>查看任务与安全事件</small></span>
                <ChevronRight size={17} />
              </button>
              <SectionHeading title="家庭设置" />
              <div className="settings-group">
                {[
                  {
                    icon: <Home size={18} />,
                    title: "家庭管理",
                    body: "查看和切换家庭。正式产品会校验家庭成员身份与权限。",
                  },
                  {
                    icon: <UserRound size={18} />,
                    title: "成员与权限",
                    body: "管理家庭成员角色、可访问空间和设备。演示版暂使用管理员身份。",
                  },
                  {
                    icon: <ShieldCheck size={18} />,
                    title: "隐私与数据授权",
                    body: "查看家庭数据授权范围。演示版所有内容均为本地模拟数据。",
                  },
                  {
                    icon: <Bell size={18} />,
                    title: "通知偏好",
                    body: "普通通知可配置；紧急安全事件不受普通免打扰关闭。",
                  },
                ].map((row) => (
                  <button
                    key={row.title}
                    onClick={() => row.title === "隐私与数据授权" ? openModeSheet() : showInfo(row.title, row.body)}
                  >
                    {row.icon}
                    <span>{row.title}</span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
              <SectionHeading title="体验设置" />
              <button className="list-link" onClick={() => setDemoOpen(true)}>
                <Settings2 size={19} /> 演示场景与设备状态{" "}
                <ChevronRight size={17} />
              </button>
              <p className="version-note">
                维家智能空间 · 交互演示 v0.1
                <br />
                所有家庭、设备及事件数据均为模拟数据
              </p>
            </div>
          )}
        </div>
        {!detail && tab === "home" && (
          <div className="composer-wrap">
            {alertOn ? (
              <button
                className="safety-composer"
                onClick={() => setDetail("event")}
              >
                <ShieldAlert size={18} /> 先处理厨房燃气告警{" "}
                <ArrowRight size={16} />
              </button>
            ) : privacyMode === "privacy" ? (
              <button className="privacy-composer" onClick={openModeSheet}>
                <MicOff size={18} /> 隐私模式已开启，对话暂停 <ChevronRight size={16} />
              </button>
            ) : (
              <form className="ai-composer" onSubmit={submitInput}>
                <div className="ai-input-box">
                  <button
                    type="button"
                    aria-label="语音演示说明"
                    onClick={() =>
                      showInfo(
                        "语音输入",
                        privacyMode === "mute"
                          ? "静音模式下主动语音已暂停，文字输入仍可用；紧急安全告警不受普通静音抑制。"
                          : "当前是浏览器前端演示版。可用文字输入或点击功能入口体验流程；语音识别将在后续接入。",
                      )
                    }
                  >
                    <Mic size={20} />
                  </button>
                  <input
                    aria-label="向维家提问"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="说说你想让家做什么…"
                  />
                  <button
                    className="ai-send"
                    type={input.trim() ? "submit" : "button"}
                    aria-label={input.trim() ? "发送问题" : "更多功能"}
                    onClick={input.trim() ? undefined : () => setDemoOpen(true)}
                  >
                    {input.trim() ? <ArrowUp size={17} /> : <Plus size={17} />}
                  </button>
                </div>
              </form>
            )}
            {alertOn && <span>演示事件 · 确认通知不代表险情解除</span>}
          </div>
        )}
        <div className="home-indicator" />
        {confirmLeave && (
          <div className="overlay">
            <div className="dialog">
              <button
                className="dialog-close"
                aria-label="关闭"
                onClick={() => setConfirmLeave(false)}
              >
                <X size={19} />
              </button>
              <IconTile className="lavender">
                <Home size={22} />
              </IconTile>
              <h2>确认执行离家模式？</h2>
              <p>
                将关闭客厅灯、空调和卧室灯。冰箱与家庭网络保持运行；窗帘未纳入本次演示。
              </p>
              <div className="dialog-note">
                <ShieldCheck size={17} /> 需确认后才会下发模拟任务
              </div>
              <button
                className="wide-primary"
                onClick={() => {
                  setConfirmLeave(false);
                  runTask("leave");
                }}
              >
                确认执行
              </button>
              <button
                className="wide-secondary"
                onClick={() => {
                  setConfirmLeave(false);
                  append({
                    kind: "notice",
                    title: "已取消",
                    body: "离家模式没有执行。",
                  });
                }}
              >
                先不执行
              </button>
            </div>
          </div>
        )}
        {modeOpen && (
          <div className="overlay bottom-overlay" onClick={() => setModeOpen(false)}>
            <div className="demo-sheet mode-sheet" role="dialog" aria-modal="true" aria-label="切换隐私模式" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="sheet-title">
                <div><h2>模式与隐私</h2></div>
                <button aria-label="关闭" onClick={() => setModeOpen(false)}><X size={20} /></button>
              </div>
              <p>当前以“未来之家”管理员身份演示切换。选择模式后查看影响，再确认生效。</p>
              <div className="mode-options" role="group" aria-label="选择模式">
                {([
                  { id: "standard" as PrivacyMode, icon: <Mic size={18} />, summary: "语音和感知按授权工作" },
                  { id: "mute" as PrivacyMode, icon: <VolumeX size={18} />, summary: "暂停主动语音，保留页面操作" },
                  { id: "privacy" as PrivacyMode, icon: <MicOff size={18} />, summary: "暂停非安全收音和云端对话" },
                ]).map((option) => (
                  <button
                    key={option.id}
                    className={selectedPrivacyMode === option.id ? "selected" : ""}
                    aria-pressed={selectedPrivacyMode === option.id}
                    onClick={() => setSelectedPrivacyMode(option.id)}
                  >
                    <span className="mode-option-icon">{option.icon}</span>
                    <span><strong>{privacyModeNames[option.id]}</strong><small>{option.summary}</small></span>
                    <span className="mode-radio">{selectedPrivacyMode === option.id && <Check size={13} />}</span>
                  </button>
                ))}
              </div>
              <div className="mode-impact">
                <strong>切换后的影响</strong>
                <p>{selectedPrivacyMode === "standard"
                  ? "恢复按授权工作的语音和感知能力；不会补传隐私模式期间的非安全音频或会话。"
                  : selectedPrivacyMode === "mute"
                    ? "关闭主动语音唤醒或播报；文字输入和小程序页面仍可使用，普通语音反馈改为页面提示。"
                    : "停止非安全类音频采集、云端会话和主动个性化；小程序仍可查看空间与消息，不新增长期偏好数据。"}</p>
                <small>安全例外：已审核的本地安全感知与紧急声光告警不受普通静音或隐私模式抑制。当前 Demo 只模拟燃气事件。</small>
              </div>
              <div className="mode-duration">
                <span>持续时间</span><strong>{selectedPrivacyMode === "standard" ? "直到再次切换" : "本次演示会话，直到手动恢复或重置"}</strong>
              </div>
              <div className="mode-duration">
                <span>恢复方式</span><strong>从「我的」或首页状态提示重新切换</strong>
              </div>
              {modeHistory.length > 0 && <p className="mode-history">最近切换：{modeHistory[0]}</p>}
              <button className="mode-confirm" onClick={applyPrivacyMode}>
                {selectedPrivacyMode === privacyMode ? "保持当前模式" : `确认切换为${privacyModeNames[selectedPrivacyMode]}`}
              </button>
              <p className="mode-demo-note">此处仅演示小程序状态；未连接真实麦克风、面板、传感器或云端授权。</p>
            </div>
          </div>
        )}
        {demoOpen && (
          <div
            className="overlay bottom-overlay"
            onClick={() => setDemoOpen(false)}
          >
            <div
              className="demo-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-title">
                <div>
                  <h2>选择演示场景</h2>
                </div>
                <button aria-label="关闭" onClick={() => setDemoOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <p>按场景体验卡片如何引导提问、解释依据并推进任务。</p>
              <div className="demo-options">
                {[
                  {
                    id: "comfort" as Scenario,
                    icon: <Thermometer size={19} />,
                    label: "客厅有点热",
                    meta: "问答 → 方案 → 执行",
                  },
                  {
                    id: "leave" as Scenario,
                    icon: <Home size={19} />,
                    label: "离家模式",
                    meta: "影响范围 → 确认 → 部分失败",
                  },
                  {
                    id: "gas" as Scenario,
                    icon: <ShieldAlert size={19} />,
                    label: "模拟燃气告警",
                    meta: "高优先级事件接管",
                  },
                  {
                    id: "qa" as Scenario,
                    icon: <BookOpen size={19} />,
                    label: "个性化家庭问答",
                    meta: "状态 + 档案依据",
                  },
                  {
                    id: "light" as Scenario,
                    icon: <Lightbulb size={19} />,
                    label: "打开客厅灯",
                    meta: "简单控制 + 回读",
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => startScenario(option.id)}
                  >
                    {option.icon}
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.meta}</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
              <button
                className="switch-row"
                onClick={() => setOffline((value) => !value)}
              >
                <WifiOff size={18} />
                <span>模拟客厅设备离线</span>
                <span className={`switch ${offline ? "on" : ""}`} />
              </button>
              <button className="reset-button" onClick={resetDemo}>
                <RotateCcw size={15} /> 重置演示数据
              </button>
            </div>
          </div>
        )}
        {info && (
          <div className="overlay" onClick={() => setInfo(null)}>
            <div
              className="dialog info-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="dialog-close"
                aria-label="关闭"
                onClick={() => setInfo(null)}
              >
                <X size={19} />
              </button>
              <IconTile className="sky">
                <Sparkles size={22} />
              </IconTile>
              <h2>{info.title}</h2>
              <p>{info.body}</p>
              <button className="wide-primary" onClick={() => setInfo(null)}>
                知道了 <Check size={17} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
