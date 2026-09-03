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
  finalPrice: number;
  metalName: string;
  error?: string;
} {
  const weight = Number(product.weight || 0);
  const makingCharge = Number(product.makingCharge || 0);
  const makingChargeType = product.makingChargeType || 'fixed';
  const wastagePercent = Number(product.wastagePercent || 0);

  if (!product.metalRef) {
    return {
      rawMetalPrice: 0,
      wastageValue: 0,
      makingChargeValue: 0,
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
      finalPrice: 0,
      metalName: matchedMetal.metalName,
      error: 'Metal price unavailable — reassign metal'
    };
  }

  const ratePerGram = matchedMetal.pricePerGram || 0;
  const rawMetalPrice = ratePerGram * weight;
  const wastageValue = rawMetalPrice * (wastagePercent / 100);

  let makingChargeValue = 0;
  if (makingChargeType === 'percentage') {
    makingChargeValue = rawMetalPrice * (makingCharge / 100);
  } else if (makingChargeType === 'fixed_per_gram') {
    makingChargeValue = makingCharge * weight;
  } else {
    // default to absolute fixed amount
    makingChargeValue = makingCharge;
  }

  const finalPrice = rawMetalPrice + wastageValue + makingChargeValue;

  return {
    rawMetalPrice: Math.round(rawMetalPrice),
    wastageValue: Math.round(wastageValue),
    makingChargeValue: Math.round(makingChargeValue),
    finalPrice: Math.round(finalPrice),
    metalName: matchedMetal.metalName
  };
}
