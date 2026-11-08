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

  test('Sidebar maintains fixed width and full viewport height on desktop and drawer on tablet', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

    // Desktop sidebar width must be lg:w-64, tablet drawer width w-[280px]
    assert.match(sidebarContent, /lg:w-64/);
    assert.match(sidebarContent, /w-\[280px\]/);

    // Desktop sidebar (>=1024px) must stretch full height and not shrink
    assert.match(sidebarContent, /lg:h-full/);
    assert.match(sidebarContent, /lg:shrink-0/);
    assert.match(sidebarContent, /lg:static/);
    assert.match(sidebarContent, /lg:translate-x-0/);

    // Drawer backdrop and close button must be hidden on desktop (lg:hidden)
    assert.match(sidebarContent, /lg:hidden/);

    // Internal navigation area must have independent scroll
    assert.match(sidebarContent, /<nav[^>]*overflow-y-auto/);

    // Keyboard accessibility: Escape key listener closes the drawer
    assert.match(sidebarContent, /Escape/);
  });

  test('Header includes tablet/mobile hamburger button and remains fixed at top', () => {
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Header must have h-16 (64px) and shrink-0
    assert.match(headerContent, /h-16/);
    assert.match(headerContent, /shrink-0/);

    // Header must be pinned sticky top-0
    assert.match(headerContent, /sticky top-0/);

    // Hamburger button visible on mobile and tablet (<1024px), hidden on desktop (lg:hidden)
    assert.match(headerContent, /lg:hidden/);
    assert.match(headerContent, /aria-label="Open navigation menu"/);
  });
});

