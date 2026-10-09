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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Thermometer,
  UserRound,
  VolumeX,
  WifiOff,
  Wind,
  Moon,
  X,
} from "lucide-react";

type Tab = "home" | "space" | "messages" | "me";
type Detail = "task" | "event" | "device" | "house" | "family" | "members" | "privacy" | "notifications" | null;
type Scenario = "comfort" | "leave" | "home" | "wake" | "sleep" | "gas" | "qa" | "light";
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
  status: "待确认" | "执行中" | "成功" | "部分完成" | "部分失败" | "失败";
  rows: Row[];
};

const demoUserName = "小南";
type PrototypePage = Tab | Exclude<Detail, null>;
type PrototypeCase = {
  id: string;
  page: PrototypePage;
  name: string;
  title: string;
  body: string;
  rows?: Row[];
  action?: string;
  tone?: "warning" | "danger";
};
const prototypeCases: PrototypeCase[] = [
  { id: "first-visit", page: "home", name: "首访 · 未绑定家庭", title: "先关联你的家", body: "关联家庭后，才能看到真实空间、设备和任务。绑定前不会显示家庭状态，也不能控制设备。", rows: [{ label: "当前状态", value: "尚未绑定家庭" }, { label: "授权方式", value: "按需授权" }], action: "绑定家庭" },
  { id: "no-history", page: "home", name: "首访 · 已绑定无历史", title: "你好，小南", body: "家庭已关联。这里会先展示当前空间摘要和几个常见问题；首次提问时再申请相关能力的授权。", rows: [{ label: "家庭", value: "未来之家" }, { label: "历史任务", value: "暂无" }], action: "进入对话首页" },
  { id: "history", page: "home", name: "历史会话 · 待确认任务", title: "继续上次的任务", body: "离家模式已完成影响范围预览，等待你确认。恢复时沿用原会话和任务编号，不会重复下发已完成动作。", rows: [{ label: "原任务", value: "离家模式" }, { label: "任务编号", value: "T-1028" }, { label: "当前步骤", value: "等待确认" }], action: "继续任务" },
  { id: "loading", page: "home", name: "通用 · 加载中", title: "正在更新家庭状态", body: "保留页面与当前家庭上下文。较长时间未返回时，说明正在等待哪个服务。", rows: [{ label: "正在读取", value: "空间与任务" }, { label: "当前结果", value: "尚未确认" }], action: "返回页面" },
  { id: "offline", page: "space", name: "空间 · 设备离线", title: "客厅设备暂时离线", body: "手机网络正常，但客厅主灯和空调没有最新回报。页面保留最后一次记录，不允许以旧状态发起确定性控制。", rows: [{ label: "最后上报", value: "10 分钟前" }, { label: "当前状态", value: "无法确认" }], action: "查看设备", tone: "warning" },
  { id: "phone-offline", page: "space", name: "空间 · 手机断网", title: "手机当前无法连接网络", body: "小程序无法刷新云端空间与任务状态。已缓存的摘要仅供参考；现场面板及设备本地能力是否可用需分别判断。", rows: [{ label: "手机网络", value: "已断开" }, { label: "页面数据", value: "上次缓存" }], action: "重新连接后刷新", tone: "warning" },
  { id: "hub-offline", page: "space", name: "空间 · 主机离线", title: "家庭主机暂时离线", body: "手机网络正常，但主机未回报。依赖主机的远程控制与自动化暂停；不将所有设备都标成故障。", rows: [{ label: "手机网络", value: "正常" }, { label: "家庭主机", value: "离线" }], action: "查看连接说明", tone: "warning" },
  { id: "stale", page: "space", name: "空间 · 数据过期", title: "环境数据已过期", body: "温度和 CO₂ 读数来自较早的上报，暂不能据此判断客厅是否舒适或自动建议控制。", rows: [{ label: "温度", value: "29.2°C · 历史值" }, { label: "采集时间", value: "20 分钟前" }], action: "重新获取", tone: "warning" },
  { id: "space-empty", page: "space", name: "空间 · 空房间", title: "这个房间还没有设备", body: "已选择厨房，但尚未接入可显示的设备。可以返回全屋或前往家庭设置完成设备配置。", rows: [{ label: "空间", value: "厨房" }, { label: "设备", value: "0 台" }], action: "返回全屋" },
  { id: "sensor-missing", page: "space", name: "空间 · 传感器缺失", title: "暂缺环境读数", body: "卧室尚未接入温度与空气质量传感器。不要使用其他房间的数据代替。", rows: [{ label: "温度", value: "暂无数据" }, { label: "CO₂", value: "暂无数据" }], action: "查看设备配置" },
  { id: "message-empty", page: "messages", name: "消息 · 空列表", title: "暂时没有消息", body: "告警、任务结果和通知会出现在这里。你可以返回对话页发起一次设备任务。", action: "返回对话" },
  { id: "message-unread", page: "messages", name: "消息 · 未读与待处理", title: "有一条待处理告警", body: "未读只表示尚未打开；确认收到也不代表险情解除。打开消息时应刷新事件最新状态。", rows: [{ label: "厨房燃气报警", value: "待处理" }, { label: "读取状态", value: "未读" }], action: "查看事件", tone: "danger" },
  { id: "message-expired", page: "messages", name: "消息 · 历史链接失效", title: "这条消息已失效", body: "原消息的操作入口已过期。先获取当前事件或任务状态，再决定是否展示后续操作。", rows: [{ label: "原消息", value: "离家模式结果" }, { label: "当前状态", value: "需重新获取" }], action: "刷新当前状态", tone: "warning" },
  { id: "permission", page: "messages", name: "消息 · 无权限", title: "无法查看这条消息", body: "你的家庭访问权限已变化。敏感摘要保持隐藏，如需继续查看请联系家庭管理员。", rows: [{ label: "访问对象", value: "已脱敏" }, { label: "处理方式", value: "联系管理员" }], action: "返回消息" },
  { id: "member", page: "me", name: "我的 · 普通成员", title: "小南 · 普通成员", body: "可以查看被授权的空间和设备；邀请、移除成员及家庭级配置由管理员处理。", rows: [{ label: "家庭", value: "未来之家" }, { label: "可访问空间", value: "客厅、卧室" }, { label: "家庭管理", value: "仅查看" }], action: "查看权限说明" },
  { id: "me-no-family", page: "me", name: "我的 · 无家庭", title: "尚未加入家庭", body: "当前账号没有关联家庭。空间、消息与设备详情暂不展示家庭数据。", action: "加入或创建家庭" },
  { id: "task-failed", page: "task", name: "任务 · 失败", title: "设备操作失败", body: "客厅空调未收到可确认的设备回读，本次任务显示失败，不会标记为已完成。", rows: [{ label: "任务编号", value: "T-1026" }, { label: "客厅空调", value: "未响应" }], action: "查看失败原因", tone: "warning" },
  { id: "task-accepted", page: "task", name: "任务 · 已受理", title: "任务已受理", body: "控制请求已进入执行队列，尚无设备回读。只有收到可靠结果后，才会更新为成功或失败。", rows: [{ label: "任务编号", value: "T-1026" }, { label: "当前阶段", value: "等待设备回读" }], action: "返回任务详情" },
  { id: "task-queued", page: "task", name: "任务 · 待发送", title: "任务等待发送", body: "方案已确认，正在检查家庭在线状态与执行权限。尚未向设备下发指令，不能显示执行成功。", rows: [{ label: "任务编号", value: "T-1026" }, { label: "设备指令", value: "尚未发送" }], action: "返回任务详情" },
  { id: "task-timeout", page: "task", name: "任务 · 超时", title: "仍在等待设备回读", body: "服务已受理指令，但超过等待时间仍没有可靠回读。暂不重发相同动作，先查询设备现状。", rows: [{ label: "任务编号", value: "T-1026" }, { label: "当前结论", value: "结果未知" }], action: "刷新状态", tone: "warning" },
  { id: "task-cancelled", page: "task", name: "任务 · 已取消", title: "离家模式已取消", body: "用户在确认前取消。本次没有向设备下发指令，历史记录仍可查看。", rows: [{ label: "任务编号", value: "T-1028" }, { label: "设备指令", value: "未下发" }], action: "返回对话" },
  { id: "event-recovered", page: "event", name: "事件 · 已恢复待确认", title: "燃气读数已恢复", body: "传感器恢复正常不代表现场处理已完成。仍需有权成员核对现场并完成关闭流程。", rows: [{ label: "本地声光", value: "已停止" }, { label: "阀门状态", value: "待现场确认" }, { label: "人工确认", value: "待完成" }], action: "查看处置时间线", tone: "warning" },
  { id: "event-detecting", page: "event", name: "事件 · 检测中", title: "正在核对传感器读数", body: "检测结果尚未达到告警判定条件。页面展示正在核对的对象与时间，不提前宣告安全或触发远程解除操作。", rows: [{ label: "传感器", value: "厨房燃气" }, { label: "当前阶段", value: "检测中" }], action: "查看实时读数", tone: "warning" },
  { id: "event-processing", page: "event", name: "事件 · 处理中", title: "安全事件正在处理", body: "本地安全动作与通知已开始执行，远程页面逐项显示回执。未确认现场安全前，不提供一键解除按钮。", rows: [{ label: "本地告警", value: "已触发" }, { label: "联系人通知", value: "发送中" }, { label: "现场确认", value: "待完成" }], action: "查看处置时间线", tone: "danger" },
  { id: "event-closed", page: "event", name: "事件 · 已关闭", title: "事件已关闭", body: "有权成员已核对现场，并记录关闭原因。历史处置过程保持可追溯，旧消息不再出现可执行的处置按钮。", rows: [{ label: "现场核对", value: "已完成" }, { label: "关闭原因", value: "读数恢复且现场无异常" }], action: "查看事件记录" },
  { id: "event-false-alarm", page: "event", name: "事件 · 误报", title: "事件已标记误报", body: "经现场核查确认误报，处理人和核查依据已留存。历史告警仍可查询，且不当作设备故障已修复。", rows: [{ label: "处理结果", value: "误报" }, { label: "核查依据", value: "现场检测记录" }], action: "查看核查记录" },
  { id: "device-unsupported", page: "device", name: "设备 · 不支持控制", title: "当前设备暂不支持远程控制", body: "设备状态可查看，但能力目录未返回可用控制项。页面不展示无法履约的操作按钮。", rows: [{ label: "设备", value: "窗帘电机" }, { label: "在线状态", value: "已连接" }, { label: "远程控制", value: "待验证" }], action: "查看设备资料" },
  { id: "device-fault", page: "device", name: "设备 · 故障", title: "设备状态异常", body: "客厅空调上报故障码，暂不提供继续控制。可查看最近回报与故障说明，并联系维护人员。", rows: [{ label: "设备", value: "客厅空调" }, { label: "故障", value: "需检修" }], action: "查看故障详情", tone: "warning" },
  { id: "device-permission", page: "device", name: "设备 · 无控制权限", title: "你没有控制权限", body: "设备状态按授权范围可见，但当前成员不能发起控制。申请权限后需重新校验，不沿用旧页面授权。", rows: [{ label: "设备", value: "客厅空调" }, { label: "控制权限", value: "未授权" }], action: "查看权限说明" },
  { id: "house-missing", page: "house", name: "资料 · 缺失", title: "尚未录入保修凭证", body: "已有型号和安装位置，但保修日期缺少可靠来源。回答中应标明缺口，不推测保修时间。", rows: [{ label: "型号", value: "KFR-35" }, { label: "保修凭证", value: "未录入" }], action: "查看补录说明" },
  { id: "house-conflict", page: "house", name: "资料 · 来源冲突", title: "资料需要核对", body: "设备铭牌与上传凭证的型号不一致。在有权人核对前，不将其中一项作为确定答案。", rows: [{ label: "设备铭牌", value: "KFR-35" }, { label: "上传凭证", value: "KFR-36" }], action: "查看来源", tone: "warning" },
  { id: "house-unavailable", page: "house", name: "资料 · 来源不可用", title: "资料暂时无法获取", body: "设备档案服务未返回可靠结果。保留当前问题与已确认资料，恢复后继续查询，不编造型号或保修日期。", rows: [{ label: "资料来源", value: "暂时不可用" }, { label: "回答状态", value: "等待核验" }], action: "稍后重试", tone: "warning" },
  { id: "house-permission", page: "house", name: "资料 · 无权限", title: "无法查看这份资料", body: "当前成员没有访问这份家庭凭证的权限。页面只显示可公开的设备摘要，敏感文件内容保持隐藏。", rows: [{ label: "凭证内容", value: "已隐藏" }, { label: "下一步", value: "联系家庭管理员" }], action: "返回资料" },
  { id: "me-denied", page: "me", name: "我的 · 权限受限", title: "家庭访问权限已变更", body: "账号仍已登录，但当前家庭授权被收回。家庭空间和任务入口暂停显示；可联系管理员或切换家庭。", rows: [{ label: "家庭", value: "未来之家" }, { label: "访问状态", value: "受限" }], action: "查看家庭权限" },
  { id: "member-pending", page: "me", name: "成员 · 待生效", title: "成员邀请等待接受", body: "邀请已发出，但被邀请人尚未接受。页面不能提前展示家庭设备和资料，邀请者可查看有效期。", rows: [{ label: "邀请状态", value: "待接受" }, { label: "访问权限", value: "尚未生效" }], action: "查看邀请记录" },
  { id: "member-expired", page: "me", name: "成员 · 已过期", title: "成员授权已过期", body: "该成员无法继续查看家庭状态或控制设备。历史操作记录按家庭审计规则保留。", rows: [{ label: "授权状态", value: "已过期" }, { label: "设备控制", value: "不可用" }], action: "联系管理员" },
  { id: "member-revoked", page: "me", name: "成员 · 已撤销", title: "成员权限已撤销", body: "撤销后当前家庭的消息、资料和设备入口同步失效；旧链接重新打开时仍需校验权限。", rows: [{ label: "授权状态", value: "已撤销" }, { label: "旧链接", value: "不可继续访问" }], action: "返回我的" },
  { id: "member-rejected", page: "me", name: "成员 · 越权拒绝", title: "当前操作未获授权", body: "普通成员尝试修改家庭级设置。服务端拒绝后，页面显示受限原因和联系管理员路径，不将操作写成成功。", rows: [{ label: "操作", value: "修改家庭成员" }, { label: "处理结果", value: "已拒绝" }], action: "查看权限说明", tone: "warning" },
  { id: "service-unavailable", page: "home", name: "通用 · 服务不可用", title: "服务暂时不可用", body: "当前请求尚未完成。保留原会话和已完成步骤，恢复后继续，不重复创建任务。", rows: [{ label: "设备本地能力", value: "仍可用" }, { label: "云端问答", value: "暂时中断" }], action: "稍后重试", tone: "warning" },
];
function greetingForHour(hour: number) {
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 13) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}
const livingRoomTemperatureC = 29.2;
function homeSubtitleFor(hour: number, livingRoomTemperatureC: number | null) {
  if (hour >= 21 || hour < 6) return "准备休息了吗？";
  if (livingRoomTemperatureC === null) return "客厅状态暂时无法更新，稍后再看看？";
  if (livingRoomTemperatureC >= 28) return "今天客厅有点热，要开空调吗？";
  return "家里现在挺舒适，要看看别的房间吗？";
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
  let current = Date.now() * 1000;
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
          <small>设备状态 · 刚刚更新</small>
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
            ? "安全事件"
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
  const initialPrototype = prototypeCases.find((entry) => entry.id === new URLSearchParams(window.location.search).get("prototype"));
  const [tab, setTab] = useState<Tab>(initialPrototype && ["home", "space", "messages", "me"].includes(initialPrototype.page) ? initialPrototype.page as Tab : "home");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [detail, setDetail] = useState<Detail>(initialPrototype && ["task", "event", "device", "house", "family", "members", "privacy", "notifications"].includes(initialPrototype.page) ? initialPrototype.page as Detail : null);
  const [items, setItems] = useState<ChatItem[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("weijia-demo-items") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [offline, setOffline] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [acOn, setAcOn] = useState(false);
  const [acTargetTemp, setAcTargetTemp] = useState(26);
  const [alertOn, setAlertOn] = useState(false);
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [task, setTask] = useState<Task | null>(() => {
    try { return JSON.parse(sessionStorage.getItem("weijia-demo-task") || "null"); }
    catch { return null; }
  });
  const [prototypeCase, setPrototypeCase] = useState(() =>
    new URLSearchParams(window.location.search).get("prototype") || "",
  );
  const [bindingStep, setBindingStep] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [ordinaryNotices, setOrdinaryNotices] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
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
  const [room, setRoom] = useState("全屋");
  const [messageFilter, setMessageFilter] = useState("全部");
  const [deviceTarget, setDeviceTarget] = useState<"灯" | "空调">("空调");
  const streamRef = useRef<HTMLDivElement>(null);
  const taskRunVersion = useRef(0);

  useEffect(() => {
    sessionStorage.setItem("weijia-demo-privacy-mode", privacyMode);
    sessionStorage.setItem("weijia-demo-mode-history", JSON.stringify(modeHistory));
  }, [privacyMode, modeHistory]);

  useEffect(() => {
    sessionStorage.setItem("weijia-demo-items", JSON.stringify(items));
    sessionStorage.setItem("weijia-demo-task", JSON.stringify(task));
  }, [items, task]);

  function openPrototype(id: string) {
    const selected = prototypeCases.find((entry) => entry.id === id);
    if (!selected) return;
    if (["task", "event", "device", "house", "family", "members", "privacy", "notifications"].includes(selected.page)) {
      setDetail(selected.page as Exclude<Detail, null>);
    } else {
      setDetail(null);
      setTab(selected.page as Tab);
    }
    setPrototypeCase(id);
    setBindingStep(0);
    setDemoOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("prototype", id);
    window.history.replaceState(null, "", url);
  }

  function closePrototype() {
    setPrototypeCase("");
    setBindingStep(0);
    const url = new URL(window.location.href);
    url.searchParams.delete("prototype");
    window.history.replaceState(null, "", url);
  }

  function actOnPrototype() {
    if (prototypeCase === "first-visit") {
      if (bindingStep === 0) { setBindingStep(1); return; }
      closePrototype();
      setTab("home");
      setDetail(null);
      return;
    }
    if (prototypeCase === "history") {
      setItems([
        { id: uid(), kind: "user", body: "执行离家模式" },
        { id: uid(), kind: "plan", title: "继续确认离家模式", body: "恢复上次的任务步骤。客厅灯、空调和卧室灯将关闭；冰箱与家庭网络保持运行。", badge: "待确认", rows: [{ label: "任务编号", value: "T-1028" }, { label: "当前步骤", value: "等待确认" }], actions: [{ label: "查看并确认", id: "leave_confirm", tone: "primary" }, { label: "取消", id: "cancel" }] },
      ]);
      setTask({ id: "T-1028", title: "离家模式", status: "待确认", rows: [{ label: "作用范围", value: "3 台设备" }] });
      closePrototype();
      setDetail(null);
      setTab("home");
      return;
    }
    if (prototypeCase === "message-unread" || prototypeCase === "event-recovered") {
      closePrototype(); setDetail("event"); setAlertOn(true); return;
    }
    if (prototypeCase === "offline") {
      closePrototype(); setDetail("device"); setOffline(true); return;
    }
    if (prototypeCase === "no-history") {
      closePrototype(); setTab("home"); setDetail(null); return;
    }
    closePrototype();
  }

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

  function runTask(type: "comfort" | "leave" | "home" | "wake" | "sleep" | "light", sourceId?: number) {
    const currentRun = ++taskRunVersion.current;
    if (sourceId) resolveCard(sourceId);
    const title =
      type === "comfort"
        ? "客厅空调调节"
        : type === "leave"
          ? "离家模式"
          : type === "home"
            ? "回家模式"
            : type === "wake"
              ? "起床模式"
              : type === "sleep"
                ? "睡眠模式"
            : "打开客厅灯";
    const taskId = `T-${type === "leave" ? "1028" : type === "home" ? "1029" : type === "wake" ? "1030" : type === "sleep" ? "1031" : type === "light" ? "1027" : "1026"}`;
    if (offline && type !== "leave") {
      setTask({
        id: taskId,
        title,
        status: "失败",
        rows: [
          {
            label: type === "light" ? "客厅主灯" : type === "home" || type === "sleep" ? "客厅灯与空调" : "客厅空调",
            value: "设备离线",
            state: "warn",
          },
        ],
      });
      append({
        kind: "result",
        title: "设备离线，未执行",
        body: "设备目前无法连接。请检查设备或稍后重试；没有设备回读，不会显示操作成功。",
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
        : type === "home"
          ? [
              { label: "客厅灯", value: "等待回读" },
              { label: "客厅空调", value: "等待回读" },
            ]
        : type === "wake" || type === "sleep"
          ? [
              ...(type === "sleep" ? [{ label: "客厅灯", value: "等待回读" }] : []),
              { label: "客厅空调", value: "等待回读" },
              { label: type === "wake" ? "卧室主灯" : "卧室小夜灯", value: "未接入，跳过", state: "muted" as const },
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
          : type === "home"
            ? [
                { label: "客厅灯", value: "已打开", state: "ok" },
                { label: "客厅空调", value: "制冷 · 26°C", state: "ok" },
              ]
          : type === "wake" || type === "sleep"
            ? [
                ...(type === "sleep" ? [{ label: "客厅灯", value: "已关闭", state: "ok" as const }] : []),
                { label: "客厅空调", value: type === "wake" ? "舒适温度 · 26°C" : "夜间温度 · 27°C", state: "ok" },
                { label: type === "wake" ? "卧室主灯" : "卧室小夜灯", value: "未接入，已跳过", state: "muted" },
              ]
          : [
              {
                label: type === "light" ? "客厅主灯" : "客厅空调",
                value: type === "light" ? "已打开" : "制冷 · 26°C",
                state: "ok",
              },
            ];
      const status = type === "leave" ? "部分失败" : type === "wake" || type === "sleep" ? "部分完成" : "成功";
      setTask({ id: taskId, title, status, rows });
      if (type === "light") setLightOn(true);
      if (type === "comfort") {
        setAcOn(true);
        setAcTargetTemp(26);
      }
      if (type === "home") {
        setLightOn(true);
        setAcOn(true);
        setAcTargetTemp(26);
      }
      if (type === "wake" || type === "sleep") {
        setAcOn(true);
        setAcTargetTemp(type === "wake" ? 26 : 27);
        if (type === "sleep") setLightOn(false);
      }
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
                title: type === "leave" ? "离家模式部分完成" : type === "wake" || type === "sleep" ? `${title}已执行可用动作` : type === "light" ? "客厅灯已打开" : `${title}已完成`,
                layout: type === "light" ? "compact-light-success" : undefined,
                body:
                  type === "leave"
                    ? offline
                      ? "客厅设备离线未执行，卧室灯无响应。请查看分项结果，不会把本次任务显示为成功。"
                      : "卧室灯未响应，其余动作已有回读。请查看失败项，不会把本次任务显示为全部成功。"
                    : type === "wake" || type === "sleep"
                      ? "客厅设备动作已有回读；卧室灯尚未接入，已跳过。"
                    : "设备状态已更新，可在下方查看。",
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
      showInfo("隐私模式下对话已暂停", "非安全类云端会话和主动个性化已暂停。你仍可查看空间和消息；如需继续对话，可从“我的”切回标准或静音模式。安全告警仍会显示。");
      return;
    }
    if (alertOn) {
      append({
        kind: "safety",
        title: "请先处理厨房燃气告警",
        body: "安全事件仍处于待处理状态。普通问答与设备控制暂时让位于现场处置；请先查看事件详情并按现场情况处理。",
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
        body: "本地声光告警已触发。阀门状态尚未取得真实回读，请按现场处置指引处理；确认通知不代表险情解除。",
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
          { label: "窗帘", value: "未纳入本次执行范围", state: "muted" },
        ],
        actions: [
          { label: "查看并确认", id: "leave_confirm", tone: "primary" },
          { label: "取消", id: "cancel" },
        ],
      });
    } else if (type === "home") {
      append({
        kind: "plan",
        title: "准备执行回家模式",
        body: "回家后打开客厅灯，并将客厅空调设为制冷 26°C。确认后再执行。",
        badge: "待确认",
        rows: [
          { label: "客厅灯", value: "打开" },
          { label: "客厅空调", value: "制冷 · 26°C" },
        ],
        actions: [
          { label: "确认执行", id: "home_exec", tone: "primary" },
          { label: "取消", id: "cancel" },
        ],
      });
    } else if (type === "wake" || type === "sleep") {
      const waking = type === "wake";
      append({
        kind: "plan",
        title: `准备执行${waking ? "起床" : "睡眠"}模式`,
        body: waking
          ? "将客厅空调调至舒适温度。卧室主灯尚未接入，本次跳过渐亮动作。"
          : "关闭客厅灯，并将空调调至夜间温度。卧室小夜灯尚未接入，本次跳过。",
        badge: "待确认",
        rows: waking
          ? [
              { label: "客厅空调", value: "舒适温度 · 26°C" },
              { label: "卧室主灯", value: "未接入，跳过", state: "muted" },
            ]
          : [
              { label: "客厅灯", value: "关闭" },
              { label: "客厅空调", value: "夜间温度 · 27°C" },
              { label: "卧室小夜灯", value: "未接入，跳过", state: "muted" },
            ],
        actions: [
          { label: "确认执行可用动作", id: waking ? "wake_exec" : "sleep_exec", tone: "primary" },
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
            value: "KFR-35",
            note: "房屋档案",
          },
          {
            label: "保修",
            value: "至 2027 年 6 月",
            note: "保修凭证",
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
    else if (action === "home_exec") runTask("home", itemId);
    else if (action === "wake_exec") runTask("wake", itemId);
    else if (action === "sleep_exec") runTask("sleep", itemId);
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
        "对话无法判断真实险情，也不能用文字触发传感器告警。若现场有异常，请优先按现场应急流程处理；可在消息中查看安全事件。",
      );
      return;
    }
    if (/不要|别|不用|不许/.test(question) && /打开|开启|执行|调节|启动/.test(question)) {
      answer("不会执行这项操作", "我已理解你不希望执行该动作；本次没有向任何设备下发指令。设备状态请以当前页面显示为准。");
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
        "目前只有客厅主灯可从对话控制。其他房间可查看空间概览，但不能假装已执行设备指令。",
      );
      else answer(
        "想打开哪盏灯？",
        "请说出房间或灯具。当前可控制的是客厅主灯。",
        { actions: [{ label: "打开客厅灯", id: "prompt_light" }] },
      );
      return;
    }
    if (/灯|空调|窗帘/.test(question) && /关闭|关掉|关一下|停止/.test(question) && !/了吗|吗|么|是否|有没有|状态|是不是|？|\?/.test(question)) {
      answer(
        "这项关闭操作暂不可用",
        "目前可使用客厅开灯、空调调凉和离家模式；离家模式会先列出影响设备供你确认。",
      );
      return;
    }
    if (/窗帘/.test(question)) {
      answer(
        "窗帘控制能力待确认",
        "当前无法获取窗帘状态或控制结果，因此无法确认它是否打开，也不会下发控制指令。",
      );
      return;
    }
    if (/型号|保修|维修|档案|说明书|设备资料/.test(question)) {
      if (roomName && roomName !== "客厅") answer(
        `${roomName}设备资料尚未录入`,
        "目前只有客厅空调的档案。缺失的型号、保修和维修记录不会用猜测补全。",
      );
      else startScenario("qa", value);
      return;
    }
    if (/任务|记录|历史|上次|刚才/.test(question)) {
      answer(
        task ? `最近任务：${task.title}` : "目前还没有任务记录",
        task
          ? `当前结果为“${task.status}”。可以打开任务详情查看每台设备的执行和回读。`
          : "目前还没有设备任务。你可以直接描述想做的事，涉及设备执行时我会展示确认和结果。",
        task ? { rows: task.rows, actions: [{ label: "查看任务详情", id: "task_detail" }] } : {},
      );
      return;
    }
    if (/成员|管理员|权限|谁能/.test(question)) {
      answer(
        "当前家庭身份",
        "当前以“未来之家”家庭管理员身份使用。成员和权限管理入口在“我的”页面。",
      );
      return;
    }
    if (/隐私|数据授权|数据安全/.test(question)) {
      answer(
        "隐私与数据授权",
        "你可以在“我的”页面查看隐私模式与数据授权。",
      );
      return;
    }
    if (/天气|室外/.test(question) && !/室内|家里|房间|客厅|卧室|厨房/.test(question)) {
      answer("暂无室外实时信息", "目前无法获取室外天气。你可以继续问我家中各房间的温度。");
      return;
    }
    if (/空调/.test(question) && /打开|开启|调|制冷|凉快|降温/.test(question) && !/了吗|吗|么|是否|有没有|状态|是不是|？|\?/.test(question)) {
      if (roomName && roomName !== "客厅") answer(
        `${roomName}空调控制尚未接入`,
        "目前只有客厅空调支持调节。未接入的设备不会显示执行成功。",
      );
      else if (/\d{2}\s*(?:度|°C|℃)/i.test(question) && !/26\s*(?:度|°C|℃)/i.test(question)) answer(
        "可以先查看客厅空调方案",
        "目前仅支持制冷 26°C，不能按自定义温度执行。你可以继续查看 26°C 的调节方案。",
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
          : `${roomName}当前显示温度为${roomName === "卧室" ? "25.8" : "26.4"}°C。这个房间尚未接入空调控制流程，我不会替你执行未接入的操作。`,
      );
      return;
    }
    if (/温度|室温|几度|多少度|冷热/.test(question) && roomName) {
      const degree = roomName === "客厅" ? "29.2" : roomName === "卧室" ? "25.8" : "26.4";
      answer(
        `${roomName}温度${offline ? "待确认" : `约 ${degree}°C`}`,
        offline
          ? "当前设备离线，不能把空间概览中的旧数据当成实时温度。"
          : "这是空间页当前显示的温度，请以最近更新时间为准。",
        { rows: [{ label: "空间", value: roomName }, { label: "温度", value: offline ? "待确认" : `${degree}°C` }] },
      );
      return;
    }
    if (/温度|室温|几度|多少度/.test(question) && !roomName) {
      answer(
        "家里的空间温度",
        offline ? "当前设备离线，无法确认实时温度。" : "以下是空间页当前显示的温度，你可以继续指定房间问我。",
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
          ? "目前无法获取该房间灯具的实时状态。"
          : offline ? "客厅设备离线，当前无法确认灯是否亮着。" : `客厅主灯目前${lightOn ? "已打开" : "已关闭"}；可在设备详情查看更新时间。`,
      );
      return;
    }
    if (/空调/.test(question)) {
      if (roomName && roomName !== "客厅") answer(
        `${roomName}空调状态暂无回读`,
        "目前仅有客厅空调的状态与档案。",
      );
      else startScenario("qa", value);
      return;
    }
    if (/家里|家中|全屋|家庭|设备/.test(question) && /怎么样|如何|状态|情况|概况|有哪些|多少|都/.test(question)) {
      answer(
        "未来之家空间概览",
        offline
          ? "客厅设备当前离线，无法确认实时状态；以下是已配置的空间。"
          : "已配置客厅、卧室和厨房。客厅温度偏高；下方列出已接入的设备状态。",
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
        "客厅当前显示温度偏高。你可以先查看客厅温度与空调状态，再决定是否调节；离家前也可检查灯和空调。这里没有真实用电量，无法估算节省金额。",
        { actions: [{ label: "看看客厅状态", id: "prompt_comfort" }] },
      );
      return;
    }
    if (/你好|您好|在吗|你是谁|你能做什么/.test(question)) {
      answer(
        "你好，我是维家",
        "你可以直接说想了解哪个房间、设备或家庭任务。我能回答空间状态、客厅设备和空调资料，也能展示需确认的设备操作流程。",
      );
      return;
    }
    answer(
      "我还缺少回答这个问题的信息",
      "我收到了你的提问，但目前没有对应的可靠数据。你可以补充房间、设备或想完成的动作；我会说明能查询什么，以及哪些信息尚未接入。",
    );
  }

  function resetDemo() {
    taskRunVersion.current += 1;
    setItems([]);
    setTask(null);
    setAlertOn(false);
    setAlertAcknowledged(false);
    setAcOn(false);
    setAcTargetTemp(26);
    setLightOn(false);
    setOffline(false);
    setDetail(null);
    setTab("home");
    setDemoOpen(false);
    setModeOpen(false);
    setPrivacyMode("standard");
    setSelectedPrivacyMode("standard");
    setModeHistory([]);
    closePrototype();
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

  const selectedPrototype = prototypeCases.find((entry) => entry.id === prototypeCase);
  const headerTitle = detail
    ? {
        task: "任务详情",
        event: "安全事件",
        device: `客厅${deviceTarget === "灯" ? "主灯" : "空调"}`,
        house: "房屋资料",
        family: "家庭管理",
        members: "成员与权限",
        privacy: "隐私与数据授权",
        notifications: "通知偏好",
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
          {detail && (
            <button
              className="icon-button"
              aria-label="返回"
              onClick={handleBack}
            >
              <ArrowLeft size={21} />
            </button>
          )}
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
                aria-label="场景与设备状态"
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
                <p>任务编号 {task?.id || "—"}</p>
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
                      "请先核对失败原因。仅可重试不会重复执行已成功动作的失败项。",
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
                <span>安全事件</span>
                <h1>厨房燃气报警</h1>
                <p>现场声光告警已触发。请以现场情况为准，并按预案处理。</p>
              </div>
              <SectionHeading title="当前处置状态" />
              <div className="surface-card">
                <DataRows
                  rows={[
                    { label: "燃气传感器", value: "已触发", state: "warn" },
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
                  传感器触发
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
                          ? `制冷 · ${acTargetTemp}°C`
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
                          { label: "目标温度", value: acOn ? `${acTargetTemp}°C` : "—" },
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
              </div>
              <SectionHeading title="设备资料" />
              <div className="surface-card">
                <DataRows
                  rows={[
                    {
                      label: "设备型号",
                      value: "KFR-35",
                      note: "设备档案 · 2026-09-20",
                    },
                    { label: "安装位置", value: "客厅" },
                    {
                      label: "保修截止",
                      value: "2027 年 6 月",
                      note: "保修凭证",
                    },
                    { label: "维修记录", value: "未录入", state: "muted" },
                  ]}
                />
              </div>
              <div className="source-note">
                <BookOpen size={16} />{" "}
                资料缺失时会标注“未录入”。
              </div>
            </div>
          )}
          {detail === "family" && (
            <div className="detail-page">
              <div className="detail-hero">
                <IconTile className="sky"><Home size={23} /></IconTile>
                <h1>未来之家</h1>
                <p>当前家庭 · 已关联</p>
              </div>
              <SectionHeading title="家庭信息" />
              <div className="surface-card"><DataRows rows={[
                { label: "家庭管理员", value: demoUserName },
                { label: "已配置空间", value: "客厅、卧室、厨房" },
                { label: "设备状态", value: offline ? "部分设备离线" : "2 台设备在线", state: offline ? "warn" : "ok" },
              ]} /></div>
              <SectionHeading title="管理入口" />
              <button className="wide-secondary" onClick={() => setDetail("members")}>查看成员与权限 <ChevronRight size={17} /></button>
              <button className="wide-secondary" onClick={() => { setDetail(null); setTab("space"); }}>查看空间与设备 <ChevronRight size={17} /></button>
              <div className="source-note"><ShieldCheck size={16} /> 家庭数据仅对已授权成员开放。</div>
            </div>
          )}
          {detail === "members" && (
            <div className="detail-page">
              <div className="detail-hero">
                <IconTile className="lavender"><UserRound size={23} /></IconTile>
                <h1>成员与权限</h1>
                <p>未来之家 · 按角色查看可用范围</p>
              </div>
              <SectionHeading title="当前成员" />
              <div className="surface-card"><DataRows rows={[
                { label: demoUserName, value: "家庭管理员", note: "管理家庭设置、成员权限与设备" },
                { label: "家人", value: "普通成员", note: "查看已授权空间和设备" },
              ]} /></div>
              <SectionHeading title="权限说明" />
              <div className="surface-card"><DataRows rows={[
                { label: "空间与设备", value: "按成员授权范围开放" },
                { label: "家庭设置", value: "仅管理员可修改" },
                { label: "授权变更", value: "变更后重新校验访问权限" },
              ]} /></div>
              <button className="wide-secondary" onClick={() => showInfo("邀请成员", "请由家庭管理员发起邀请。新成员接受邀请后，才能查看获授权的空间与设备。")}>邀请成员 <ChevronRight size={17} /></button>
            </div>
          )}
          {detail === "privacy" && (
            <div className="detail-page">
              <div className="detail-hero">
                <IconTile className="mint"><ShieldCheck size={23} /></IconTile>
                <h1>隐私与数据授权</h1>
                <p>查看当前模式及家庭数据使用范围</p>
              </div>
              <SectionHeading title="当前模式" />
              <div className="surface-card"><DataRows rows={[
                { label: "运行模式", value: privacyModeNames[privacyMode] },
                { label: "语音与对话", value: privacyMode === "privacy" ? "已暂停" : privacyMode === "mute" ? "主动语音已暂停" : "按授权使用" },
                { label: "安全告警", value: "保持可用", state: "ok" },
              ]} /></div>
              <SectionHeading title="数据授权" />
              <div className="surface-card"><DataRows rows={[
                { label: "空间与设备状态", value: "用于状态查询与设备控制" },
                { label: "房屋资料", value: "仅在有权访问时用于回答" },
                { label: "操作记录", value: "按家庭权限查看" },
              ]} /></div>
              <div className="source-note"><ShieldCheck size={16} /> 授权变化后，相关数据访问会重新校验。</div>
            </div>
          )}
          {detail === "notifications" && (
            <div className="detail-page">
              <div className="detail-hero">
                <IconTile className="peach"><Bell size={23} /></IconTile>
                <h1>通知偏好</h1>
                <p>管理家庭提醒的接收方式</p>
              </div>
              <SectionHeading title="通知类型" />
              <div className="surface-card"><DataRows rows={[
                { label: "安全告警", value: "始终提醒", note: "紧急事件不受普通免打扰影响", state: "warn" },
                { label: "任务结果", value: "在消息中查看" },
              ]} /></div>
              <button className="wide-secondary" onClick={() => setOrdinaryNotices((value) => !value)}>普通提醒 · {ordinaryNotices ? "已开启" : "已关闭"} <ChevronRight size={17} /></button>
              <button className="wide-secondary" onClick={() => setQuietHours((value) => !value)}>静默时段 · {quietHours ? "已开启" : "未开启"} <ChevronRight size={17} /></button>
              <div className="source-note"><Bell size={16} /> 重要安全告警仍会提醒家庭成员。</div>
            </div>
          )}
          {!detail && tab === "home" && (
            <>
              <div className={`ai-home ${items.length ? "has-conversation" : ""}`}>
                <div className="ai-hero">
                  <div className="ai-welcome">
                    <h1>{greetingForHour(currentTime.getHours())}，{demoUserName}</h1>
                    <p>{homeSubtitleFor(currentTime.getHours(), offline ? null : livingRoomTemperatureC)}</p>
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
                        {offline ? "设备状态待确认" : `客厅 ${livingRoomTemperatureC}°C`}
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
                    <button className="ai-recommend-home" onClick={() => startScenario("home", "回家模式")}>
                      <span className="ai-recommend-copy">
                        <strong>回家模式</strong>
                        <small>开启客厅灯与空调</small>
                      </span>
                      <span className="ai-recommend-icon" aria-hidden="true"><Home size={30} /></span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                    <button className="ai-recommend-wake" onClick={() => startScenario("wake", "起床模式")}>
                      <span className="ai-recommend-copy">
                        <strong>起床模式</strong>
                        <small>开启早晨舒适温度</small>
                      </span>
                      <span className="ai-recommend-icon" aria-hidden="true"><Sunrise size={30} /></span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                    <button className="ai-recommend-sleep" onClick={() => startScenario("sleep", "睡眠模式")}>
                      <span className="ai-recommend-copy">
                        <strong>睡眠模式</strong>
                        <small>关闭客厅灯并调温</small>
                      </span>
                      <span className="ai-recommend-icon" aria-hidden="true"><Moon size={30} /></span>
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
                right={<span className="section-small">当前状态</span>}
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
                        {offline ? "离线" : acOn ? `制冷 · ${acTargetTemp}°C` : "已关闭"}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : (
                <div className="space-empty">该空间暂未接入设备</div>
              )}
              <SectionHeading title="常用入口" />
              {([
                { id: "wake" as Scenario, label: "起床模式", icon: <Sunrise size={19} /> },
                { id: "home" as Scenario, label: "回家模式", icon: <Home size={19} /> },
                { id: "leave" as Scenario, label: "离家模式", icon: <Home size={19} /> },
                { id: "sleep" as Scenario, label: "睡眠模式", icon: <Moon size={19} /> },
              ]).map((mode) => (
                <button className="list-link" key={mode.id} onClick={() => startScenario(mode.id, mode.label)}>
                  {mode.icon} {mode.label} <ChevronRight size={17} />
                </button>
              ))}
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
                      "家庭已连接，空间与设备状态可在首页查看。",
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
                  <span>目前没有需要处理的安全告警。</span>
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
                  <img src="./me-avatar.jpg" alt="我的头像" />
                </div>
                <div className="family-info">
                  <small>我的账号</small>
                  <strong>{demoUserName}</strong>
                  <span>未来之家 · 家庭管理员</span>
                </div>
                <Home className="family-mark" size={18} aria-hidden="true" />
              </div>
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
                    page: "family" as Detail,
                  },
                  {
                    icon: <UserRound size={18} />,
                    title: "成员与权限",
                    page: "members" as Detail,
                  },
                  {
                    icon: <ShieldCheck size={18} />,
                    title: "隐私与数据授权",
                    page: "privacy" as Detail,
                  },
                  {
                    icon: <Bell size={18} />,
                    title: "通知偏好",
                    page: "notifications" as Detail,
                  },
                ].map((row) => (
                  <button
                    key={row.title}
                    onClick={() => setDetail(row.page)}
                  >
                    {row.icon}
                    <span>{row.title}</span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
              <p className="version-note">
                维家智能空间
              </p>
            </div>
          )}
        </div>
        {selectedPrototype && (
          <div className="prototype-overlay" role="region" aria-label={`页面状态：${selectedPrototype.name}`}>
            <div className="prototype-toolbar">
              <span>页面状态</span>
              <button onClick={closePrototype} aria-label="退出页面状态"><X size={18} /></button>
            </div>
            <select aria-label="切换页面状态" value={prototypeCase} onChange={(event) => openPrototype(event.target.value)}>
              {prototypeCases.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
            <div className={`prototype-card ${selectedPrototype.tone || ""}`}>
              <span className="prototype-kicker">{selectedPrototype.page === "home" ? "对话" : selectedPrototype.page === "me" ? "我的" : selectedPrototype.page === "messages" ? "家里的动态" : selectedPrototype.page === "space" ? "空间" : "详情"}</span>
              <h1>{prototypeCase === "first-visit" && bindingStep === 1 ? "确认关联未来之家" : selectedPrototype.title}</h1>
              <p>{prototypeCase === "first-visit" && bindingStep === 1 ? "已找到可关联的家庭。确认后进入对话首页，再按需申请语音、设备和资料权限。" : selectedPrototype.body}</p>
              {selectedPrototype.rows && <div className="prototype-data"><DataRows rows={prototypeCase === "first-visit" && bindingStep === 1 ? [{ label: "当前状态", value: "等待确认关联" }, { label: "家庭", value: "未来之家" }] : selectedPrototype.rows} /></div>}
              {prototypeCase === "loading" && <div className="prototype-loading"><span />正在获取最新状态…</div>}
              {prototypeCase === "history" && items.length > 0 && <p className="prototype-hint">本次浏览器会话中还保存了 {items.length} 条对话消息；返回首页可继续查看。</p>}
              <button className="prototype-primary" onClick={actOnPrototype}>{prototypeCase === "first-visit" && bindingStep === 1 ? "确认绑定" : selectedPrototype.action || "返回页面"}<ArrowRight size={16} /></button>
              <button className="prototype-secondary" onClick={closePrototype}>返回页面</button>
            </div>
          </div>
        )}
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
                    aria-label="语音输入说明"
                    onClick={() =>
                      showInfo(
                        "语音输入",
                        privacyMode === "mute"
                          ? "静音模式下主动语音已暂停，文字输入仍可用；紧急安全告警不受普通静音抑制。"
                          : "语音输入暂不可用，请使用文字输入或点击功能入口。",
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
                    aria-label={input.trim() ? "发送问题" : "添加功能（暂不可用）"}
                    disabled={!input.trim()}
                  >
                    {input.trim() ? <ArrowUp size={17} /> : <Plus size={17} />}
                  </button>
                </div>
              </form>
            )}
            {alertOn && <span>安全事件 · 确认通知不代表险情解除</span>}
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
                将关闭客厅灯、空调和卧室灯。冰箱与家庭网络保持运行；窗帘未纳入本次执行范围。
              </p>
              <div className="dialog-note">
                <ShieldCheck size={17} /> 操作后可在记录中查看执行结果
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
              <p>当前以管理员身份。选择模式后查看影响，再确认生效。</p>
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
                <small>安全例外：已审核的本地安全感知与紧急声光告警不受普通静音或隐私模式抑制。</small>
              </div>
              <div className="mode-duration">
                <span>持续时间</span><strong>{selectedPrivacyMode === "standard" ? "直到再次切换" : "直到手动恢复或再次切换"}</strong>
              </div>
              <div className="mode-duration">
                <span>恢复方式</span><strong>从「我的」或首页状态提示重新切换</strong>
              </div>
              {modeHistory.length > 0 && <p className="mode-history">最近切换：{modeHistory[0]}</p>}
              <button className="mode-confirm" onClick={applyPrivacyMode}>
                {selectedPrivacyMode === privacyMode ? "保持当前模式" : `确认切换为${privacyModeNames[selectedPrivacyMode]}`}
              </button>
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
                  <h2>选择场景</h2>
                </div>
                <button aria-label="关闭" onClick={() => setDemoOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <p>选择场景，查看维家如何推进任务。</p>
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
                    label: "燃气告警",
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
              <div className="prototype-menu-entry">
                <strong>查看页面状态</strong>
                <button onClick={() => openPrototype("first-visit")}><Home size={17} /> 首访绑定 <ChevronRight size={16} /></button>
                <button onClick={() => openPrototype("history")}><Clock3 size={17} /> 历史任务恢复 <ChevronRight size={16} /></button>
                <button onClick={() => openPrototype("offline")}><WifiOff size={17} /> 异常与权限状态库 <ChevronRight size={16} /></button>
              </div>
              <button
                className="switch-row"
                onClick={() => setOffline((value) => !value)}
              >
                <WifiOff size={18} />
                <span>客厅设备离线</span>
                <span className={`switch ${offline ? "on" : ""}`} />
              </button>
              <button className="reset-button" onClick={resetDemo}>
                <RotateCcw size={15} /> 重置会话
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
