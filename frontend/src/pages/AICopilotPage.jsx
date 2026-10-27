
import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  ShieldAlert,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react';

import { api, getData } from '../services/api';
import { PageHeader, Loading, Empty } from '../components/common';
import '../styles/ai-copilot.css';

const SUGGESTIONS = [
  'Which open findings should we prioritize first?',
  'Summarize the latest scan results and their limitations.',
  'What remediation work is still outstanding?',
  'Explain the difference between critical and high severity findings.',
];

function getAIErrorDetails(error) {
  const data = error?.response?.data || {};
  const code = data.code;

  if (code === 'AI_PROVIDER_RATE_LIMIT') {
    const seconds = Number(data.retryAfter);

    return {
      title: 'Gemini quota or rate limit reached',
      message:
        data.message ||
        'Gemini is temporarily refusing requests because the configured project has reached a usage limit.',
      detail:
        Number.isFinite(seconds) && seconds > 0
          ? `SecureTrack will pause new AI calls for approximately ${seconds} seconds. This does not reset Google quota.`
          : 'Check Google AI Studio usage, model limits, and billing. A cooldown cannot restore exhausted quota.',
      quota: true,
    };
  }

  if (
    code === 'AI_PROVIDER_AUTH' ||
    code === 'AI_NOT_CONFIGURED'
  ) {
    return {
      title: 'Gemini configuration problem',
      message:
        data.message ||
        'Gemini API key or project configuration needs attention.',
      detail:
        'Check GEMINI_API_KEY and the Google project connected to that key in Render.',
    };
  }

  if (
    code === 'AI_MODEL_NOT_FOUND' ||
    code === 'AI_MODEL_NOT_CONFIGURED'
  ) {
    return {
      title: 'Gemini model unavailable',
      message:
        data.message ||
        'The configured Gemini model is unavailable.',
      detail:
        'Check AI_MODEL in Render and choose a model available to your Google project.',
    };
  }

  if (code === 'AI_TIMEOUT') {
    return {
      title: 'AI request timed out',
      message:
        data.message ||
        'Gemini did not respond within the configured time.',
      detail: 'Please retry after a short wait.',
    };
  }

  return {
    title: 'AI request failed',
    message:
      data.message ||
      error?.message ||
      'SecureTrack could not complete the AI request.',
    detail: data.requestId
      ? `Request ID: ${data.requestId}`
      : 'Check the backend logs and try again.',
  };
}

