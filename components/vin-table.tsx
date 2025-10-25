// components/vin-table.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VinItem {
  id: number;
  Aperol_Spritz: number;
  Vin_Alb: number;
  Vin_Rosu: number;
  Prosecco: number;
}

export function VinTable({ items }: { items: VinItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Aperol Spritz</TableHead>
          <TableHead>Vin Alb</TableHead>
          <TableHead>Vin Rosu</TableHead>
          <TableHead>Prosecco</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.id}</TableCell>
            <TableCell>{item.Aperol_Spritz}</TableCell>
            <TableCell>{item.Vin_Alb}</TableCell>
            <TableCell>{item.Vin_Rosu}</TableCell>
            <TableCell>{item.Prosecco}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
