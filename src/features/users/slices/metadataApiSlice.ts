import apiService from "@/app/store/apiService";
import { setUsers, setGroups } from "./metadataSlice";
import { ENVIRONMENT } from "@/@noctua.core/data/constants";
import type { Contributor, Group } from "../models/contributor";

const addTagTypes = ['metadata'] as const;

export const noctuaDataApi = apiService
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getUserInfo: builder.query<any, string>({
        query: (uri: string) => `/user_info_by_id/${encodeURIComponent(uri)}`,
      }),

      getAllData: builder.query<{
        users: Contributor[];
        groups: Group[];
      }, void>({
        async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
          try {
            // Fetch all data in parallel
            const [usersResponse, groupsResponse] = await Promise.all([
              fetchWithBQ(`${ENVIRONMENT.globalBaristaLocation}/users`),
              fetchWithBQ(`${ENVIRONMENT.globalBaristaLocation}/groups`),
            ]);

            if (usersResponse.error) return { error: usersResponse.error };
            if (groupsResponse.error) return { error: groupsResponse.error };

            // Sorted at load, as the Angular `NoctuaDataService` did: Barista
            // returns both lists in no useful order, and every picker shows them.
            const users: Contributor[] = ((usersResponse.data as any[]) ?? [])
              .map((item: any) => {
                const initials = getInitials(item.nickname);
                return {
                  name: item.nickname,
                  uri: item.uri,
                  group: item.group,
                  initials,
                  // Barista sends no colour; Angular derived one from the initials.
                  color: item.color ?? getColor(initials),
                };
              })
              .sort((a: Contributor, b: Contributor) => byText(a.name, b.name));

            const groups: Group[] = ((groupsResponse.data as any[]) ?? [])
              .map((item: any) => ({
                id: item.id,
                label: item.label,
                shorthand: item.shorthand,
              }))
              .sort((a: Group, b: Group) => byText(a.label, b.label));


            return {
              data: {
                users,
                groups
              }
            };
          } catch (error) {
            return { error: error as Error };
          }
        },
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(setUsers(data.users));
            dispatch(setGroups(data.groups));
          } catch {
            // Error handling if needed
          }
        }
      })
    }),
    overrideExisting: false,
  });

// Helper functions

/** Case-insensitive A–Z; a missing name sorts last rather than first. */
function byText(a: string | undefined, b: string | undefined): number {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/**
 * Material `[100]` shades in Angular's `MatColors.all` order (red … brown), the
 * 17 that `NoctuaDataService.getColor` picked from.
 */
const CONTRIBUTOR_COLORS = [
  '#ffcdd2',
  '#f8bbd0',
  '#e1bee7',
  '#d1c4e9',
  '#c5cae9',
  '#bbdefb',
  '#b3e5fc',
  '#b2ebf2',
  '#b2dfdb',
  '#c8e6c9',
  '#dcedc8',
  '#f0f4c3',
  '#fff9c4',
  '#ffecb3',
  '#ffe0b2',
  '#ffccbc',
  '#d7ccc8',
];

/**
 * Port of Angular's `getColor`: the first initial picks a shade, so a person keeps
 * the same colour everywhere. Index 0 (A, R, …) fell back to an invalid colour
 * there; leaving it undefined here gives the default chip colour, which is
 * what prod showed.
 */
function getColor(initials: string): string | undefined {
  if (!initials) return undefined;
  const index = (initials.charCodeAt(0) - 65) % CONTRIBUTOR_COLORS.length;
  return index > 0 ? CONTRIBUTOR_COLORS[index] : undefined;
}

function getInitials(string: string): string {
  // One user without a nickname must not take down the whole metadata load.
  if (!string) return '';
  const names = string.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
}

export const {
  useGetAllDataQuery
} = noctuaDataApi;