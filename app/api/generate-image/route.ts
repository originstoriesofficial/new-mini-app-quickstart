import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// 🧠 Required: Setup API key from env
fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(req: Request) {
  const { animalType, capeColor ,attribute } = await req.json();

  const prompt = `An editorial photograph of an animated medieval ${animalType}, wearing an elaborate ${capeColor} inspired cape, holding an instantly recognizable, stereotypical ${attribute} in their hands, glossy, symmetrical, 4k, award-winning, crisp, detailed`

  try {
    const result = await fal.subscribe("fal-ai/stable-cascade", {
      input: {
        prompt,
        image_size: "square_hd",
        guidance_scale: 4,
        enable_safety_checker: true,
        num_images: 1,
      },
    });

    const imageUrl = result?.data?.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Fal error:", err);
    return NextResponse.json({ error: "Fal generation error" }, { status: 500 });
  }
}
