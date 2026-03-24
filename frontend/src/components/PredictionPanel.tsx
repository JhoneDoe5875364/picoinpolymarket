"use client";

import { useEffect, useState } from "react";
import type { Market } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";
import { PlacePosition } from "./PlacePosition";


interface PredictionPanelProps {
  market: Market;
}

export function PredictionPanel({ market }: PredictionPanelProps) {
  const [side, setSide] = useState<"yes" | "no" | undefined>();

  const [yesPrice, setYesPrice] = useState(0.5)
  const [noPrice, setNoPrice] = useState(0.5)

  useEffect(() => {
    setYesPrice(market?.yes_price ?? 0.5)
    setNoPrice(market?.no_price ?? 0.5)
  }, [market])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Place Prediction</CardTitle>
        <CardDescription>Market is {market.status}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          onValueChange={(value: "yes" | "no") => setSide(value)}
          defaultValue={side}
          className="grid grid-cols-2 gap-4"
          disabled={market.status !== "open"}
        >
          <div>
            <RadioGroupItem value="yes" id="yes" className="peer sr-only" />
            <Label
              htmlFor="yes"
              className={cn(
                "flex flex-col items-center justify-between rounded-md",
                "border-2 border-border bg-popover p-4",
                "cursor-pointer shadow-sm",
                "hover:border-primary hover:shadow-md hover:bg-secondary/80",
                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/40",
                "transition-all duration-200 ease-in-out"
              )}
            >
              Forecast YES
              <span className="font-bold text-lg" style={{ color: "#00F5FF" }}>
                {yesPrice.toFixed(2)} π
              </span>
            </Label>
          </div>

          <div>
            <RadioGroupItem value="no" id="no" className="peer sr-only" />
            <Label
              htmlFor="no"
              className={cn(
                "flex flex-col items-center justify-between rounded-md",
                "border-2 border-border bg-popover p-4",
                "cursor-pointer shadow-sm",
                "hover:border-primary hover:shadow-md hover:bg-secondary/80",
                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/40",
                "transition-all duration-200 ease-in-out"
              )}
            >
              Forecast NO
              <span className="font-bold text-lg" style={{ color: "#FF2ECF" }}>
                {noPrice.toFixed(2)} π
              </span>
            </Label>
          </div>
        </RadioGroup>

        {side && <PlacePosition market={market} side={side} />}

      </CardContent>
    </Card>
  );
}
