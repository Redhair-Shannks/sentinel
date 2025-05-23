const Table = ({ children }: { children: React.ReactNode }) => (
    <table className="w-full border-collapse">{children}</table>
  );
  
  const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-200">{children}</thead>
  );
  
  const TableRow = ({ children }: { children: React.ReactNode }) => (
    <tr className="border-b">{children}</tr>
  );
  
  const TableHead = ({ children }: { children: React.ReactNode }) => (
    <th className="p-2 text-left">{children}</th>
  );
  
  const TableBody = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;
  
  const TableCell = ({ children }: { children: React.ReactNode }) => (
    <td className="p-2">{children}</td>
  );
  
  export { Table, TableHeader, TableRow, TableHead, TableBody, TableCell };
  