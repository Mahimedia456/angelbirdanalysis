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
            .slice(0, 8)
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
You analyze customer satisfaction feedback for Angelbird support operations.

Your job is to produce ONE reconciled operational analysis from ALL context that is actually available for the ticket.

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

SOURCE ROLES:
- Customer comment/reason = the customer's experience and perception.
- Internal team note = Angelbird's internal operational handling/status.
- External team note = external or cross-team handling/status.
- Rating and solved status = supporting metadata, not a replacement for the text sources.

MANDATORY CONTEXT-COMBINATION RULES:
1. Use EVERY available text source. Never base the final answer only on the customer comment when an internal or external note is available.
2. Keep perspectives distinct. Do not rewrite an internal/external note as if the customer said it.
3. If sources conflict, explicitly reconcile the conflict. Example: customer reports no response while an internal note says the case was forwarded or solved. The analysis must describe this as a communication/status mismatch instead of simply assuming nothing was done.
4. Operational notes are evidence of internal handling, but they do not invalidate the customer's reported experience.
5. Do not assume an issue is still unresolved if an internal/external note says it was handled, forwarded, closed, or solved. Instead identify what may still be missing, such as customer-facing communication, confirmation, or closure.
6. Do not invent missing context. A source marked NOT PROVIDED must be ignored as evidence.
7. The summary MUST reflect all available text sources and any important agreement/conflict between them.
8. The explanation MUST explain the classification using the combined context, not just one source.
9. The recommended action MUST be consistent with both the customer perspective and the latest operational context. Avoid generic actions that contradict an existing internal/external resolution step.
10. The evidence array MUST include at least one short evidence item from EACH available text source. It may also include rating/solved status when useful.
11. If customer feedback and internal/external notes describe different states, emphasize the gap between operational handling and customer-visible outcome.
12. Confidence must be a number from 0 to 1.

For a case such as:
- customer: "There hasn't been a response at all?"
- internal note: "Forwarded to sales/marketing and submitted as solved"
the correct synthesis is NOT merely "support failed to respond."
It should explain that the ticket was internally routed/closed, while the customer still experienced no visible response, indicating a communication or closure-confirmation gap.
      `.trim(),

      input: `
Ticket ID: ${data.ticketId}
Rating: ${data.rating}
Solved: ${data.solved ? "Yes" : "No"}

AVAILABLE CONTEXT SOURCES

Customer comment:
${cleanText(input?.comment) || "[NOT PROVIDED]"}

Customer reason:
${cleanText(input?.reason) || "[NOT PROVIDED]"}

Internal team note:
${cleanText(input?.internalNote) || "[NOT PROVIDED]"}

External team note:
${cleanText(input?.externalTeamNote) || "[NOT PROVIDED]"}

Important: Ignore every [NOT PROVIDED] source. Reconcile every source that contains real text before producing summary, classification explanation, recommended action, and evidence.
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

                maxItems: 8,
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