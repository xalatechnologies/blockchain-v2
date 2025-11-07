"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon } from "lucide-react";

interface HalalFilterProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function HalalFilter({ enabled, onToggle }: HalalFilterProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
      <div className="flex items-center space-x-2">
        <Moon className="h-4 w-4 text-accent" />
        <Label htmlFor="halal-filter" className="text-sm font-medium cursor-pointer">
          Show Only Halal Assets
        </Label>
      </div>
      <Switch
        id="halal-filter"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}

