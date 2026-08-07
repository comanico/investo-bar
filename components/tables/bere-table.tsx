// components/bere-table.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BereItem } from "@/actions/getBere";

export function BereTable({ items }: { items: BereItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Heineken</TableHead>
          <TableHead>Corona</TableHead>
          <TableHead>Peroni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              No beer data available
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.Heineken}</TableCell>
              <TableCell>{item.Corona}</TableCell>
              <TableCell>{item.Peroni}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
