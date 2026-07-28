import { smartWorkspaceConfigs, type WorkspaceConfig } from "@/lib/smart-workflow-config";
import { smartQualityConfig } from "@/lib/smart-quality-specialized";
import { smartWarehouseConfig } from "@/lib/smart-warehouse-specialized";
import { smartMaintenanceConfig } from "@/lib/smart-maintenance-specialized";
import { smartSafetyConfig } from "@/lib/smart-safety-specialized";
import { smartSupplierConfig } from "@/lib/smart-supplier-specialized";
import { smartDeliveryConfig } from "@/lib/smart-delivery-specialized";

export const smartEnterpriseConfigs: Record<string, WorkspaceConfig> = {
  ...smartWorkspaceConfigs,
  quality: smartQualityConfig,
  warehouse: smartWarehouseConfig,
  maintenance: smartMaintenanceConfig,
  safety: smartSafetyConfig,
  supplier: smartSupplierConfig,
  delivery: smartDeliveryConfig,
};
