/**
 * NotificationBudgetaireForm - Formulaire de création/édition de notification budgétaire
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useBudgetNotifications,
  BudgetNotification,
  CreateNotificationData,
} from "@/hooks/useBudgetNotifications";
import { FundingSourceSelect } from "@/components/shared/FundingSourceSelect";
import { useExercice } from "@/contexts/ExerciceContext";

interface NotificationBudgetaireFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification?: BudgetNotification | null;
  onSuccess?: () => void;
}

export function NotificationBudgetaireForm({
  open,
  onOpenChange,
  notification,
  onSuccess,
}: NotificationBudgetaireFormProps) {
  const { exercice } = useExercice();
  const {
    createNotificationAsync,
    updateNotificationAsync,
    isCreating,
    isUpdating,
  } = useBudgetNotifications();

  const isEditing = !!notification;

  const [formData, setFormData] = useState<CreateNotificationData>({
    objet: "",
    montant: 0,
    origine_fonds_code: "budget_etat",
    nature_depense: "",
    date_notification: new Date().toISOString().split("T")[0],
    date_reception: "",
    commentaire: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when notification changes
  useEffect(() => {
    if (notification && open) {
      setFormData({
        objet: notification.objet,
        montant: notification.montant,
        origine_fonds_id: notification.origine_fonds_id || undefined,
        origine_fonds_code: notification.origine_fonds_code || undefined,
        nature_depense: notification.nature_depense || "",
        date_notification: notification.date_notification,
        date_reception: notification.date_reception || "",
        commentaire: notification.commentaire || "",
      });
      setErrors({});
    } else if (!notification && open) {
      setFormData({
        objet: "",
        montant: 0,
        origine_fonds_code: "budget_etat",
        nature_depense: "",
        date_notification: new Date().toISOString().split("T")[0],
        date_reception: "",
        commentaire: "",
      });
      setErrors({});
    }
  }, [notification, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.objet.trim()) {
      newErrors.objet = "L'objet est requis";
    }

    if (!formData.montant || formData.montant <= 0) {
      newErrors.montant = "Le montant doit être supérieur à 0";
    }

    if (!formData.date_notification) {
      newErrors.date_notification = "La date est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isEditing && notification) {
        await updateNotificationAsync({
          id: notification.id,
          ...formData,
        });
      } else {
        await createNotificationAsync(formData);
      }
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatMontant = (value: number): string => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const parseMontant = (value: string): number => {
    return parseFloat(value.replace(/\s/g, "").replace(",", ".")) || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la notification" : "Nouvelle notification budgétaire"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Modification de ${notification?.reference}`
              : `Exercice ${exercice} - Créez une nouvelle notification de crédits`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="objet">Objet *</Label>
            <Textarea
              id="objet"
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              placeholder="Décrivez l'objet de la notification..."
              rows={3}
              className={errors.objet ? "border-red-500" : ""}
            />
            {errors.objet && <p className="text-sm text-red-500">{errors.objet}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (FCFA) *</Label>
              <Input
                id="montant"
                type="text"
                value={formatMontant(formData.montant)}
                onChange={(e) =>
                  setFormData({ ...formData, montant: parseMontant(e.target.value) })
                }
                placeholder="0"
                className={errors.montant ? "border-red-500" : ""}
              />
              {errors.montant && <p className="text-sm text-red-500">{errors.montant}</p>}
            </div>

            {/* Origine des fonds */}
            <div className="space-y-2">
              <Label>Origine des fonds</Label>
              <FundingSourceSelect
                value={formData.origine_fonds_code}
                onValueChange={(v) => setFormData({ ...formData, origine_fonds_code: v })}
                useLegacyValue={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date notification */}
            <div className="space-y-2">
              <Label>Date de notification *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_notification && "text-muted-foreground",
                      errors.date_notification && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_notification
                      ? format(new Date(formData.date_notification), "dd/MM/yyyy", { locale: fr })
                      : "Sélectionner..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date_notification
                        ? new Date(formData.date_notification)
                        : undefined
                    }
                    onSelect={(date) =>
                      setFormData({
                        ...formData,
                        date_notification: date?.toISOString().split("T")[0] || "",
                      })
                    }
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date_notification && (
                <p className="text-sm text-red-500">{errors.date_notification}</p>
              )}
            </div>

            {/* Date réception */}
            <div className="space-y-2">
              <Label>Date de réception</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_reception && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_reception
                      ? format(new Date(formData.date_reception), "dd/MM/yyyy", { locale: fr })
                      : "Sélectionner..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date_reception
                        ? new Date(formData.date_reception)
                        : undefined
                    }
                    onSelect={(date) =>
                      setFormData({
                        ...formData,
                        date_reception: date?.toISOString().split("T")[0] || "",
                      })
                    }
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Nature de dépense */}
          <div className="space-y-2">
            <Label htmlFor="nature_depense">Nature de la dépense</Label>
            <Input
              id="nature_depense"
              value={formData.nature_depense}
              onChange={(e) => setFormData({ ...formData, nature_depense: e.target.value })}
              placeholder="Ex: Fonctionnement, Investissement..."
            />
          </div>

          <Separator />

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Notes additionnelles..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationBudgetaireForm;
