import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    ShoppingCart,
    Package,
    Users,
    Building2,
    FileBarChart,
    UserCog,
    Boxes,
    Receipt,
    Warehouse,
    ClipboardList,
    Barcode,
    ClipboardCheck,
    Settings,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import pos from '@/routes/pos';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: 'POS', href: pos.index(), icon: ShoppingCart },
    { title: 'Online Orders', href: '/online-orders', icon: ClipboardCheck },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();
    const { props } = usePage();
    const user = (
        props as {
            auth?: { user?: { role?: string; roles?: { name: string }[] } };
        }
    ).auth?.user;
    const userRoles = user?.roles?.map((r) => r.name) || [];
    const isOwner = userRoles.includes('Owner');
    const isManager = userRoles.includes('Manager');
    const isCashier = userRoles.includes('Cashier');
    const canView = (module: string) => {
        if (isOwner) return true;
        if (
            isCashier &&
            ['dashboard', 'pos', 'customers', 'sales'].includes(module)
        )
            return true;
        if (isManager && !['users', 'roles', 'settings'].includes(module))
            return true;
        return false;
    };
    const canManageUsers = isOwner;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="px-4 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto py-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {canView('products') && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                        <SidebarMenu>
                            {isOwner && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(
                                            '/settings/store',
                                        )}
                                    >
                                        <Link href="/settings/store" prefetch>
                                            <Settings />
                                            <span>Store Settings</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/products')}
                                >
                                    <Link href="/products" prefetch>
                                        <Package />
                                        <span>Products</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/categories')}
                                >
                                    <Link href="/categories" prefetch>
                                        <Boxes />
                                        <span>Categories</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {canView('inventory') && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl('/inventory')}
                                    >
                                        <Link href="/inventory" prefetch>
                                            <Warehouse />
                                            <span>Inventory</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/barcodes')}
                                >
                                    <Link href="/barcodes" prefetch>
                                        <Barcode />
                                        <span>Barcodes</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/sales')}
                                >
                                    <Link href="/sales" prefetch>
                                        <Receipt />
                                        <span>Sales</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {canView('purchase_orders') && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(
                                            '/purchase-orders',
                                        )}
                                    >
                                        <Link href="/purchase-orders" prefetch>
                                            <ClipboardList />
                                            <span>Purchase Orders</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {canView('stock_count') && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl('/stock-counts')}
                                    >
                                        <Link href="/stock-counts" prefetch>
                                            <Package />
                                            <span>Stock Counts</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {canView('expenses') && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl('/expenses')}
                                    >
                                        <Link href="/expenses" prefetch>
                                            <Receipt />
                                            <span>Expenses</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>People</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl('/customers')}
                            >
                                <Link href="/customers" prefetch>
                                    <Users />
                                    <span>Customers</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {canView('suppliers') && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/suppliers')}
                                >
                                    <Link href="/suppliers" prefetch>
                                        <Building2 />
                                        <span>Suppliers</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        {canManageUsers && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/users')}
                                >
                                    <Link href="/users" prefetch>
                                        <UserCog />
                                        <span>Users</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>

                {canView('reports') && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Reports</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/reports/sales')}
                                >
                                    <Link href="/reports/sales" prefetch>
                                        <FileBarChart />
                                        <span>Sales Report</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/reports/products')}
                                >
                                    <Link href="/reports/products" prefetch>
                                        <FileBarChart />
                                        <span>Product Report</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(
                                        '/reports/inventory',
                                    )}
                                >
                                    <Link href="/reports/inventory" prefetch>
                                        <FileBarChart />
                                        <span>Inventory Report</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {(isOwner || isManager) && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>System</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/activity-logs')}
                                >
                                    <Link href="/activity-logs" prefetch>
                                        <FileBarChart />
                                        <span>Activity Logs</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
