import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Lock, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface CodeDisplayProps {
  code: string;
  label?: string;
  locked?: boolean;
  href?: string;
  variant?: "default" | "large" | "inline";
  className?: string;
}

export function CodeDisplay({
  code,
  label,
  locked = false,
  href,
  variant = "default",
  className = "",
}: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copié");
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "large") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {label && <span className="text-sm text-muted-foreground">{label}:</span>}
          <span className="text-xl font-mono font-bold text-primary">{code}</span>
          {locked && (
            <Tooltip>
              <TooltipTrigger>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Code verrouillé</TooltipContent>
            </Tooltip>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        {href && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={href}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Voir le détail</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{code}</code>
        {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
      </span>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`font-mono gap-1 cursor-pointer hover:bg-muted ${className}`}
      onClick={handleCopy}
    >
      {code}
      {locked && <Lock className="h-3 w-3" />}
      {copied && <Check className="h-3 w-3 text-green-500" />}
    </Badge>
  );
}
