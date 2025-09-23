import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../server/app.ts";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Let Express handle the request
  // @ts-expect-error vercel types vs express types
  return app(req, res);
}


