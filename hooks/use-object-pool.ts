'use client';

import { useCallback, useRef } from 'react';

interface PooledObject {
  id: string;
  inUse: boolean;
  data: any;
}

export function useObjectPool<T>(
  createObject: () => T,
  resetObject: (obj: T) => void,
  initialSize = 10
) {
  const pool = useRef<PooledObject[]>([]);
  const activeObjects = useRef<Map<string, T>>(new Map());

  // Initialize pool
  if (pool.current.length === 0) {
    for (let i = 0; i < initialSize; i++) {
      pool.current.push({
        id: `pool-${i}`,
        inUse: false,
        data: createObject(),
      });
    }
  }

  const acquire = useCallback(
    (id: string): T => {
      // Check if object is already active
      if (activeObjects.current.has(id)) {
        return activeObjects.current.get(id)!;
      }

      // Find available object in pool
      let pooledObject = pool.current.find((obj) => !obj.inUse);

      // If no available object, create new one
      if (!pooledObject) {
        pooledObject = {
          id: `pool-${pool.current.length}`,
          inUse: false,
          data: createObject(),
        };
        pool.current.push(pooledObject);
      }

      pooledObject.inUse = true;
      activeObjects.current.set(id, pooledObject.data);
      return pooledObject.data;
    },
    [createObject]
  );

  const release = useCallback(
    (id: string) => {
      const obj = activeObjects.current.get(id);
      if (obj) {
        // Find the pooled object and mark as available
        const pooledObject = pool.current.find((poolObj) => poolObj.data === obj);
        if (pooledObject) {
          resetObject(obj);
          pooledObject.inUse = false;
        }
        activeObjects.current.delete(id);
      }
    },
    [resetObject]
  );

  const releaseAll = useCallback(() => {
    activeObjects.current.forEach((obj, _id) => {
      const pooledObject = pool.current.find((poolObj) => poolObj.data === obj);
      if (pooledObject) {
        resetObject(obj);
        pooledObject.inUse = false;
      }
    });
    activeObjects.current.clear();
  }, [resetObject]);

  const getPoolStats = useCallback(() => {
    return {
      total: pool.current.length,
      inUse: pool.current.filter((obj) => obj.inUse).length,
      available: pool.current.filter((obj) => !obj.inUse).length,
    };
  }, []);

  return {
    acquire,
    release,
    releaseAll,
    getPoolStats,
  };
}
