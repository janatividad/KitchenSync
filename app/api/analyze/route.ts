import { NextRequest, NextResponse } from 'next/server';
import { Branch, PrepRecommendation, ShortageAlert } from '@/types/kitchen';
import { MENU_ITEMS } from '@/data/menuItems';
import { getGmiClient, GMI_MODEL_NAME } from '@/lib/gmi';
import {
  calculateNetworkStock,
  calculateTotalRequests,
  calculatePeakBuffer,
  calculateRecommendedPrep,
} from '@/lib/calculations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const branches: Branch[] = body.branches;

    if (!branches || !Array.isArray(branches)) {
      return NextResponse.json({ error: 'Invalid branch data provided.' }, { status: 400 });
    }

    const prepItems: PrepRecommendation[] = [];
    const alerts: ShortageAlert[] = [];

    // 1. Run deterministic calculations
    for (const item of MENU_ITEMS) {
      const networkStock = Math.round(calculateNetworkStock(branches, item.id) * 10) / 10;
      const totalRequested = Math.round(calculateTotalRequests(branches, item.id) * 10) / 10;
      const peakBuffer = calculatePeakBuffer(totalRequested);
      const aiRecommendedPrep = calculateRecommendedPrep(totalRequested, peakBuffer);

      prepItems.push({
        menuItemId: item.id,
        networkStock,
        totalRequested,
        peakBuffer,
        aiRecommendedPrep,
        approvedPrep: aiRecommendedPrep,
      });

      if (totalRequested > 0) {
        const ratio = networkStock > 0 ? totalRequested / networkStock : 1.0;
        const percentage = Math.round(ratio * 100);
        let urgency: 'Critical' | 'High' | 'Moderate' = 'Moderate';
        let explanation = '';

        if (ratio >= 0.5) {
          urgency = 'Critical';
          explanation = `Total request (${totalRequested} ${item.unit}) is ${percentage}% of total network stock (${networkStock} ${item.unit}). Immediate preparation required to avoid outages.`;
        } else if (ratio >= 0.25) {
          urgency = 'High';
          explanation = `Total request (${totalRequested} ${item.unit}) is ${percentage}% of total network stock (${networkStock} ${item.unit}). High demand level; buffer preparation recommended.`;
        } else {
          urgency = 'Moderate';
          explanation = `Total request (${totalRequested} ${item.unit}) is ${percentage}% of total network stock (${networkStock} ${item.unit}). Normal stock replenishment within buffer limits.`;
        }

        alerts.push({
          menuItemId: item.id,
          menuItemName: item.name,
          totalRequested,
          recommendedPrep: aiRecommendedPrep,
          urgency,
          explanation,
        });
      }
    }

    // Sort alerts by urgency: Critical first, then High, then Moderate
    const urgencyWeight = { Critical: 3, High: 2, Moderate: 1 };
    alerts.sort((a, b) => {
      const weightA = urgencyWeight[a.urgency];
      const weightB = urgencyWeight[b.urgency];
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return b.totalRequested - a.totalRequested;
    });

    // 2. Prepare compact JSON summary of the calculated branch data
    const formattedBranches = branches.map(b => ({
      name: b.name,
      requests: b.inventory.map(inv => {
        const mItem = MENU_ITEMS.find(m => m.id === inv.menuItemId);
        return {
          menuItem: mItem?.name || inv.menuItemId,
          currentStock: inv.currentStock,
          requestedQuantity: inv.requestedQuantity,
          unit: mItem?.unit || 'kg'
        };
      })
    }));

    const formattedPrep = prepItems.map(p => {
      const mItem = MENU_ITEMS.find(m => m.id === p.menuItemId);
      return {
        menuItem: mItem?.name || p.menuItemId,
        networkStock: p.networkStock,
        totalBranchRequest: p.totalRequested,
        peakBuffer: p.peakBuffer,
        recommendedPrep: p.approvedPrep,
        unit: mItem?.unit || 'kg'
      };
    });

    // 3. Fallback structure as default
    let aiAnalysis = {
      success: false,
      fallback: true,
      analysis: {
        executiveSummary: 'The preparation calculations are complete, but AI analysis is temporarily unavailable.',
        networkRiskLevel: 'unknown',
        priorityItems: [] as {
          menuItem: string;
          priority: number;
          urgency: 'moderate' | 'high' | 'critical';
          reason: string;
          recommendedAction: string;
        }[],
        chefRecommendations: [
          'Review the calculated preparation quantities before approval.'
        ],
        tomorrowStrategy: 'Use the deterministic preparation plan shown in the table.'
      }
    };

    // 4. Send data to GMI Cloud if client is initialized
    const openai = getGmiClient();
    if (openai) {
      try {
        const chatCompletion = await openai.chat.completions.create({
          model: GMI_MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: `You are KitchenSync, an AI restaurant operations analyst supporting five Tokyo restaurant branches and one central kitchen in Roppongi.

You analyze prepared-food stock requests and deterministic production calculations.

Important rules:
- Never modify or recalculate supplied quantities.
- Never invent demand, stock, cost, supplier, or staffing data.
- Use only the supplied information.
- Clearly separate facts from recommendations.
- Rank the most operationally urgent menu items first.
- Give concise, practical recommendations for a head chef.
- The head chef always makes the final decision.
- Return valid JSON only, using this schema:
{
  "executiveSummary": "string",
  "networkRiskLevel": "low | medium | high | critical",
  "priorityItems": [
    {
      "menuItem": "string",
      "priority": 1,
      "urgency": "moderate | high | critical",
      "reason": "string",
      "recommendedAction": "string"
    }
  ],
  "chefRecommendations": [
    "string"
  ],
  "tomorrowStrategy": "string"
}`
            },
            {
              role: 'user',
              content: JSON.stringify({
                branches: formattedBranches,
                prepCalculations: formattedPrep
              })
            }
          ],
          response_format: { type: 'json_object' }
        });

        const resultText = chatCompletion.choices[0]?.message?.content;
        if (resultText) {
          const parsed = JSON.parse(resultText);
          aiAnalysis = {
            success: true,
            fallback: false,
            analysis: {
              executiveSummary: parsed.executiveSummary || 'Calculations ready.',
              networkRiskLevel: parsed.networkRiskLevel || 'low',
              priorityItems: parsed.priorityItems || [],
              chefRecommendations: parsed.chefRecommendations || [],
              tomorrowStrategy: parsed.tomorrowStrategy || 'Proceed with preparation.'
            }
          };
        }
      } catch (apiError) {
        console.error('GMI Cloud completion failed. Using fallback:', apiError);
        // keep fallback
      }
    } else {
      console.warn('GMI Cloud environment missing or invalid. Using fallback mode.');
    }

    return NextResponse.json({
      prepItems,
      alerts,
      aiAnalysis
    });
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
