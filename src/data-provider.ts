/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { wsapiQuery, wsapiUpdate } from '@customagile/widget-ai/data/wsapi';
import type { ArtifactTypeKey } from '@customagile/widget-ai/types/rally-registry';
import type { EstimationBoardDataProvider, EstimationBoardItem } from './types';

const FETCH_FIELDS =
  'ObjectID,FormattedID,Name,PlanEstimate,Blocked,BlockedReason,Ready,Owner,DisplayColor';

/**
 * Map raw WSAPI results to typed EstimationBoardItems.
 * Uses explicit field-by-field mapping — no spread or `as any`.
 */
function mapItems(
  results: Record<string, unknown>[],
  typeKey: ArtifactTypeKey,
): EstimationBoardItem[] {
  return results.map((r) => {
    const owner = r.Owner as { _ref: string; _refObjectName: string; ObjectID?: number } | null | undefined;
    return {
      ObjectID: r.ObjectID as number,
      FormattedID: r.FormattedID as string,
      Name: (r.Name as string) ?? '',
      PlanEstimate: (r.PlanEstimate as number | null) ?? null,
      _type: typeKey,
      Blocked: (r.Blocked as boolean) ?? false,
      BlockedReason: (r.BlockedReason as string) ?? '',
      Ready: (r.Ready as boolean) ?? false,
      Owner: owner
        ? {
            _ref: owner._ref,
            _refObjectName: owner._refObjectName,
            ObjectID: owner.ObjectID,
          }
        : null,
      DisplayColor: (r.DisplayColor as string) ?? undefined,
    };
  });
}

export function createRallyProvider(ctx: RallyContext): EstimationBoardDataProvider {
  return {
    async fetchItems(types, extraQuery) {
      const workspaceRef =
        typeof ctx.GlobalScope.Workspace === 'string'
          ? ctx.GlobalScope.Workspace
          : ctx.GlobalScope.Workspace._ref;

      const projectRef =
        typeof ctx.GlobalScope.Project === 'string'
          ? ctx.GlobalScope.Project
          : ctx.GlobalScope.Project._ref;

      const allItems: EstimationBoardItem[] = [];

      await Promise.all(
        types.map(async (typeKey) => {
          const results = await wsapiQuery(typeKey, {
            fetch: FETCH_FIELDS,
            query: extraQuery ?? '',
            workspace: workspaceRef || undefined,
            project: projectRef || undefined,
            projectScopeDown: ctx.GlobalScope.ProjectScopeDown,
            pagesize: 200,
          });
          allItems.push(...mapItems(results as Record<string, unknown>[], typeKey));
        }),
      );

      return allItems;
    },

    async updateItem(type, oid, fields) {
      await wsapiUpdate(type, oid, fields as never);
    },
  };
}
