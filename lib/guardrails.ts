const NAMAN_KEYWORDS = [
  "naman", "singh", "you", "your", "he", "his", "him",
  "resume", "cv", "experience", "work", "job", "career",
  "project", "built", "build", "created", "developed",
  "skill", "tech", "stack", "language", "framework", "tool",
  "education", "degree", "university", "college", "gpa", "stevens", "ggsipu",
  "internship", "product manager", "business analyst", "research",
  "achievement", "award", "leadership", "president", "club",
  "contact", "email", "linkedin", "github", "reach", "hire",
  "startupHub", "flight", "airbnb", "career explorer",
  "langchain", "rag", "python", "sql", "tableau", "supabase",
  "anthropic", "claude", "openai", "voyage", "machine learning",
  "blinkit", "buncha", "isource", "stevens", "nyc", "dep",
];

const BLOCK_PATTERNS = [
  /write (me )?(a |an )?(code|program|script|function|app)/i,
  /how (do|does|to) (make|create|build) (a |an )?(?!naman)/i,
  /what is (the meaning of|life|love|god)/i,
  /politics|election|war|religion|covid|crypto|bitcoin/i,
  /tell me a joke|write a poem|write a story/i,
  /weather|news|sports|stock|price of/i,
];

export function isOnTopic(query: string): boolean {
  const lower = query.toLowerCase();

  // Block obvious off-topic patterns first
  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.test(lower)) return false;
  }

  // Allow if any Naman-related keyword is present
  for (const keyword of NAMAN_KEYWORDS) {
    if (lower.includes(keyword)) return true;
  }

  // Short greetings are fine
  if (lower.length < 30 && /^(hi|hello|hey|what|who|tell|show|how|does|did|is|can|where|when)/.test(lower)) {
    return true;
  }

  return false;
}

export const OFF_TOPIC_RESPONSE =
  "I'm NamanGPT — I can only answer questions about Naman Singh: his experience, projects, skills, education, and background. Try asking something like *\"What has Naman built?\"* or *\"What is Naman's tech stack?\"*";
