const logger = require('../utils/logger');

/**
 * Supported AI providers.
 */
const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
};

/**
 * Default model configurations per provider.
 */
const DEFAULT_MODELS = {
  [AI_PROVIDERS.OPENAI]: {
    default: 'gpt-4o',
    fast: 'gpt-4o-mini',
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    default: 'claude-sonnet-4-20250514',
    fast: 'claude-haiku-3-5-20241022',
  },
};

/**
 * Resolve which provider and model to use based on env vars.
 */
function resolveProvider() {
  const provider = (process.env.AI_PROVIDER || AI_PROVIDERS.OPENAI).toLowerCase();

  if (provider === AI_PROVIDERS.ANTHROPIC) {
    return {
      provider: AI_PROVIDERS.ANTHROPIC,
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      models: DEFAULT_MODELS[AI_PROVIDERS.ANTHROPIC],
    };
  }

  // Default to OpenAI-compatible
  return {
    provider: AI_PROVIDERS.OPENAI,
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    models: DEFAULT_MODELS[AI_PROVIDERS.OPENAI],
  };
}

/**
 * Build the request body for OpenAI-compatible chat completions API.
 * @param {Array} messages - Array of message objects {role, content}.
 * @param {Object} options - Generation options.
 * @returns {Object} Request body for fetch.
 */
function buildRequestBody(messages, options = {}) {
  const config = resolveProvider();

  const body = {
    model: options.model || config.models.default,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens || 4096,
    stream: options.stream || false,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
    body.tool_choice = options.toolChoice || 'auto';
  }

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  return body;
}

/**
 * Core function to call the AI API.
 *
 * @param {Array} messages - Array of message objects [{role, content}].
 * @param {Object} options - Call options.
 * @param {boolean} [options.stream=false] - Return a ReadableStream instead of full response.
 * @param {number} [options.maxTokens] - Max tokens.
 * @param {number} [options.temperature] - Temperature.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function callAI(messages, options = {}) {
  const config = resolveProvider();

  if (!config.apiKey) {
    return {
      success: false,
      error: `AI API key not configured. Set ${
        config.provider === AI_PROVIDERS.ANTHROPIC ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'
      } environment variable.`,
    };
  }

  const body = buildRequestBody(messages, options);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.provider === AI_PROVIDERS.ANTHROPIC) {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const endpoint =
    config.provider === AI_PROVIDERS.ANTHROPIC
      ? `${config.baseUrl}/v1/messages`
      : `${config.baseUrl}/chat/completions`;

  if (logger && logger.debug) {
    logger.debug(`Calling AI (${config.provider}) with model ${body.model}`);
  }

  try {
    const fetchOptions = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    };

    if (options.stream) {
      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `AI API error (${response.status}): ${errorText}` };
      }

      return { success: true, data: response.body, stream: true };
    }

    const response = await fetch(endpoint, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `AI API error (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    // Normalize response across providers
    if (config.provider === AI_PROVIDERS.ANTHROPIC) {
      const content = data.content?.[0]?.text || '';
      return { success: true, data: content };
    }

    const content = data.choices?.[0]?.message?.content || '';
    return { success: true, data: content };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Request was cancelled.' };
    }
    if (logger && logger.error) {
      logger.error(`AI API call failed: ${err.message}`);
    }
    return { success: false, error: `AI API request failed: ${err.message}` };
  }
}

/**
 * Convenience wrapper to stream AI responses and yield SSE chunks.
 * Works as an async generator.
 *
 * @param {Array} messages - Chat messages.
 * @param {Object} options - Same as callAI options.
 * @yields {string} SSE data chunks.
 */
async function* streamAI(messages, options = {}) {
  const result = await callAI(messages, { ...options, stream: true });
  if (!result.success || !result.stream) {
    yield '';
    return;
  }

  const reader = result.data.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') return;

        try {
          const parsed = JSON.parse(dataStr);
          const delta =
            parsed.choices?.[0]?.delta?.content ||
            parsed.delta?.text ||
            '';

          if (delta) {
            yield delta;
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Generate a completion for a single prompt (convenience wrapper).
 * @param {string} prompt - User prompt.
 * @param {string} systemPrompt - System instructions.
 * @param {Object} options - Same as callAI options.
 * @returns {Promise<string>} The generated text.
 */
async function generateCompletion(prompt, systemPrompt = '', options = {}) {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const result = await callAI(messages, options);
  return result.data || '';
}

module.exports = { callAI, streamAI, generateCompletion, AI_PROVIDERS, resolveProvider };
