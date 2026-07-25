import { NextRequest, NextResponse } from 'next/server';
import { Branch, PrepRecommendation, ShortageAlert } from '@/types/kitchen';
import { MENU_ITEMS } from '@/data/menuItems';
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
        return weightB - weightA; // Higher weight first
      }
      return b.totalRequested - a.totalRequested; // Larger requests first
    });

    return NextResponse.json({ prepItems, alerts });
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
