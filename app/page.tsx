'use client';

import React, { useState } from 'react';
import { Branch, PrepRecommendation, ShortageAlert, IngredientRequirement } from '@/types/kitchen';
import { MENU_ITEMS } from '@/data/menuItems';
import { INITIAL_BRANCHES } from '@/data/branches';
import { SUPPLIERS } from '@/data/suppliers';
import {
  calculateBranchStatus,
  calculateBranchAllocations,
  calculateIngredientRequirements,
} from '@/lib/calculations';

export default function Dashboard() {
  // Navigation & Step control
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [loadingStep, setLoadingStep] = useState<boolean>(false);

  // Core Data States
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  
  // Tab 2 AI recommendations state
  const [prepItems, setPrepItems] = useState<PrepRecommendation[]>([]);
  const [alerts, setAlerts] = useState<ShortageAlert[]>([]);

  // Tab 3 state: prepared checkbox tracking (key: branchId-menuItemId, value: boolean)
  const [preparedItems, setPreparedItems] = useState<Record<string, boolean>>({});
  // Tab 3 state: global menu item prepared checkbox tracking (key: menuItemId, value: boolean)
  const [globalPreparedItems, setGlobalPreparedItems] = useState<Record<string, boolean>>({});

  // Tab 4 state: PO inclusion checkbox tracking (key: ingredientId, value: boolean)
  const [includedIngredients, setIncludedIngredients] = useState<Record<string, boolean>>({});
  const [purchaseApproved, setPurchaseApproved] = useState<boolean>(false);
  const [simulationStatuses, setSimulationStatuses] = useState<{
    posPrepared: 'idle' | 'pending' | 'success';
    financeCreated: 'idle' | 'pending' | 'success';
    kitchenNotified: 'idle' | 'pending' | 'success';
    auditLogged: 'idle' | 'pending' | 'success';
  }>({
    posPrepared: 'idle',
    financeCreated: 'idle',
    kitchenNotified: 'idle',
    auditLogged: 'idle',
  });

  // Reset all states to initial mock data
  const handleResetDemoData = () => {
    setActiveStep(1);
    setBranches(JSON.parse(JSON.stringify(INITIAL_BRANCHES))); // Deep copy
    setPrepItems([]);
    setAlerts([]);
    setPreparedItems({});
    setGlobalPreparedItems({});
    setIncludedIngredients({});
    setPurchaseApproved(false);
    setSimulationStatuses({
      posPrepared: 'idle',
      financeCreated: 'idle',
      kitchenNotified: 'idle',
      auditLogged: 'idle',
    });
  };

  // Input Validation helper: converts raw string to safe non-negative number
  const validateQuantityInput = (val: string): number => {
    if (val === '') return 0;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return 0;
    return num;
  };

  // Handle Current Stock & Requested Quantity editing in Tab 1
  const handleBranchInventoryEdit = (
    branchId: string,
    menuItemId: string,
    field: 'currentStock' | 'requestedQuantity',
    rawVal: string
  ) => {
    const cleanVal = validateQuantityInput(rawVal);
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id === branchId) {
          return {
            ...b,
            inventory: b.inventory.map((inv) => {
              if (inv.menuItemId === menuItemId) {
                return { ...inv, [field]: cleanVal };
              }
              return inv;
            }),
          };
        }
        return b;
      })
    );
  };

  // Tab 1 -> Tab 2 transition (Analyze requests)
  const handleAnalyzeRequests = async () => {
    setLoadingStep(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branches }),
      });
      
      // Simulate loading state for a polished UI
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (response.ok) {
        const data = await response.json();
        setPrepItems(data.prepItems);
        setAlerts(data.alerts);
        setActiveStep(2);
      } else {
        alert('Failed to analyze branch inventory requests.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the analysis API.');
    } finally {
      setLoadingStep(false);
    }
  };

  // Handle Approved Prep editing in Tab 2
  const handleApprovedPrepEdit = (menuItemId: string, rawVal: string) => {
    const cleanVal = validateQuantityInput(rawVal);
    setPrepItems((prev) =>
      prev.map((item) => {
        if (item.menuItemId === menuItemId) {
          return { ...item, approvedPrep: cleanVal };
        }
        return item;
      })
    );
  };

  // Tab 2 -> Tab 3 transition
  const handleApprovePrep = async () => {
    setLoadingStep(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingStep(false);
    setActiveStep(3);
  };

  // Tab 3 -> Tab 4 transition
  const handleGeneratePurchase = async () => {
    setLoadingStep(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingStep(false);

    // Initialize purchase checkboxes (include all by default)
    const activeApprovedPreps = prepItems.map((p) => ({
      menuItemId: p.menuItemId,
      approvedQty: p.approvedPrep,
    }));
    const rawReqs = calculateIngredientRequirements(activeApprovedPreps);
    const checkedMap: Record<string, boolean> = {};
    rawReqs.forEach((req) => {
      checkedMap[req.ingredientId] = true;
    });
    setIncludedIngredients(checkedMap);
    setActiveStep(4);
  };

  // Tab 4: Approve Purchase Plan simulation
  const handleApprovePurchaseRequirements = async () => {
    setLoadingStep(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingStep(false);
    setPurchaseApproved(true);
    setSimulationStatuses({
      posPrepared: 'pending',
      financeCreated: 'idle',
      kitchenNotified: 'idle',
      auditLogged: 'idle',
    });

    setTimeout(() => {
      setSimulationStatuses((prev) => ({ ...prev, posPrepared: 'success', financeCreated: 'pending' }));
      setTimeout(() => {
        setSimulationStatuses((prev) => ({ ...prev, financeCreated: 'success', kitchenNotified: 'pending' }));
        setTimeout(() => {
          setSimulationStatuses((prev) => ({ ...prev, kitchenNotified: 'success', auditLogged: 'pending' }));
          setTimeout(() => {
            setSimulationStatuses((prev) => ({ ...prev, auditLogged: 'success' }));
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // Weight summary calculators for Step 1 branch cards
  const getBranchRequestSummaryString = (branch: Branch): string => {
    let kgSum = 0;
    let lSum = 0;

    branch.inventory.forEach((inv) => {
      const item = MENU_ITEMS.find((m) => m.id === inv.menuItemId);
      if (!item) return;
      if (item.unit === 'kg') {
        kgSum += inv.requestedQuantity;
      } else {
        lSum += inv.requestedQuantity;
      }
    });

    return `${kgSum.toFixed(1)} kg + ${lSum.toFixed(1)} L`;
  };

  // Aggregate values for allocations and purchase calculations
  const totalApprovedProductionString = (): string => {
    let kgSum = 0;
    let lSum = 0;

    prepItems.forEach((p) => {
      const item = MENU_ITEMS.find((m) => m.id === p.menuItemId);
      if (!item) return;
      if (item.unit === 'kg') {
        kgSum += p.approvedPrep;
      } else {
        lSum += p.approvedPrep;
      }
    });

    return `${kgSum.toFixed(1)} kg + ${lSum.toFixed(1)} L`;
  };

  // Convert raw requirements to array
  const approvedPrepsList = prepItems.map((p) => ({
    menuItemId: p.menuItemId,
    approvedQty: p.approvedPrep,
  }));
  const ingredientRequirements = calculateIngredientRequirements(approvedPrepsList);

  // Group ingredient requirements by supplier
  const groupedRequirements = ingredientRequirements.reduce((acc, req) => {
    const supplier = SUPPLIERS.find((s) => s.id === req.supplierId)?.name || req.supplierId;
    if (!acc[supplier]) {
      acc[supplier] = [];
    }
    acc[supplier].push(req);
    return acc;
  }, {} as Record<string, IngredientRequirement[]>);

  // Aggregate cost stats for Tab 4
  const activePurchaseItems = ingredientRequirements.filter((req) => includedIngredients[req.ingredientId]);
  const grandTotalCost = activePurchaseItems.reduce((sum, item) => sum + item.estCost, 0);
  const checkedSuppliersCount = Object.keys(
    activePurchaseItems.reduce((acc, item) => {
      acc[item.supplierId] = true;
      return acc;
    }, {} as Record<string, boolean>)
  ).length;
  const checkedIngredientLinesCount = activePurchaseItems.length;

  // Tomorrow's Date formatter
  const getTomorrowDateString = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold text-lg tracking-wider">
              KS
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight text-white">KitchenSync</h1>
              <p className="text-xs text-slate-400">Tokyo Operations</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
          {/* Step 1 Button */}
          <button
            onClick={() => {
              if (activeStep > 1 && !purchaseApproved) setActiveStep(1);
            }}
            disabled={purchaseApproved}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeStep === 1
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            } ${purchaseApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold shrink-0">
              1
            </span>
            <span className="whitespace-nowrap">Store Requests</span>
          </button>

          {/* Step 2 Button */}
          <button
            onClick={() => {
              if (prepItems.length > 0 && !purchaseApproved) setActiveStep(2);
            }}
            disabled={prepItems.length === 0 || purchaseApproved}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeStep === 2
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            } ${(prepItems.length === 0 || purchaseApproved) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold shrink-0">
              2
            </span>
            <span className="whitespace-nowrap">AI Prep Plan</span>
          </button>

          {/* Step 3 Button */}
          <button
            onClick={() => {
              if (prepItems.length > 0 && !purchaseApproved) setActiveStep(3);
            }}
            disabled={prepItems.length === 0 || purchaseApproved}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeStep === 3
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            } ${(prepItems.length === 0 || purchaseApproved) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold shrink-0">
              3
            </span>
            <span className="whitespace-nowrap">Branch Allocation</span>
          </button>

          {/* Step 4 Button */}
          <button
            onClick={() => {
              if (prepItems.length > 0 && !purchaseApproved) setActiveStep(4);
            }}
            disabled={prepItems.length === 0}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeStep === 4
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            } ${prepItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold shrink-0">
              4
            </span>
            <span className="whitespace-nowrap">Purchase Requirements</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800 flex flex-col gap-4 text-xs text-slate-500">
          <div>
            KitchenSync v2.0.0<br />
            Tokyo Operations Center
          </div>
          <button
            onClick={handleResetDemoData}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded-md font-medium transition-colors text-center"
          >
            Reset Demo Data
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto w-full">
        {/* Loading Spinner for Transitions */}
        {loadingStep && (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 text-sm font-medium">Processing operational data...</p>
          </div>
        )}

        {/* TAB 1 — STORE REQUESTS */}
        {!loadingStep && activeStep === 1 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Tokyo Branch Stock &amp; Replenishment Requests</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Each branch reports its current prepared-food stock and the additional quantity required from the central kitchen.
                </p>
              </div>
              <button
                onClick={handleAnalyzeRequests}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm shrink-0"
              >
                Analyze All Branch Requests
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Branches Request List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{branch.name}</h3>
                      {branch.isCentralKitchen && (
                        <span className="text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                          Main Store · Central Kitchen
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      Tokyo Region
                    </span>
                  </div>

                  <div className="p-6 flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="text-slate-400 font-medium text-xs border-b border-slate-100">
                          <th className="pb-3">Menu Item</th>
                          <th className="pb-3 text-right">Current Stock</th>
                          <th className="pb-3 text-right pr-4">Requested Quantity</th>
                          <th className="pb-3 pl-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {branch.inventory.map((inv) => {
                          const item = MENU_ITEMS.find((m) => m.id === inv.menuItemId);
                          if (!item) return null;
                          const status = calculateBranchStatus(inv.currentStock, item.minimumStock);

                          return (
                            <tr key={inv.menuItemId} className="align-middle">
                              <td className="py-3.5 font-medium text-slate-800">
                                {item.name} <span className="text-slate-400 text-xs font-normal">({item.unit})</span>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                  <input
                                    type="number"
                                    step="any"
                                    value={inv.currentStock}
                                    onChange={(e) => handleBranchInventoryEdit(branch.id, inv.menuItemId, 'currentStock', e.target.value)}
                                    className="w-16 text-right bg-transparent border-0 px-2 py-1 text-slate-800 text-sm focus:outline-none focus:ring-0 font-medium"
                                    min="0"
                                  />
                                </div>
                              </td>
                              <td className="py-3.5 text-right pr-4">
                                <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                  <input
                                    type="number"
                                    step="any"
                                    value={inv.requestedQuantity}
                                    onChange={(e) => handleBranchInventoryEdit(branch.id, inv.menuItemId, 'requestedQuantity', e.target.value)}
                                    className="w-16 text-right bg-transparent border-0 px-2 py-1 text-slate-800 text-sm focus:outline-none focus:ring-0 font-medium"
                                    min="0"
                                  />
                                </div>
                              </td>
                              <td className="py-3.5 pl-6">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    status === 'Good'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : status === 'Low'
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    status === 'Good'
                                      ? 'bg-emerald-500'
                                      : status === 'Low'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`} />
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs shrink-0">
                    <span className="text-slate-400 font-medium">Branch Request Summary</span>
                    <span className="font-semibold text-slate-800">
                      Total Requested: {getBranchRequestSummaryString(branch)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2 — AI PREP PLAN */}
        {!loadingStep && activeStep === 2 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Tomorrow’s Central Kitchen Preparation Plan</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-emerald-500 text-white text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase shrink-0">
                    AI Recommended
                  </span>
                  <p className="text-sm text-slate-500">
                    AI aggregates and analyzes store requests. Head chef review and final authorization required.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveStep(1)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                >
                  Back to Requests
                </button>
                <button
                  onClick={handleApprovePrep}
                  disabled={prepItems.reduce((sum, i) => sum + i.approvedPrep, 0) === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm inline-flex items-center gap-2"
                >
                  Approve Prep &amp; Create Allocation Plan
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Shortage Urgency Index Column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-sm tracking-wider uppercase text-emerald-400">Shortage Urgency Index</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Urgent inventory deficits ranked by total requested replenish volume relative to network stock.
                  </p>
                </div>

                {alerts.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-800 text-sm font-medium flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold">No active replenishment requests</p>
                      <p className="text-xs text-emerald-700 mt-1">All branch replenishment values are zero.</p>
                    </div>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.menuItemId}
                      className={`border rounded-xl p-4 bg-white shadow-sm flex items-start gap-3 ${
                        alert.urgency === 'Critical'
                          ? 'border-l-4 border-l-rose-500 border-rose-200'
                          : alert.urgency === 'High'
                          ? 'border-l-4 border-l-amber-500 border-amber-200'
                          : 'border-l-4 border-l-blue-500 border-blue-200'
                      }`}
                    >
                      <span className={`p-2 rounded-lg shrink-0 ${
                        alert.urgency === 'Critical'
                          ? 'bg-rose-50 text-rose-600'
                          : alert.urgency === 'High'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-slate-800 text-sm leading-tight">{alert.menuItemName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                              alert.urgency === 'Critical'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : alert.urgency === 'High'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {alert.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {alert.explanation}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Prep Plan Requirements Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Tomorrow’s Preparation Plan (Roppongi Central Kitchen)</h3>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-md">
                      AI Advisory Output
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="text-slate-400 font-medium text-xs border-b border-slate-100">
                            <th className="pb-3">Menu Item</th>
                            <th className="pb-3 text-right">Network Stock</th>
                            <th className="pb-3 text-right">Branch Request</th>
                            <th className="pb-3 text-right">Buffer (15%)</th>
                            <th className="pb-3 text-right bg-emerald-50/30 text-emerald-800 font-bold px-2 rounded-t-md">
                              AI Recommended Prep
                            </th>
                            <th className="pb-3 text-right pl-6 font-bold">Approved Prep</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {prepItems.map((item) => {
                            const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId);
                            if (!menuItem) return null;

                            return (
                              <tr key={item.menuItemId} className="align-middle">
                                <td className="py-4 font-semibold text-slate-800">
                                  {menuItem.name}
                                </td>
                                <td className="py-4 text-right text-slate-500 font-normal">
                                  {item.networkStock.toFixed(1)} {menuItem.unit}
                                </td>
                                <td className="py-4 text-right text-slate-700 font-medium">
                                  {item.totalRequested.toFixed(1)} {menuItem.unit}
                                </td>
                                <td className="py-4 text-right text-slate-400 font-normal">
                                  +{item.peakBuffer.toFixed(1)} {menuItem.unit}
                                </td>
                                <td className="py-4 text-right bg-emerald-50/30 text-emerald-700 font-bold px-2">
                                  {item.aiRecommendedPrep.toFixed(1)} {menuItem.unit}
                                </td>
                                <td className="py-4 text-right pl-6">
                                  <div className="inline-flex items-center bg-slate-50 border border-slate-300 rounded-md focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                    <input
                                      type="number"
                                      step="any"
                                      value={item.approvedPrep}
                                      onChange={(e) => handleApprovedPrepEdit(item.menuItemId, e.target.value)}
                                      className="w-16 text-right bg-transparent border-0 px-2 py-1.5 text-slate-800 text-sm focus:outline-none focus:ring-0 font-semibold"
                                      min="0"
                                    />
                                    <span className="text-xs text-slate-400 pr-2 select-none">{menuItem.unit}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Chef Approval Required Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-800 text-sm">Chef Approval Required</h4>
                    <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                      AI recommendations are advisory. The head chef reviews and approves the final production quantities. Adjust the values under the &quot;Approved Prep&quot; column to tweak output parameters before establishing allocations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — BRANCH ALLOCATION */}
        {!loadingStep && activeStep === 3 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Branch Preparation &amp; Allocation Plan</h2>
                <p className="text-sm text-slate-500 mt-1">
                  The kitchen team can see exactly how much prepared food must be produced and allocated to every branch.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveStep(2)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                >
                  Back to Prep Plan
                </button>
                <button
                  onClick={handleGeneratePurchase}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm inline-flex items-center gap-2"
                >
                  Generate Ingredient Requirements
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Network Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Active Network</p>
                <p className="text-lg font-bold text-slate-800 mt-2">5 Tokyo Branches</p>
                <p className="text-xs text-slate-500 mt-1">Covering Shibuya, Ginza &amp; central hub</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Menu Items Matrix</p>
                <p className="text-lg font-bold text-slate-800 mt-2">6 Prepared Recipes</p>
                <p className="text-xs text-slate-500 mt-1">5 weight-based, 1 volume-based</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Total Approved prep</p>
                <p className="text-lg font-bold text-emerald-600 mt-2">{totalApprovedProductionString()}</p>
                <p className="text-xs text-slate-500 mt-1">Sum of chef authorized volumes</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Central Hub</p>
                <p className="text-lg font-bold text-slate-800 mt-2">Roppongi Kitchen</p>
                <p className="text-xs text-slate-500 mt-1">Combined main store and cook hub</p>
              </div>
            </div>

            {/* Combined Kitchen-Production Summary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Combined Production &amp; Allocations Summary</h3>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Network aggregates
                </span>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-medium text-xs border-b border-slate-100">
                      <th className="pb-3">Menu Item</th>
                      <th className="pb-3 text-right">Total Requested</th>
                      <th className="pb-3 text-right">Approved Production</th>
                      <th className="pb-3 text-right">Total Allocated</th>
                      <th className="pb-3 text-right">Unallocated Buffer</th>
                      <th className="pb-3 pl-8">Global Production Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prepItems.map((item) => {
                      const mItem = MENU_ITEMS.find((m) => m.id === item.menuItemId);
                      if (!mItem) return null;

                      // Calculate allocations sum for this item across all branches
                      const totalAllocated = branches.reduce((sum, b) => {
                        const brReq = b.inventory.find((i) => i.menuItemId === item.menuItemId)?.requestedQuantity || 0;
                        const alloc = calculateBranchAllocations(brReq, item.totalRequested, item.approvedPrep);
                        return sum + alloc;
                      }, 0);

                      const unallocatedBuffer = Math.max(0, Math.round((item.approvedPrep - totalAllocated) * 10) / 10);
                      const isCompleted = globalPreparedItems[item.menuItemId] || false;

                      return (
                        <tr key={item.menuItemId} className="align-middle">
                          <td className="py-4 font-semibold text-slate-800">{mItem.name}</td>
                          <td className="py-4 text-right text-slate-500">{item.totalRequested.toFixed(1)} {mItem.unit}</td>
                          <td className="py-4 text-right text-slate-800 font-bold">{item.approvedPrep.toFixed(1)} {mItem.unit}</td>
                          <td className="py-4 text-right text-slate-600 font-medium">{totalAllocated.toFixed(1)} {mItem.unit}</td>
                          <td className="py-4 text-right text-slate-400 font-mono text-xs">{unallocatedBuffer.toFixed(1)} {mItem.unit}</td>
                          <td className="py-4 pl-8">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setGlobalPreparedItems((prev) => ({ ...prev, [item.menuItemId]: checked }));
                                  // Propagate status check locally to all individual branch allocations for simplicity
                                  setPreparedItems((prev) => {
                                    const next = { ...prev };
                                    branches.forEach((b) => {
                                      next[`${b.id}-${item.menuItemId}`] = checked;
                                    });
                                    return next;
                                  });
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
                              />
                              <span className={`text-xs font-semibold ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {isCompleted ? 'Prepared' : 'Ready to Prepare'}
                              </span>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual Branch Allocation Details */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{branch.name}</h3>
                      {branch.isCentralKitchen && (
                        <span className="text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                          Main Store · Central Kitchen
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                      Allocation Matrix
                    </span>
                  </div>

                  <div className="p-6 flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="text-slate-400 font-medium text-xs border-b border-slate-100">
                          <th className="pb-3">Menu Item</th>
                          <th className="pb-3 text-right">Current Stock</th>
                          <th className="pb-3 text-right">Requested</th>
                          <th className="pb-3 text-right bg-emerald-50/20 text-emerald-800 font-bold px-2 rounded-t-md">
                            Allocated Qty
                          </th>
                          <th className="pb-3 pl-8">Prep Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {branch.inventory.map((inv) => {
                          const item = MENU_ITEMS.find((m) => m.id === inv.menuItemId);
                          if (!item) return null;

                          // Retrieve approved prep quantity from Step 2 states to calculate proportional allocations
                          const approvedPrep = prepItems.find((p) => p.menuItemId === inv.menuItemId)?.approvedPrep || 0;
                          const totalRequested = prepItems.find((p) => p.menuItemId === inv.menuItemId)?.totalRequested || 0;
                          const allocation = calculateBranchAllocations(inv.requestedQuantity, totalRequested, approvedPrep);

                          const key = `${branch.id}-${inv.menuItemId}`;
                          const isPrepared = preparedItems[key] || false;

                          return (
                            <tr key={inv.menuItemId} className="align-middle">
                              <td className="py-3 font-semibold text-slate-800">
                                {item.name} <span className="text-slate-400 text-xs font-normal">({item.unit})</span>
                              </td>
                              <td className="py-3 text-right text-slate-500">{inv.currentStock} {item.unit}</td>
                              <td className="py-3 text-right text-slate-600 font-medium">{inv.requestedQuantity} {item.unit}</td>
                              <td className="py-3 text-right bg-emerald-50/20 text-emerald-800 font-bold px-2">
                                {allocation.toFixed(1)} {item.unit}
                              </td>
                              <td className="py-3 pl-8">
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isPrepared}
                                    onChange={(e) => {
                                      setPreparedItems((prev) => ({ ...prev, [key]: e.target.checked }));
                                    }}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
                                  />
                                  <span className={`text-xs font-semibold ${isPrepared ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {isPrepared ? 'Prepared' : 'Ready to Prepare'}
                                  </span>
                                </label>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4 — PURCHASE REQUIREMENTS */}
        {!loadingStep && activeStep === 4 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Supplier Purchase Requirements</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Raw ingredient requirements calculated from the chef-approved central-kitchen production plan.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!purchaseApproved && (
                  <>
                    <button
                      onClick={() => setActiveStep(3)}
                      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                    >
                      Back to Allocation
                    </button>
                    <button
                      onClick={handleApprovePurchaseRequirements}
                      disabled={activePurchaseItems.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                    >
                      Approve Purchase Requirements
                    </button>
                  </>
                )}
                {purchaseApproved && (
                  <button
                    onClick={handleResetDemoData}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                  >
                    Start New Batch / Reset
                  </button>
                )}
              </div>
            </div>

            {/* Configurable Ratios Notice Banner */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl px-5 py-3 text-slate-600 text-xs font-medium flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Demo recipe ratios — configurable for each restaurant.
              </span>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Operational parameters</span>
            </div>

            {ingredientRequirements.length === 0 ? (
              <div className="bg-slate-100 rounded-xl p-10 text-center border border-slate-200">
                <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-800 font-semibold">No Raw Ingredients Required</p>
                <p className="text-sm text-slate-500 mt-1">
                  Approved preparation quantities are currently set to zero. Tweak the approved quantities in Step 2 to generate ingredient orders.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ingredient Requirements Grouped by Supplier */}
                <div className="lg:col-span-2 space-y-6">
                  {Object.entries(groupedRequirements).map(([supplierName, items]) => {
                    // Check if any items for this supplier are checked
                    const checkedItems = items.filter((it) => includedIngredients[it.ingredientId]);
                    const supplierSubtotal = checkedItems.reduce((sum, it) => sum + it.estCost, 0);

                    return (
                      <div key={supplierName} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                          <h3 className="font-semibold text-slate-800">{supplierName}</h3>
                          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-md">
                            Subtotal: ¥{supplierSubtotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-6 overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="text-slate-400 font-medium text-xs border-b border-slate-100">
                                <th className="pb-3 w-6"></th>
                                <th className="pb-3 pl-3">Raw Ingredient</th>
                                <th className="pb-3">Used For</th>
                                <th className="pb-3 text-right">Required Quantity</th>
                                <th className="pb-3 text-right">Unit Price</th>
                                <th className="pb-3 text-right pl-6">Estimated Cost</th>
                                <th className="pb-3 text-right pl-6">Delivery Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {items.map((item) => {
                                const isIncluded = includedIngredients[item.ingredientId] || false;

                                return (
                                  <tr key={item.ingredientId} className={`align-middle ${isIncluded ? 'opacity-100' : 'opacity-40'}`}>
                                    <td className="py-4">
                                      <input
                                        type="checkbox"
                                        checked={isIncluded}
                                        onChange={(e) => {
                                          setIncludedIngredients((prev) => ({
                                            ...prev,
                                            [item.ingredientId]: e.target.checked,
                                          }));
                                        }}
                                        disabled={purchaseApproved}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-4 pl-3 font-semibold text-slate-800">
                                      {item.ingredientName}
                                    </td>
                                    <td className="py-4 text-xs text-slate-500 leading-normal max-w-[120px]">
                                      Used for: <span className="font-medium text-slate-700">{item.usedFor.join(', ')}</span>
                                    </td>
                                    <td className="py-4 text-right text-slate-800 font-semibold">
                                      {item.requiredQty.toFixed(2)} {item.unit}
                                    </td>
                                    <td className="py-4 text-right text-slate-500 font-mono text-xs">
                                      ¥{item.unitPrice.toLocaleString()} / {item.unit}
                                    </td>
                                    <td className="py-4 text-right pl-6 font-bold text-slate-800">
                                      ¥{item.estCost.toLocaleString()}
                                    </td>
                                    <td className="py-4 text-right pl-6 text-slate-500 text-xs">
                                      {getTomorrowDateString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {/* Operational statistics and cost summaries */}
                  <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex gap-6">
                      <div>
                        <h4 className="text-emerald-400 font-bold tracking-wider uppercase text-[10px]">Active Suppliers</h4>
                        <p className="text-lg font-bold text-white mt-1">{checkedSuppliersCount}</p>
                      </div>
                      <div>
                        <h4 className="text-emerald-400 font-bold tracking-wider uppercase text-[10px]">Ingredient Lines</h4>
                        <p className="text-lg font-bold text-white mt-1">{checkedIngredientLinesCount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-xs mr-2">Grand Total Cost:</span>
                      <span className="text-2xl font-bold text-white">¥{grandTotalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Manager Gatekeeper panel */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Manager Approval</h3>

                    {!purchaseApproved ? (
                      <div className="mt-4 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          The operations manager reviews the ingredient quantities, estimated costs, suppliers, and delivery dates before approving the purchase requirements.
                        </p>
                        <button
                          onClick={handleApprovePurchaseRequirements}
                          disabled={activePurchaseItems.length === 0}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 rounded-lg shadow-sm text-sm transition-colors text-center"
                        >
                          Approve Purchase Requirements
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-6">
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-emerald-800 text-xs font-semibold">
                          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Purchase requirements approved
                        </div>

                        {/* Simulation cascades */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Simulated Actions (Demo)</p>
                          
                          {/* Log 1 */}
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">
                              {simulationStatuses.posPrepared === 'success' && (
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                              {simulationStatuses.posPrepared === 'pending' && (
                                <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              )}
                              {simulationStatuses.posPrepared === 'idle' && (
                                <span className="w-4 h-4 rounded-full border border-slate-200 block" />
                              )}
                            </span>
                            <span className={`text-xs ${simulationStatuses.posPrepared === 'success' ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                              Supplier purchase orders prepared
                            </span>
                          </div>

                          {/* Log 2 */}
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">
                              {simulationStatuses.financeCreated === 'success' && (
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                              {simulationStatuses.financeCreated === 'pending' && (
                                <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              )}
                              {simulationStatuses.financeCreated === 'idle' && (
                                <span className="w-4 h-4 rounded-full border border-slate-200 block" />
                              )}
                            </span>
                            <span className={`text-xs ${simulationStatuses.financeCreated === 'success' ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                              Finance record created
                            </span>
                          </div>

                          {/* Log 3 */}
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">
                              {simulationStatuses.kitchenNotified === 'success' && (
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                              {simulationStatuses.kitchenNotified === 'pending' && (
                                <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              )}
                              {simulationStatuses.kitchenNotified === 'idle' && (
                                <span className="w-4 h-4 rounded-full border border-slate-200 block" />
                              )}
                            </span>
                            <span className={`text-xs ${simulationStatuses.kitchenNotified === 'success' ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                              Roppongi central kitchen notified
                            </span>
                          </div>

                          {/* Log 4 */}
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">
                              {simulationStatuses.auditLogged === 'success' && (
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                              {simulationStatuses.auditLogged === 'pending' && (
                                <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              )}
                              {simulationStatuses.auditLogged === 'idle' && (
                                <span className="w-4 h-4 rounded-full border border-slate-200 block" />
                              )}
                            </span>
                            <span className={`text-xs ${simulationStatuses.auditLogged === 'success' ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                              Audit log recorded
                            </span>
                          </div>
                        </div>

                        {simulationStatuses.auditLogged === 'success' && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center mt-6">
                            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-emerald-800 text-xs">Plan Dispatched Successfully</h4>
                            <p className="text-[10px] text-emerald-600 mt-1 leading-normal">
                              Vendor order requests and kitchen batches locked. Real-world systems simulated and validated.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
