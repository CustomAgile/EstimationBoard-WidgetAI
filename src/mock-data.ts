/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type { EstimationBoardDataProvider, EstimationBoardItem } from './types';

// ── Mock items ─────────────────────────────────────────────────────────

const MOCK_ITEMS: EstimationBoardItem[] = [
  {
    ObjectID: 1001,
    FormattedID: 'US1001',
    Name: 'User can log in with SSO',
    PlanEstimate: 3,
    _type: 'hierarchicalrequirement',
    Blocked: false,
    BlockedReason: '',
    Ready: true,
    Owner: { _ref: '/user/501', _refObjectName: 'Alice Smith', ObjectID: 501 },
    DisplayColor: '#21a2e0',
  },
  {
    ObjectID: 1002,
    FormattedID: 'US1002',
    Name: 'Password reset flow',
    PlanEstimate: 5,
    _type: 'hierarchicalrequirement',
    Blocked: false,
    BlockedReason: '',
    Ready: false,
    Owner: { _ref: '/user/502', _refObjectName: 'Bob Jones', ObjectID: 502 },
    DisplayColor: undefined,
  },
  {
    ObjectID: 1003,
    FormattedID: 'US1003',
    Name: 'Profile page avatar upload',
    PlanEstimate: 2,
    _type: 'hierarchicalrequirement',
    Blocked: true,
    BlockedReason: 'Waiting for design spec',
    Ready: false,
    Owner: null,
    DisplayColor: undefined,
  },
  {
    ObjectID: 2001,
    FormattedID: 'DE2001',
    Name: 'Login button disabled on mobile',
    PlanEstimate: 1,
    _type: 'defect',
    Blocked: false,
    BlockedReason: '',
    Ready: false,
    Owner: { _ref: '/user/501', _refObjectName: 'Alice Smith', ObjectID: 501 },
    DisplayColor: undefined,
  },
  {
    ObjectID: 2002,
    FormattedID: 'DE2002',
    Name: 'Tooltip misaligned in Safari',
    PlanEstimate: null,
    _type: 'defect',
    Blocked: false,
    BlockedReason: '',
    Ready: false,
    Owner: null,
    DisplayColor: undefined,
  },
  {
    ObjectID: 3001,
    FormattedID: 'DS3001',
    Name: 'Auth defect suite',
    PlanEstimate: 8,
    _type: 'defectsuite',
    Blocked: false,
    BlockedReason: '',
    Ready: false,
    Owner: { _ref: '/user/503', _refObjectName: 'Carol Lee', ObjectID: 503 },
    DisplayColor: undefined,
  },
];

// ── Mock provider ─────────────────────────────────────────────────────

export const mockProvider: EstimationBoardDataProvider = {
  fetchItems: async (_types, _extraQuery) => MOCK_ITEMS,
  updateItem: async () => {},
};

// ── Mock context ──────────────────────────────────────────────────────

export const mockContext: RallyContext = {
  ...DEFAULT_RALLY_CONTEXT,
  User: {
    _ref: '/user/999',
    DisplayName: 'Mock User',
    EmailAddress: 'mock@example.com',
    UserName: 'mockuser',
    ObjectID: 999,
  },
  WidgetName: 'Estimation Board',
  WidgetUUID: 'mock-estimation-board-uuid',
  isEditMode: false,
  Settings: {},
};
