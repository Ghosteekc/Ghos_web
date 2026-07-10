import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, User, Users } from "lucide-react";
import { api, ApiError } from "@/api/client";
import { SearchResult } from "@/types";
import { Card, Button, Loader } from "@/components/ui";
import { formatPlayerTag } from "@/utils";
import { usePageRefresh } from "@/hooks";

export function PlayerPreviewPage() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tag) return;
    try {
      setError(null);
      setPlayer(await api.getPlayerPreview(tag));
    } catch (e) {
      setPlayer(null);
      setError(e instanceof ApiError ? e.message : "Игрок не найден");
    } finally {
      setLoading(false);
    }
  }, [tag]);

  usePageRefresh(load);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="!p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-cr-text">Игрок</h1>
      </div>

      {loading ? (
        <Loader />
      ) : error || !player ? (
        <Card className="text-center text-cr-loss text-sm">{error ?? "Не найден"}</Card>
      ) : (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-cr-surface flex items-center justify-center text-xl font-bold text-cr-gold">
              {player.player_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-cr-text truncate">{player.player_name}</p>
              <p className="text-sm text-cr-muted font-mono">{formatPlayerTag(player.player_tag)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-cr-bg/60 p-3 border border-cr-border/40">
              <div className="flex items-center gap-1 text-cr-gold mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs text-cr-muted">Кубки</span>
              </div>
              <p className="font-bold text-cr-text">{player.trophies}</p>
            </div>
            {player.max_trophies != null && (
              <div className="rounded-xl bg-cr-bg/60 p-3 border border-cr-border/40">
                <p className="text-xs text-cr-muted mb-1">Макс.</p>
                <p className="font-bold text-cr-text">{player.max_trophies}</p>
              </div>
            )}
            <div className="rounded-xl bg-cr-bg/60 p-3 border border-cr-border/40 col-span-2">
              <p className="text-xs text-cr-muted mb-1">Арена</p>
              <p className="font-semibold text-cr-text">{player.arena}</p>
            </div>
            {player.clan_name && (
              <div className="rounded-xl bg-cr-bg/60 p-3 border border-cr-border/40 col-span-2">
                <div className="flex items-center gap-1 text-cr-muted mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Клан</span>
                </div>
                <p className="font-semibold text-cr-text">{player.clan_name}</p>
              </div>
            )}
            {player.exp_level != null && (
              <div className="rounded-xl bg-cr-bg/60 p-3 border border-cr-border/40">
                <div className="flex items-center gap-1 text-cr-muted mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs">Уровень</span>
                </div>
                <p className="font-bold text-cr-text">{player.exp_level}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export { PlayerPreviewPage as default };
