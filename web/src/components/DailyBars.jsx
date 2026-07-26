import React from "react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fmtPct, fmtTokens, fmtUsd } from "@/format";

export function DailyBars({ daily, t, reducedMotion = false }) {
  if (!daily?.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        {t("noData")}
      </div>
    );
  }

  const max = Math.max(...daily.map((d) => d.totalTokens || 0), 1);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-52 items-end gap-1 overflow-x-auto thin-scroll px-0.5 pb-1">
        {daily.map((d, i) => {
          const h = Math.max(4, Math.round(((d.totalTokens || 0) / max) * 170));
          return (
            <Tooltip key={d.date}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="group flex min-w-[18px] max-w-[36px] flex-1 flex-col items-center gap-1.5 border-0 bg-transparent p-0"
                >
                  <motion.div
                    className="w-full rounded-t-md rounded-b-sm bg-gradient-to-t from-primary/50 to-primary"
                    style={{ height: h, transformOrigin: "bottom" }}
                    initial={reducedMotion ? false : { scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : {
                            delay: Math.min(i * 0.02, 0.5),
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                  />
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                    {d.date.slice(5)}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="font-medium">{d.date}</div>
                <div className="text-muted-foreground">
                  {fmtTokens(d.totalTokens)} · {fmtUsd(d.costUsd)} · hit{" "}
                  {fmtPct(d.cacheHitRate)}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
