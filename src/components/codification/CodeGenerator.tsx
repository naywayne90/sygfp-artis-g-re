import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCodification } from "@/hooks/useCodification";
import { Copy, RefreshCw, Lock, Hash, Check } from "lucide-react";
import { toast } from "sonner";

interface CodeGeneratorProps {
  objet: string;
  value?: string;
  onChange?: (code: string) => void;
  locked?: boolean;
  showPreview?: boolean;
  isAdmin?: boolean;
  className?: string;
}

export function CodeGenerator({
  objet,
  value,
  onChange,
  locked = false,
  showPreview = true,
  isAdmin = false,
  className = "",
}: CodeGeneratorProps) {
  const { generateCode, previewNextCode, getRuleForObject } = useCodification();
  const [code, setCode] = useState(value || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const rule = getRuleForObject(objet);
  const previewCode = showPreview && !code ? previewNextCode(objet) : null;

  useEffect(() => {
    if (value) {
      setCode(value);
    }
  }, [value]);

  const handleGenerate = async () => {
    if (locked && !isAdmin) {
      toast.error("Code verrouillé - Contactez un administrateur");
      return;
    }
    
    setIsGenerating(true);
    try {
      const newCode = await generateCode(objet);
      setCode(newCode);
      onChange?.(newCode);
      toast.success("Code généré: " + newCode);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copié");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={code}
            readOnly
            placeholder={previewCode || "Code à générer..."}
            className="pl-9 pr-20 font-mono bg-muted/50"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {locked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Code verrouillé après validation</TooltipContent>
              </Tooltip>
            )}
            {code && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {!code && !locked && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Générer"
            )}
          </Button>
        )}
        
        {code && !locked && isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regénérer le code (Admin)</TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {rule && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {rule.code_type}
          </Badge>
          <span>Format: {rule.format_numero || rule.exemple}</span>
        </div>
      )}
    </div>
  );
}
