/**
 * Composant de test pour la génération de références ARTI
 * À utiliser en mode admin pour vérifier le bon fonctionnement
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Copy, RefreshCw } from "lucide-react";
import { 
  generateARTIReference, 
  parseARTIReferenceLocal, 
  formatARTIReference,
  formatARTIReferenceShort,
  getCountersStatus,
  ETAPE_CODES,
  ETAPE_LABELS,
} from "@/lib/notes-sef/referenceService";

interface GeneratedReference {
  id: number;
  reference: string;
  formatted: string;
  short: string;
  etape: number;
  mois: number;
  annee: number;
  numero: number;
  timestamp: Date;
}

interface CounterStatus {
  etape: number;
  mois: number;
  annee: number;
  dernierNumero: number;
}

export default function ARTIReferenceTest() {
  const { toast } = useToast();
  const [selectedEtape, setSelectedEtape] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCounters, setIsLoadingCounters] = useState(false);
  const [generatedRefs, setGeneratedRefs] = useState<GeneratedReference[]>([]);
  const [counters, setCounters] = useState<CounterStatus[]>([]);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const reference = await generateARTIReference(selectedEtape);
      const parsed = parseARTIReferenceLocal(reference);
      
      const newRef: GeneratedReference = {
        id: Date.now(),
        reference,
        formatted: formatARTIReference(reference),
        short: formatARTIReferenceShort(reference),
        etape: parsed.etape,
        mois: parsed.mois,
        annee: parsed.annee,
        numero: parsed.numero,
        timestamp: new Date(),
      };

      setGeneratedRefs((prev) => [newRef, ...prev.slice(0, 9)]);
      
      toast({
        title: "Référence générée",
        description: `${reference} (${ETAPE_LABELS[selectedEtape]})`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur de génération",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestSequence = async () => {
    setIsGenerating(true);
    setTestResult(null);
    
    try {
      // Générer 2 références consécutives pour vérifier l'incrémentation
      const ref1 = await generateARTIReference(selectedEtape);
      const ref2 = await generateARTIReference(selectedEtape);
      
      const parsed1 = parseARTIReferenceLocal(ref1);
      const parsed2 = parseARTIReferenceLocal(ref2);
      
      // Vérifier que le numéro s'incrémente
      const isSequential = parsed2.numero === parsed1.numero + 1;
      
      setGeneratedRefs((prev) => [
        {
          id: Date.now() + 1,
          reference: ref2,
          formatted: formatARTIReference(ref2),
          short: formatARTIReferenceShort(ref2),
          ...parsed2,
          timestamp: new Date(),
        },
        {
          id: Date.now(),
          reference: ref1,
          formatted: formatARTIReference(ref1),
          short: formatARTIReferenceShort(ref1),
          ...parsed1,
          timestamp: new Date(),
        },
        ...prev.slice(0, 7),
      ]);
      
      setTestResult(isSequential ? "success" : "error");
      
      toast({
        variant: isSequential ? "default" : "destructive",
        title: isSequential ? "Test réussi ✓" : "Test échoué ✗",
        description: isSequential 
          ? `Séquence correcte: ${parsed1.numero} → ${parsed2.numero}`
          : `Séquence incorrecte: ${parsed1.numero} → ${parsed2.numero}`,
      });
    } catch (error) {
      setTestResult("error");
      toast({
        variant: "destructive",
        title: "Test échoué",
        description: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadCounters = async () => {
    setIsLoadingCounters(true);
    try {
      const data = await getCountersStatus();
      setCounters(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les compteurs",
      });
    } finally {
      setIsLoadingCounters(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié", description: text });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Test Génération Référence ARTI
            {testResult === "success" && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Test OK
              </Badge>
            )}
            {testResult === "error" && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Échec
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Format: ARTI + ÉTAPE(1) + MM(2) + YY(2) + NNNN(4) = 13 caractères
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={selectedEtape.toString()}
              onValueChange={(v) => setSelectedEtape(parseInt(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sélectionner l'étape" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ETAPE_CODES).map(([label, code]) => (
                  <SelectItem key={code} value={code.toString()}>
                    {code} - {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Générer une référence
            </Button>

            <Button 
              variant="outline" 
              onClick={handleTestSequence} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Test séquence (2 refs)
            </Button>
          </div>

          {generatedRefs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence brute</TableHead>
                  <TableHead>Formatée</TableHead>
                  <TableHead>Courte</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead>Mois/Année</TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedRefs.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-mono text-sm">
                      {ref.reference}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {ref.formatted}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ref.short}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ref.etape} - {ETAPE_LABELS[ref.etape]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {String(ref.mois).padStart(2, "0")}/{ref.annee}
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {String(ref.numero).padStart(4, "0")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(ref.reference)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>État des compteurs</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLoadCounters}
              disabled={isLoadingCounters}
            >
              {isLoadingCounters ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Compteurs séquentiels par (étape, mois, année)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {counters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étape</TableHead>
                  <TableHead>Mois</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Dernier N°</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counters.map((counter, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline">
                        {counter.etape} - {ETAPE_LABELS[counter.etape]}
                      </Badge>
                    </TableCell>
                    <TableCell>{String(counter.mois).padStart(2, "0")}</TableCell>
                    <TableCell>{counter.annee}</TableCell>
                    <TableCell className="font-mono font-bold">
                      {String(counter.dernierNumero).padStart(4, "0")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              Cliquez sur le bouton pour charger les compteurs
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
