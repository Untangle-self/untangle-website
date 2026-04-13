import { generateUntangleResponse } from "../../src/services/responseService";

export default async function handler(req, res) {
  const { input } = req.body;

  try {
    const response = await generateUntangleResponse(input);
    return res.status(200).json(response);
  } catch (e) {
    console.error("FULL ERROR:", e);

    return res.status(200).json({
      reflection: "Something feels off, even if it’s hard to name.",
      deepening: "There’s more underneath this than what’s immediately visible.",
      untangle: "It’s not just what’s happening — it’s how it’s sitting with you."
      error: "LLM pipeline failed:",
      details: String(e)
    });
  }
}