"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceBadgeProps {
  className?: string;
}

export function ComplianceBadge({ className }: ComplianceBadgeProps) {
  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      <CheckCircle2 className="h-4 w-4 text-success" />
      <span className="text-foreground/70">Sharia Compliant</span>
      <span className="text-xs text-foreground/50">(AAOIFI Certified)</span>
    </div>
  );
}

