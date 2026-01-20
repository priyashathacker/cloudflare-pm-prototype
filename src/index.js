export default {
  async fetch(request, env) {
    const url = new URL(request.url);

if (url.pathname === "/") {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Feedback DJ</title>
  <style>
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      padding: 24px;
      background: #fafafa;
    }
    .card {
      max-width: 820px;
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 16px;
      background: #fff;
    }
    button {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid #333;
      background: #fff;
      cursor: pointer;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #f7f7f7;
      padding: 12px;
      border-radius: 10px;
    }
    footer {
      margin-top: 16px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>🎧 Feedback DJ — Today’s Customer Signal Mix</h2>
    <p>One-click daily briefing from messy product feedback.</p>
    <button id="btn">Generate Today’s Briefing</button>
    <p id="meta"></p>
    <pre id="out">Click the button to generate.</pre>
  </div>

  <footer>
    © 2026, Priyasha Thacker, Inc.
  </footer>

  <script>
    const btn = document.getElementById('btn');
    const out = document.getElementById('out');
    const meta = document.getElementById('meta');

    btn.onclick = async () => {
      out.textContent = "Generating…";
      const res = await fetch('/briefing');
      const txt = await res.text();
      meta.textContent = "Last generated: " + new Date().toLocaleString();
      out.textContent = txt;
    };
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}


    async function getFeedbackList() {
      const raw = await env.FEEDBACK_KV.get("feedback:list");
      if (raw) return JSON.parse(raw);

      const seeded = [
        { source: "support", text: "Onboarding is confusing — docs felt scattered.", ts: Date.now() - 86400000 },
        { source: "github", text: "Wrangler deploy errors didn’t tell me which binding was missing.", ts: Date.now() - 70000000 },
        { source: "discord", text: "Not sure which Workers AI model to use for sentiment vs summary.", ts: Date.now() - 50000000 },
        { source: "email", text: "Once it worked, performance was awesome. Love edge latency.", ts: Date.now() - 30000000 },
        { source: "twitter", text: "KV setup was fast but naming/preview namespaces confused me.", ts: Date.now() - 10000000 }
      ];
      await env.FEEDBACK_KV.put("feedback:list", JSON.stringify(seeded));
      return seeded;
    }

    if (url.pathname === "/ingest" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body?.text) {
        return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
      }

      const list = await getFeedbackList();
      list.unshift({
        source: body.source || "manual",
        text: body.text,
        ts: Date.now()
      });
      await env.FEEDBACK_KV.put("feedback:list", JSON.stringify(list.slice(0, 50))); // cap size
      return new Response(JSON.stringify({ ok: true, count: list.length }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/briefing") {
      const cached = await env.FEEDBACK_KV.get("briefing:latest");
      const cachedAt = await env.FEEDBACK_KV.get("briefing:latest:ts");
      if (cached && cachedAt && (Date.now() - Number(cachedAt) < 10 * 60 * 1000)) {
        return new Response(cached, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

      const list = await getFeedbackList();
      const combined = list.slice(0, 20).map((f, i) => `${i + 1}. [${f.source}] ${f.text}`).join("\n");

      const prompt = `
You are "Feedback DJ", a product manager who turns raw customer feedback into a catchy daily briefing.

Given the feedback below, produce a short briefing with EXACT sections in this order:

1) TOP THEMES (max 3 bullets)
2) SENTIMENT WEATHER (one line: "Sunny", "Cloudy", "Stormy", etc + one sentence why)
3) 🔥 HOTTEST COMPLAINT (one short quote from the feedback)
4) WHAT WE FIX THIS WEEK (one concrete fix)
5) A RISKY BET (one experiment idea)
6) METRICS TO WATCH (3 metrics)

Keep it punchy. Use plain text (NOT JSON). Do not mention you are an AI.

FEEDBACK:
${combined}
`;

      let outputText = "";
      try {
        const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [{ role: "user", content: prompt }]
        });
        outputText = result?.response || result?.output_text || JSON.stringify(result);
      } catch (e) {
        outputText =
`TOP THEMES
- Onboarding/docs confusion
- Tooling errors lack clarity
- Model selection uncertainty

SENTIMENT WEATHER
Cloudy — users like performance but struggle to get started.

🔥 HOTTEST COMPLAINT
"Wrangler deploy errors didn’t tell me which binding was missing."

WHAT WE FIX THIS WEEK
Add an end-to-end “first build” doc with exact binding names + expected outputs.

A RISKY BET
Ship a “Feedback DJ” template app in the dashboard to bootstrap common prototypes.

METRICS TO WATCH
- Time-to-first-successful-deploy
- Docs search exits / bounce rate
- Error-to-resolution time`;
      }

      await env.FEEDBACK_KV.put("briefing:latest", outputText);
      await env.FEEDBACK_KV.put("briefing:latest:ts", String(Date.now()));

      return new Response(outputText, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    return new Response("Try / or /briefing", { status: 200 });
  }
};
