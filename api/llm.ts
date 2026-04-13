export default async function handler(req, res) {
  console.log("API HIT V3");

  try {
    const { generateUntangleResponse } = await import(
      "../src/services/responseService"
    );

    console.log("IMPORT OK");

    const { input } = req.body;

    const response = await generateUntangleResponse(input);

    console.log("RESPONSE OK", response);

    return res.status(200).json(response);

  } catch (e) {
    console.error("ERROR STEP:", e);

    return res.status(500).json({
      error: "FAIL",
      step: "check logs",
      message: String(e),
    });
  }
}