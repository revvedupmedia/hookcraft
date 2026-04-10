import { GoogleGenAI, Type } from "@google/genai";

const getAI = (customKey?: string) => {
  const key = customKey || process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey: key });
};

export interface HookResult {
  style: string;
  content: string | string[]; // Threads can be an array of strings
  platform: string;
}

export interface GenerationResponse {
  results: {
    threads: HookResult[];
    tiktok: HookResult[];
    facebook: HookResult[];
  };
}

export async function extractShopeeDetails(url: string, customKey?: string) {
  const ai = getAI(customKey);
  let finalUrl = url;
  
  // If it's a shortlink, try to resolve it via our backend proxy
  if (url.includes('s.shopee.com') || url.includes('shp.ee')) {
    try {
      const response = await fetch(`/api/resolve-shopee?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.finalUrl) {
        finalUrl = data.finalUrl;
      }
    } catch (error) {
      console.error("Failed to resolve shortlink:", error);
    }
  }

  const prompt = `
    ACT AS A PRODUCT RESEARCHER.
    I have a SPECIFIC Shopee product link: ${finalUrl}
    
    INSTRUCTIONS:
    1. Use your search tool to visit this EXACT URL.
    2. DO NOT return information for any other product.
    3. If you see a login page or cannot access the specific product, DO NOT GUESS. Instead, say "MAAF: Saya tidak dapat mengakses maklumat produk ini secara terus."
    4. If successful, extract:
       - Exact Product Name
       - Key Features/Benefits
       - Price in RM
       - Target Audience
    
    Return the summary in plain text.
    CRITICAL: If the product is not related to the URL provided, do not return anything.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  return response.text;
}

export async function generateHooks(params: {
  product: string;
  shopeeUrl?: string;
  platforms: string[];
  tone: string;
  count: number;
  styles: string[];
  lang: string;
  ctaType: 'soft' | 'hard';
  threadLength?: 'short' | 'long';
  customKey?: string;
}) {
  const { product, shopeeUrl, platforms, tone, count, styles, lang, ctaType, threadLength, customKey } = params;
  const ai = getAI(customKey);

  const prompt = `
    Product/Topic: ${product}
    ${shopeeUrl ? `Shopee Link (for CTA): ${shopeeUrl}` : ''}
    Platforms: ${platforms.join(", ")}
    Tone: ${tone}
    Count per platform: ${count}
    Hook Styles: ${styles.join(", ")}
    Language: ${lang === 'bm' ? 'Bahasa Melayu (Malaysian slang/casual if tone is casual)' : lang === 'en' ? 'English' : 'Mixed (BM + English - code-switching style common in Malaysia)'}
    Facebook CTA Type: ${ctaType === 'soft' ? 'Soft Sell (Curiosity, value-first, subtle link)' : 'Hard Sell (Direct, urgent, clear price/buy now)'}
    Threads Length Preference: ${threadLength === 'long' ? 'Long & Detailed (Deep dive, more context per post)' : 'Short & Punchy (Quick to read, straight to the point)'}

    Generate high-converting social media content.
    Use relevant emojis.

    SPECIFIC PLATFORM RULES:
    1. For Threads: Generate a THREAD of 3-5 posts for EACH result. Each post in the thread should be a separate string in an array.
       - If length is "long", ensure each post in the thread is more descriptive (40-60 words per post).
       - If length is "short", keep each post concise (15-30 words per post).
    2. For TikTok: Script format. Start with a strong HOOK (3s), then BODY (bullet points), then CTA.
    3. For Facebook: One long post (80-150 words) with emotional build-up and the specified CTA type (${ctaType}).

    CTA INSTRUCTIONS:
    ${shopeeUrl ? `IMPORTANT: Include the Shopee link (${shopeeUrl}) in the CTA section of every post/thread.` : 'Include a generic CTA like "Check link in bio" or "DM for details".'}

    Return the result in JSON format matching this schema:
    {
      "results": {
        "threads": [{"style": "...", "content": ["post 1", "post 2", "post 3"]}],
        "tiktok": [{"style": "...", "content": "..."}],
        "facebook": [{"style": "...", "content": "..."}]
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.OBJECT,
            properties: {
              threads: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    style: { type: Type.STRING },
                    content: { 
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                  },
                  required: ["style", "content"],
                },
              },
              tiktok: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    style: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ["style", "content"],
                },
              },
              facebook: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    style: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ["style", "content"],
                },
              },
            },
          },
        },
      },
    },
  });

  try {
    return JSON.parse(response.text) as GenerationResponse;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Invalid response from AI");
  }
}
