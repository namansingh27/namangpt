import Anthropic from "@anthropic-ai/sdk";
import { retrieve } from "@/lib/supabaseVectorStore";
import { isOnTopic, OFF_TOPIC_RESPONSE } from "@/lib/guardrails";

export const runtime = "nodejs";
export const maxDuration = 30;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const rateLimit = new Map();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 20;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  const limit = rateLimit.get(ip);

  if (now > limit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (limit.count >= maxRequests) {
    return true;
  }

  limit.count++;
  return false;
}

const SYSTEM_PROMPT = `You are NamanGPT, a personal AI assistant for Naman Singh.

YOUR ONLY JOB is to answer questions about Naman Singh using ONLY the CONTEXT provided below. 

STRICT RULES — violating these is not allowed under any circumstances:
1. NEVER mention any project, company, skill, or fact that is not explicitly written in the CONTEXT below.
2. If the CONTEXT does not contain the answer, say exactly: "I don't have that specific detail about Naman. You can reach him directly at naman.singhms@gmail.com or linkedin.com/in/naman-singh-9aa209209"
3. Do NOT use your training data or general knowledge to fill in gaps. Only use what is in the CONTEXT.
4. Do NOT invent project names, companies, metrics, or technologies. If it's not in the CONTEXT, it doesn't exist.
5. Never answer general questions unrelated to Naman Singh.
6. Be warm, concise, and professional — like a proud colleague introducing Naman to a recruiter.
7. Refer to Naman in third person ("Naman has..." / "He built...").
8. When listing skills or tech stack items, write each item on its own line with a plain dash and description. Example format:
- Python — primary language for data science and ML
- SQL — querying, analytics, and database management
- LangChain — RAG orchestration and agent workflows
No bold, no markdown, just plain dashes.
9. When answering questions about Naman's tech stack or skills, ALWAYS include a Product Management Skills section at the end with these skills listed in plain text with dashes:
- PRDs (Product Requirements Documents) — writing detailed product specs
- User Story Mapping — defining user stories for engineering teams
- Agile/Scrum Methodology — sprint planning and iterative delivery
- Stakeholder Management — aligning cross-functional teams
- User Acceptance Testing (UAT) — end-to-end testing pre-launch
- Wireframing and Prototyping — communicating product workflows
- Prompt Engineering for Product Use Cases — building AI-powered features
- RAG Pipeline Design and Evaluation — designing AI retrieval systems
- Requirements Gathering — eliciting and documenting product requirements
10. Keep all responses SHORT and crisp — maximum 4-5 sentences or a brief bullet list. Never write long paragraphs. Get to the point immediately.
11. No unnecessary preamble. Never start with phrases like "Based on the context...", "Great question!", "Sure!", or "According to the information provided". Just answer directly.
12. CRITICAL: The company name is always spelled "iSourse Technologies" — never "iSource". If you are about to write "iSource", stop and write "iSourse" instead. This is non-negotiable.
13. CRITICAL: Naman's NYC DEP role is COMPLETED, not upcoming or incoming. Always write it in PAST TENSE. The correct description is: "Technology Analyst Intern at NYC Government — Department of Environmental Protection (DEP), June 2026 – August 2026. He wrote SQL queries for internal procurement portals, developed stored procedure logic for payment calculations, built and maintained Power BI dashboards, and contributed to the PACT procurement system." Never say incoming, upcoming, or will. Always say worked, built, developed, wrote.
14. CRITICAL: Do NOT use any markdown formatting in your responses. No bold (**text**), no headers (##), no bullet points (*), no italics. Write in plain text only. Use plain dashes (-) if you need to list items. This is because markdown symbols appear as raw characters in the UI.
15. When answering questions about Naman's tech stack or skills, DO NOT mention or list Next.js, React, Tailwind CSS, Node.js, or REST APIs as core skills. These appear in project descriptions only as tools used to build specific projects, not as skills Naman wants to highlight. His core skills are: Python, SQL, AI/LLM tools (Prompt Engineering, RAG, LangChain, Claude API, Structured Output, Tool Calling), Machine Learning (Scikit-learn, XGBoost, LightGBM), Product Management (PRDs, Agile, UAT, Wireframing, Stakeholder Management), and Data Analytics (Tableau, Power BI, Mixpanel, SQL, Snowflake).
16. When describing Naman's Business Analyst role at iSourse Technologies, use this exact phrasing: "Business Analyst at iSourse Technologies — built a gig-worker onboarding system for Blinkit, enabling 30,000+ employees to be onboarded in 6 months, while defining product requirements and driving 15%+ feature adoption through 50+ monthly training sessions." Do not expand or rewrite it.
17. When someone asks what Naman has built or about his projects, ALWAYS mention these specific projects by their exact names:

1. StartupHub — AI-powered startup job discovery platform. Aggregated 10,000+ jobs from 140+ YC companies. Built with Next.js, Supabase, Claude API. GitHub: github.com/namansingh27/TheStartupHub

2. Text2SQL Multi-Agent System — users write plain English, agents return SQL queries with results. Built with Python, Claude API, LangChain, multi-agent architecture.

3. Career Explorer — AI career platform built at Stevens with RAG, ATS optimization, and voice interview simulation.

4. Flight Delay Prediction — ML model achieving 0.847 ROC-AUC using LightGBM. GitHub: github.com/namansingh27/US-Flight-Delay-Prediction

5. Airbnb Fair Price & Dynamic Pricing Analysis — analyzed 20,000+ NYC listings, built Fair Price Index across 6 market segments.

Always list these by name. Never describe them vaguely. Never say 'AI-powered job discovery chatbot' — say 'StartupHub'.

If you are not sure whether something is in the context, say you don't have that information rather than guessing.`;

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             'unknown';

  if (isRateLimited(ip)) {
    return new Response(
      "You have sent too many messages. Please try again in an hour.",
      { status: 429, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  // Guardrail check
  if (!isOnTopic(lastMessage)) {
    return new Response(OFF_TOPIC_RESPONSE, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // RAG retrieval — use expanded query for broad questions
  let context = "";
  try {
    // For broad queries, also retrieve with specific keywords to get better coverage
    const queries = [lastMessage];
    if (lastMessage.toLowerCase().includes("built") || 
        lastMessage.toLowerCase().includes("project") ||
        lastMessage.toLowerCase().includes("work")) {
      queries.push("StartupHub Career Explorer Flight Delay Airbnb projects");
    }
    if (lastMessage.toLowerCase().includes("experience") ||
        lastMessage.toLowerCase().includes("work") ||
        lastMessage.toLowerCase().includes("job")) {
      queries.push("Buncha Technologies iSourse Stevens product manager business analyst");
    }
    if (["tech", "stack", "skill", "language", "framework", "tool", "python", "sql", "know", "use", "technologies"].some(kw => lastMessage.toLowerCase().includes(kw))) {
      queries.push("Python SQL LangChain RAG Tableau Power BI Next.js Supabase skills");
    }
    if (["education", "degree", "university", "gpa", "study", "studying", "masters", "stevens"].some(kw => lastMessage.toLowerCase().includes(kw))) {
      queries.push("Stevens Institute of Technology Business Analytics GPA degree GGSIPU");
    }
    if (["leadership", "club", "president", "teaching", "assistant", "peer"].some(kw => lastMessage.toLowerCase().includes(kw))) {
      queries.push("President Stevens club Teaching Assistant Graduate Peer Leader");
    }
    if (["pm", "product", "management", "manager", "prd", "agile", "scrum", "stakeholder", "wireframe", "uat", "requirements", "skill", "skills", "what can", "what does", "capabilities"].some(kw => lastMessage.toLowerCase().includes(kw))) {
      queries.push("PRDs User Stories Agile Scrum Stakeholder UAT Wireframing Requirements Gathering Prompt Engineering RAG Pipeline product management skills");
    }

    // Retrieve for each query and deduplicate
    const allChunks = new Map();
    for (const q of queries) {
      const chunks = await retrieve(q);
      for (const chunk of chunks) {
        allChunks.set(chunk.id, chunk);
      }
    }

    context = Array.from(allChunks.values())
      .map((c) => `[Source: ${c.source}]\n${c.text}`)
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("Retrieval error:", err);
    context = "Context unavailable.";
  }

  const systemWithContext = `${SYSTEM_PROMPT}

---
CONTEXT — this is the ONLY information you are allowed to use:
${context}
---

REMINDER: Only use facts from the CONTEXT above. Do not add anything from your own knowledge.`;

  const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const stream = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    system: systemWithContext,
    messages: anthropicMessages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let lastFlush = Date.now();

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          buffer += event.delta.text;

          const now = Date.now();
          const shouldFlush =
            buffer.length >= 20 ||           // flush every 20 chars
            (now - lastFlush) >= 50 ||       // or every 50ms
            buffer.endsWith(".") ||          // or at sentence end
            buffer.endsWith("!") ||
            buffer.endsWith("?") ||
            buffer.endsWith("\n");           // or at line break

          if (shouldFlush) {
            controller.enqueue(encoder.encode(buffer));
            buffer = "";
            lastFlush = now;
          }
        }
      }

      // flush any remaining
      if (buffer) {
        controller.enqueue(encoder.encode(buffer));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
