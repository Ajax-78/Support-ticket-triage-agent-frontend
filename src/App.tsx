
import { useState, type ReactNode } from "react";

import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Menu,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRoundCheck,
  X,
} from "lucide-react";

import { triageTicket } from "./api";
import type { TriageResult } from "./types";
import "./App.css";

/* =========================================================
   TYPES
========================================================= */

type QueueTicket = {
  id: string;
  text: string;
  triage: TriageResult;
};

type BadgeTone = "green" | "red" | "yellow" | "blue" | "gray";

type PageType = "dashboard" | "triage";

/* =========================================================
   SAMPLE TICKETS
========================================================= */

const examples = [
  "Mera payment deduct ho gaya but course access nahi mil raha",
  "I want a refund for my course",
  "Lecture video is not playing and app keeps buffering",
  "This is ridiculous. I have contacted support three times and nobody is helping me.",
];

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [text, setText] = useState(examples[0]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [active, setActive] = useState<PageType>("dashboard");

  const [sent, setSent] = useState(false);

  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>([]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* =========================================================
     ANALYZE
  ========================================================= */

  async function analyze() {
    if (!text.trim() || loading) return;

    setLoading(true);
    setSent(false);

    try {
      const ticketText = text.trim();

      const data = await triageTicket(ticketText);

      setResult(data);

      const ticketNumber = 1043 + queueTickets.length;

      const newTicket: QueueTicket = {
        id: `#${ticketNumber}`,
        text: ticketText,
        triage: data,
      };

      setQueueTickets((prev) => [newTicket, ...prev]);

      setActive("triage");
    } catch (error) {
      console.error(error);

      alert(
        "Unable to analyze ticket. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     OPEN QUEUE TICKET
  ========================================================= */

  function openQueueTicket(ticket: QueueTicket) {
    setText(ticket.text);
    setResult(ticket.triage);
    setSent(false);
    setActive("triage");
    setMobileMenuOpen(false);
  }

  /* =========================================================
     SEND REPLY
  ========================================================= */

  function sendReply() {
    setSent(true);
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function navigate(page: PageType) {
    setActive(page);
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="mobile-header">
        <div className="mobile-brand">
          <div className="brand-icon">
            <Sparkles size={17} />
          </div>

          <div>
            <div className="brand-name">SupportAI</div>
            <div className="brand-subtitle">Triage Agent</div>
          </div>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        active={active}
        onDashboard={() => navigate("dashboard")}
        onTriage={() => navigate("triage")}
        mobileOpen={mobileMenuOpen}
      />

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main-content">
        {active === "dashboard" ? (
          <Dashboard
            queueTickets={queueTickets}
            onOpenTriage={() => navigate("triage")}
            onSelectTicket={openQueueTicket}
          />
        ) : (
          <TriagePage
            text={text}
            setText={setText}
            result={result}
            loading={loading}
            sent={sent}
            onAnalyze={analyze}
            onSendReply={sendReply}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  active,
  onDashboard,
  onTriage,
  mobileOpen,
}: {
  active: PageType;
  onDashboard: () => void;
  onTriage: () => void;
  mobileOpen: boolean;
}) {
  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="brand">
        <div className="brand-icon">
          <Sparkles size={18} />
        </div>

        <div>
          <div className="brand-name">SupportAI</div>
          <div className="brand-subtitle">Triage Agent</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">WORKSPACE</div>

        <button
          className={`nav-item ${
            active === "dashboard" ? "active" : ""
          }`}
          onClick={onDashboard}
        >
          <BarChart3 size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-item ${
            active === "triage" ? "active" : ""
          }`}
          onClick={onTriage}
        >
          <Ticket size={18} />
          <span>Triage Ticket</span>
        </button>
      </div>

      <div className="sidebar-info">
        <div className="sidebar-info-icon">
          <ShieldCheck size={16} />
        </div>

        <div>
          <strong>AI Grounded</strong>
          <span>Knowledge base enabled</span>
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className="agent-status">
          <div className="status-dot" />

          <div>
            <div className="status-title">Agent Online</div>
            <div className="status-text">AI triage active</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  queueTickets,
  onOpenTriage,
  onSelectTicket,
}: {
  queueTickets: QueueTicket[];
  onOpenTriage: () => void;
  onSelectTicket: (ticket: QueueTicket) => void;
}) {
  const totalTickets = queueTickets.length;

  const escalatedTickets = queueTickets.filter(
    (ticket) => ticket.triage.escalate
  ).length;

  const autoReplyTickets = queueTickets.filter(
    (ticket) => !ticket.triage.escalate
  ).length;

  const categories = queueTickets.reduce<Record<string, number>>(
    (acc, ticket) => {
      const category = ticket.triage.category;

      acc[category] = (acc[category] || 0) + 1;

      return acc;
    },
    {}
  );

  const averageConfidence =
    queueTickets.length > 0
      ? Math.round(
          (queueTickets.reduce(
            (sum, ticket) => sum + ticket.triage.confidence,
            0
          ) /
            queueTickets.length) *
            100
        )
      : null;

  return (
    <div className="page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-header">
        <div className="page-heading">
          <div className="eyebrow">OPERATIONS</div>

          <h1>Support Dashboard</h1>

          <p>
            Monitor incoming tickets, AI decisions, and escalation
            activity.
          </p>
        </div>

        <button
          className="primary-button header-button"
          onClick={onOpenTriage}
        >
          <Ticket size={17} />
          New Triage Ticket
        </button>
      </div>

      {/* =====================================================
          METRICS
      ===================================================== */}

      <div className="metrics-grid">
        <MetricCard
          icon={<Ticket size={18} />}
          label="Total Tickets"
          value={totalTickets}
          description="Processed this session"
        />

        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label="Auto Reply"
          value={autoReplyTickets}
          description="Resolved automatically"
        />

        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Escalated"
          value={escalatedTickets}
          description="Requires human review"
        />

        <MetricCard
          icon={<ShieldCheck size={18} />}
          label="Confidence"
          value={
            averageConfidence !== null
              ? `${averageConfidence}%`
              : "—"
          }
          description="Average AI confidence"
        />
      </div>

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <div className="dashboard-grid">
        {/* QUEUE */}

        <section className="card queue-card">
          <div className="card-header">
            <div>
              <h2>Recent Queue</h2>

              <p>
                Click a ticket to view its complete triage result.
              </p>
            </div>

            <div className="card-header-icon">
              <Clock3 size={18} />
            </div>
          </div>

          {queueTickets.length === 0 ? (
            <EmptyQueue onOpenTriage={onOpenTriage} />
          ) : (
            <div className="queue-list">
              {queueTickets.map((ticket) => (
                <QueueRow
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onSelectTicket(ticket)}
                />
              ))}
            </div>
          )}
        </section>

        {/* CATEGORY */}

        <section className="card category-card">
          <div className="card-header">
            <div>
              <h2>Ticket Categories</h2>

              <p>Current session distribution</p>
            </div>

            <div className="card-header-icon">
              <BarChart3 size={18} />
            </div>
          </div>

          {Object.keys(categories).length === 0 ? (
            <div className="empty-small">
              <BarChart3 size={22} />
              <span>No ticket categories yet.</span>
            </div>
          ) : (
            <div className="category-list">
              {Object.entries(categories).map(
                ([category, count]) => {
                  const percentage =
                    totalTickets > 0
                      ? Math.round((count / totalTickets) * 100)
                      : 0;

                  return (
                    <div
                      className="category-row"
                      key={category}
                    >
                      <div className="category-left">
                        <div className="category-name">
                          {formatCategory(category)}
                        </div>

                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="category-count">
                        {count}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          WORKFLOW
      ===================================================== */}

      <section className="card workflow-card">
        <div className="card-header">
          <div>
            <div className="eyebrow">AUTOMATION PIPELINE</div>

            <h2>How the Agent Works</h2>

            <p>
              Tickets move through retrieval, AI reasoning, response
              generation, and deterministic escalation.
            </p>
          </div>

          <div className="card-header-icon">
            <Sparkles size={19} />
          </div>
        </div>

        <div className="workflow">
          <WorkflowStep
            number="01"
            icon={<Search size={17} />}
            title="Retrieve"
            text="Search the support knowledge base using TF-IDF."
          />

          <WorkflowArrow />

          <WorkflowStep
            number="02"
            icon={<Bot size={17} />}
            title="Classify"
            text="Gemini analyzes the ticket using retrieved evidence."
          />

          <WorkflowArrow />

          <WorkflowStep
            number="03"
            icon={<FileText size={17} />}
            title="Draft"
            text="Generate a grounded support response."
          />

          <WorkflowArrow />

          <WorkflowStep
            number="04"
            icon={<UserRoundCheck size={17} />}
            title="Escalate"
            text="Apply deterministic rules for human review."
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   EMPTY QUEUE
========================================================= */

function EmptyQueue({
  onOpenTriage,
}: {
  onOpenTriage: () => void;
}) {
  return (
    <div className="empty-queue">
      <div className="empty-icon">
        <Ticket size={22} />
      </div>

      <h3>No tickets yet</h3>

      <p>
        Analyze your first student ticket and it will appear here.
      </p>

      <button
        className="secondary-button"
        onClick={onOpenTriage}
      >
        Create Ticket
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* =========================================================
   QUEUE ROW
========================================================= */

function QueueRow({
  ticket,
  onClick,
}: {
  ticket: QueueTicket;
  onClick: () => void;
}) {
  const result = ticket.triage;

  return (
    <button className="queue-row" onClick={onClick}>
      <div className="queue-row-main">
        <div className="ticket-id">{ticket.id}</div>

        <div className="ticket-content">
          <div className="ticket-text">
            {ticket.text}
          </div>

          <div className="ticket-meta">
            <span>
              {formatCategory(result.category)}
            </span>

            <span>•</span>

            <span>
              {Math.round(result.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>

      <div className="queue-row-right">
        <Badge tone={result.escalate ? "red" : "green"}>
          {result.escalate ? "Escalated" : "Auto Reply"}
        </Badge>

        <ChevronRight size={17} />
      </div>
    </button>
  );
}

/* =========================================================
   TRIAGE PAGE
========================================================= */

function TriagePage({
  text,
  setText,
  result,
  loading,
  sent,
  onAnalyze,
  onSendReply,
}: {
  text: string;
  setText: (value: string) => void;
  result: TriageResult | null;
  loading: boolean;
  sent: boolean;
  onAnalyze: () => void;
  onSendReply: () => void;
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <div className="eyebrow">AI TRIAGE</div>

          <h1>Triage Ticket</h1>

          <p>
            Analyze a student support request and generate an
            evidence-backed response.
          </p>
        </div>

        <div className="agent-pill">
          <span className="status-dot" />
          Agent ready
        </div>
      </div>

      {/* =====================================================
          INPUT
      ===================================================== */}

      <section className="card ticket-input-card">
        <div className="card-header">
          <div>
            <div className="eyebrow">INPUT</div>

            <h2>Student Ticket</h2>

            <p>
              Paste the incoming support request below.
            </p>
          </div>

          <div className="card-header-icon">
            <Ticket size={19} />
          </div>
        </div>

        <textarea
          className="ticket-textarea"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Enter a student support ticket..."
          rows={7}
        />

        <div className="example-row">
          <span className="example-label">Try example:</span>

          {examples.map((example, index) => (
            <button
              key={index}
              className="example-button"
              onClick={() => setText(example)}
            >
              {shorten(example, 42)}
            </button>
          ))}
        </div>

        <div className="input-actions">
          <div className="input-hint">
            <ShieldCheck size={15} />

            <span>
              Responses are grounded in the support knowledge base.
            </span>
          </div>

          <button
            className="primary-button"
            onClick={onAnalyze}
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Analyze Ticket
              </>
            )}
          </button>
        </div>
      </section>

      {/* =====================================================
          RESULT
      ===================================================== */}

      {result ? (
        <TriageResultPanel
          result={result}
          sent={sent}
          onSendReply={onSendReply}
        />
      ) : (
        <EmptyTriageState />
      )}
    </div>
  );
}

/* =========================================================
   EMPTY TRIAGE
========================================================= */

function EmptyTriageState() {
  return (
    <section className="card empty-result">
      <div className="empty-icon">
        <Bot size={22} />
      </div>

      <h3>Waiting for a ticket</h3>

      <p>
        Submit a student ticket above to see classification,
        draft response, evidence, and escalation decision.
      </p>
    </section>
  );
}

/* =========================================================
   TRIAGE RESULT
========================================================= */

function TriageResultPanel({
  result,
  sent,
  onSendReply,
}: {
  result: TriageResult;
  sent: boolean;
  onSendReply: () => void;
}) {
  return (
    <div className="result-layout">
      {/* =====================================================
          MAIN RESULT
      ===================================================== */}

      <div className="result-main">
        {/* DECISION */}

        <section className="card decision-card">
          <div className="card-header">
            <div>
              <div className="eyebrow">AGENT DECISION</div>

              <h2>
                {result.escalate
                  ? "Human Review Required"
                  : "Ready for Auto Reply"}
              </h2>
            </div>

            <div
              className={`decision-icon ${
                result.escalate ? "danger" : "success"
              }`}
            >
              {result.escalate ? (
                <AlertTriangle size={21} />
              ) : (
                <CheckCircle2 size={21} />
              )}
            </div>
          </div>

          <div className="decision-grid">
            <InfoItem
              label="Category"
              value={formatCategory(result.category)}
            />

            <InfoItem
              label="Confidence"
              value={`${Math.round(
                result.confidence * 100
              )}%`}
            />

            <InfoItem
              label="Priority"
              value={formatValue(result.priority)}
            />

            <InfoItem
              label="Sentiment"
              value={formatValue(result.sentiment)}
            />
          </div>

          {result.escalate && (
            <div className="escalation-box">
              <div className="escalation-title">
                <AlertTriangle size={16} />
                Escalation Reason
              </div>

              <p>
                {result.escalation_reason ||
                  "This ticket requires human review based on escalation rules."}
              </p>
            </div>
          )}
        </section>

        {/* DRAFT */}

        <section className="card draft-card">
          <div className="card-header">
            <div>
              <div className="eyebrow">GENERATED RESPONSE</div>

              <h2>Draft Response</h2>

              <p>
                AI-generated response grounded in the knowledge
                base.
              </p>
            </div>

            <div className="draft-icon">
              <FileText size={19} />
            </div>
          </div>

          <div className="draft-response">
            {result.draft_reply}
          </div>

          <div className="draft-footer">
            <div className="citation-note">
              <ShieldCheck size={15} />

              <span>
                Grounded using retrieved knowledge-base evidence.
              </span>
            </div>

            {!result.escalate && !sent && (
              <button
                className="primary-button"
                onClick={onSendReply}
              >
                <Send size={16} />
                Send Auto Reply
              </button>
            )}

            {!result.escalate && sent && (
              <div className="sent-status">
                <CheckCircle2 size={16} />
                Reply queued successfully
              </div>
            )}

            {result.escalate && (
              <div className="escalated-status">
                <UserRoundCheck size={16} />
                Send to human support
              </div>
            )}
          </div>
        </section>

        {/* EVIDENCE */}

        <section className="card evidence-card">
          <div className="card-header">
            <div>
              <div className="eyebrow">KNOWLEDGE BASE</div>

              <h2>Retrieved Evidence</h2>

              <p>
                Sources used to ground the generated response.
              </p>
            </div>

            <div className="card-header-icon">
              <Search size={19} />
            </div>
          </div>

          {result.evidence && result.evidence.length > 0 ? (
            <div className="evidence-list">
              {result.evidence.map((item, index) => (
                <EvidenceItem
                  key={index}
                  item={item}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="empty-small">
              No evidence was returned.
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="result-sidebar">
        {/* TRACE */}

        <section className="card trace-card">
          <div className="card-header">
            <div>
              <div className="eyebrow">TRACE</div>

              <h2>Agent Trace</h2>
            </div>

            <Sparkles size={18} />
          </div>

          <div className="trace-list">
            <TraceStep
              number="01"
              title="Ticket received"
              description="Input accepted"
              completed
            />

            <TraceStep
              number="02"
              title="Knowledge retrieval"
              description="TF-IDF search completed"
              completed
            />

            <TraceStep
              number="03"
              title="AI classification"
              description="Gemini analysis completed"
              completed
            />

            <TraceStep
              number="04"
              title="Escalation rules"
              description={
                result.escalate
                  ? "Human review triggered"
                  : "Auto reply allowed"
              }
              completed
            />
          </div>
        </section>

        {/* SYSTEM */}

        <section className="card system-card">
          <div className="card-header">
            <div>
              <div className="eyebrow">SYSTEM</div>

              <h2>Run Details</h2>
            </div>
          </div>

          <div className="system-list">
            <SystemRow
              label="Model"
              value={result.model || "Gemini"}
            />

            <SystemRow
              label="Latency"
              value={
                result.latency_ms !== undefined
                  ? `${result.latency_ms} ms`
                  : "—"
              }
            />

            <SystemRow
              label="Confidence"
              value={`${Math.round(
                result.confidence * 100
              )}%`}
            />

            <SystemRow
              label="Escalation"
              value={result.escalate ? "Yes" : "No"}
            />
          </div>
        </section>

        {/* ISSUES */}

        {result.issues && result.issues.length > 0 && (
          <section className="card issues-card">
            <div className="card-header">
              <div>
                <div className="eyebrow">DETECTED</div>

                <h2>Issues</h2>
              </div>
            </div>

            <div className="issue-list">
              {result.issues.map((issue, index) => (
                <div className="issue-item" key={index}>
                  <span className="issue-dot" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

/* =========================================================
   EVIDENCE ITEM
========================================================= */

function EvidenceItem({
  item,
  index,
}: {
  item: any;
  index: number;
}) {
  const title =
    item.title ||
    item.name ||
    item.source ||
    `Knowledge Base Source ${index + 1}`;

  const score =
    typeof item.score === "number"
      ? `${Math.round(item.score * 100)}% match`
      : null;

  return (
    <div className="evidence-item">
      <div className="evidence-number">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="evidence-content">
        <div className="evidence-top">
          <strong>{title}</strong>

          {score && (
            <Badge tone="blue">
              {score}
            </Badge>
          )}
        </div>

        {item.text && <p>{item.text}</p>}

        {item.citation && (
          <div className="citation">
            Source: {item.citation}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <div className="metric-icon">
          {icon}
        </div>
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-label">{label}</div>

      <div className="metric-description">
        {description}
      </div>
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>

      <div className="info-value">{value}</div>
    </div>
  );
}

/* =========================================================
   BADGE
========================================================= */

function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {children}
    </span>
  );
}

/* =========================================================
   WORKFLOW
========================================================= */

function WorkflowStep({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="workflow-step">
      <div className="workflow-number">{number}</div>

      <div className="workflow-icon">
        {icon}
      </div>

      <div className="workflow-title">{title}</div>

      <div className="workflow-text">{text}</div>
    </div>
  );
}

/* =========================================================
   WORKFLOW ARROW
========================================================= */

function WorkflowArrow() {
  return (
    <div className="workflow-arrow">
      <ChevronRight size={17} />
    </div>
  );
}

/* =========================================================
   TRACE
========================================================= */

function TraceStep({
  number,
  title,
  description,
  completed,
}: {
  number: string;
  title: string;
  description: string;
  completed: boolean;
}) {
  return (
    <div className="trace-step">
      <div
        className={`trace-number ${
          completed ? "completed" : ""
        }`}
      >
        {completed ? (
          <CheckCircle2 size={14} />
        ) : (
          number
        )}
      </div>

      <div className="trace-content">
        <div className="trace-title">{title}</div>

        <div className="trace-description">
          {description}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SYSTEM ROW
========================================================= */

function SystemRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="system-row">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatCategory(category: string) {
  if (!category) return "Unknown";

  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatValue(value: string | undefined) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function shorten(text: string, length: number) {
  if (text.length <= length) return text;

  return `${text.slice(0, length)}...`;
}







