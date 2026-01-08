import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GripVertical, Plus, Trash2, Play, Copy, AlertTriangle, 
  CheckCircle2, ArrowRight, Settings2 
} from "lucide-react";
import { toast } from "sonner";
import { useCodificationVariables, PatternSegment, CodifVariable } from "@/hooks/useCodificationVariables";
import { useExercice } from "@/contexts/ExerciceContext";

interface PatternEditorProps {
  pattern: PatternSegment[];
  onChange: (pattern: PatternSegment[]) => void;
  onTest?: (code: string, isValid: boolean) => void;
}

export function PatternEditor({ pattern, onChange, onTest }: PatternEditorProps) {
  const { activeVariables, generateCodeFromValues } = useCodificationVariables();
  const { exercice } = useExercice();
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ code: string; isValid: boolean; warnings: string[] } | null>(null);

  const handleAddSegment = () => {
    const newSegment: PatternSegment = {
      var_key: activeVariables[0]?.key || 'OS',
      length: 2,
      required: true,
    };
    onChange([...pattern, newSegment]);
  };

  const handleRemoveSegment = (index: number) => {
    const newPattern = [...pattern];
    newPattern.splice(index, 1);
    onChange(newPattern);
  };

  const handleUpdateSegment = (index: number, updates: Partial<PatternSegment>) => {
    const newPattern = [...pattern];
    newPattern[index] = { ...newPattern[index], ...updates };
    onChange(newPattern);
  };

  const handleMoveSegment = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === pattern.length - 1)
    ) {
      return;
    }

    const newPattern = [...pattern];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newPattern[index], newPattern[targetIndex]] = [newPattern[targetIndex], newPattern[index]];
    onChange(newPattern);
  };

  const handleTest = () => {
    const result = generateCodeFromValues(pattern, testValues, exercice);
    setTestResult(result);
    onTest?.(result.code, result.isValid);
  };

  const handleCopyCode = async () => {
    if (testResult?.code) {
      await navigator.clipboard.writeText(testResult.code);
      toast.success("Code copié");
    }
  };

  const getVariableInfo = (key: string): CodifVariable | undefined => {
    return activeVariables.find(v => v.key === key);
  };

  // Calculate total code length
  const totalLength = pattern.reduce((sum, seg) => {
    const variable = getVariableInfo(seg.var_key);
    return sum + (seg.length || variable?.pad_length || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Pattern Builder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Segments du pattern
          </CardTitle>
          <CardDescription>
            Glissez-déposez pour réordonner. Total: {totalLength} caractères
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {pattern.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun segment défini. Cliquez sur "Ajouter" pour commencer.
            </p>
          ) : (
            pattern.map((segment, index) => {
              const variable = getVariableInfo(segment.var_key);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30 group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-grab opacity-50 hover:opacity-100"
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>

                  <Badge 
                    variant="secondary" 
                    className="font-mono min-w-[80px] justify-center"
                  >
                    {segment.var_key}
                  </Badge>

                  <Select
                    value={segment.var_key}
                    onValueChange={(value) => handleUpdateSegment(index, { var_key: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeVariables.map((v) => (
                        <SelectItem key={v.key} value={v.key}>
                          <span className="font-mono">{v.key}</span>
                          <span className="ml-2 text-muted-foreground text-xs">
                            - {v.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Long:</Label>
                    <Input
                      type="number"
                      value={segment.length || variable?.pad_length || 0}
                      onChange={(e) => handleUpdateSegment(index, { length: parseInt(e.target.value) || 0 })}
                      className="w-14 h-8 text-center"
                      min={1}
                      max={20}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Requis:</Label>
                    <Switch
                      checked={segment.required ?? true}
                      onCheckedChange={(checked) => handleUpdateSegment(index, { required: checked })}
                    />
                  </div>

                  <Input
                    placeholder="Sep."
                    value={segment.separator_after || ''}
                    onChange={(e) => handleUpdateSegment(index, { separator_after: e.target.value })}
                    className="w-12 h-8 text-center"
                    maxLength={2}
                  />

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveSegment(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveSegment(index, 'down')}
                      disabled={index === pattern.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleRemoveSegment(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          <Button variant="outline" size="sm" onClick={handleAddSegment} className="w-full mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un segment
          </Button>
        </CardContent>
      </Card>

      {/* Test Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4" />
            Tester le pattern
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pattern.map((segment) => {
              const variable = getVariableInfo(segment.var_key);
              const isAutomatic = ['EXERCICE', 'ANNEE', 'MOIS'].includes(segment.var_key);
              
              return (
                <div key={segment.var_key} className="space-y-1">
                  <Label className="text-xs">
                    {variable?.label || segment.var_key}
                    {segment.required && <span className="text-destructive ml-1">*</span>}
                    {isAutomatic && <span className="text-muted-foreground ml-1">(auto)</span>}
                  </Label>
                  <Input
                    placeholder={isAutomatic ? String(exercice || new Date().getFullYear()) : `Ex: ${variable?.default_value || '001'}`}
                    value={testValues[segment.var_key] || ''}
                    onChange={(e) => setTestValues({ ...testValues, [segment.var_key]: e.target.value })}
                    className="h-8 font-mono"
                    disabled={isAutomatic}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTest} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Générer le code
            </Button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg border ${testResult.isValid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {testResult.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="text-sm font-medium">
                    {testResult.isValid ? 'Code valide' : 'Code avec avertissements'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copier
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <code className="text-lg font-mono font-bold text-primary bg-white px-3 py-1 rounded border">
                  {testResult.code}
                </code>
                <Badge variant="outline">{testResult.code.length} car.</Badge>
              </div>

              {testResult.warnings.length > 0 && (
                <div className="space-y-1 mt-2">
                  {testResult.warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
