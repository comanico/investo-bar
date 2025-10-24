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
import { VinItem } from "@/actions/getVin";

export function VinTable({ items }: { items: VinItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Aperol</TableHead>
          <TableHead>Vin Alb</TableHead>
          <TableHead>Vin Rosu</TableHead>
          <TableHead>Prosecco</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              No wine data available
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.Aperol}</TableCell>
              <TableCell>{item.Vin_Alb}</TableCell>
              <TableCell>{item.Vin_Rosu}</TableCell>
              <TableCell>{item.Prosecco}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
