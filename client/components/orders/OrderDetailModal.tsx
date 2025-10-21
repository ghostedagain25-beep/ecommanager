import React from 'react';
import type { FormattedOrder } from '../../types/orders';
import { SpinnerIcon, CheckCircleIcon, CancelIcon } from '../ui/icons';

interface OrderDetailModalProps {
  order: FormattedOrder | null;
  onClose: () => void;
  onComplete?: (orderId: number) => Promise<void>;
  onCancel?: (orderId: number, platform: 'wordpress' | 'shopify') => Promise<void>;
  isUpdating: boolean;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onComplete,
  onCancel,
  isUpdating,
}) => {
  if (!order) return null;

  const subtotal = order.lineItems?.reduce((acc, item) => acc + parseFloat(item.total), 0) || 0;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            Order Details: <span className="text-sky-400">{order.orderNumber}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Customer & Address Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Billing Address</h3>
              <address className="text-sm text-gray-300 not-italic">
                {order.billingAddress?.name}
                <br />
                {order.billingAddress?.address1}
                <br />
                {order.billingAddress?.address2 && (
                  <>
                    {order.billingAddress.address2}
                    <br />
                  </>
                )}
                {order.billingAddress?.cityStateZip}
                <br />
                {order.billingAddress?.country}
              </address>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Shipping Address</h3>
              <address className="text-sm text-gray-300 not-italic">
                {order.shippingAddress?.name}
                <br />
                {order.shippingAddress?.address1}
                <br />
                {order.shippingAddress?.address2 && (
                  <>
                    {order.shippingAddress.address2}
                    <br />
                  </>
                )}
                {order.shippingAddress?.cityStateZip}
                <br />
                {order.shippingAddress?.country}
              </address>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-white mb-2">Items</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {order.lineItems?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-white">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-300">
                        {order.currencySymbol}
                        {parseFloat(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <p>Subtotal:</p>{' '}
                <p>
                  {order.currencySymbol}
                  {subtotal.toFixed(2)}
                </p>
              </div>
              {order.shippingMethod && (
                <div className="flex justify-between text-gray-300">
                  <p>Shipping ({order.shippingMethod}):</p> <p>{/* Included in total for now */}</p>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <p>Tax:</p>{' '}
                <p>
                  {order.currencySymbol}
                  {parseFloat(order.totalTax || '0').toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-slate-600 pt-2 mt-2">
                <p>Total:</p>{' '}
                <p>
                  {order.currencySymbol}
                  {parseFloat(order.total).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex justify-end items-center gap-4 p-4 border-t border-slate-700 flex-shrink-0">
          {isUpdating && <SpinnerIcon className="w-5 h-5 text-sky-400" />}
          {order.canCancel && onCancel && (
            <button
              onClick={() => onCancel(order.id, order.platform)}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-md text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <CancelIcon className="w-4 h-4" />
              Cancel Order
            </button>
          )}
          {order.canComplete && onComplete && (
            <button
              onClick={() => onComplete(order.id)}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 rounded-md text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Mark as Completed
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default OrderDetailModal;
