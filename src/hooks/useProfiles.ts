import { useQuery } from '@tanstack/react-query';
import { fetchProfiles } from '@/lib/api/profiles';
import { QUERY_KEYS } from '@/config/constants';

export function useProfiles() {
  return useQuery({
    queryKey: QUERY_KEYS.profiles,
    queryFn: fetchProfiles,
    staleTime: 1000 * 60 * 10,
  });
}