export default function AICopilotPage() {
  const [status, setStatus] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [findings, setFindings] = useState([]);
  const [usage, setUsage] = useState(null);

  const [insights, setInsights] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);

  const [insightBusy, setInsightBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [analyzingId, setAnalyzingId] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const [error, setError] = useState('');
  const [aiError, setAiError] = useState(null);
  const [notice, setNotice] = useState('');

  const currentConversation = useMemo(
    () =>
      conversations.find(
        item =>
          String(item._id) === String(conversationId)
      ),
    [conversations, conversationId]
  );

  function clearErrors() {
    setError('');
    setAiError(null);
  }

  function handleAIError(error) {
    setError('');
    setAiError(getAIErrorDetails(error));
  }

  async function loadInitial() {
    setLoading(true);
    clearErrors();

    try {
      const [
        statusResponse,
        conversationResponse,
        findingResponse,
        usageResponse,
      ] = await Promise.all([
        getData('/ai/status'),
        getData('/ai/conversations'),
        getData('/findings', { limit: 100 }),
        getData('/ai/usage'),
      ]);

      setStatus(statusResponse);
      setConversations(conversationResponse?.items || []);
      setFindings(findingResponse?.items || []);
      setUsage(usageResponse?.summary || null);
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'SecureTrack AI could not be initialized.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  async function openConversation(id) {
    clearErrors();
    setNotice('');
    setAnalysis(null);

    try {
      const data = await getData(
        `/ai/conversations/${id}`
      );

      setConversationId(id);
      setMessages(data.messages || []);
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Conversation could not be loaded.'
      );
    }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setMessage('');
    setAnalysis(null);
    clearErrors();
    setNotice('');
  }

  async function submit(event) {
    event.preventDefault();

    const value = message.trim();

    if (!value || sending) return;

    setSending(true);
    clearErrors();
    setNotice('');
    setAnalysis(null);

    const optimistic = {
      _id: `local-${Date.now()}`,
      role: 'user',
      content: value,
      createdAt: new Date().toISOString(),
    };

    setMessages(old => [...old, optimistic]);
    setMessage('');

    try {
      const response = await api.post('/ai/chat', {
        message: value,
        conversationId,
      });

      const data = response.data?.data;

      if (!data?.answer || !data?.conversationId) {
        throw new Error(
          'The AI server returned an incomplete response.'
        );
      }

      setConversationId(data.conversationId);

      setMessages(old => [
        ...old.filter(
          item => !String(item._id).startsWith('local-')
        ),
        optimistic,
        {
          _id: `answer-${data.requestId}`,
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          model: data.model,
          createdAt: new Date().toISOString(),
        },
      ]);

      const updated = await getData('/ai/conversations');

      setConversations(updated?.items || []);

      setNotice(
        `Answered using ${data.model || 'the configured AI model'}. Review cited records before acting.`
      );

      // Refresh status because cooldown may have changed.
      try {
        setStatus(await getData('/ai/status'));
      } catch {
        // Chat response has already succeeded.
      }
    } catch (e) {
      setMessages(old =>
        old.filter(item => item._id !== optimistic._id)
      );

      setMessage(value);
      handleAIError(e);

      try {
        setStatus(await getData('/ai/status'));
      } catch {
        // Keep the original chat error.
      }
    } finally {
      setSending(false);
    }
  }

  async function analyzeFinding(event) {
    const id = event.target.value;

    setAnalysis(null);
    clearErrors();

    if (!id) return;

    setAnalyzingId(id);

    try {
      const response = await api.post(
        `/ai/findings/${id}/analyze`
      );

      setAnalysis(response.data?.data);
    } catch (e) {
      handleAIError(e);
    } finally {
      setAnalyzingId('');
      event.target.value = '';

      try {
        setStatus(await getData('/ai/status'));
      } catch {
        // Preserve the analysis result or error.
      }
    }
  }

  async function generateInsights() {
    setInsightBusy(true);
    clearErrors();
    setNotice('');

    try {
      const response = await api.post('/ai/risk-insights');

      setInsights(response.data?.data || null);
    } catch (e) {
      handleAIError(e);
    } finally {
      setInsightBusy(false);
    }
  }

  async function generateReportSummary() {
    setReportBusy(true);
    clearErrors();
    setNotice('');

    try {
      const response = await api.post(
        '/ai/reports/summarize'
      );

      setReportSummary(response.data?.data || null);
    } catch (e) {
      handleAIError(e);
    } finally {
      setReportBusy(false);
    }
  }

  async function deleteConversation(event, id) {
    event.stopPropagation();

    if (
      !window.confirm(
        'Delete this AI conversation and its stored messages?'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/ai/conversations/${id}`);

      setConversations(items =>
        items.filter(
          item => String(item._id) !== String(id)
        )
      );

      if (String(conversationId) === String(id)) {
        newConversation();
      }
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Conversation could not be deleted.'
      );
    }
  }

  if (loading) return <Loading />;

  const cooldownSeconds = Number(
    status?.cooldownSeconds || 0
  );

  const aiAvailable =
    Boolean(status?.configured) &&
    status?.available !== false;

  return (
    <div className="ai-page">
      <PageHeader
        eyebrow="SECURETRACK INTELLIGENCE"
        title="AI Security Copilot"
        subtitle="Ask questions about your authorized monitoring data and turn findings into reviewable next steps."
        action={
          <button
            className="btn secondary"
            onClick={loadInitial}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      {aiError && (
        <div
          className="ai-alert error"
          role="alert"
        >
          <AlertCircle size={19} />

          <div className="ai-error-copy">
            <strong>{aiError.title}</strong>

            <span>{aiError.message}</span>

            <small>{aiError.detail}</small>

            {aiError.quota && (
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Open Google AI Studio
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          <button
            type="button"
            className="btn secondary small"
            onClick={() => setAiError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          className="ai-alert error"
          role="alert"
        >
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div
          className="ai-alert success"
          role="status"
        >
          <CheckCircle2 size={17} />
          <span>{notice}</span>
        </div>
      )}

      <div className="ai-status-row">
        <span
          className={`ai-status-dot ${
            aiAvailable ? 'ready' : 'offline'
          }`}
        />

        <div>
          <b>
            {!status?.configured
              ? 'AI provider not configured'
              : aiAvailable
                ? 'AI provider configured'
                : 'AI temporarily unavailable'}
          </b>

          <span>
            {status?.configured
              ? `Provider: ${status.provider} · Model: ${status.model}${
                  cooldownSeconds > 0
                    ? ` · Retry in ${cooldownSeconds}s`
                    : ''
                }`
              : 'Add GEMINI_API_KEY to the backend Render environment to enable live AI responses.'}
          </span>
        </div>

        <span className="ai-privacy-note">
          <ShieldAlert size={15} />
          Workspace-scoped context
        </span>
      </div>

      <div className="ai-usage-strip">
        <div>
          <span>AI requests · 30 days</span>
          <b>{usage?.requests ?? '—'}</b>
        </div>

        <div>
          <span>Prompt tokens</span>
          <b>
            {Number(
              usage?.promptTokens || 0
            ).toLocaleString()}
          </b>
        </div>

        <div>
          <span>Response tokens</span>
          <b>
            {Number(
              usage?.completionTokens || 0
            ).toLocaleString()}
          </b>
        </div>

        <div className="ai-usage-caption">
          Usage reflects recorded AI calls for your account.
        </div>
      </div>

      <div className="ai-workspace">
        <aside className="ai-history panel">
          <div className="ai-history-head">
            <div>
              <h3>Conversations</h3>
              <p>Private to your account</p>
            </div>

            <button
              className="btn primary small"
              onClick={newConversation}
            >
              <Plus size={15} />
              New
            </button>
          </div>

          {conversations.length ? (
            <div className="ai-conversation-list">
              {conversations.map(item => (
                <button
                  key={item._id}
                  className={`ai-conversation ${
                    String(item._id) ===
                    String(conversationId)
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    openConversation(item._id)
                  }
                >
                  <MessageSquare size={16} />

                  <span>
                    <b>
                      {item.title ||
                        'Security conversation'}
                    </b>

                    <small>
                      {new Date(
                        item.lastMessageAt ||
                        item.updatedAt
                      ).toLocaleDateString()}
                    </small>
                  </span>

                  <span
                    role="button"
                    tabIndex={0}
                    className="ai-delete"
                    aria-label="Delete conversation"
                    onClick={e =>
                      deleteConversation(e, item._id)
                    }
                    onKeyDown={e =>
                      e.key === 'Enter' &&
                      deleteConversation(e, item._id)
                    }
                  >
                    <Trash2 size={14} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="No conversations yet"
              text="Start a conversation using a suggested question."
            />
          )}

          <div className="ai-history-foot">
            <LockIcon />
            Your messages are stored in your SecureTrack database.
          </div>
        </aside>

        <section
          className="ai-chat panel"
          aria-label="AI Copilot chat"
        >
          <div className="ai-chat-head">
            <span className="ai-bot-avatar">
              <Bot size={21} />
            </span>

            <div>
              <h3>
                {currentConversation?.title ||
                  'Security assistant'}
              </h3>

              <p>
                Evidence-grounded defensive guidance · Human review required
              </p>
            </div>

            <span className="ai-model-pill">
              <Sparkles size={13} />
              AI
            </span>
          </div>

          <div
            className="ai-messages"
            aria-live="polite"
          >
            {!messages.length ? (
              <div className="ai-welcome">
                <span className="ai-welcome-icon">
                  <Sparkles size={25} />
                </span>

                <h2>
                  Make your security data actionable.
                </h2>

                <p>
                  Ask about stored findings, completed scans,
                  monitored websites, and remediation tasks.
                  The assistant may be wrong—verify recommendations
                  against evidence.
                </p>

                <div className="ai-suggestions">
                  {SUGGESTIONS.map(item => (
                    <button
                      key={item}
                      onClick={() => setMessage(item)}
                    >
                      {item}
                      <ExternalLink size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(item => (
                <article
                  className={`ai-message ${
                    item.role === 'user'
                      ? 'user'
                      : 'assistant'
                  }`}
                  key={item._id}
                >
                  <span className="ai-message-avatar">
                    {item.role === 'user'
                      ? 'You'
                      : <Bot size={17} />}
                  </span>

                  <div className="ai-message-body">
                    <div className="ai-message-label">
                      {item.role === 'user'
                        ? 'You'
                        : 'SecureTrack AI'}

                      <span>
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="ai-message-content">
                      {item.content}
                    </div>

                    {item.sources?.length > 0 && (
                      <div className="ai-sources">
                        <b>Related workspace records</b>

                        {item.sources
                          .slice(0, 6)
                          .map(source => (
                            <a
                              key={`${source.type}-${source.id}`}
                              href={source.url}
                            >
                              {source.title}
                              <span>{source.type}</span>
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}

            {sending && (
              <div className="ai-thinking">
                <LoaderCircle
                  size={17}
                  className="ai-spin"
                />
                Checking authorized records and generating a response…
              </div>
            )}
          </div>

          <form
            className="ai-composer"
            onSubmit={submit}
          >
            <label
              className="sr-only"
              htmlFor="ai-message"
            >
              Ask SecureTrack AI
            </label>

            <textarea
              id="ai-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ask about findings, scan results, risk, or remediation…"
              maxLength={4000}
              rows={3}
              disabled={sending}
            />

            <div className="ai-composer-bottom">
              <span>
                {message.length}/4000 · AI output should be verified
              </span>

              <button
                className="btn primary"
                disabled={!message.trim() || sending}
              >
                <Send size={15} />
                {sending ? 'Thinking…' : 'Send'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="ai-advanced-grid">
        <section className="panel ai-analysis-panel">
          <div className="ai-analysis-heading">
            <div>
              <span className="ai-section-icon">
                <Sparkles size={18} />
              </span>

              <div>
                <h3>AI Risk Insights</h3>
                <p>
                  Prioritized defensive recommendations from stored records.
                </p>
              </div>
            </div>

            <button
              className="btn secondary small"
              onClick={generateInsights}
              disabled={insightBusy || !aiAvailable}
            >
              {insightBusy
                ? 'Analyzing…'
                : 'Generate insights'}
            </button>
          </div>

          {insights ? (
            <div className="ai-analysis-result">
              <div className="ai-analysis-meta">
                <span>Model: {insights.model}</span>

                <button
                  className="btn secondary small"
                  onClick={() => setInsights(null)}
                >
                  Close
                </button>
              </div>

              <pre>{insights.insights}</pre>

              <p className="ai-disclaimer">
                {insights.metrics?.note ||
                  'Recommendations are advisory. Verify the source records before acting.'}
              </p>
            </div>
          ) : (
            <p className="ai-analysis-empty">
              Generate a prioritized review of recent findings,
              scan states, and remediation work. The result
              includes context-scope limitations.
            </p>
          )}
        </section>

        <section className="panel ai-analysis-panel">
          <div className="ai-analysis-heading">
            <div>
              <span className="ai-section-icon report">
                <MessageSquare size={18} />
              </span>

              <div>
                <h3>Executive Report Draft</h3>
                <p>
                  AI-written narrative based on computed account metrics.
                </p>
              </div>
            </div>

            <button
              className="btn secondary small"
              onClick={generateReportSummary}
              disabled={reportBusy || !aiAvailable}
            >
              {reportBusy ? 'Drafting…' : 'Draft report'}
            </button>
          </div>

          {reportSummary ? (
            <div className="ai-analysis-result">
              <div className="ai-analysis-meta">
                <span>Model: {reportSummary.model}</span>

                <button
                  className="btn secondary small"
                  onClick={() => setReportSummary(null)}
                >
                  Close
                </button>
              </div>

              <pre>{reportSummary.summary}</pre>

              <p className="ai-disclaimer">
                {reportSummary.metrics?.limitation ||
                  'AI-generated report draft; review before sharing.'}
              </p>
            </div>
          ) : (
            <p className="ai-analysis-empty">
              Create an executive summary of recent security
              posture data. This drafts narrative text only
              and does not replace a verified report export.
            </p>
          )}
        </section>
      </div>

      <section className="panel ai-analysis-panel">
        <div className="ai-analysis-heading">
          <div>
            <span className="ai-section-icon">
              <ShieldAlert size={18} />
            </span>

            <div>
              <h3>Finding Intelligence</h3>
              <p>
                Generate remediation guidance for a specific stored finding.
              </p>
            </div>
          </div>

          <select
            aria-label="Select a finding to analyze"
            defaultValue=""
            onChange={analyzeFinding}
            disabled={
              Boolean(analyzingId) ||
              !findings.length ||
              !aiAvailable
            }
          >
            <option value="">Choose a finding…</option>

            {findings.map(f => (
              <option
                key={f._id}
                value={f._id}
              >
                {f.severity?.toUpperCase()} · {f.title}
              </option>
            ))}
          </select>
        </div>

        {analyzingId && (
          <div className="ai-thinking">
            <LoaderCircle
              size={17}
              className="ai-spin"
            />
            Analyzing finding evidence…
          </div>
        )}

        {analysis && (
          <div className="ai-analysis-result">
            <div className="ai-analysis-meta">
              <span className="badge">
                {analysis.evidence?.severity || 'Finding'}
              </span>

              <span>Model: {analysis.model}</span>

              <button
                className="btn secondary small"
                onClick={() => setAnalysis(null)}
              >
                Close
              </button>
            </div>

            <pre>{analysis.analysis}</pre>

            <p className="ai-disclaimer">
              AI-generated guidance is advisory. Confirm the
              evidence and test any remediation safely before deployment.
            </p>
          </div>
        )}

        {!analysis && !analyzingId && (
          <p className="ai-analysis-empty">
            Select a finding to generate an evidence-based
            explanation, remediation steps, verification checklist,
            and limitations.
          </p>
        )}
      </section>
    </div>
  );
}

function LockIcon() {
  return (
    <span className="ai-lock-mark">
      <ShieldAlert size={14} />
    </span>
  );
}
