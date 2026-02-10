/**
 * NotificationsBudgetaires - Liste des notifications budgétaires
 *
 * Fonctionnalités:
 * - Liste avec recherche et filtres
 * - Export (Copy, CSV, Excel, PDF, Print)
 * - CRUD avec formulaire
 * - Workflow de validation
 * - Pièces jointes
 */

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Check,
  X,
  Download,
  Copy,
  FileSpreadsheet,
  Printer,
  Loader2,
  Eye,
  Paperclip,
  Calendar,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  useBudgetNotifications,
  BudgetNotification,
  NotificationStatut,
  NOTIFICATION_STATUTS,
} from "@/hooks/useBudgetNotifications";
import { useFundingSources } from "@/hooks/useFundingSources";
import { useExercice } from "@/contexts/ExerciceContext";
import { NotificationBudgetaireForm } from "@/components/notification/NotificationBudgetaireForm";
import { NotificationBudgetaireDetails } from "@/components/notification/NotificationBudgetaireDetails";

export default function NotificationsBudgetaires() {
  const { exercice, isReadOnly } = useExercice();
  const tableRef = useRef<HTMLTableElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<NotificationStatut | "all">("all");
  const [origineFondsFilter, setOrigineFondsFilter] = useState<string>("");

  // Dialogs
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<BudgetNotification | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Hooks
  const {
    notifications,
    stats,
    isLoading,
    _createNotification,
    _updateNotification,
    submitNotification,
    validateNotification,
    rejectNotification,
    deleteNotification,
    getStatutLabel,
    getStatutColor,
    formatMontant,
    exportToCSV,
    _isSubmitting,
    _isValidating,
    isRejecting,
    isDeleting,
  } = useBudgetNotifications({
    statut: statutFilter,
    origine_fonds_id: origineFondsFilter || undefined,
    search: searchTerm,
  });

  const { activeSources } = useFundingSources();

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreate = () => {
    setSelectedNotification(null);
    setShowFormDialog(true);
  };

  const handleEdit = (notification: BudgetNotification) => {
    setSelectedNotification(notification);
    setShowFormDialog(true);
  };

  const handleView = (notification: BudgetNotification) => {
    setSelectedNotification(notification);
    setShowDetailsDialog(true);
  };

  const handleSubmit = (notification: BudgetNotification) => {
    submitNotification(notification.id);
  };

  const handleValidate = (notification: BudgetNotification) => {
    validateNotification(notification.id);
  };

  const handleRejectClick = (notification: BudgetNotification) => {
    setSelectedNotification(notification);
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (selectedNotification && rejectReason) {
      rejectNotification({ id: selectedNotification.id, reason: rejectReason });
      setShowRejectDialog(false);
    }
  };

  const handleDeleteClick = (notification: BudgetNotification) => {
    setSelectedNotification(notification);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedNotification) {
      deleteNotification(selectedNotification.id);
      setShowDeleteDialog(false);
    }
  };

  // Export functions
  const handleCopy = () => {
    if (!notifications || notifications.length === 0) return;

    const text = notifications
      .map((n) => `${n.reference}\t${n.date_notification}\t${n.objet}\t${n.montant}`)
      .join("\n");

    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    window.print();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Notifications Budgétaires
          </h1>
          <p className="text-muted-foreground">
            Exercice {exercice} - Gérez les notifications de crédits budgétaires
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isReadOnly}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle notification
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-xl font-bold">{formatMontant(stats?.totalMontant || 0)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.byStatut?.valide?.count || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(stats?.byStatut?.brouillon?.count || 0) + (stats?.byStatut?.soumis?.count || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search and Filters */}
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statutFilter}
                onValueChange={(v) => setStatutFilter(v as NotificationStatut | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {NOTIFICATION_STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={origineFondsFilter}
                onValueChange={setOrigineFondsFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Origine fonds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes origines</SelectItem>
                  {activeSources?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export buttons */}
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={handleCopy} title="Copier">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} title="CSV">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} title="Excel">
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} title="Imprimer">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune notification</h3>
              <p className="text-muted-foreground mb-4">
                Il n'y a pas encore de notification budgétaire pour cet exercice.
              </p>
              <Button onClick={handleCreate} disabled={isReadOnly}>
                <Plus className="mr-2 h-4 w-4" />
                Créer la première notification
              </Button>
            </div>
          ) : (
            <Table ref={tableRef}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Référence</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead className="w-[150px]">Origine fonds</TableHead>
                  <TableHead className="w-[130px] text-right">Montant</TableHead>
                  <TableHead className="w-[100px]">Statut</TableHead>
                  <TableHead className="w-[50px]">PJ</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-mono font-medium">
                      {notification.reference}
                    </TableCell>
                    <TableCell>
                      {new Date(notification.date_notification).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate" title={notification.objet}>
                        {notification.objet}
                      </div>
                      {notification.nature_depense && (
                        <div className="text-xs text-muted-foreground">
                          {notification.nature_depense}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {notification.origine_fonds_libelle || notification.origine_fonds_code || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(notification.montant)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatutColor(notification.statut)}>
                        {getStatutLabel(notification.statut)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notification.attachments_count && notification.attachments_count > 0 ? (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{notification.attachments_count}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(notification)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          {notification.statut === "brouillon" && !isReadOnly && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(notification)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSubmit(notification)}>
                                <Send className="mr-2 h-4 w-4 text-blue-600" />
                                Soumettre
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(notification)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                          {notification.statut === "soumis" && !isReadOnly && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleValidate(notification)}>
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Valider
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRejectClick(notification)}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          {notification.statut === "rejete" && !isReadOnly && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(notification)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier et resoumettre
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(notification)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Annuler
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <NotificationBudgetaireForm
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        notification={selectedNotification}
        onSuccess={() => setShowFormDialog(false)}
      />

      {/* Details Dialog */}
      <NotificationBudgetaireDetails
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        notification={selectedNotification}
      />

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter cette notification ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Vous allez rejeter la notification{" "}
                <strong>{selectedNotification?.reference}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Motif du rejet *</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Indiquez le motif du rejet..."
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={!rejectReason || isRejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette notification ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez annuler la notification{" "}
              <strong>{selectedNotification?.reference}</strong>. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
