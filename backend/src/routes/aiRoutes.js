import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';

import Website from '../models/Website.js';
import Scan from '../models/Scan.js';
import Finding from '../models/Finding.js';
import RemediationTask from '../models/RemediationTask.js';
import AIConversation from '../models/AIConversation.js';
import AIMessage from '../models/AIMessage.js';
import AIUsage from '../models/AIUsage.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';

const router = Router();
const wrap = (fn) => asyncHandler(fn);

const DEFAULT_AI_MODEL = 'gemini-3.8-flash';
const MAX_MESSAGE_LENGTH = 4000;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

const modelName = () => String(
  process.env.AI_MODEL || DEFAULT_AI_MODEL
)
  .trim()
  .replace(/^models\//i, '');

function providerReady() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function httpError(message, status, code, extra = {}) {
  return Object.assign(new Error(message), {
    status,
    code,
    ...extra,
  });
}

function publicError(error, requestId) {
  return {
    success: false,
    code: error.code || 'AI_REQUEST_FAILED',
    message:
      error.publicMessage ||
      error.message ||
      'The AI service could not complete your request.',
    requestId,
    ...(error.providerCode
      ? { providerCode: error.providerCode }
      : {}),
    ...(error.retryAfter
      ? { retryAfter: error.retryAfter }
      : {}),
  };
}

function getRetryDelay(response, attempt) {
  const header = response?.headers?.get('retry-after');

  if (header) {
    const seconds = Number(header);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 10000);
    }

    const dateDelay = Date.parse(header) - Date.now();

    if (Number.isFinite(dateDelay) && dateDelay > 0) {
      return Math.min(dateDelay, 10000);
    }
  }

  return Math.min(1000 * (2 ** attempt), 4000);
}

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGemini(url, options) {
  const configuredTimeout =
    Number(process.env.AI_TIMEOUT_MS) || 30000;

  const timeoutMs = Math.min(
    Math.max(configuredTimeout, 5000),
    45000
  );

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (
        !RETRYABLE_STATUSES.has(response.status) ||
        attempt === maxRetries
      ) {
        return response;
      }

      const delay = getRetryDelay(response, attempt);

      if (
        response.body &&
        typeof response.body.cancel === 'function'
      ) {
        await response.body.cancel().catch(() => {});
      }

      await sleep(delay);
    } catch (error) {
      if (error?.name === 'AbortError') {
        if (attempt === maxRetries) {
          throw httpError(
            'The AI service took too long to respond. Please try again.',
            504,
            'AI_TIMEOUT'
          );
        }
      } else if (attempt === maxRetries) {
        console.error('[SecureTrack AI network error]', {
          name: error?.name,
          message: String(
            error?.message || 'Unknown network error'
          ).slice(0, 300),
        });

        throw httpError(
          'SecureTrack could not connect to the AI provider. Please try again later.',
          502,
          'AI_NETWORK_ERROR'
        );
      }

      await sleep(
        Math.min(1000 * (2 ** attempt), 4000)
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw httpError(
    'The AI provider could not complete this request.',
    502,
    'AI_PROVIDER_ERROR'
  );
}

function providerError(response, details, requestId) {
  const providerCode = String(
    details?.status || details?.code || ''
  );

  const providerMessage = String(
    details?.message || ''
  );

  const combined = `${providerCode} ${providerMessage}`;

  let status = 502;
  let code = 'AI_PROVIDER_ERROR';

  let message =
    'The AI provider could not complete this request. Please try again.';

  if (
    response.status === 429 ||
    /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(combined)
  ) {
    status = 429;
    code = 'AI_PROVIDER_RATE_LIMIT';

    message =
      'Gemini API quota or rate limit was reached. Check Google AI Studio usage and limits.';
  } else if ([401, 403].includes(response.status)) {
    status = 503;
    code = 'AI_PROVIDER_AUTH';

    message =
      'Gemini rejected the API key or the project does not have permission to use this API. Check GEMINI_API_KEY and Google project settings.';
  } else if (response.status === 404) {
    status = 503;
    code = 'AI_MODEL_NOT_FOUND';

    message =
      'The configured Gemini model was not found or is unavailable. Check AI_MODEL in Render.';
  } else if (response.status === 400) {
    status = 400;
    code = 'AI_PROVIDER_BAD_REQUEST';

    message =
      'Gemini rejected the request. Check the model configuration and request parameters.';
  } else if ([408, 504].includes(response.status)) {
    status = 504;
    code = 'AI_PROVIDER_TIMEOUT';

    message =
      'Gemini did not respond in time. Please try again.';
  }

  const error = httpError(message, status, code, {
    publicMessage: message,
    providerCode: providerCode.slice(0, 100) || undefined,
    retryAfter: response.headers
      .get('retry-after')
      ?.slice(0, 30),
  });

  console.error('[SecureTrack AI provider error]', {
    requestId,
    provider: 'gemini',
    httpStatus: response.status,
    code,
    providerCode: error.providerCode,
    message: providerMessage.slice(0, 500),
    retryAfter: error.retryAfter,
  });

  return error;
}

async function callModel({
  system,
  messages,
  maxTokens = 900,
  requestId,
}) {
  if (!providerReady()) {
    throw httpError(
      'AI is not configured. Set GEMINI_API_KEY in the Render backend environment.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }

  const model = modelName();

  if (!model) {
    throw httpError(
      'AI_MODEL is empty. Set a supported Gemini model in Render.',
      503,
      'AI_MODEL_NOT_CONFIGURED'
    );
  }

  const contents = messages
    .filter(
      (item) =>
        item &&
        ['user', 'assistant'].includes(item.role)
    )
    .map((item) => ({
      role:
        item.role === 'assistant'
          ? 'model'
          : 'user',
      parts: [
        {
          text: String(item.content ?? ''),
        },
      ],
    }))
    .filter((item) =>
      item.parts[0].text.trim()
    );

  if (!contents.length) {
    throw httpError(
      'A non-empty message is required.',
      400,
      'AI_EMPTY_PROMPT'
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetchGemini(url, {
    method: 'POST',

    headers: {
      'x-goog-api-key':
        process.env.GEMINI_API_KEY.trim(),

      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: String(
              system || 'You are SecureTrack AI.'
            ),
          },
        ],
      },

      contents,

      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    let payload = {};

    try {
      payload = await response.json();
    } catch {
      // Provider may return a non-JSON error response.
    }

    throw providerError(
      response,
      payload?.error || {},
      requestId
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw httpError(
      'Gemini returned an unreadable response.',
      502,
      'AI_INVALID_PROVIDER_RESPONSE'
    );
  }

  const candidate = data?.candidates?.[0];

  const content = (
    candidate?.content?.parts || []
  )
    .map((part) =>
      typeof part.text === 'string'
        ? part.text
        : ''
    )
    .join('')
    .trim();

  if (!content) {
    const finishReason = String(
      candidate?.finishReason || 'UNKNOWN'
    );

    console.error('[SecureTrack AI empty response]', {
      requestId,
      model,
      finishReason,
      blockReason:
        data?.promptFeedback?.blockReason || null,
    });

    throw httpError(
      finishReason === 'SAFETY'
        ? 'Gemini blocked this prompt under its safety rules. Please rephrase it.'
        : 'Gemini returned an empty response. Please try again.',
      502,
      finishReason === 'SAFETY'
        ? 'AI_PROMPT_BLOCKED'
        : 'AI_EMPTY_RESPONSE'
    );
  }

  return {
    content,
    model,

    promptTokens:
      Number(data?.usageMetadata?.promptTokenCount) || 0,

    completionTokens:
      Number(data?.usageMetadata?.candidatesTokenCount) || 0,
  };
}

async function buildContext(owner) {
  const [
    websites,
    findings,
    scans,
    tasks,
  ] = await Promise.all([
    Website.find({ owner })
      .select(
        'name url monitoringEnabled latestStatus lastCheckedAt'
      )
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean(),

    Finding.find({ owner })
      .select(
        'website title description severity status evidence remediation priority createdAt updatedAt'
      )
      .populate('website', 'name url')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),

    Scan.find({ owner })
      .select(
        'website status riskScore summary createdAt completedAt'
      )
      .populate('website', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),

    RemediationTask.find({ owner })
      .select(
        'website title status priority dueDate updatedAt'
      )
      .populate('website', 'name')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean(),
  ]);

  return {
    websites: websites.map((w) => ({
      id: String(w._id),
      name: w.name,
      url: w.url,
      monitoringEnabled: w.monitoringEnabled,
      latestStatus: w.latestStatus,
      lastCheckedAt: w.lastCheckedAt,
    })),

    findings: findings.map((f) => ({
      id: String(f._id),
      website: f.website?.name || 'Unknown website',
      title: f.title,
      description: f.description,
      severity: f.severity,
      status: f.status,
      priority: f.priority,
      evidence: f.evidence,
      remediation: f.remediation,
      updatedAt: f.updatedAt,
    })),

    scans: scans.map((s) => ({
      id: String(s._id),
      website: s.website?.name || 'Unknown website',
      status: s.status,
      riskScore: s.riskScore,
      summary: s.summary,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
    })),

    remediationTasks: tasks.map((t) => ({
      id: String(t._id),
      website: t.website?.name || 'Unknown website',
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      updatedAt: t.updatedAt,
    })),
  };
}

const chatSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),

  conversationId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional()
    .nullable(),
});

function sendAIError(res, error, requestId) {
  const status = Number.isInteger(error?.status)
    ? error.status
    : 502;

  return res
    .status(status)
    .json(publicError(error, requestId));
}