import { useCardCatalog } from "@/hooks";
import type { DecisionExplanation, RecommendationSwap } from "@/types";

function SwapBlock({
  swap,
  nameRu,
}: {
  swap: RecommendationSwap;
  nameRu: (name: string) => string;
}) {
  const title = swap.drop
    ? `${nameRu(swap.drop)} → ${nameRu(swap.pick)}`
    : nameRu(swap.pick);

  return (
    <div className="rounded-xl border border-cr-border/60 bg-cr-bg/40 p-3 space-y-1.5">
      <p className="text-sm font-semibold text-cr-text">{title}</p>
      {swap.reason ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Причина</p>
          <p className="text-sm text-cr-text leading-snug mt-0.5">{swap.reason}</p>
        </div>
      ) : null}
    </div>
  );
}

interface DecisionExplanationViewProps {
  explanation: DecisionExplanation | null | undefined;
  title?: string;
  className?: string;
  /** Показывать внутренние детали (только для режима разработчика). */
  debug?: boolean;
}

/** Пользовательский блок рекомендаций — без tier / rating / scores. */
export function DecisionExplanationView({
  explanation,
  title = "Рекомендации",
  className = "",
  debug = false,
}: DecisionExplanationViewProps) {
  const { nameRu } = useCardCatalog();

  const swaps: RecommendationSwap[] =
    explanation?.swaps?.length
      ? explanation.swaps
      : (explanation?.pick_explanations ?? [])
          .filter((pe) => pe.pick)
          .map((pe) => ({
            drop: pe.drop,
            pick: pe.pick,
            reason: pe.reason || "",
          }));

  if (!explanation || swaps.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {title ? (
        <h3 className="text-base font-semibold text-cr-text">{title}</h3>
      ) : null}
      {swaps.map((swap) => (
        <SwapBlock
          key={`${swap.drop ?? ""}-${swap.pick}-${swap.reason}`}
          swap={swap}
          nameRu={nameRu}
        />
      ))}
      {debug && import.meta.env.DEV ? (
        <pre className="text-3xs text-cr-muted overflow-auto max-h-40 rounded-lg bg-cr-bg/60 p-2">
          {JSON.stringify(
            {
              why_gaps: explanation.why_gaps,
              rejected: explanation.rejected,
              pick_explanations: explanation.pick_explanations,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
}
