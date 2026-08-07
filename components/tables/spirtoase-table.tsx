"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SpirtoaseItem } from "@/actions/getSpirtoase";

export function SpirtoaseTable({ items }: { items: SpirtoaseItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Jameson</TableHead>
          <TableHead>Jameson Black Barrel</TableHead>
          <TableHead>Fireball</TableHead>
          <TableHead>Tequilla</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              No spirtoase data available
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.Jameson}</TableCell>
              <TableCell>{item.Jameson_Black_Barrel}</TableCell>
              <TableCell>{item.Fireball}</TableCell>
              <TableCell>{item.Tequilla}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
