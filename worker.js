/**
 * Worker entry for hardencode.com (static assets + contact API).
 * Cloudflare serves files from disk; /api/* runs this script first.
 */
import { handleContact } from "./functions/api/contact.js";

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
