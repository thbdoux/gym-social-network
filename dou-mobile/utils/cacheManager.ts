// utils/cacheManager.ts - Centralized cache update management
import { QueryClient } from '@tanstack/react-query';
import { debounce, throttle } from 'lodash';

export interface CacheUpdateRequest {
  queryKey: string;
  source: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  force?: boolean;
  data?: any; // Optional data for optimistic updates
}

class CacheUpdateManager {
  private static instance: CacheUpdateManager;
  private queryClient: QueryClient | null = null;
  private pendingUpdates = new Map<string, CacheUpdateRequest>();
  private lastUpdateTime = new Map<string, number>();
  private isUpdating = false;
  
  // Different cooldowns based on priority
  private readonly cooldowns = {
    low: 10000,      // 10 seconds
    normal: 5000,    // 5 seconds  
    high: 2000,      // 2 seconds
    critical: 0      // No cooldown
  };

  // Debounced batch update - waits for quiet period
  private debouncedUpdate = debounce(() => {
    this.executeBatchUpdate();
  }, 1000);

  // Throttled immediate update for critical updates
  private throttledCriticalUpdate = throttle(() => {
    this.executeCriticalUpdates();
  }, 500);

  static getInstance(): CacheUpdateManager {
    if (!CacheUpdateManager.instance) {
      CacheUpdateManager.instance = new CacheUpdateManager();
    }
    return CacheUpdateManager.instance;
  }

  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
    console.log('📋 Cache manager initialized with QueryClient');
  }

  scheduleUpdate(request: CacheUpdateRequest): void {
    if (!this.queryClient) {
      console.warn('⚠️ Cache manager not initialized with QueryClient');
      return;
    }

    const { queryKey, source, priority, force } = request;
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime.get(queryKey) || 0;
    const cooldown = this.cooldowns[priority];

    // Check cooldown unless forced or critical
    if (!force && priority !== 'critical' && (now - lastUpdate) < cooldown) {
      console.log(`⏰ Skipping ${queryKey} update from ${source} (cooldown: ${cooldown}ms)`);
      return;
    }

    // Store or update the pending request
    const existingRequest = this.pendingUpdates.get(queryKey);
    if (!existingRequest || this.getPriorityWeight(priority) > this.getPriorityWeight(existingRequest.priority)) {
      this.pendingUpdates.set(queryKey, request);
      console.log(`📝 Scheduled ${priority} update for ${queryKey} from ${source}`);
    }

    // Handle based on priority
    if (priority === 'critical') {
      this.throttledCriticalUpdate();
    } else {
      this.debouncedUpdate();
    }
  }

  private getPriorityWeight(priority: string): number {
    const weights = { low: 1, normal: 2, high: 3, critical: 4 };
    return weights[priority as keyof typeof weights] || 2;
  }

  private async executeCriticalUpdates(): Promise<void> {
    if (this.isUpdating || !this.queryClient) return;

    const criticalUpdates = Array.from(this.pendingUpdates.entries())
      .filter(([_, request]) => request.priority === 'critical');

    if (criticalUpdates.length === 0) return;

    this.isUpdating = true;
    console.log('🔥 Executing critical cache updates:', criticalUpdates.length);

    try {
      for (const [queryKey, request] of criticalUpdates) {
        await this.executeUpdate(queryKey, request);
        this.pendingUpdates.delete(queryKey);
        this.lastUpdateTime.set(queryKey, Date.now());
      }
    } catch (error) {
      console.error('❌ Error executing critical updates:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private async executeBatchUpdate(): Promise<void> {
    if (this.isUpdating || !this.queryClient || this.pendingUpdates.size === 0) return;

    this.isUpdating = true;
    const updates = Array.from(this.pendingUpdates.entries());
    this.pendingUpdates.clear();

    console.log('🔄 Executing batch cache updates:', updates.length);

    try {
      // Group by priority and execute in order
      const groupedUpdates = this.groupUpdatesByPriority(updates);
      
      for (const priority of ['high', 'normal', 'low']) {
        const priorityUpdates = groupedUpdates[priority] || [];
        if (priorityUpdates.length > 0) {
          await this.executePriorityGroup(priorityUpdates);
        }
      }
    } catch (error) {
      console.error('❌ Error executing batch updates:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private groupUpdatesByPriority(updates: [string, CacheUpdateRequest][]): Record<string, [string, CacheUpdateRequest][]> {
    return updates.reduce((groups, update) => {
      const priority = update[1].priority;
      if (!groups[priority]) groups[priority] = [];
      groups[priority].push(update);
      return groups;
    }, {} as Record<string, [string, CacheUpdateRequest][]>);
  }

  private async executePriorityGroup(updates: [string, CacheUpdateRequest][]): Promise<void> {
    const queryKeys = updates.map(([queryKey]) => queryKey);
    
    try {
      // Batch invalidate queries of same priority
      await this.queryClient!.invalidateQueries({
        predicate: (query) => {
          return queryKeys.some(key => {
            if (key.includes('*')) {
              // Handle wildcard patterns
              const pattern = key.replace('*', '');
              return query.queryKey[0]?.toString().startsWith(pattern);
            }
            return query.queryKey[0] === key;
          });
        },
        refetchType: 'none' // Don't refetch immediately
      });

      // Update timestamps
      updates.forEach(([queryKey]) => {
        this.lastUpdateTime.set(queryKey, Date.now());
      });

      console.log(`✅ Batch updated ${updates.length} queries:`, queryKeys);
    } catch (error) {
      console.error('❌ Error in priority group update:', error);
    }
  }

  private async executeUpdate(queryKey: string, request: CacheUpdateRequest): Promise<void> {
    try {
      // Handle optimistic updates if data provided
      if (request.data) {
        this.queryClient!.setQueryData([queryKey], request.data);
      }

      // Invalidate query
      if (queryKey.includes('*')) {
        const pattern = queryKey.replace('*', '');
        await this.queryClient!.invalidateQueries({
          predicate: (query) => query.queryKey[0]?.toString().startsWith(pattern),
          refetchType: request.priority === 'critical' ? 'active' : 'none'
        });
      } else {
        await this.queryClient!.invalidateQueries({
          queryKey: [queryKey],
          refetchType: request.priority === 'critical' ? 'active' : 'none'
        });
      }
    } catch (error) {
      console.error(`❌ Error updating ${queryKey}:`, error);
    }
  }

  // Manual refresh with highest priority
  async forceRefresh(queryKey: string, source: string = 'manual'): Promise<void> {
    this.scheduleUpdate({
      queryKey,
      source,
      priority: 'critical',
      force: true
    });
  }

  // Clear all pending updates
  clearPendingUpdates(): void {
    this.pendingUpdates.clear();
    console.log('🧹 Cleared all pending cache updates');
  }

  // Get stats for debugging
  getStats() {
    return {
      pendingUpdates: this.pendingUpdates.size,
      lastUpdates: Array.from(this.lastUpdateTime.entries()),
      isUpdating: this.isUpdating
    };
  }
}

export const cacheManager = CacheUpdateManager.getInstance();