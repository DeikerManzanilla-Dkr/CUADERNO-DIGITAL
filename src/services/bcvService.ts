import { useState, useEffect, useCallback } from "react";

export interface ExchangeRate {
  usdToBs: number;
  source: "api" | "manual";
  lastUpdated: Date;
}

const API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";
const STORAGE_KEY = "bcv_rate_session";

// Fetch rate from API
export const fetchBCVRate = async (): Promise<ExchangeRate | null> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch rate");
    
    const data = await response.json();
    // The API returns rate in 'promedio' or 'venta' field
    const rate = data.promedio || data.venta || data.compra;
    
    if (!rate || isNaN(rate)) {
      throw new Error("Invalid rate data");
    }

    return {
      usdToBs: Number(rate),
      source: "api",
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error fetching BCV rate:", error);
    return null;
  }
};

// Save to session storage
export const saveRateToStorage = (rate: ExchangeRate) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...rate,
      lastUpdated: rate.lastUpdated.toISOString(),
    }));
  } catch {
    // Ignore storage errors
  }
};

// Load from session storage
export const loadRateFromStorage = (): ExchangeRate | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      usdToBs: parsed.usdToBs,
      source: parsed.source,
      lastUpdated: new Date(parsed.lastUpdated),
    };
  } catch {
    return null;
  }
};

// Format BS with Intl.NumberFormat
export const formatBs = (amount: number): string => {
  return new Intl.NumberFormat("es-VE", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " Bs";
};

// Format USD
export const formatUsd = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Convert USD to BS
export const usdToBs = (usdAmount: number, rate: number): number => {
  return usdAmount * rate;
};

// React Hook for exchange rate
export const useExchangeRate = () => {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from storage on mount
  useEffect(() => {
    const stored = loadRateFromStorage();
    if (stored) {
      setRate(stored);
    }
  }, []);

  // Fetch from API
  const fetchRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const newRate = await fetchBCVRate();
    
    if (newRate) {
      setRate(newRate);
      saveRateToStorage(newRate);
    } else {
      setError("No se pudo obtener la tasa");
    }
    
    setLoading(false);
    return newRate;
  }, []);

  // Update rate manually
  const setManualRate = useCallback((usdToBs: number) => {
    const newRate: ExchangeRate = {
      usdToBs,
      source: "manual",
      lastUpdated: new Date(),
    };
    setRate(newRate);
    saveRateToStorage(newRate);
  }, []);

  // Auto-fetch on mount if no stored rate
  useEffect(() => {
    const stored = loadRateFromStorage();
    if (!stored) {
      fetchRate();
    }
  }, [fetchRate]);

  return {
    rate,
    loading,
    error,
    fetchRate,
    setManualRate,
  };
};
