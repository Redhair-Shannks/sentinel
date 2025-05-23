import { createContext, useContext, useState, ReactNode } from "react";

interface FlaskResponseContextType {
  flaskResponse: string | null;
  setFlaskResponse: (response: string | null) => void; // Fixed: Allow setting null
}

const FlaskResponseContext = createContext<FlaskResponseContextType | undefined>(undefined);

export const FlaskResponseProvider = ({ children }: { children: ReactNode }) => {
  const [flaskResponse, setFlaskResponse] = useState<string | null>(null);

  return (
    <FlaskResponseContext.Provider value={{ flaskResponse, setFlaskResponse }}>
      {children}
    </FlaskResponseContext.Provider>
  );
};

export const useFlaskResponse = () => {
  const context = useContext(FlaskResponseContext);
  if (!context) {
    throw new Error("useFlaskResponse must be used within a FlaskResponseProvider");
  }
  return context;
};
