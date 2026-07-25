import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, GEMINI_MODEL_NAME } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvedPrep, branchAllocations, priorityItems } = body;

    if (!approvedPrep || !branchAllocations) {
      return NextResponse.json({ error: 'Missing approved prep or branch allocation data.' }, { status: 400 });
    }

    // Prepare default fallback briefing
    let briefingResult = {
      success: false,
      fallback: true,
      briefing: {
        japaneseTitle: '日本語指示書（一時的に利用不可）',
        japaneseSummary: '指示書の生成中にエラーが発生しました。時間をおいて再度お試しください。',
        priorityInstructions: [] as { priority: number; menuItem: string; instructionJapanese: string }[],
        branchNotes: [] as { branch: string; noteJapanese: string }[],
        safetyReminderJapanese: '調理手順とアロケーション表を確認し、安全第一で作業を行ってください。',
        englishSummary: 'Japanese briefing temporarily unavailable. Branch allocations remain available.'
      }
    };

    const openai = getGeminiClient();
    if (openai) {
      try {
        const chatCompletion = await openai.chat.completions.create({
          model: GEMINI_MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: `You are KitchenSync’s Japanese restaurant operations coordinator.

Create a concise briefing for kitchen staff working at a central kitchen in Roppongi.

Rules:
- Use natural, clear workplace Japanese.
- Keep the language suitable for restaurant staff.
- Do not change, recalculate, round, or invent quantities.
- Copy quantities exactly as supplied.
- Prioritize urgent items first.
- Separate central-kitchen production instructions from branch allocation notes.
- Keep the head chef as the final decision-maker.
- Avoid overly formal Japanese.
- Return valid JSON only, using this schema:
{
  "japaneseTitle": "string",
  "japaneseSummary": "string",
  "priorityInstructions": [
    {
      "priority": 1,
      "menuItem": "string",
      "instructionJapanese": "string"
    }
  ],
  "branchNotes": [
    {
      "branch": "string",
      "noteJapanese": "string"
    }
  ],
  "safetyReminderJapanese": "string",
  "englishSummary": "string"
}`
            },
            {
              role: 'user',
              content: JSON.stringify({
                approvedPrep,
                branchAllocations,
                priorityItems
              })
            }
          ],
          response_format: { type: 'json_object' }
        });

        const resultText = chatCompletion.choices[0]?.message?.content;
        if (resultText) {
          const parsed = JSON.parse(resultText);
          briefingResult = {
            success: true,
            fallback: false,
            briefing: {
              japaneseTitle: parsed.japaneseTitle || '日本語キッチン指示書',
              japaneseSummary: parsed.japaneseSummary || '明日の仕込みおよび各店舗への配送指示書。',
              priorityInstructions: parsed.priorityInstructions || [],
              branchNotes: parsed.branchNotes || [],
              safetyReminderJapanese: parsed.safetyReminderJapanese || '安全第一で作業を推進してください。',
              englishSummary: parsed.englishSummary || 'Calculations complete.'
            }
          };
        }
      } catch (apiError) {
        console.error('Gemini completion failed. Using fallback:', apiError);
        // keep fallback
      }
    } else {
      console.warn('Gemini client not initialized. Using fallback mode.');
    }

    return NextResponse.json(briefingResult);
  } catch (error) {
    console.error('Error in Japanese briefing API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
