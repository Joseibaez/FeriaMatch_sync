import { createContext, useContext, useState, ReactNode } from "react";

interface DemoContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  // Use session state only - NOT localStorage to prevent manipulation
  const [isDemoMode, setIsDemoMode] = useState(false);

  const enterDemoMode = () => {
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
