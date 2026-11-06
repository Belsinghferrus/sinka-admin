import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Profile Capsule & Single Logout UI Tests', () => {
  const headerPath = path.resolve('src/components/layout/Header.jsx');
  const sidebarPath = path.resolve('src/components/layout/Sidebar.jsx');
  const capsulePath = path.resolve('src/components/layout/AdminProfileCapsule.jsx');

  test('Sidebar footer does NOT contain duplicate logout action or icon', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

    // Must NOT import LogOut
    assert.doesNotMatch(sidebarContent, /\bLogOut\b/);

    // Must NOT have a logout button
    assert.doesNotMatch(sidebarContent, /onClick=\{logout\}/);
    assert.doesNotMatch(sidebarContent, /title="Sign Out"/);

    // Must preserve admin identity information
    assert.match(sidebarContent, /user\.displayName \|\| user\.email/);
    assert.match(sidebarContent, /ShieldCheck/);
    assert.match(sidebarContent, /user\.role/);
  });

  test('Header includes AdminProfileCapsule and no standalone logout button', () => {
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Must import and render AdminProfileCapsule
    assert.match(headerContent, /import AdminProfileCapsule from '\.\/AdminProfileCapsule\.jsx'/);
    assert.match(headerContent, /<AdminProfileCapsule\s*\/>/);

    // Must NOT have standalone logout button in Header
    assert.doesNotMatch(headerContent, /onClick=\{logout\}/);
    assert.doesNotMatch(headerContent, /\bLogOut\b/);
  });

  test('AdminProfileCapsule implements keyboard accessibility and aria attributes', () => {
    const capsuleContent = fs.readFileSync(capsulePath, 'utf8');

    // Button attributes
    assert.match(capsuleContent, /aria-haspopup="menu"/);
    assert.match(capsuleContent, /aria-expanded=\{isOpen\}/);
    assert.match(capsuleContent, /aria-controls="admin-profile-dropdown"/);

    // Dropdown attributes
    assert.match(capsuleContent, /id="admin-profile-dropdown"/);
    assert.match(capsuleContent, /role="menu"/);
    assert.match(capsuleContent, /role="menuitem"/);

    // Keyboard handlers (Escape key)
    assert.match(capsuleContent, /event\.key === 'Escape'/);

    // Click outside handler
    assert.match(capsuleContent, /handleClickOutside/);

    // Single source of truth for logout via useAuth
    assert.match(capsuleContent, /const \{ user, logout \} = useAuth\(\)/);
    assert.match(capsuleContent, /await logout\(\)/);
  });

  test('AdminProfileCapsule supports responsive identity display and monogram initials', () => {
    const capsuleContent = fs.readFileSync(capsulePath, 'utf8');

    // Monogram generator helper
    assert.match(capsuleContent, /function getInitials\(/);

    // Desktop/mobile responsive classes: hidden on mobile, visible on sm:
    assert.match(capsuleContent, /hidden sm:flex flex-col/);

    // Administrator label
    assert.match(capsuleContent, /Administrator/);

    // Sinka Brown brand primary accent
    assert.match(capsuleContent, /bg-brand-primary/);
  });

  test('Navbar is static global header without dynamic breadcrumbs or page titles', () => {
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Global branding: Sinka Admin / Back Office
    assert.match(headerContent, /Sinka Admin/);
    assert.match(headerContent, /Back Office/);

    // Mobile menu button preserved
    assert.match(headerContent, /<Menu className="w-5 h-5"/);

    // Must NOT have dynamic route breadcrumb logic
    assert.doesNotMatch(headerContent, /useLocation/);
    assert.doesNotMatch(headerContent, /getPageTitle/);
    assert.doesNotMatch(headerContent, /Product Catalogue/);
    assert.doesNotMatch(headerContent, /Order Management/);
  });

  test('Main admin pages own their respective page headers and descriptions', () => {
    const productsList = fs.readFileSync(path.resolve('src/pages/products/ProductsListPage.jsx'), 'utf8');
    const ordersList = fs.readFileSync(path.resolve('src/pages/orders/OrdersListPage.jsx'), 'utf8');
    const bannersList = fs.readFileSync(path.resolve('src/pages/banners/BannersListPage.jsx'), 'utf8');
    const offersList = fs.readFileSync(path.resolve('src/pages/offers/OffersListPage.jsx'), 'utf8');

    // Products page header
    assert.match(productsList, /Product Catalogue/);
    assert.match(productsList, /Manage your furniture catalogue/);

    // Orders page header
    assert.match(ordersList, /Orders/);
    assert.match(ordersList, /Manage customer orders, fulfilment status/);

    // Banners page header
    assert.match(bannersList, /Homepage Banners/);
    assert.match(bannersList, /Manage the storefront hero carousel/);

    // Offers page header
    assert.match(offersList, /Promotional Offers/);
    assert.match(offersList, /Create and manage promotional campaigns/);
  });
});

