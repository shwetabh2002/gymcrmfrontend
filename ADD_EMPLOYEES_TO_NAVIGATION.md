# Adding Employees to Navigation

## ✅ Header Already Updated
The header page titles have been updated to include "Employees".

**File:** `app/(app)/components/layout/Header.tsx` (Line 10)

## 🔧 To Add Navigation Link

### Find Your Sidebar/Navigation Component

Look for one of these files in your frontend:
```
- app/(app)/layout.tsx
- app/(app)/components/Sidebar.tsx
- app/(app)/components/Navigation.tsx
- app/(app)/components/layout/Sidebar.tsx
- components/Sidebar.tsx
- lib/navigation.ts or lib/navigation.tsx
```

### Add Employees Link

**Example 1: If using a navigation array:**
```typescript
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/users", label: "Members", icon: "👥" },
  { href: "/employees", label: "Employees", icon: "👔" },  // ADD THIS
  { href: "/subscriptions", label: "Subscriptions", icon: "📝" },
  { href: "/plans", label: "Plans", icon: "💳" },
  { href: "/payments", label: "Payments", icon: "💰" },
  { href: "/invoices", label: "Invoices", icon: "🧾" },
];
```

**Example 2: If using JSX directly:**
```tsx
<nav>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/users">Members</Link>
  <Link href="/employees">Employees</Link>  {/* ADD THIS */}
  <Link href="/subscriptions">Subscriptions</Link>
  <Link href="/plans">Plans</Link>
  <Link href="/payments">Payments</Link>
  <Link href="/invoices">Invoices</Link>
</nav>
```

**Example 3: If using styled links:**
```tsx
<NavLink href="/employees" className={styles.navLink}>
  <span className={styles.icon}>👔</span>
  <span className={styles.label}>Employees</span>
</NavLink>
```

## 🎨 Recommended Icon
Use one of these emojis or icons:
- 👔 (tie - professional)
- 🧑‍💼 (office worker)
- 👥 (people)
- 🏢 (office building)
- 💼 (briefcase)

## 📱 Route Configuration
The route is already set up:
- **URL:** `/employees`
- **Page:** `app/(app)/employees/page.tsx`
- **Protected:** Yes (requires unlock with password)

## ✅ Testing
After adding the link:
1. Start frontend: `npm run dev`
2. Login as admin
3. Click "Employees" in navigation
4. Should show unlock modal
5. Enter password: `GymEmployee@2026`
6. Should see employees page

## 🔍 Need Help Finding Navigation?

Run this command from frontend root:
```bash
grep -r "href.*dashboard" app --include="*.tsx" | grep -v node_modules
```

This will show you where dashboard links are defined, and you can add employees link there.

---

**Note:** The exact location depends on your frontend structure. Look for the file that contains links to Dashboard, Members, etc.
