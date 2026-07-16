/**
 * POST /api/contact — relays form submissions to Resend.
 *
 * Cloudflare secrets (Settings → Variables and Secrets):
 *   RESEND_API_KEY  — from https://resend.com
 * Optional plain vars:
 *   CONTACT_TO      — default hello@hardencode.com
 *   CONTACT_FROM    — default Hardencode <onboarding@resend.dev>
 */

const MAX = { name: 100, email: 200, query: 4000 };

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= MAX.email;
}

function stripControls(value) {
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

async function readBody(request) {
  var type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return await request.json();
  }
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    var form = await request.formData();
    return {
      name: form.get("name"),
      email: form.get("email"),
      query: form.get("query"),
      company: form.get("company"),
    };
  }
  return null;
}

export async function handleContact(request, env) {
  if (request.method === "GET" || request.method === "HEAD") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  var data;
  try {
    data = await readBody(request);
  } catch (err) {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  if (!data || typeof data !== "object") {
    return json({ ok: false, error: "Unsupported content type." }, 415);
  }

  // Honeypot: bots fill hidden "company"; real users leave it empty.
  if (data.company) {
    return json({ ok: true });
  }

  var name = stripControls(data.name || "");
  var email = stripControls(data.email || "").toLowerCase();
  var query = stripControls(data.query || "");

  if (!name || name.length > MAX.name) {
    return json({ ok: false, error: "Please enter your name." }, 400);
  }
  if (!isEmail(email)) {
    return json({ ok: false, error: "Please enter a valid email." }, 400);
  }
  if (!query || query.length > MAX.query) {
    return json({ ok: false, error: "Please enter your query." }, 400);
  }

  var apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return json({
      ok: false,
      error: "Form is not configured yet. Email hello@hardencode.com instead.",
    }, 503);
  }

  var to = env.CONTACT_TO || "hello@hardencode.com";
  var from = env.CONTACT_FROM || "Hardencode <hello@hardencode.com>";
  var subject = "Hardencode query from " + name;
  var text =
    "Name: " + name + "\n" +
    "Email: " + email + "\n\n" +
    query + "\n";
  var html =
    "<p><strong>Name:</strong> " + escapeHtml(name) + "</p>" +
    "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>" +
    "<p><strong>Query:</strong></p>" +
    "<p>" + escapeHtml(query).replace(/\n/g, "<br>") + "</p>";

  var resendRes;
  try {
    resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from,
        to: [to],
        reply_to: email,
        subject: subject,
        text: text,
        html: html,
      }),
    });
  } catch (err) {
    return json({ ok: false, error: "Could not reach the mail service. Try again or email hello@hardencode.com." }, 502);
  }

  if (!resendRes.ok) {
    var detail = "";
    var resendMessage = "";
    try {
      detail = await resendRes.text();
      var parsed = JSON.parse(detail);
      resendMessage = (parsed && (parsed.message || (parsed.error && parsed.error.message))) || "";
    } catch (e) {}
    console.error("Resend error", resendRes.status, detail);

    // Surface Resend's own message so domain/from misconfig is obvious in the browser network tab.
    if (resendMessage) {
      return json({
        ok: false,
        error: "Could not send your query. Try again or email hello@hardencode.com.",
        reason: resendMessage,
      }, 502);
    }
    return json({ ok: false, error: "Could not send your query. Try again or email hello@hardencode.com." }, 502);
  }

  return json({ ok: true });
}

/** Pages Functions compatibility (if the project is ever deployed that way). */
export async function onRequestPost(context) {
  return handleContact(context.request, context.env);
}

export async function onRequestGet() {
  return json({ ok: false, error: "Method not allowed." }, 405);
}
