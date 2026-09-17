import OpenAI from "openai";

const ALLOWED_TEAMS = [
  "Support Team",
  "Backend Team",
  "RMA Team",
  "Product / Hardware Team",
  "Customer Feedback",
  "Unclear",
];

const ALLOWED_SENTIMENTS = [
  "Positive",
  "Negative",
  "Neutral",
  "Mixed",
];

let openaiClient = null;

function getOpenAIClient() {
  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "OPENAI_API_KEY is not configured on the backend."
    );

    error.statusCode = 500;
    throw error;
  }

  if (!openaiClient) {
    openaiClient =
      new OpenAI({
        apiKey,
      });
  }

  return openaiClient;
}

function cleanText(
  value,
  maxLength = 6000
) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeBoolean(
  value
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  return [
    "true",
    "yes",
    "1",
    "solved",
    "closed",
    "resolved",
  ].includes(normalized);
}

function validateInput({
  ticketId,
  rating,
  comment,
  reason,
  solved,
  internalNote,
  externalTeamNote,
}) {
  const cleanComment =
    cleanText(comment);

  const cleanReason =
    cleanText(reason);

  const cleanInternalNote =
    cleanText(internalNote);

  const cleanExternalTeamNote =
    cleanText(externalTeamNote);

  if (
    !cleanComment &&
    !cleanReason &&
    !cleanInternalNote &&
    !cleanExternalTeamNote
  ) {
    const error = new Error(
      "No customer feedback or team-note context is available for AI analysis."
    );

    error.statusCode = 400;
    throw error;
  }

  return {
    ticketId:
      cleanText(
        ticketId,
        200
      ) || "Unknown",

    rating:
      cleanText(
        rating,
        100
      ) || "Unknown",

    comment:
      cleanComment ||
      "No comment provided.",

    reason:
      cleanReason ||
      "No reason provided.",

    solved:
      normalizeBoolean(
        solved
      ),

    internalNote:
      cleanInternalNote ||
      "No internal note provided.",

    externalTeamNote:
      cleanExternalTeamNote ||
      "No external team note provided.",
  };
}

function normalizeResult(
  result
) {
  const team =
    ALLOWED_TEAMS.includes(
      result?.team
    )
      ? result.team
      : "Unclear";

  const sentiment =
    ALLOWED_SENTIMENTS.includes(
      result?.sentiment
    )
      ? result.sentiment
      : "Neutral";

  let confidence =
    Number(
      result?.confidence
    );

  if (
    !Number.isFinite(
      confidence
    )
  ) {
    confidence = 0;
  }

  confidence =
    Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );

  return {
    team,

    summary:
      cleanText(
        result?.summary,
        800
      ) ||
      "No summary was returned.",

    sentiment,

    confidence,

    explanation:
      cleanText(
        result?.explanation,
        1200
      ) ||
      "No explanation was returned.",

    recommendedAction:
      cleanText(
        result?.recommendedAction,
        800
      ) ||
      "Review the satisfaction response manually.",

    evidence:
      Array.isArray(
        result?.evidence
      )
        ? result.evidence
            .map((item) =>
              cleanText(
                item,
                300
              )
            )
            .filter(Boolean)
            .slice(0, 5)
        : [],
  };
}

export async function analyzeSatisfactionWithAI(
  input
) {
  const data =
    validateInput(input);

  const client =
    getOpenAIClient();

  const model =
    process.env.OPENAI_MODEL ||
    "gpt-4.1-mini";

  const response =
    await client.responses.create({
      model,

      instructions: `
You analyze customer satisfaction feedback for Angelbird technical support operations.

Classify which team should primarily review or own the feedback.

Allowed team values:
- Support Team
- Backend Team
- RMA Team
- Product / Hardware Team
- Customer Feedback
- Unclear

Classification guidance:
- Support Team: agent communication, response speed, troubleshooting guidance, follow-up, service quality, unanswered messages.
- Backend Team: account systems, portal, API, database, login, activation, software platform, internal system or synchronization failures.
- RMA Team: warranty, replacement, return, exchange, defective-unit replacement process, RMA delays.
- Product / Hardware Team: product defects, compatibility, physical hardware, SSD, storage cards, readers, cables, firmware or device behavior.
- Customer Feedback: general praise, thanks, broad satisfaction or dissatisfaction without an identifiable operational owner.
- Unclear: insufficient evidence.

Use every available source of context, while keeping the sources distinct:
- Customer feedback/comment
- Customer reason, if present
- Internal team note
- External team note
- Rating and solved status

If only one source is present, analyze only that source.
If two or three text sources are present, synthesize them together and note meaningful agreement or conflict.
Treat customer feedback as the customer's perspective, Internal Note as internal operational context, and External Team Note as third-party/team response context.
Do not invent facts that are not present in the provided context.

The summary must be concise, operational, and represent the combined available context.
The explanation must state why the selected team was chosen.
The evidence array must quote or paraphrase only the most relevant short clues from the provided text.
Confidence must be a number from 0 to 1.
      `.trim(),

      input: `
Ticket ID: ${data.ticketId}
Rating: ${data.rating}
Solved: ${data.solved ? "Yes" : "No"}

Customer comment:
${data.comment}

Customer reason:
${data.reason}

Internal team note:
${data.internalNote}

External team note:
${data.externalTeamNote}
      `.trim(),

      text: {
        format: {
          type: "json_schema",

          name:
            "satisfaction_ai_analysis",

          strict: true,

          schema: {
            type: "object",

            additionalProperties:
              false,

            properties: {
              team: {
                type: "string",

                enum:
                  ALLOWED_TEAMS,
              },

              summary: {
                type: "string",
              },

              sentiment: {
                type: "string",

                enum:
                  ALLOWED_SENTIMENTS,
              },

              confidence: {
                type: "number",

                minimum: 0,
                maximum: 1,
              },

              explanation: {
                type: "string",
              },

              recommendedAction: {
                type: "string",
              },

              evidence: {
                type: "array",

                items: {
                  type: "string",
                },

                maxItems: 5,
              },
            },

            required: [
              "team",
              "summary",
              "sentiment",
              "confidence",
              "explanation",
              "recommendedAction",
              "evidence",
            ],
          },
        },
      },
    });

  const outputText =
    response.output_text;

  if (!outputText) {
    const error = new Error(
      "AI returned an empty response."
    );

    error.statusCode = 502;
    throw error;
  }

  let parsed;

  try {
    parsed =
      JSON.parse(
        outputText
      );
  } catch {
    const error = new Error(
      "AI returned an invalid structured response."
    );

    error.statusCode = 502;
    throw error;
  }

  return {
    ...normalizeResult(
      parsed
    ),

    model,

    responseId:
      response.id,

    analyzedAt:
      new Date().toISOString(),
  };
}