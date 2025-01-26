import * as React from "react";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextType>({});

export function Select({
  value,
  onValueChange,
  children
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-100"
      >
        {children}
      </button>
      {isOpen && <SelectContent>{children}</SelectContent>}
    </div>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
      <div className="p-1">
        {children}
      </div>
    </div>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { onValueChange } = React.useContext(SelectContext);
  
  return (
    <button
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100"
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
}