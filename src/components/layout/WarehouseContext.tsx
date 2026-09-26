"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface WarehouseContextValue {
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  warehouses: WarehouseOption[];
  setWarehouses: (warehouses: WarehouseOption[]) => void;
  selectedWarehouse: WarehouseOption | undefined;
}

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

export function WarehouseProvider({
  children,
  initialWarehouses = [],
  initialSelectedId = "ALL",
}: {
  children: React.ReactNode;
  initialWarehouses?: WarehouseOption[];
  initialSelectedId?: string;
}) {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>(initialWarehouses);
  const [selectedWarehouseId, setSelectedWarehouseIdState] = useState<string>(initialSelectedId);

  useEffect(() => {
    const saved = localStorage.getItem("stocksense_warehouse_id");
    if (saved) {
      setSelectedWarehouseIdState(saved);
    }
  }, []);

  const setSelectedWarehouseId = (id: string) => {
    setSelectedWarehouseIdState(id);
    localStorage.setItem("stocksense_warehouse_id", id);
  };

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  return (
    <WarehouseContext.Provider
      value={{
        selectedWarehouseId,
        setSelectedWarehouseId,
        warehouses,
        setWarehouses,
        selectedWarehouse,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error("useWarehouse must be used within a WarehouseProvider");
  }
  return context;
}
