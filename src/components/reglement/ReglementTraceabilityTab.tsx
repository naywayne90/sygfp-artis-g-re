/**
 * P2.4 — Onglet "Traçabilité" dans ReglementDetails
 *
 * Affiche deux sections :
 *   1. Timeline chaîne complète (engagement → liquidation → ordonnancement
 *      → règlement → visa → paiement → rapprochement) — via RPC P2
 *   2. Audit log immuable (INSERT/UPDATE/DELETE snapshots) — via P1.3
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleCheck, CircleDashed, FileStack, GitBranch, Shield, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  useReglementTraceability,
  useReglementAuditLog,
  type TraceabilityEvent,
  type TraceabilityStep,
  type ReglementAuditEntry,
} from '@/hooks/useReglementTraceability';
import { formatCurrency } from '@/lib/utils';

const STEP_COLORS: Record<TraceabilityStep, string> = {
  engagement: 'bg-blue-500',
  liquidation: 'bg-indigo-500',
  ordonnancement_cree: 'bg-purple-500',
  ordonnancement_valide: 'bg-purple-600',
  reglement_cree: 'bg-orange-500',
  visa: 'bg-amber-500',
  paiement: 'bg-emerald-500',
  rapprochement: 'bg-teal-500',
};

const STEP_LABELS: Record<TraceabilityStep, string> = {
  engagement: 'Engagement',
  liquidation: 'Liquidation',
  ordonnancement_cree: 'Ordonnancement créé',
  ordonnancement_valide: 'Ordonnancement validé',
  reglement_cree: 'Règlement émis',
  visa: 'Visa numérique',
  paiement: 'Décaissement',
  rapprochement: 'Rapprochement bancaire',
};

function formatEventDate(at: string | null): string {
  if (!at) return '—';
  try {
    const d = new Date(at);
    return format(d, 'dd MMM yyyy HH:mm', { locale: fr });
  } catch {
    return at;
  }
}

function TraceabilityTimeline({ events }: { events: TraceabilityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Aucun événement enregistré sur cette chaîne.
      </p>
    );
  }

  const sorted = [...events].sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return ta - tb;
  });

  return (
    <div className="relative space-y-4">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden />
      {sorted.map((ev, idx) => (
        <div key={`${ev.step}-${idx}`} className="relative flex gap-4 pl-0">
          <div
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
              STEP_COLORS[ev.step] ?? 'bg-muted'
            }`}
          >
            {ev.at ? <CircleCheck className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
          </div>
          <div className="flex-1 rounded-md border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{ev.label}</p>
                <p className="text-xs text-muted-foreground">{STEP_LABELS[ev.step]}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {formatEventDate(ev.at)}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {typeof ev.montant === 'number' && (
                <Badge variant="outline">{formatCurrency(ev.montant)}</Badge>
              )}
              {ev.mode && <Badge variant="outline">Mode : {ev.mode}</Badge>}
              {ev.ref && <Badge variant="outline">Réf : {ev.ref}</Badge>}
              {ev.statut && <Badge variant="secondary">{ev.statut}</Badge>}
              {ev.statut_rapprochement && (
                <Badge variant="secondary">{ev.statut_rapprochement}</Badge>
              )}
              {ev.hash && (
                <Badge variant="outline" className="font-mono">
                  SHA-256 : {ev.hash.slice(0, 12)}…
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderJsonDiff(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): Array<{ key: string; old: unknown; new: unknown }> {
  const keys = new Set<string>([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]);
  const diff: Array<{ key: string; old: unknown; new: unknown }> = [];
  for (const key of Array.from(keys).sort()) {
    const ov = oldData?.[key];
    const nv = newData?.[key];
    if (JSON.stringify(ov) !== JSON.stringify(nv)) {
      diff.push({ key, old: ov, new: nv });
    }
  }
  return diff;
}

function AuditEntryCard({ entry }: { entry: ReglementAuditEntry }) {
  const actionColor =
    entry.action === 'INSERT'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
      : entry.action === 'DELETE'
        ? 'bg-destructive/10 text-destructive border-destructive/30'
        : 'bg-amber-500/10 text-amber-700 border-amber-500/30';

  const diff = entry.action === 'UPDATE' ? renderJsonDiff(entry.old_data, entry.new_data) : [];

  return (
    <div className="rounded-md border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Badge className={actionColor} variant="outline">
          {entry.action}
        </Badge>
        <span className="text-xs text-muted-foreground">{formatEventDate(entry.changed_at)}</span>
      </div>
      {entry.changed_by && (
        <p className="mt-1 text-xs text-muted-foreground">
          Par utilisateur <span className="font-mono">{entry.changed_by.slice(0, 8)}…</span>
        </p>
      )}
      {entry.action === 'UPDATE' && diff.length > 0 && (
        <div className="mt-2 space-y-1 text-xs">
          {diff.slice(0, 8).map((d) => (
            <div key={d.key} className="flex items-start gap-2">
              <span className="w-32 shrink-0 font-mono text-muted-foreground">{d.key}</span>
              <span className="flex-1 space-x-1">
                <span className="rounded bg-destructive/10 px-1 text-destructive line-through">
                  {String(d.old ?? '∅')}
                </span>
                <span>→</span>
                <span className="rounded bg-emerald-500/10 px-1 text-emerald-700">
                  {String(d.new ?? '∅')}
                </span>
              </span>
            </div>
          ))}
          {diff.length > 8 && (
            <p className="text-muted-foreground">… et {diff.length - 8} autre(s) changement(s)</p>
          )}
        </div>
      )}
    </div>
  );
}

interface ReglementTraceabilityTabProps {
  reglementId: string;
}

export function ReglementTraceabilityTab({ reglementId }: ReglementTraceabilityTabProps) {
  const traceabilityQuery = useReglementTraceability(reglementId);
  const auditQuery = useReglementAuditLog(reglementId);

  return (
    <div className="space-y-6 pt-4">
      {/* Section 1 — Timeline chaîne */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-5 w-5" />
            Chaîne de traçabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          {traceabilityQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {traceabilityQuery.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur de chargement de la chaîne</AlertTitle>
              <AlertDescription>{traceabilityQuery.error.message}</AlertDescription>
            </Alert>
          )}
          {traceabilityQuery.data?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{traceabilityQuery.data.error}</AlertDescription>
            </Alert>
          )}
          {traceabilityQuery.data?.events && (
            <TraceabilityTimeline events={traceabilityQuery.data.events} />
          )}
        </CardContent>
      </Card>

      {/* Section 2 — Audit log immuable P1.3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />
            Audit log immuable
            {auditQuery.data && (
              <Badge variant="secondary" className="ml-2">
                {auditQuery.data.length} entrée(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {auditQuery.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Audit log inaccessible</AlertTitle>
              <AlertDescription>
                Lecture réservée aux rôles ADMIN / AUDITOR / TRESORERIE / DG / DAAF.
              </AlertDescription>
            </Alert>
          )}
          {auditQuery.data && auditQuery.data.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground italic">
              <FileStack className="h-4 w-4" />
              Aucune entrée d'audit pour ce règlement.
            </p>
          )}
          {auditQuery.data && auditQuery.data.length > 0 && (
            <div className="space-y-3">
              {auditQuery.data.map((entry) => (
                <AuditEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
