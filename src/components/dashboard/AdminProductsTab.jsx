import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Image as ImageIcon, Edit3, Save, X } from 'lucide-react';
import { adminListProducts, adminUpdateProduct, adminCreateProduct } from '@/api/AdminProductsApi';

const AdminProductsTab = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null); // { isNew?: boolean, ...fields }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminListProducts({ limit: 50 });
        setProducts(res?.products || []);
      } catch (e) {
        console.error('Error loading products', e);
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to load products.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const openEditor = (product) => {
    const primary = product?.variants?.[0] || null;
    setEditing({
      raw: product,
      id: product.id,
      title: product.title || '',
      description: product.description || '',
      image: product.image || '',
      subtitle: product.subtitle || '',
      ribbonText: product.ribbon_text || '',
      // Specs / feature bullets, shown on cards & product page
      featuresText: (product.features || []).join('\n'),
      priceId: primary?.id || null,
      price: primary ? (primary.price_in_cents || 0) / 100 : 0,
      salePrice: primary && primary.sale_price_in_cents != null ? primary.sale_price_in_cents / 100 : '',
      currency: primary?.currency || 'EUR',
      priceNickname: 'Default',
    });
    setSheetOpen(true);
  };

  const openCreator = () => {
    setEditing({
      isNew: true,
      id: null,
      title: '',
      description: '',
      image: '',
      subtitle: '',
      ribbonText: '',
      featuresText: '',
      priceId: null,
      price: 0,
      salePrice: '',
      currency: 'EUR',
      priceNickname: 'Default',
    });
    setSheetOpen(true);
  };

  const handleFieldChange = (field, value) => {
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editing) return;
    const { isNew, id, title, description, image, subtitle, ribbonText, featuresText, priceId, price, salePrice, currency, priceNickname } = editing;

    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Product name cannot be empty.' });
      return;
    }
    if (!isNew && !priceId) {
      toast({ variant: 'destructive', title: 'Missing price', description: 'Primary price variant is missing.' });
      return;
    }

    try {
      setSaving(true);
      const unitAmountCents = Math.round(Number(price || 0) * 100);
      const salePriceCents = salePrice === '' ? null : Math.round(Number(salePrice) * 100);

      const features = (featuresText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (isNew) {
        const created = await adminCreateProduct({
          name: title,
          description,
          image,
          subtitle,
          ribbonText,
          features,
          unitAmountCents,
          salePriceCents,
          currency: (currency || 'EUR').toLowerCase(),
          priceNickname: priceNickname || 'Default',
        });
        setProducts((prev) => [created, ...prev]);
        toast({ title: 'Product created', description: 'New product added to the store.' });
      } else {
        const updated = await adminUpdateProduct({
          productId: id,
          name: title,
          description,
          image,
          subtitle,
          ribbonText,
          features,
          priceId,
          unitAmountCents,
          salePriceCents,
        });
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast({ title: 'Product updated', description: 'Storefront will reflect these changes shortly.' });
      }
      setSheetOpen(false);
      setEditing(null);
    } catch (e) {
      console.error('Error saving product', e);
      toast({ variant: 'destructive', title: 'Save failed', description: e.message || 'Could not update product.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card-dark rounded-2xl p-6 border border-white/10 bg-[#121212]"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Products</h2>
          <p className="text-sm text-gray-400">Edit product name, imagery, details and pricing used in the store.</p>
        </div>
        <Button onClick={openCreator} className="bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold px-4">
          + Add Product
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/10">
              <TableHead className="text-gray-400 text-xs uppercase">Product</TableHead>
              <TableHead className="text-gray-400 text-xs uppercase">Price</TableHead>
              <TableHead className="text-gray-400 text-xs uppercase">Ribbon</TableHead>
              <TableHead className="text-right text-gray-400 text-xs uppercase">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const primary = product.variants?.[0];
                const price = primary ? primary.price_formatted : '-';
                const sale = primary?.sale_price_formatted;
                return (
                  <TableRow key={product.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white line-clamp-1">{product.title}</div>
                          {product.subtitle && (
                            <div className="text-xs text-gray-500 line-clamp-1">{product.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-100">
                      {sale ? (
                        <div className="flex flex-col">
                          <span className="text-xs line-through text-gray-500">{price}</span>
                          <span className="text-sm font-semibold text-emerald-400">{sale}</span>
                        </div>
                      ) : (
                        <span>{price}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">{product.ribbon_text || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-white/10"
                        onClick={() => openEditor(product)}
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg bg-[#0b0b0b] border-l border-white/10 text-white">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Edit Product
              </SheetTitle>
              <SheetDescription>Changes sync with the public store once saved.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Name</label>
                <Input
                  value={editing.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="bg-black/40 border-white/10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Subtitle</label>
                <Input
                  value={editing.subtitle}
                  onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                  className="bg-black/40 border-white/10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Main Image URL</label>
                <Input
                  value={editing.image}
                  onChange={(e) => handleFieldChange('image', e.target.value)}
                  className="bg-black/40 border-white/10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Short Description</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full min-h-[80px] rounded-md bg-black/40 border border-white/10 text-sm px-3 py-2 outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.price}
                    onChange={(e) => handleFieldChange('price', e.target.value)}
                    className="bg-black/40 border-white/10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Sale Price (optional)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.salePrice}
                    onChange={(e) => handleFieldChange('salePrice', e.target.value)}
                    className="bg-black/40 border-white/10 text-sm"
                  />
                </div>
              </div>

              {editing?.isNew && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Currency</label>
                    <select
                      value={editing.currency}
                      onChange={(e) => handleFieldChange('currency', e.target.value)}
                      className="w-full h-10 rounded-md bg-black/40 border border-white/10 px-3 text-sm"
                    >
                      <option>EUR</option>
                      <option>USD</option>
                      <option>GBP</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Price Nickname</label>
                    <Input
                      value={editing.priceNickname}
                      onChange={(e) => handleFieldChange('priceNickname', e.target.value)}
                      className="bg-black/40 border-white/10 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Ribbon Text</label>
                <Input
                  value={editing.ribbonText}
                  onChange={(e) => handleFieldChange('ribbonText', e.target.value)}
                  placeholder="Best Seller, High Demand, etc."
                  className="bg-black/40 border-white/10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">
                  Specs / Feature bullets
                  <span className="ml-1 text-[10px] text-gray-500">(one per line)</span>
                </label>
                <textarea
                  value={editing.featuresText}
                  onChange={(e) => handleFieldChange('featuresText', e.target.value)}
                  className="w-full min-h-[120px] rounded-md bg-black/40 border border-white/10 text-sm px-3 py-2 outline-none focus:border-cyan-500/60"
                  placeholder="e.g.\n25 Reviews on One Platform\nGeo-Targeted Reviewers\n7-Day Drip Delivery"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="text-sm text-gray-400 hover:text-white"
                onClick={() => {
                  setSheetOpen(false);
                  setEditing(null);
                }}
              >
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                type="button"
                className="bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold px-6"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-1" /> Save Changes
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </motion.div>
  );
};

export default AdminProductsTab;
