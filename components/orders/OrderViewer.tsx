
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { fetchWooCommerceOrders, fetchWooCommerceOrder, updateWooCommerceOrder } from '../../services/wooCommerceApi';
import { fetchShopifyOrders, fetchShopifyOrder, cancelShopifyOrder } from '../../services/shopifyApi';
import type { User, Website } from '../../types/index';
import type { WooCommerceOrder } from '../../types/woocommerce';
import type { ShopifyOrder } from '../../types/shopify';
import type { FormattedOrder } from '../../types/orders';
import { SpinnerIcon, ExclamationIcon, InfoIcon, ArrowLeftIcon, UserIcon, WordPressIcon, EyeIcon, SearchIcon, ShopifyIcon } from '../ui/icons';
import OrderDetailModal from './OrderDetailModal';

type ViewState = 'select_user' | 'show_orders';

const StatCard: React.FC<{ label: string; value: string | number; emoji: string; }> = ({ label, value, emoji }) => (
    <div className="flex flex-col items-center justify-center bg-slate-800 rounded-2xl p-4 text-center shadow-md border border-slate-700">
        <span className="text-3xl mb-2">{emoji}</span>
        <p className="text-gray-300 text-sm">{label}</p>
        <p className="text-white font-semibold text-lg">{value}</p>
    </div>
);

const OrderStatusBadge: React.FC<{ status: string; platform: 'wordpress' | 'shopify' }> = ({ status, platform }) => {
    const statusMap: Record<string, string> = {
        // WooCommerce
        completed: 'bg-green-600 text-white',
        processing: 'bg-yellow-500 text-black',
        pending: 'bg-sky-500 text-white',
        cancelled: 'bg-red-600 text-white',
        refunded: 'bg-gray-500 text-white',
        'on-hold': 'bg-orange-500 text-white',
        failed: 'bg-red-800 text-white',
        // Shopify
        fulfilled: 'bg-green-600 text-white',
        unfulfilled: 'bg-orange-500 text-white',
        partial: 'bg-yellow-500 text-black',
    };
    const colorClass = statusMap[status] || 'bg-gray-600 text-white';

    return <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>{status.replace(/[-_]/g, ' ')}</span>
};

// --- Data Formatting Helpers ---
const formatWooCommerceOrder = (order: WooCommerceOrder, currencySymbol: string): FormattedOrder => ({
    id: order.id,
    platform: 'wordpress',
    orderNumber: `#${order.number}`,
    customerName: `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim(),
    date: order.date_created,
    status: order.status,
    total: order.total,
    currencySymbol: currencySymbol,
    canComplete: !['completed', 'cancelled', 'refunded', 'failed'].includes(order.status),
    canCancel: !['completed', 'cancelled', 'refunded', 'failed'].includes(order.status),
});

const formatShopifyOrder = (order: ShopifyOrder, currencySymbol: string): FormattedOrder => {
    let status = order.fulfillment_status || 'unfulfilled';
    if (order.cancelled_at) {
        status = 'cancelled';
    } else if (order.financial_status === 'refunded' || order.financial_status === 'partially_refunded') {
        status = 'refunded';
    }

    return {
        id: order.id,
        platform: 'shopify',
        orderNumber: `#${order.order_number}`,
        customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
        date: order.created_at,
        status: status,
        total: order.total_price,
        currencySymbol: currencySymbol,
        canComplete: false, // Completing requires fulfillment API, too complex for now
        canCancel: !order.cancelled_at
    };
};

const formatWooCommerceOrderDetail = (order: WooCommerceOrder): FormattedOrder => {
    const formatted = formatWooCommerceOrder(order, order.currency);
    return {
        ...formatted,
        lineItems: order.line_items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            total: item.total,
            sku: item.sku,
        })),
        billingAddress: {
            name: `${order.billing.first_name} ${order.billing.last_name}`,
            address1: '', address2: '', cityStateZip: '', country: ''
        },
        shippingAddress: {
            name: `${order.shipping.first_name} ${order.shipping.last_name}`,
            address1: order.shipping.address_1,
            address2: order.shipping.address_2,
            cityStateZip: `${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}`,
            country: order.shipping.country,
        },
        shippingMethod: order.shipping_lines.map(l => l.method_title).join(', '),
        totalTax: order.total_tax,
        customerNote: order.customer_note,
    };
};

