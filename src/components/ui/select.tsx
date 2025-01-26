import * as React from "react";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType>({
  isOpen: false,
  setIsOpen: () => {}
});

export function Select({
  value,
  onValueChange,
  children
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen, value } = React.useContext(SelectContext);
  
  return (
    <button 
      onClick={() => setIsOpen(!isOpen)}
      className="w-full px-4 py-2 text-left border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </button>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0" 
        onClick={() => setIsOpen(false)} 
      />
      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
        {children}
      </div>
    </>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { onValueChange, setIsOpen } = React.useContext(SelectContext);

  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen(false);
  };

  return (
    <div
      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
      onClick={handleClick}
    >
      {children}
    </div>
  );
}