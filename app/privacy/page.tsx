import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — NamanGPT",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-indigo-500 hover:underline">
          ← Back to NamanGPT
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: July 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">1. What We Collect</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            When you use NamanGPT, your chat messages are sent to Anthropic&apos;s
            Claude API to generate responses. We do not store your messages on
            our servers. Conversation history is stored locally in your
            browser&apos;s localStorage only.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">2. Third-Party Services</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            This app uses Anthropic Claude API for AI responses and Voyage AI
            for semantic search. Your messages may be processed by these
            services. Please refer to their respective privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">3. Cookies</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            We do not use cookies. localStorage is used only to save your
            conversation history locally on your device.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">4. Contact</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            For any privacy concerns, contact Naman Singh at{" "}
            <a
              href="mailto:naman.singhms@gmail.com"
              className="text-indigo-500 hover:underline"
            >
              naman.singhms@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
