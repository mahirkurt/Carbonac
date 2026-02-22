const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_QA_MODEL = process.env.GEMINI_QA_MODEL || process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models';

const MAX_ISSUES = 50;

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1];
  }
  const raw = text.match(/\{[\s\S]*\}/);
  return raw ? raw[0] : null;
}

export async function reviewQaIssues({ issues = [] } = {}) {
  if (!GEMINI_API_KEY || !issues.length) {
    return null;
  }

  const payload = {
    issues: issues.slice(0, MAX_ISSUES),
  };

  const prompt = `You are a PDF QA reviewer for a print report using IBM Carbon Design System.
Return JSON only with this schema:
{
  "summary": "Short executive summary.",
  "severity": "low|medium|high",
  "notes": ["Short note 1", "Short note 2"],
  "layoutSuggestions": ["Use narrower columns for data sections", "Add pattern blocks between sections"]
}
layoutSuggestions: actionable layout improvements for the art director (max 3).
Be concise and practical.`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `${prompt}\n\nIssues:\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(`${GEMINI_API_URL}/${GEMINI_QA_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini QA error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonText = extractJson(text);
  if (!jsonText) {
    return null;
  }

  return JSON.parse(jsonText);
}
