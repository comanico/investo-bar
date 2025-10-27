// components/racoritoare-table.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RacoritoareItem } from "@/actions/getRacoritoare";

export function RacoritoareTable({ items }: { items: RacoritoareItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Vin Spumant Fara Alcool</TableHead>
          <TableHead>Apa</TableHead>
          <TableHead>Cola</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground"
            >
              No soft drinks data available
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.Vin_Spumant_Fara_Alcool}</TableCell>
              <TableCell>{item.Apa}</TableCell>
              <TableCell>{item.Cola}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
