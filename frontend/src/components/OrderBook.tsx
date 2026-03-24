
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Market, Position } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface OrderBookProps {
  market: Market;
}

export function OrderBook({ market }: OrderBookProps) {
  const { toast } = useToast();
  const [listings, setListings] = useState<Position[]>([]);
  const [isBuying, setIsBuying] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would be a real-time subscription.
    // For now, just filter the mock positions that are listed for sale.
    const listedPositions = (market?.positions||[])?.filter(p => p.status === 'listed');
    setListings(listedPositions);
  }, [market]);

  const handleBuy = async (position: Position) => {
    setIsBuying(position.id);
    // This is a mock implementation. A real app would call a server action.
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Purchase Successful!",
        description: `You have purchased ${position?.amount_pi}π of "${position.side.toUpperCase()}" shares.`,
      });
      // Remove the bought position from the list
      setListings(prev => prev.filter(p => p.id !== position.id));
    } catch (error) {
      toast({
        title: "An Error Occurred",
        description: "Could not purchase the position. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBuying(null);
    }
  };

  const yesListings = listings.filter(l => l.side === 'yes').sort((a, b) => (a?.price ?? 0) - (b?.price ?? 0));
  const noListings = listings.filter(l => l.side === 'no').sort((a, b) => (a?.price ?? 0) - (b?.price ?? 0));

  if (listings.length === 0) {
    return null; // Don't render the component if there are no listings
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
        <CardDescription>Positions available for purchase from other users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">YES Positions for Sale</h4>
          {yesListings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yesListings.map(pos => (
                  <TableRow key={pos.id}>
                    <TableCell>{pos?.amount_pi.toFixed(2)}π</TableCell>
                    <TableCell className="font-semibold text-primary">{pos?.price?.toFixed(2)}π</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => handleBuy(pos)} disabled={!!isBuying}>
                        {isBuying === pos.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-xs text-muted-foreground text-center py-2">No "YES" positions for sale.</p>}
        </div>
        <div>
          <h4 className="font-semibold mb-2">NO Positions for Sale</h4>
          {noListings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {noListings.map(pos => (
                  <TableRow key={pos.id}>
                    <TableCell>{pos?.amount_pi.toFixed(2)}π</TableCell>
                    <TableCell className="font-semibold text-pink-500">{pos?.price?.toFixed(2)}π</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white" onClick={() => handleBuy(pos)} disabled={!!isBuying}>
                        {isBuying === pos.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-xs text-muted-foreground text-center py-2">No "NO" positions for sale.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
