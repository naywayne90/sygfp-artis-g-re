/**
 * Hook pour gérer les permissions de documents
 */

import { useMemo } from "react";
import { usePermissions } from "./usePermissions";
import {
  checkDocumentPermission,
  getUploadableDocumentTypes,
  DocumentPermission,
} from "@/lib/config/document-permissions";

interface UseDocumentPermissionsOptions {
  typeDocument?: string;
  isOwner?: boolean;
}

export function useDocumentPermissions(options: UseDocumentPermissionsOptions = {}) {
  const { typeDocument, isOwner = false } = options;
  const { userRoles } = usePermissions();

  const permissions = useMemo(() => {
    const roles = userRoles || [];
    
    if (typeDocument) {
      return {
        canUpload: checkDocumentPermission('upload', typeDocument, roles, isOwner),
        canView: checkDocumentPermission('view', typeDocument, roles, isOwner),
        canDelete: checkDocumentPermission('delete', typeDocument, roles, isOwner),
      };
    }
    
    // Default permissions without specific document type
    return {
      canUpload: checkDocumentPermission('upload', 'default', roles, isOwner),
      canView: checkDocumentPermission('view', 'default', roles, isOwner),
      canDelete: checkDocumentPermission('delete', 'default', roles, isOwner),
    };
  }, [userRoles, typeDocument, isOwner]);

  const uploadableTypes = useMemo(() => {
    return getUploadableDocumentTypes(userRoles || []);
  }, [userRoles]);

  const checkPermission = (
    permission: DocumentPermission,
    docType: string,
    docIsOwner = false
  ): boolean => {
    return checkDocumentPermission(permission, docType, userRoles || [], docIsOwner);
  };

  return {
    ...permissions,
    uploadableTypes,
    checkPermission,
    userRoles: userRoles || [],
  };
}
