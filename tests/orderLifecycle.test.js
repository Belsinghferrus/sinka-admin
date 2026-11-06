import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  STANDARD_LIFECYCLE_STAGES,
  deriveLifecycleStages,
} from '../src/utils/orderLifecycle.js';

describe('Order Lifecycle Progress Tracker & State Derivation Tests', () => {
  test('1. STANDARD_LIFECYCLE_STAGES contains all 7 canonical sequential stages', () => {
    const keys = STANDARD_LIFECYCLE_STAGES.map((s) => s.key);
    assert.deepEqual(keys, [
      'PENDING',
      'ACCEPTED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ]);
  });

  test('2. deriveLifecycleStages for PENDING marks PENDING as current and others as upcoming', () => {
    const stages = deriveLifecycleStages('PENDING', []);
    assert.equal(stages.length, 7);
    assert.equal(stages[0].key, 'PENDING');
    assert.equal(stages[0].state, 'current');
    for (let i = 1; i < 7; i++) {
      assert.equal(stages[i].state, 'upcoming');
    }
  });

  test('3. deriveLifecycleStages for PROCESSING marks PENDING and ACCEPTED as completed', () => {
    const history = [
      { toStatus: 'PENDING', timestamp: '2026-11-04T10:00:00.000Z' },
      { toStatus: 'ACCEPTED', timestamp: '2026-11-04T10:30:00.000Z' },
      { toStatus: 'PROCESSING', timestamp: '2026-11-04T11:00:00.000Z' },
    ];
    const stages = deriveLifecycleStages('PROCESSING', history);
    assert.equal(stages[0].key, 'PENDING');
    assert.equal(stages[0].state, 'completed');
    assert.equal(stages[0].timestamp, '2026-11-04T10:00:00.000Z');

    assert.equal(stages[1].key, 'ACCEPTED');
    assert.equal(stages[1].state, 'completed');
    assert.equal(stages[1].timestamp, '2026-11-04T10:30:00.000Z');

    assert.equal(stages[2].key, 'PROCESSING');
    assert.equal(stages[2].state, 'current');
    assert.equal(stages[2].timestamp, '2026-11-04T11:00:00.000Z');

    assert.equal(stages[3].key, 'PACKED');
    assert.equal(stages[3].state, 'upcoming');
  });

  test('4. deriveLifecycleStages for DELIVERED marks all stages as completed', () => {
    const stages = deriveLifecycleStages('DELIVERED', [
      { toStatus: 'DELIVERED', timestamp: '2026-11-05T15:00:00.000Z' },
    ]);
    assert.equal(stages.length, 7);
    for (const stage of stages) {
      assert.equal(stage.state, 'completed');
    }
  });

  test('5. deriveLifecycleStages for CANCELLED terminates chain with cancelled node without showing remaining steps', () => {
    const history = [
      { fromStatus: null, toStatus: 'PENDING', timestamp: '2026-11-04T10:00:00.000Z' },
      { fromStatus: 'PENDING', toStatus: 'ACCEPTED', timestamp: '2026-11-04T10:15:00.000Z' },
      { fromStatus: 'ACCEPTED', toStatus: 'CANCELLED', timestamp: '2026-11-04T11:00:00.000Z' },
    ];
    const stages = deriveLifecycleStages('CANCELLED', history);

    // Should only contain PENDING, ACCEPTED, and CANCELLED
    const keys = stages.map((s) => s.key);
    assert.deepEqual(keys, ['PENDING', 'ACCEPTED', 'CANCELLED']);

    assert.equal(stages[0].state, 'completed');
    assert.equal(stages[1].state, 'completed');
    assert.equal(stages[2].state, 'cancelled');
    assert.equal(stages[2].label, 'Cancelled');
  });

  test('6. deriveLifecycleStages for REJECTED handles terminal rejection accurately', () => {
    const history = [
      { fromStatus: null, toStatus: 'PENDING', timestamp: '2026-11-04T10:00:00.000Z' },
      { fromStatus: 'PENDING', toStatus: 'REJECTED', timestamp: '2026-11-04T10:05:00.000Z' },
    ];
    const stages = deriveLifecycleStages('REJECTED', history);

    assert.equal(stages.length, 2);
    assert.equal(stages[0].key, 'PENDING');
    assert.equal(stages[0].state, 'completed');
    assert.equal(stages[1].key, 'REJECTED');
    assert.equal(stages[1].state, 'cancelled');
    assert.equal(stages[1].label, 'Rejected');
  });

  test('7. OrderDetailPage includes OrderLifecycleProgress and removes separate vertical timeline', async () => {
    const content = await fs.readFile(
      path.resolve(process.cwd(), 'src/pages/orders/OrderDetailPage.jsx'),
      'utf-8'
    );

    assert.ok(
      content.includes('OrderLifecycleProgress'),
      'OrderDetailPage must import and render OrderLifecycleProgress'
    );
    assert.equal(
      content.includes('Order Lifecycle Timeline'),
      false,
      'Old separate vertical Order Lifecycle Timeline must be removed'
    );
  });

  test('8. OrderLifecycleProgress enforces compact height, eliminates stage timestamps, and preserves History drawer', async () => {
    const content = await fs.readFile(
      path.resolve(process.cwd(), 'src/components/orders/OrderLifecycleProgress.jsx'),
      'utf-8'
    );

    // Verify timestamps are not rendered directly under progress stages
    assert.equal(
      content.includes('formatEventDateTime'),
      false,
      'Timestamps must not be rendered under stage names in the progress bar'
    );

    // Verify compact circle indicator sizing (~28-32px: w-7 / w-8)
    assert.ok(
      content.includes('w-7') || content.includes('w-8'),
      'Stage circle size must be compact (w-7 / w-8, 28-32px)'
    );

    // Verify connector line is compact (2px)
    assert.ok(
      content.includes('h-[2px]'),
      'Connector bar height must be 2px'
    );

    // Verify History drawer toggle is preserved
    assert.ok(
      content.includes('isHistoryExpanded'),
      'History toggle state must be preserved'
    );
  });
});

