/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  Smartphone, 
  Facebook, 
  MessageSquare,
  Zap,
  Layout,
  Type as TypeIcon,
  Globe,
  Palette,
  ShoppingCart,
  Search,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { generateHooks, extractShopeeDetails, GenerationResponse, HookResult } from './lib/gemini';

const PLATFORMS = [
  { id: 'threads', name: 'Threads', icon: MessageSquare, color: 'bg-slate-900' },
  { id: 'tiktok', name: 'TikTok', icon: Smartphone, color: 'bg-pink-600' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
];

const STYLES = [
  { id: 'story', name: 'Storytelling', emoji: '📖' },
  { id: 'fomo', name: 'FOMO', emoji: '⏰' },
  { id: 'problem', name: 'Problem-Solution', emoji: '💡' },
  { id: 'curiosity', name: 'Curiosity', emoji: '🤔' },
  { id: 'social', name: 'Social Proof', emoji: '⭐' },
];

export default function App() {
  const [product, setProduct] = useState('');
  const [shopeeUrl, setShopeeUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['threads', 'tiktok', 'facebook']);
  const [tone, setTone] = useState('casual');
  const [lang, setLang] = useState('bm');
  const [ctaType, setCtaType] = useState<'soft' | 'hard'>('soft');
  const [count, setCount] = useState('3');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['story', 'fomo', 'problem']);
  const [threadLength, setThreadLength] = useState<'short' | 'long'>('short');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const saveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setUserApiKey(key);
    toast.success('API Key berjaya disimpan!');
    setIsSettingsOpen(false);
  };

  const handleTogglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleToggleStyle = (id: string) => {
    setSelectedStyles(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleExtractShopee = async () => {
    if (!shopeeUrl.trim()) return;
    
    // Simple validation to ensure it's a shopee link
    if (!shopeeUrl.includes('shopee.com')) {
      toast.error('Sila masukkan link Shopee yang sah.');
      return;
    }

    setIsExtracting(true);
    toast.info('Sedang mengekstrak maklumat produk...');
    
    try {
      const details = await extractShopeeDetails(shopeeUrl, userApiKey);
      if (details && !details.toLowerCase().includes('cannot find') && !details.toLowerCase().includes('maaf')) {
        setProduct(prev => prev ? `${prev}\n\n${details}` : details);
        toast.success('Maklumat produk berjaya diekstrak!');
        setShopeeUrl(''); // Clear input on success
      } else {
        toast.error('Gagal mengekstrak maklumat. Sila masukkan butiran secara manual.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ralat berlaku semasa mengekstrak maklumat.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!product.trim()) return;
    setIsGenerating(true);
    try {
      const data = await generateHooks({
        product,
        shopeeUrl,
        platforms: selectedPlatforms,
        tone,
        count: parseInt(count),
        styles: selectedStyles,
        lang,
        ctaType,
        threadLength,
        customKey: userApiKey
      });
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0c0c12] text-slate-100 font-sans selection:bg-orange-500/30">
      <Toaster theme="dark" position="top-center" />
      
      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Top Navigation / Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 mb-8">
          <Dialog>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-xs h-9">
                <Globe size={14} className="mr-2" /> Setup Guide
              </Button>
            } />
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
              <DialogHeader>
                <DialogTitle>Panduan Penggunaan</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Langkah-langkah untuk menggunakan HookCraft secara optimum.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-orange-500 flex items-center gap-2">
                    <Smartphone size={16} /> 1. Install sebagai PWA
                  </h4>
                  <p className="text-sm text-slate-300">
                    Buka aplikasi ini di Chrome (Android) atau Safari (iOS), kemudian pilih <strong>"Add to Home Screen"</strong> untuk gunakannya seperti aplikasi biasa.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-orange-500 flex items-center gap-2">
                    <Zap size={16} /> 2. Guna Gemini Sendiri
                  </h4>
                  <p className="text-sm text-slate-300">
                    Untuk kelajuan dan had penggunaan yang lebih tinggi, anda boleh masukkan API Key anda sendiri:
                  </p>
                  <ol className="text-xs text-slate-400 list-decimal ml-4 space-y-1">
                    <li>Layari <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-orange-500 underline">Google AI Studio</a>.</li>
                    <li>Klik <strong>"Create API key"</strong>.</li>
                    <li>Salin key tersebut dan masukkan dalam menu <strong>Settings</strong> di aplikasi ini.</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-xs h-9">
                <Palette size={14} className="mr-2" /> Settings
              </Button>
            } />
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Konfigurasi API Key Gemini anda di sini.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Gemini API Key</label>
                  <Input 
                    type="password"
                    placeholder="Masukkan API Key anda..."
                    className="bg-slate-950 border-slate-800 focus:border-orange-500/50"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    * API Key disimpan secara lokal di peranti anda sahaja.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => saveApiKey(userApiKey)} className="bg-orange-600 hover:bg-orange-500">
                  Simpan Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {results && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setResults(null);
                toast.info('Sejarah post telah dikosongkan.');
              }}
              className="bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-500 text-xs h-9"
            >
              <RefreshCw size={14} className="mr-2" /> Clear History
            </Button>
          )}
        </div>

        <header className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold tracking-widest uppercase mb-6"
          >
            <Zap size={14} /> AI-Powered Content Engine
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent"
          >
            Hook<span className="text-orange-500">Craft</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Generate scroll-stopping threads, scripts, and high-converting posts in seconds.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-5 space-y-6"
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layout size={18} className="text-orange-500" /> 1. Product Details
                </CardTitle>
                <CardDescription>Describe what you're selling or talking about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="e.g. Local Vitamin C Serum, brightens skin in 7 days, Korean formula, RM59, 2000+ happy customers..."
                  className="bg-slate-950 border-slate-800 min-h-[120px] focus:border-orange-500/50 transition-colors"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart size={18} className="text-orange-500" /> 2. Shopee Link (Optional)
                </CardTitle>
                <CardDescription>Paste a Shopee link to extract details OR use as CTA link.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://shopee.com.my/product-link..."
                    className="bg-slate-950 border-slate-800 focus:border-orange-500/50"
                    value={shopeeUrl}
                    onChange={(e) => setShopeeUrl(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    className="border-slate-800 hover:bg-slate-800"
                    onClick={handleExtractShopee}
                    disabled={isExtracting || !shopeeUrl.trim()}
                    title="Extract details from link"
                  >
                    {isExtracting ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smartphone size={18} className="text-orange-500" /> 3. Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleTogglePlatform(p.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        selectedPlatforms.includes(p.id) 
                        ? 'bg-orange-500/10 border-orange-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <p.icon size={24} className={selectedPlatforms.includes(p.id) ? 'text-orange-500' : ''} />
                      <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter">{p.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette size={18} className="text-orange-500" /> 4. Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Language</label>
                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="bm">Bahasa Melayu</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="mixed">Mixed (BM + EN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="hype">Hype</SelectItem>
                      <SelectItem value="sincere">Sincere</SelectItem>
                      <SelectItem value="pro">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Facebook CTA</label>
                  <Select value={ctaType} onValueChange={(v: any) => setCtaType(v)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="soft">Soft Sell</SelectItem>
                      <SelectItem value="hard">Hard Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedPlatforms.includes('threads') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Thread Length</label>
                    <Select value={threadLength} onValueChange={(v: any) => setThreadLength(v)}>
                      <SelectTrigger className="bg-slate-950 border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="short">Short (Quick)</SelectItem>
                        <SelectItem value="long">Long (Detailed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Count</label>
                  <Select value={count} onValueChange={setCount}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="2">2 Sets</SelectItem>
                      <SelectItem value="3">3 Sets</SelectItem>
                      <SelectItem value="5">5 Sets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TypeIcon size={18} className="text-orange-500" /> 5. Hook Styles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleToggleStyle(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedStyles.includes(s.id)
                        ? 'bg-orange-500/20 border-orange-500 text-orange-500'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {s.emoji} {s.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-900/20 transition-all active:scale-95"
              disabled={isGenerating || !product.trim()}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <><RefreshCw className="mr-2 animate-spin" /> Crafting Content...</>
              ) : (
                <><Sparkles className="mr-2" /> Generate Content</>
              )}
            </Button>
          </motion.div>

          {/* Results Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-7"
          >
            {!results && !isGenerating && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Send className="text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">Ready to Craft</h3>
                <p className="text-slate-500 max-w-xs">Fill in your product details or paste a Shopee link to start.</p>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="h-4 w-24 bg-slate-800 rounded" />
                    <div className="h-20 w-full bg-slate-800 rounded" />
                    <div className="h-4 w-full bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {results && (
              <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
                  {selectedPlatforms.map(pId => {
                    const p = PLATFORMS.find(x => x.id === pId)!;
                    return (
                      <TabsTrigger 
                        key={pId} 
                        value={pId}
                        className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                      >
                        <p.icon size={14} className="mr-2" /> {p.name}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {selectedPlatforms.map(pId => (
                  <TabsContent key={pId} value={pId} className="space-y-6">
                    <AnimatePresence mode="popLayout">
                      {results.results[pId as keyof typeof results.results]?.map((hook, idx) => (
                        <motion.div
                          key={`${pId}-${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="bg-slate-900/80 border-slate-800 group overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                              <Badge variant="outline" className="bg-slate-950 border-slate-800 text-orange-500">
                                {STYLES.find(s => s.id === hook.style)?.emoji} {STYLES.find(s => s.id === hook.style)?.name}
                              </Badge>
                              {pId !== 'threads' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 hover:bg-slate-800"
                                  onClick={() => copyToClipboard(hook.content as string, `${pId}-${idx}`)}
                                >
                                  {copiedId === `${pId}-${idx}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                                </Button>
                              )}
                            </CardHeader>
                            <CardContent>
                              {pId === 'threads' && Array.isArray(hook.content) ? (
                                <div className="space-y-4">
                                  {hook.content.map((post, pIdx) => (
                                    <div key={pIdx} className="relative pl-6 pb-4 last:pb-0">
                                      {pIdx < hook.content.length - 1 && (
                                        <div className="absolute left-[7px] top-6 bottom-0 w-[2px] bg-slate-800" />
                                      )}
                                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                        <span className="text-[8px] font-bold">{pIdx + 1}</span>
                                      </div>
                                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 relative group/thread">
                                        <p className="text-slate-200 text-sm whitespace-pre-wrap">{post}</p>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover/thread:opacity-100 transition-opacity"
                                          onClick={() => copyToClipboard(post, `${pId}-${idx}-${pIdx}`)}
                                        >
                                          {copiedId === `${pId}-${idx}-${pIdx}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  <Button 
                                    className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-xs h-8"
                                    onClick={() => copyToClipboard((hook.content as string[]).join('\n\n---\n\n'), `${pId}-${idx}-all`)}
                                  >
                                    {copiedId === `${pId}-${idx}-all` ? 'Copied Full Thread!' : 'Copy Full Thread'}
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-sm">
                                  {hook.content}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
