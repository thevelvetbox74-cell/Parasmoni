/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Dynamic Product Price Calculator
 */

export interface PricingParams {
  metalRef?: string;
  weight?: number | string;
  makingCharge?: number | string;
  makingChargeType?: 'fixed' | 'percentage' | 'fixed_per_gram' | string;
  wastagePercent?: number | string;
  otherChargesName?: string;
  otherChargesAmount?: number | string;
  gstPercent?: number | string;
  hallmarkCharge?: number | string;
}

export interface MetalPriceItem {
  id: string;
  metalName: string;
  pricePerGram: number; // stored as price per 1g
  status: string;
}

export function calculateProductPrice(
  product: PricingParams,
  metalPrices: MetalPriceItem[]
): {
  rawMetalPrice: number;
  wastageValue: number;
  makingChargeValue: number;
  otherChargesAmount?: number;
  otherChargesName?: string;
  hallmarkCharge?: number;
  gstPercent?: number;
  gstValue?: number;
  finalPrice: number;
  metalName: string;
  error?: string;
} {
  const weight = Number(product.weight || 0);
  const makingCharge = Number(product.makingCharge || 0);
  const makingChargeType = product.makingChargeType || 'fixed';
  const wastagePercent = Number(product.wastagePercent || 0);
  const otherChargesName = product.otherChargesName || 'Other Charges';
  const otherChargesAmount = Number(product.otherChargesAmount || 0);
  const hallmarkCharge = Number(product.hallmarkCharge || 0);
  const gstPercent = Number(product.gstPercent !== undefined ? product.gstPercent : 3); // 3% default for gold jewellery

  if (!product.metalRef) {
    return {
      rawMetalPrice: 0,
      wastageValue: 0,
      makingChargeValue: 0,
      otherChargesAmount: 0,
      otherChargesName,
      hallmarkCharge: 0,
      gstPercent,
      gstValue: 0,
      finalPrice: 0,
      metalName: '',
      error: 'Metal price unavailable — reassign metal'
    };
  }

  const matchedMetal = metalPrices.find(m => m.id === product.metalRef);
  if (!matchedMetal) {
    return {
      rawMetalPrice: 0,
      wastageValue: 0,
      makingChargeValue: 0,
      otherChargesAmount: 0,
      otherChargesName,
      hallmarkCharge: 0,
      gstPercent,
      gstValue: 0,
      finalPrice: 0,
      metalName: '',
      error: 'Metal price unavailable — reassign metal'
    };
  }

  if (matchedMetal.status === 'inactive') {
    return {
      rawMetalPrice: 0,
      wastageValue: 0,
      makingChargeValue: 0,
      otherChargesAmount: 0,
      otherChargesName,
      hallmarkCharge: 0,
      gstPercent,
      gstValue: 0,
      finalPrice: 0,
      metalName: matchedMetal.metalName,
      error: 'Metal price unavailable — reassign metal'
    };
  }

  const ratePerGram = matchedMetal.pricePerGram || 0;
  const rawMetalPrice = ratePerGram * weight;
  const wastageValue = 0;

  let makingChargeValue = 0;
  if (makingChargeType === 'percentage') {
    makingChargeValue = rawMetalPrice * (makingCharge / 100);
  } else if (makingChargeType === 'fixed_per_gram') {
    makingChargeValue = makingCharge * weight;
  } else {
    // default to absolute fixed amount
    makingChargeValue = makingCharge;
  }

  const priceBeforeGst = rawMetalPrice + makingChargeValue + otherChargesAmount + hallmarkCharge;
  const gstValue = priceBeforeGst * (gstPercent / 100);
  const finalPrice = priceBeforeGst + gstValue;

  return {
    rawMetalPrice: Math.round(rawMetalPrice),
    wastageValue: Math.round(wastageValue),
    makingChargeValue: Math.round(makingChargeValue),
    otherChargesAmount: Math.round(otherChargesAmount),
    otherChargesName,
    hallmarkCharge: Math.round(hallmarkCharge),
    gstPercent,
    gstValue: Math.round(gstValue),
    finalPrice: Math.round(finalPrice),
    metalName: matchedMetal.metalName
  };
}
