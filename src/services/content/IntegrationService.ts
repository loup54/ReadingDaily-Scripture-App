/**
 * Integration Service
 * Phase 10D.11: Service Integration
 *
 * Coordinates all content services:
 * - Service initialization
 * - Lifecycle management
 * - Error aggregation
 * - Status monitoring
 * - Workflow orchestration
 *
 * Features:
 * - Unified initialization
 * - Service coordination
 * - Error handling
 * - Status aggregation
 * - Workflow support
 */

import { contentDatabaseService } from './ContentDatabaseService';
import { contentService } from './ContentService';
import { searchService } from './SearchService';
import { favoritesService } from './FavoritesService';
import { readingsScreenService } from './ReadingsScreenService';
import { notificationsService } from './NotificationsService';
import { exportImportService } from './ExportImportService';
import { analyticsService } from './AnalyticsService';
import { syncToCloudService } from './SyncToCloudService';
import { validationService } from './ValidationService';

export interface ServiceStatus {
  name: string;
  isReady: boolean;
  isInitializing: boolean;
  lastError?: string;
  timestamp: number;
}

export interface IntegrationStatus {
  allReady: boolean;
  servicesReady: number;
  totalServices: number;
  services: ServiceStatus[];
  overallStatus: 'initializing' | 'ready' | 'error' | 'partial';
  timestamp: number;
}

export interface InitializationResult {
  success: boolean;
  duration: number;
  servicesInitialized: number;
  servicesFailed: number;
  errors: Array<{ service: string; error: string }>;
  timestamp: number;
}

class IntegrationService {
  private isInitialized = false;
  private serviceStatus: Map<string, ServiceStatus> = new Map();
  private services = [
    { name: 'ContentDatabaseService', service: contentDatabaseService },
    { name: 'ContentService', service: contentService },
    { name: 'SearchService', service: searchService },
    { name: 'FavoritesService', service: favoritesService },
    { name: 'ReadingsScreenService', service: readingsScreenService },
    { name: 'NotificationsService', service: notificationsService },
    { name: 'ExportImportService', service: exportImportService },
    { name: 'AnalyticsService', service: analyticsService },
    { name: 'SyncToCloudService', service: syncToCloudService },
    { name: 'ValidationService', service: validationService },
  ];

