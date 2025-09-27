import { useEffect, useMemo, useCallback } from 'react';
import { useGetRunsQuery, usePrefetch, useDeleteRunMutation } from '../../../store/runnersApi';
import { useAppSelector } from '../../../store/hooks';
import { parseCreatorIdFromFallback } from '../../../utils';
import { useVkUsers } from '../../../hooks/useVkUsers';

export function useRunsData(filters: Record<string, string | number>) {
  const myVkId = useAppSelector((s) => s.user.data?.id);

  // Запрос
  const { data, isLoading, isError, refetch } = useGetRunsQuery(
    { endpoint: '/api/v1/runs', size: 20, filters },
    { pollingInterval: 5_000, refetchOnFocus: true, refetchOnReconnect: true }
  );
  const runs = data?.items ?? [];

  // Профили авторов
  const creatorIds = useMemo(
    () => runs
      .map((r: any) => (typeof r.creatorVkId === 'number' ? r.creatorVkId : parseCreatorIdFromFallback(r.fullName)))
      .filter((x): x is number => Number.isFinite(x)),
    [runs]
  );
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  const vkProfiles = useVkUsers(creatorIds, appId);

  // Префетч деталей
  const prefetchRunById = usePrefetch('getRunById', { ifOlderThan: 60 });

  // Удаление
  const [deleteRun, { isLoading: isDeleting }] = useDeleteRunMutation();
  const doDeleteNow = useCallback(async (id: number) => {
    await deleteRun(id).unwrap();
    window.dispatchEvent(new Event('runs:updated'));
    refetch();
  }, [deleteRun, refetch]);

  // События: подтверждение удаления
  useEffect(() => {
    const handler = (e: Event) => {
      const anyEvt = e as unknown as { detail?: { id?: number } };
      const id = anyEvt?.detail?.id;
      if (typeof id === 'number') void doDeleteNow(id);
    };
    window.addEventListener('runs:confirm-delete', handler);
    return () => window.removeEventListener('runs:confirm-delete', handler);
  }, [doDeleteNow]);

  // События: обновление
  useEffect(() => {
    const onUpdated = () => refetch();
    window.addEventListener('runs:updated', onUpdated);
    return () => window.removeEventListener('runs:updated', onUpdated);
  }, [refetch]);

  return {
    runs,
    isLoading,
    isError,
    refetch,
    prefetchRunById,
    isDeleting,
    doDeleteNow,
    vkProfiles,
    myVkId,
  } as const;
}