const formatShopifyOrderDetail = (order: ShopifyOrder): FormattedOrder => {
    const formatted = formatShopifyOrder(order, order.currency);
    return {
        ...formatted,
        lineItems: order.line_items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            total: (parseFloat(item.price) * item.quantity).toFixed(2),
            sku: item.sku,
        })),
         billingAddress: {
            name: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim(),
            address1: order.billing_address?.address1,
            address2: order.billing_address?.address2,
            cityStateZip: `${order.billing_address?.city}, ${order.billing_address?.province} ${order.billing_address?.zip}`,
            country: order.billing_address?.country,
        },
        shippingAddress: {
            name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
            address1: order.shipping_address?.address1,
            address2: order.shipping_address?.address2,
            cityStateZip: `${order.shipping_address?.city}, ${order.shipping_address?.province} ${order.shipping_address?.zip}`,
            country: order.shipping_address?.country,
        },
        shippingMethod: order.shipping_lines.map(l => l.title).join(', '),
        totalTax: order.total_tax,
        customerNote: order.note,
    };
};


export const OrderViewer: React.FC = () => {
    const { user } = useAuth();
    const [viewState, setViewState] = useState<ViewState>(user?.role === 'admin' ? 'select_user' : 'show_orders');
    const [users, setUsers] = useState<User[]>([]);
    const [websites, setWebsites] = useState<Website[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
    
    const [orders, setOrders] = useState<FormattedOrder[]>([]);
    const [page, setPage] = useState(1); // For WooCommerce pagination
    const [nextUrl, setNextUrl] = useState<string | null>(null); // For Shopify pagination
    const [canLoadMore, setCanLoadMore] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedOrderDetails, setSelectedOrderDetails] = useState<FormattedOrder | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Initial data loading (users for admin, websites for regular user)
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return setIsLoading(false);
            setError(null);
            setIsLoading(true);

            if (user.role === 'admin') {
                try {
                    const allUsers = await api.getUsers();
                    setUsers(allUsers.filter(u => u.role === 'user'));
                } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load users'); }
            } else {
                try {
                    const userWebsites = await api.getWebsitesForUser(user.username);
                    setWebsites(userWebsites);
                    if (userWebsites.length > 0) {
                        setSelectedWebsite(userWebsites.find(w => !!w.is_primary) || userWebsites[0]);
                    }
                } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load websites'); }
            }
            setIsLoading(false);
        };
        loadInitialData();
    }, [user]);

    const fetchOrders = useCallback(async (isLoadMore = false) => {
        if (!selectedWebsite) return;

        setIsLoading(true);
        setError(null);

        try {
            if (selectedWebsite.platform === 'wordpress') {
                const pageToFetch = isLoadMore ? page + 1 : 1;
                const wooOrders = await fetchWooCommerceOrders(selectedWebsite, pageToFetch);
                const newOrders = wooOrders.map(o => formatWooCommerceOrder(o, selectedWebsite.currency_symbol));
                
                setCanLoadMore(wooOrders.length > 0);
                setPage(pageToFetch);
                setOrders(prev => isLoadMore ? [...prev, ...newOrders] : newOrders);
            } else if (selectedWebsite.platform === 'shopify') {
                const fetchUrl = isLoadMore && nextUrl ? nextUrl : null;
                const { orders: shopifyOrders, nextUrl: newNextUrl } = await fetchShopifyOrders(selectedWebsite, fetchUrl);
                const newOrders = shopifyOrders.map(o => formatShopifyOrder(o, selectedWebsite.currency_symbol));
                
                setNextUrl(newNextUrl);
                setCanLoadMore(!!newNextUrl);
                setOrders(prev => isLoadMore ? [...prev, ...newOrders] : newOrders);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch orders.');
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedWebsite, page, nextUrl]);


    // Effect to trigger initial fetch when website changes
    useEffect(() => {
        if (selectedWebsite) {
            setOrders([]);
            setPage(1);
            setNextUrl(null);
            setSearchTerm('');
            setCanLoadMore(true);
            fetchOrders(false);
        }
    }, [selectedWebsite, fetchOrders]);
    
    const handleUserSelect = useCallback(async (userToSelect: User) => {
        setIsLoading(true);
        setSelectedUser(userToSelect);
        setError(null);
        try {
            const userWebsites = await api.getWebsitesForUser(userToSelect.username);
            setWebsites(userWebsites);
            setSelectedWebsite(userWebsites.find(w => !!w.is_primary) || userWebsites[0] || null);
            setViewState('show_orders');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load websites for user.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleWebsiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const websiteId = e.target.value;
        console.log(`\n=== WEBSITE SELECTION ===`);
        console.log(`Selected website ID: ${websiteId}`);
        console.log(`Available websites:`, websites.map(w => ({
            name: w.name,
            id: w._id || w.id,
            platform: w.platform
        })));
        
        const selectedSite = websites.find(w => (w._id || w.id) === websiteId) || null;
        console.log(`Found website:`, selectedSite ? {
            name: selectedSite.name,
            platform: selectedSite.platform,
            id: selectedSite._id || selectedSite.id
        } : 'NOT FOUND');
        
        setSelectedWebsite(selectedSite);
    };

    const handleBack = () => {
        setError(null);
        setOrders([]);
        if (user?.role === 'admin') {
            setSelectedUser(null);
            setSelectedWebsite(null);
            setWebsites([]);
            setViewState('select_user');
        }
    };
    
     const handleViewDetails = async (order: FormattedOrder) => {
        if (!selectedWebsite) return;
        setIsLoadingDetails(true);
        setError(null);
        try {
            let fullOrder;
            if (order.platform === 'wordpress') {
                // FIX: The `fetchWooCommerceOrder` function expects a `Website` object, not separate credentials.
                const wooOrder = await fetchWooCommerceOrder(selectedWebsite, order.id);
                fullOrder = formatWooCommerceOrderDetail(wooOrder);
            } else {
                // FIX: The `fetchShopifyOrder` function expects a `Website` object, not separate credentials.
                const shopifyOrder = await fetchShopifyOrder(selectedWebsite, order.id);
                fullOrder = formatShopifyOrderDetail(shopifyOrder);
            }
            setSelectedOrderDetails(fullOrder);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load order details.');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleCancelOrder = async (orderId: number, platform: 'wordpress' | 'shopify') => {
        if (!selectedWebsite) return;
        setIsUpdatingStatus(true);
        setError(null);
        try {
            if (platform === 'wordpress') {
                // FIX: The `updateWooCommerceOrder` function expects a `Website` object, not separate credentials.
                await updateWooCommerceOrder(selectedWebsite, orderId, { status: 'cancelled' });
            } else {
                // FIX: The `cancelShopifyOrder` function expects a `Website` object, not separate credentials.
                await cancelShopifyOrder(selectedWebsite, orderId);
            }
            setSelectedOrderDetails(null);
            fetchOrders(false); // Refresh
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel order.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleCompleteOrder = async (orderId: number) => {
        if (!selectedWebsite || selectedWebsite.platform !== 'wordpress') return;
        setIsUpdatingStatus(true);
        setError(null);
        try {
            // FIX: The `updateWooCommerceOrder` function expects a `Website` object, not separate credentials.
            await updateWooCommerceOrder(selectedWebsite, orderId, { status: 'completed' });
            setSelectedOrderDetails(null);
            fetchOrders(false); // Refresh
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete order.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!searchTerm) return orders;
        const lowercasedFilter = searchTerm.toLowerCase();
        return orders.filter(order =>
            order.orderNumber.toLowerCase().includes(lowercasedFilter) ||
            order.customerName.toLowerCase().includes(lowercasedFilter) ||
            order.status.toLowerCase().includes(lowercasedFilter)
        );
    }, [orders, searchTerm]);

    const stats = useMemo(() => {
        const source = filteredOrders;
        const revenue = source.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
        const processingCount = source.filter(o => ['pending', 'processing', 'on-hold', 'unfulfilled', 'partial'].includes(o.status)).length;
        const completedCount = source.filter(o => ['completed', 'fulfilled'].includes(o.status)).length;
        
        return [
             { label: "Pending/Processing", value: processingCount, emoji: "⏳" },
             { label: "Completed", value: completedCount, emoji: "✅" },
             { label: "Orders Shown", value: source.length, emoji: "🧾" },
             { label: "Revenue Shown", value: `${selectedWebsite?.currency_symbol || '$'}${revenue.toFixed(2)}`, emoji: "💰" },
        ]
    }, [filteredOrders, selectedWebsite]);

    if (isLoading && viewState === 'select_user') return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8 text-sky-400" /><p className="ml-4">Loading Users...</p></div>;
    if (viewState === 'select_user') return (
        <div className="animate-fade-in">
            <header className="text-center mb-8"><h2 className="text-2xl font-semibold text-white">Select a User</h2></header>
            {error && <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg mb-4"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>}
            {users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(item => (
                        <button key={item.username} onClick={() => handleUserSelect(item)} className="bg-slate-800 p-6 rounded-lg text-left hover:bg-slate-700/80 border border-slate-700 hover:border-sky-500 transition-all transform hover:scale-105">
                            <div className="flex items-center gap-4"><UserIcon className="w-8 h-8 text-sky-400 flex-shrink-0" /><div><p className="font-bold text-lg text-white">{item.username}</p></div></div>
                        </button>
                    ))}
                </div>
            ) : <div className="text-center py-10 bg-slate-900/50 rounded-lg"><UserIcon className="w-12 h-12 mx-auto text-gray-500"/><h3 className="mt-2 text-lg font-medium text-white">No users found</h3></div>}
        </div>
    );

    if (viewState === 'show_orders') {
        if (!selectedWebsite) return (
            <div className="animate-fade-in text-center">
                {user?.role === 'admin' && <button onClick={handleBack} className="flex items-center gap-2 mb-6 text-sm text-gray-400 hover:text-white mx-auto"><ArrowLeftIcon className="w-4 h-4"/> Back to User Selection</button>}
                <div className="py-10 bg-slate-900/50 rounded-lg">
                    <WordPressIcon className="w-12 h-12 mx-auto text-gray-500"/>
                    <h3 className="mt-2 text-lg font-medium text-white">No websites configured</h3>
                    <p className="mt-1 text-sm text-gray-400">{user?.role === 'admin' ? `This user does not have any websites set up.` : `Please go to Settings to add a new website.`}</p>
                </div>
            </div>
        );

        if (selectedWebsite.platform === 'shopify') {
            return (
                 <div className="animate-fade-in space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-grow">
                            {user?.role === 'admin' && (
                                <button onClick={handleBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-2">
                                    <ArrowLeftIcon className="w-4 h-4"/> Back to User Selection
                                </button>
                            )}
                            <h1 className="text-3xl font-bold text-white tracking-tight">Orders: <span className="text-sky-400">{selectedWebsite?.name}</span></h1>
                        </div>
                         {websites.length > 1 && (
                            <div className="flex items-center gap-2 self-start sm:self-center">
                                <label htmlFor="website-select" className="text-sm font-medium text-gray-300 flex-shrink-0">
                                    Change Site:
                                </label>
                                <select
                                    id="website-select"
                                    value={(selectedWebsite?._id || selectedWebsite?.id) || ''}
                                    onChange={handleWebsiteChange}
                                    className="bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500"
                                >
                                    {websites.map(site => (
                                        <option key={site._id || site.id} value={site._id || site.id}>
                                            {site.name} ({site.platform})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="text-center py-10 bg-slate-900/50 rounded-lg">
                        <ShopifyIcon className="w-12 h-12 mx-auto text-gray-500"/>
                        <h3 className="mt-2 text-lg font-medium text-white">Feature Not Available</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            The Order Viewer is not currently supported for Shopify stores.
                        </p>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="animate-fade-in space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-grow">
                        {user?.role === 'admin' && <button onClick={handleBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-2"><ArrowLeftIcon className="w-4 h-4"/> Back to User Selection</button>}
                        <h1 className="text-3xl font-bold text-white tracking-tight">Orders: <span className="text-sky-400">{selectedWebsite?.name}</span></h1>
                    </div>
                    {websites.length > 1 && (
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <label htmlFor="website-select" className="text-sm font-medium text-gray-300 flex-shrink-0">
                                Change Site:
                            </label>
                            <select 
                                id="website-select" 
                                value={(selectedWebsite?._id || selectedWebsite?.id) || ''} 
                                onChange={handleWebsiteChange} 
                                className="bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500"
                            >
                                {websites.map(site => (
                                    <option key={site._id || site.id} value={site._id || site.id}>
                                        {site.name} ({site.platform})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                {error && <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map(stat => <StatCard key={stat.label} {...stat} />)}</div>
                <div className="my-6"><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-gray-400" /></span><input type="text" placeholder="Search loaded orders by #, name, or status..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-white bg-gray-800 border border-slate-700 rounded-lg focus:ring-sky-500 focus:border-sky-500"/></div></div>
                <div>
                    <div className="sm:hidden space-y-4">{filteredOrders.map(o => ( <div key={o.id} className="w-full rounded-2xl bg-[#0d1b2a] p-4 shadow-md border border-slate-700 text-gray-200"><div className="flex justify-between items-start mb-3"><div className="min-w-0"><p className="text-xs text-gray-400 uppercase tracking-wide">Order</p><p className="text-blue-400 font-semibold break-all">{o.orderNumber}</p></div><OrderStatusBadge status={o.status} platform={o.platform} /></div><div className="space-y-2 text-sm"><div className="flex justify-between items-start gap-4"><span className="font-medium text-gray-400 flex-shrink-0">Customer</span><span className="text-gray-100 text-right break-words">{o.customerName || 'N/A'}</span></div><div className="flex justify-between items-start gap-4"><span className="font-medium text-gray-400 flex-shrink-0">Date</span><span className="text-gray-100 text-right">{new Date(o.date).toLocaleString()}</span></div><div className="flex justify-between items-start gap-4"><span className="font-medium text-gray-400 flex-shrink-0">Total</span><span className="text-green-400 font-semibold text-right">{o.currencySymbol}{parseFloat(o.total).toFixed(2)}</span></div></div><div className="mt-3 pt-3 border-t border-slate-700 flex justify-end"><button onClick={() => handleViewDetails(o)} className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300"><EyeIcon className="w-4 h-4"/>View Details</button></div></div>))}</div>
                    <div className="hidden sm:block overflow-x-auto"><table className="min-w-full border border-slate-700 bg-slate-900 rounded-2xl text-gray-200"><thead className="bg-slate-800 text-gray-300 uppercase text-xs"><tr>{["Order #", "Customer", "Date", "Status", "Total", "Details"].map(h =><th key={h} className={`px-4 py-3 ${h === 'Details' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead><tbody>{filteredOrders.map(o => (<tr key={o.id} className="border-t border-slate-700 hover:bg-slate-800/50"><td className="px-4 py-3 text-blue-400 font-semibold">{o.orderNumber}</td><td className="px-4 py-3">{o.customerName || 'N/A'}</td><td className="px-4 py-3">{new Date(o.date).toLocaleString()}</td><td className="px-4 py-3"><OrderStatusBadge status={o.status} platform={o.platform} /></td><td className="px-4 py-3 text-right text-green-400 font-semibold">{o.currencySymbol}{parseFloat(o.total).toFixed(2)}</td><td className="px-4 py-3 text-right"><button onClick={() => handleViewDetails(o)} className="text-sky-400 hover:text-sky-300 disabled:cursor-wait" disabled={isLoadingDetails && selectedOrderDetails?.id === o.id}>{isLoadingDetails && selectedOrderDetails?.id === o.id ? <SpinnerIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}</button></td></tr>))}</tbody></table></div>
                    {isLoading && <div className="text-center py-12"><SpinnerIcon className="w-8 h-8 mx-auto text-sky-400" /></div>}
                    {!isLoading && filteredOrders.length === 0 && <div className="text-center py-12 text-gray-500 bg-slate-900 rounded-2xl mt-4"><InfoIcon className="w-8 h-8 mx-auto mb-2" />{searchTerm ? `No orders found for "${searchTerm}".` : "No orders found for this website."}</div>}
                </div>
                <div className="flex justify-center items-center gap-4 pt-4">
                    <button onClick={() => fetchOrders(false)} disabled={isLoading} className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-lg shadow hover:bg-sky-700 transition-colors disabled:bg-gray-600"><i data-lucide="rotate-cw" className="w-4 h-4"></i>Refresh</button>
                    <button onClick={() => fetchOrders(true)} disabled={isLoading || !canLoadMore} className="flex items-center gap-2 bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"><i data-lucide="arrow-down" className="w-4 h-4"></i>Load More</button>
                </div>
                 <OrderDetailModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} onComplete={handleCompleteOrder} onCancel={handleCancelOrder} isUpdating={isUpdatingStatus} />
            </div>
        );
    }
    return null;
};
