import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Fixed Layout & Scrolling Architecture Tests', () => {
  const layoutPath = path.resolve('src/layouts/AdminLayout.jsx');
  const sidebarPath = path.resolve('src/components/layout/Sidebar.jsx');
  const headerPath = path.resolve('src/components/layout/Header.jsx');

  test('AdminLayout locks viewport height and delegates scroll to main', () => {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Root container must have fixed viewport height and overflow-hidden
    assert.match(layoutContent, /h-screen/);
    assert.match(layoutContent, /overflow-hidden/);
    assert.doesNotMatch(layoutContent, /min-h-screen/);

    // Main content area must be the designated vertical scroll container
    assert.match(layoutContent, /<main[^>]*overflow-y-auto/);
  });

  test('Sidebar maintains fixed width and full viewport height', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

    // Sidebar width must be w-64
    assert.match(sidebarContent, /w-64/);

    // Desktop sidebar must stretch full height and not shrink
    assert.match(sidebarContent, /md:h-full/);
    assert.match(sidebarContent, /md:shrink-0/);

    // Internal navigation area must have independent scroll
    assert.match(sidebarContent, /<nav[^>]*overflow-y-auto/);
  });

  test('Header remains fixed at top with fixed height and no shrinkage', () => {
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Header must have h-16 (64px) and shrink-0
    assert.match(headerContent, /h-16/);
    assert.match(headerContent, /shrink-0/);

    // Header must be pinned sticky top-0
    assert.match(headerContent, /sticky top-0/);
  });
});