  /**
   * Initialize all services
   */
  async initialize(): Promise<InitializationResult> {
    try {
      if (this.isInitialized) {
        console.log('[IntegrationService] Already initialized');
        return {
          success: true,
          duration: 0,
          servicesInitialized: this.services.length,
          servicesFailed: 0,
          errors: [],
          timestamp: Date.now(),
        };
      }

      const startTime = Date.now();
      const errors: Array<{ service: string; error: string }> = [];
      let servicesInitialized = 0;
      let servicesFailed = 0;

      console.log('[IntegrationService] Initializing', this.services.length, 'services...');

      // Initialize services in order
      for (const { name, service } of this.services) {
        try {
          console.log(`[IntegrationService] Initializing ${name}...`);
          this.updateServiceStatus(name, true, false);

          if (typeof (service as any).initialize === 'function') {
            await (service as any).initialize();
          }

          this.updateServiceStatus(name, false, true);
          servicesInitialized++;
          console.log(`[IntegrationService] ${name} initialized`);
        } catch (error) {
          const errorMessage = (error as Error).message;
          errors.push({ service: name, error: errorMessage });
          this.updateServiceStatus(name, false, false, errorMessage);
          servicesFailed++;
          console.error(`[IntegrationService] ${name} initialization failed:`, error);
        }
      }

      this.isInitialized = true;

      const duration = Date.now() - startTime;
      const result: InitializationResult = {
        success: servicesFailed === 0,
        duration,
        servicesInitialized,
        servicesFailed,
        errors,
        timestamp: Date.now(),
      };

      console.log('[IntegrationService] Initialization complete:', result);
      return result;
    } catch (error) {
      console.error('[IntegrationService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if all services are ready
   */
  isReady(): boolean {
    return this.isInitialized && Array.from(this.serviceStatus.values()).every((s) => s.isReady);
  }

  /**
   * Get integration status
   */
  getStatus(): IntegrationStatus {
    const services = Array.from(this.serviceStatus.values());
    const servicesReady = services.filter((s) => s.isReady).length;
    const totalServices = services.length;

    let overallStatus: 'initializing' | 'ready' | 'error' | 'partial' = 'ready';
    if (servicesReady === 0) {
      overallStatus = 'initializing';
    } else if (servicesReady < totalServices) {
      overallStatus = 'partial';
    } else if (services.some((s) => s.lastError)) {
      overallStatus = 'error';
    }

    return {
      allReady: servicesReady === totalServices,
      servicesReady,
      totalServices,
      services,
      overallStatus,
      timestamp: Date.now(),
    };
  }

  /**
   * Get individual service status
   */
  getServiceStatus(serviceName: string): ServiceStatus | null {
    return this.serviceStatus.get(serviceName) || null;
  }

  /**
   * Perform complete content workflow
   */
  async performCompleteWorkflow(): Promise<{
    imported: number;
    validated: number;
    synced: number;
    success: boolean;
  }> {
    try {
      if (!this.isReady()) {
        throw new Error('Integration service not ready');
      }

      console.log('[IntegrationService] Starting complete workflow...');

      // Validate existing data
      const readings = await contentDatabaseService.searchReadings({});
      const validationResult = await validationService.validateBatch(readings);
      console.log('[IntegrationService] Validated', validationResult.validItems, 'readings');

      // Track in analytics
      await analyticsService.trackExport('workflow', readings.length);

      // Sync to cloud
      const syncResult = await syncToCloudService.syncNow();
      console.log('[IntegrationService] Synced', syncResult.itemsSynced, 'items');

      return {
        imported: readings.length,
        validated: validationResult.validItems,
        synced: syncResult.itemsSynced,
        success: true,
      };
    } catch (error) {
      console.error('[IntegrationService] Workflow failed:', error);
      return {
        imported: 0,
        validated: 0,
        synced: 0,
        success: false,
      };
    }
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    try {
      console.log('[IntegrationService] Shutting down', this.services.length, 'services...');

      // Shutdown in reverse order
      for (const { name, service } of this.services.reverse()) {
        try {
          if (typeof (service as any).shutdown === 'function') {
            await (service as any).shutdown();
            console.log(`[IntegrationService] ${name} shutdown`);
          }
        } catch (error) {
          console.error(`[IntegrationService] ${name} shutdown failed:`, error);
        }
      }

      this.serviceStatus.clear();
      this.isInitialized = false;
      console.log('[IntegrationService] All services shutdown');
    } catch (error) {
      console.error('[IntegrationService] Shutdown error:', error);
      throw error;
    }
  }

  /**
   * Restart a service
   */
  async restartService(serviceName: string): Promise<boolean> {
    try {
      const serviceEntry = this.services.find((s) => s.name === serviceName);
      if (!serviceEntry) {
        throw new Error(`Service not found: ${serviceName}`);
      }

      const { service } = serviceEntry;

      // Shutdown
      if (typeof (service as any).shutdown === 'function') {
        await (service as any).shutdown();
      }

      // Reinitialize
      if (typeof (service as any).initialize === 'function') {
        await (service as any).initialize();
      }

      this.updateServiceStatus(serviceName, false, true);
      console.log('[IntegrationService] Restarted service:', serviceName);
      return true;
    } catch (error) {
      console.error('[IntegrationService] Failed to restart service:', error);
      const errorMessage = (error as Error).message;
      this.updateServiceStatus(serviceName, false, false, errorMessage);
      return false;
    }
  }

  /**
   * Get all services status summary
   */
  getServicesSummary(): string {
    const status = this.getStatus();
    const statusLines = [
      `Overall Status: ${status.overallStatus}`,
      `Services Ready: ${status.servicesReady}/${status.totalServices}`,
      '---',
    ];

    status.services.forEach((service) => {
      const indicator = service.isReady ? '✓' : '✗';
      const errorInfo = service.lastError ? ` (${service.lastError})` : '';
      statusLines.push(`${indicator} ${service.name}${errorInfo}`);
    });

    return statusLines.join('\n');
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<{
    healthy: boolean;
    servicesHealthy: number;
    totalServices: number;
    issues: string[];
  }> {
    try {
      const issues: string[] = [];
      let servicesHealthy = 0;

      const status = this.getStatus();

      for (const service of status.services) {
        if (service.isReady) {
          servicesHealthy++;
        } else {
          if (service.lastError) {
            issues.push(`${service.name}: ${service.lastError}`);
          } else {
            issues.push(`${service.name}: not ready`);
          }
        }
      }

      return {
        healthy: issues.length === 0,
        servicesHealthy,
        totalServices: status.totalServices,
        issues,
      };
    } catch (error) {
      console.error('[IntegrationService] Health check failed:', error);
      return {
        healthy: false,
        servicesHealthy: 0,
        totalServices: this.services.length,
        issues: [(error as Error).message],
      };
    }
  }

  // ============ Private Methods ============

  /**
   * Update service status
   */
  private updateServiceStatus(
    serviceName: string,
    isInitializing: boolean,
    isReady: boolean,
    error?: string
  ): void {
    try {
      this.serviceStatus.set(serviceName, {
        name: serviceName,
        isReady,
        isInitializing,
        lastError: error,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[IntegrationService] Failed to update status:', err);
    }
  }
}

// Export singleton
export const integrationService = new IntegrationService();
