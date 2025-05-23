const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="border rounded-lg p-4 shadow-md bg-white">{children}</div>
  );
  
  const CardContent = ({ children }: { children: React.ReactNode }) => (
    <div className="p-2">{children}</div>
  );
  
  export { Card, CardContent };
  