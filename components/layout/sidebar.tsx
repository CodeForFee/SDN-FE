'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import {
  Home,
  Car,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  Package,
  Settings,
  Tag,
  User,
  PackageSearch,
  Truck,
  CreditCard,
  Calendar,
} from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

export function Sidebar() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
  ];

  if (user) {
    switch (user.role) {
      case 'DealerStaff':
        menuItems.push(
          { path: '/vehicles', label: 'Products', icon: Car },
          { path: '/quotes', label: 'Quotes', icon: FileText },
          { path: '/orders', label: 'Orders', icon: ShoppingCart },
          { path: '/deliveries', label: 'Delivery Tracking', icon: Truck },
          { path: '/customers', label: 'Customers', icon: Users },
          { path: '/test-drives', label: 'Test Drives', icon: Calendar },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/settings', label: 'Settings', icon: Settings }
        );
        break;
      case 'DealerManager':
        menuItems.push(
          { path: '/staff', label: 'Staff', icon: User },
          { path: '/orders', label: 'Orders', icon: ShoppingCart },
          { path: '/deliveries', label: 'Delivery Tracking', icon: Truck },
          { path: '/payments', label: 'Payments', icon: CreditCard },
          { path: '/customers', label: 'Customers', icon: Users },
          { path: '/quotes', label: 'Quotes', icon: FileText },
          { path: '/test-drives', label: 'Test Drives', icon: Calendar },
          { path: '/vehicle-requests', label: 'Vehicle Requests', icon: PackageSearch },
          { path: '/inventory', label: 'Inventory', icon: Package },
          { path: '/promotions', label: 'Promotions', icon: Tag },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/settings', label: 'Settings', icon: Settings }
        );
        break;
      case 'EVMStaff':
        menuItems.push(
          { path: '/vehicle-models', label: 'Vehicle Models', icon: Car },
          { path: '/vehicles/manage', label: 'Products', icon: Car },
          { path: '/inventory', label: 'Inventory', icon: Package },
          { path: '/orders', label: 'Orders', icon: ShoppingCart }, // Để allocate orders
          { path: '/vehicle-requests', label: 'Requests', icon: PackageSearch },
          { path: '/promotions', label: 'Promotions', icon: Tag },
          { path: '/dealers', label: 'Dealers', icon: Users },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/settings', label: 'Settings', icon: Settings }
        );
        break;
      case 'Admin':
        menuItems.push(
          { path: '/users', label: 'Users', icon: Users },
          { path: '/dealers', label: 'Dealers', icon: Users },
          { path: '/vehicle-models', label: 'Vehicle Models', icon: Car },
          { path: '/vehicles/manage', label: 'Products', icon: Car },
          { path: '/orders', label: 'Orders', icon: ShoppingCart },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/settings', label: 'Settings', icon: Settings }
        );
        break;
    }
  }

  return (
    <aside className="w-64 border-r bg-card min-h-screen sticky top-16">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

