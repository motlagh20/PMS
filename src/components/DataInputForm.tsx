import React, { useState, useEffect } from 'react';
import { DbRecord } from '../types';
import { addRecord, updateRecord } from '../services/dbService';
import {
  PlusCircle,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Package,
  Calendar,
  Layers,
  MapPin,
  FileText,
  User,
} from 'lucide-react';

interface DataInputFormProps {
  editRecord?: DbRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const CATEGORIES: Record<string, string[]> = {
  Electronics: ['Wireless Headphones', 'Ultra HD Monitor', 'Mechanical Keyboard', 'Smart Watch', 'USB-C Dock', 'Tablet Pro', 'Noise-Cancelling Earbuds'],
  Furniture: ['Ergonomic Chair', 'Standing Desk', 'Bookshelf', 'Office Sofa', 'Desk Lamp', 'Conference Table'],
  'Office Supplies': ['Premium Notebooks', 'Gel Pens Box', 'Stapler Pro', 'Desk Organizer', 'Whiteboard', 'Laser Toner'],
  Apparel: ['Tech Hoodie', 'Performance Polo', 'Fleece Vest', 'Running Cap', 'Rain Jacket', 'Embroidered Cap'],
  Accessories: ['Laptop Sleeve', 'Mouse Pad XL', 'Cable Organizer', 'Phone Stand', 'Backpack', 'Travel Adapter'],
  Services: ['Consulting Hours', 'System Setup', 'Maintenance Plan', 'Custom Integration'],
};

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'];
const STATUSES = ['Delivered', 'Processing', 'Shipped', 'Pending', 'Cancelled'];

export const DataInputForm: React.FC<DataInputFormProps> = ({
  editRecord,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const [orderId, setOrderId] = useState<string>(
    editRecord ? editRecord.orderId : `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [date, setDate] = useState<string>(
    editRecord ? editRecord.date : new Date().toISOString().split('T')[0]
  );
  const [region, setRegion] = useState<string>(editRecord ? editRecord.region : 'North America');
  const [category, setCategory] = useState<string>(editRecord ? editRecord.category : 'Electronics');
  const [product, setProduct] = useState<string>(
    editRecord ? editRecord.product : 'Wireless Headphones'
  );
  const [customProduct, setCustomProduct] = useState<string>('');
  const [isCustomProduct, setIsCustomProduct] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(editRecord ? editRecord.quantity : 1);
  const [unitPrice, setUnitPrice] = useState<number>(editRecord ? editRecord.unitPrice : 49.99);
  const [profitMargin, setProfitMargin] = useState<number>(
    editRecord && editRecord.totalSales ? Math.round((editRecord.profit / editRecord.totalSales) * 100) : 25
  );
  const [status, setStatus] = useState<string>(editRecord ? editRecord.status : 'Processing');
  const [customerName, setCustomerName] = useState<string>(editRecord?.customerName || '');
  const [notes, setNotes] = useState<string>(editRecord?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state if editRecord changes
  useEffect(() => {
    if (editRecord) {
      setOrderId(editRecord.orderId);
      setDate(editRecord.date);
      setRegion(editRecord.region);
      setCategory(editRecord.category);
      setProduct(editRecord.product);
      setQuantity(editRecord.quantity);
      setUnitPrice(editRecord.unitPrice);
      setStatus(editRecord.status);
      setCustomerName(editRecord.customerName || '');
      setNotes(editRecord.notes || '');
      if (editRecord.totalSales > 0) {
        setProfitMargin(Math.round((editRecord.profit / editRecord.totalSales) * 100));
      }
    }
  }, [editRecord]);

  // Derived calculations
  const totalSales = Math.round(quantity * unitPrice * 100) / 100;
  const calculatedProfit = Math.round(totalSales * (profitMargin / 100) * 100) / 100;

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const availableProducts = CATEGORIES[newCategory] || [];
    if (availableProducts.length > 0) {
      setProduct(availableProducts[0]);
      setIsCustomProduct(false);
    } else {
      setIsCustomProduct(true);
      setCustomProduct('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    const activeProduct = isCustomProduct ? customProduct.trim() || 'Custom Item' : product;

    if (!orderId.trim()) {
      setNotification({ type: 'error', message: 'Please enter a valid Order ID.' });
      setIsSubmitting(false);
      return;
    }

    if (quantity <= 0) {
      setNotification({ type: 'error', message: 'Quantity must be at least 1.' });
      setIsSubmitting(false);
      return;
    }

    try {
      if (editRecord) {
        // Update existing record
        await updateRecord(editRecord.id, {
          orderId,
          date,
          region,
          category,
          product: activeProduct,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          totalSales,
          profit: calculatedProfit,
          status,
          customerName: customerName.trim(),
          notes: notes.trim(),
        });

        setNotification({ type: 'success', message: `Record ${orderId} successfully updated in database!` });
      } else {
        // Create new record in Firestore
        await addRecord({
          orderId,
          date,
          region,
          category,
          product: activeProduct,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          totalSales,
          profit: calculatedProfit,
          status,
          customerName: customerName.trim(),
          notes: notes.trim(),
        });

        setNotification({
          type: 'success',
          message: `Record ${orderId} saved to database!`,
        });

        // Reset form for next entry
        setOrderId(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
        setQuantity(1);
        setCustomerName('');
        setNotes('');
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 600);
      }
    } catch (err: any) {
      console.error('Error saving record:', err);
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to save record to Firestore database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const productOptions = CATEGORIES[category] || [];

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status Notice */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Row 1: Order ID & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Order / Record ID <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. ORD-1024"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Entry Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Customer Name & Region */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Customer / Client Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Acme Corporation"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Region / Territory <span className="text-rose-500">*</span>
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Category & Product Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {Object.keys(CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Other">Other / Custom</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Product / Item <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCustomProduct(!isCustomProduct)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {isCustomProduct ? 'Pick from List' : '+ Enter Custom'}
            </button>
          </div>

          {isCustomProduct ? (
            <input
              type="text"
              required
              value={customProduct}
              onChange={(e) => setCustomProduct(e.target.value)}
              placeholder="Type custom product name..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {productOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Row 4: Pricing & Quantity Financial Breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Financial & Quantity Metrics
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Price ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Margin (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Real-time Computed Summary */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Calculated Revenue</span>
            <span className="font-mono text-base font-bold text-slate-900">
              ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimated Profit</span>
            <span className="font-mono text-base font-bold text-emerald-700">
              ${calculatedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Row 5: Fulfillment Status & Operational Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status <span className="text-rose-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Reference
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs hover:shadow-md transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Saving to Database...</span>
          ) : editRecord ? (
            <>
              <Save className="w-4 h-4" />
              <span>Update Record</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Submit to Database</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editRecord ? 'Edit Database Record' : 'Add New Data Record'}
                </h3>
                <p className="text-xs text-slate-500">
                  Persisted directly in your Firestore Database
                </p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Data Input Form</h3>
            <p className="text-xs text-slate-500">
              Submit records directly to your Firestore Database with automatic revenue & profit calculations
            </p>
          </div>
        </div>
      </div>
      {formContent}
    </div>
  );
};
