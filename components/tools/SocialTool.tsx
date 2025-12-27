import React, { useState } from 'react';
import { Share2, RefreshCw, Linkedin, Twitter, Instagram, Facebook, Copy, Check, Image as ImageIcon, Sliders, MessageSquare, Globe, Smile, AlertCircle, Video, Youtube, AtSign, Pin } from 'lucide-react';
import { generateSocialCampaign, generateImageWithGemini } from '../../services/geminiService';
import { SocialCampaign, LoadingState, SocialPlatform, SocialSettings } from '../../types';

const SocialTool: React.FC = () => {
  const [topic, setTopic] = useState('');
  
  // Settings State
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['linkedin', 'twitter', 'instagram']);
  const [tone, setTone] = useState('Professional');
  const [style, setStyle] = useState('Standard');
  const [language, setLanguage] = useState('English');
  const [useEmojis, setUseEmojis] = useState(true);

  // Results State
  const [campaign, setCampaign] = useState<SocialCampaign | null>(null);
  const [images, setImages] = useState<{ [key: string]: string }>({});
  const [status, setStatus] = useState<LoadingState>('idle');
  const [imageStatus, setImageStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState<string | null>(null);

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(prev => prev.filter(item => item !== p));
    } else {
      setSelectedPlatforms(prev => [...prev, p]);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim() || selectedPlatforms.length === 0) return;
    setStatus('loading');
    setCampaign(null);
    setImages({});
    setImageStatus('idle');

    const settings: SocialSettings = {
       platforms: selectedPlatforms,
       tone,
       style,
       language,
       useEmojis
    };

    try {
      // 1. Generate Text Content
      const result = await generateSocialCampaign(topic, settings);
      setCampaign(result);
      setStatus('success');
      
      // 2. Trigger Image Generations (Parallel)
      setImageStatus('loading');
      
      const requests: { platform: string, prompt?: string, ratio: string }[] = [];
      
      if (result.linkedin) requests.push({ platform: 'linkedin', prompt: result.linkedin.imagePrompt, ratio: '16:9' });
      if (result.twitter) requests.push({ platform: 'twitter', prompt: result.twitter.imagePrompt, ratio: '16:9' });
      if (result.instagram) requests.push({ platform: 'instagram', prompt: result.instagram.imagePrompt, ratio: '1:1' });
      if (result.facebook) requests.push({ platform: 'facebook', prompt: result.facebook.imagePrompt, ratio: '16:9' });
      if (result.tiktok) requests.push({ platform: 'tiktok', prompt: result.tiktok.imagePrompt, ratio: '9:16' });
      if (result.youtube_shorts) requests.push({ platform: 'youtube_shorts', prompt: result.youtube_shorts.imagePrompt, ratio: '9:16' });
      if (result.threads) requests.push({ platform: 'threads', prompt: result.threads.imagePrompt, ratio: '1:1' });
      if (result.pinterest) requests.push({ platform: 'pinterest', prompt: result.pinterest.imagePrompt, ratio: '9:16' });

      requests.forEach(async (req) => {
         if (!req.prompt) return;
         try {
            const img = await generateImageWithGemini(req.prompt, req.ratio);
            setImages(prev => ({ ...prev, [req.platform]: img }));
         } catch (e) {
            console.error(`Failed to generate ${req.platform} image`, e);
         }
      });
      
      setImageStatus('success');

    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Share2 className="w-8 h-8 text-blue-500" />
          Nano Social
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Turn one idea into a multi-platform campaign instantly.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {/* Updated label to match the actual model used (gemini-3-flash-preview). */}
              Model: gemini-3-flash-preview
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT COLUMN: Input & Configuration */}
         <div className="lg:col-span-1 space-y-6">
            
            {/* Topic Input */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
               <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Campaign Topic</label>
               <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What is this post about? (e.g. 'New Product Launch', 'Industry Trends', Link to article...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none text-sm"
               />
            </div>

            {/* Platform Selector with Scroll */}
            <div className={`bg-slate-900 border rounded-2xl p-6 shadow-lg space-y-4 transition-colors ${selectedPlatforms.length === 0 ? 'border-red-500/50' : 'border-slate-800'}`}>
               <div className="flex justify-between items-center">
                 <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Platforms</label>
                 {selectedPlatforms.length === 0 && <span className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Required</span>}
               </div>
               
               {/* Scrollable Container */}
               <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => togglePlatform('linkedin')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('linkedin') ? 'bg-[#0077b5]/20 border-[#0077b5] text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <Linkedin className={`w-5 h-5 ${selectedPlatforms.includes('linkedin') ? 'text-[#0077b5]' : ''}`} />
                        <span className="text-sm font-bold">LinkedIn</span>
                      </button>
                      <button 
                        onClick={() => togglePlatform('twitter')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('twitter') ? 'bg-white/10 border-white text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <Twitter className={`w-5 h-5 ${selectedPlatforms.includes('twitter') ? 'text-white' : ''}`} />
                        <span className="text-sm font-bold">X / Twitter</span>
                      </button>
                      <button 
                        onClick={() => togglePlatform('instagram')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('instagram') ? 'bg-pink-600/20 border-pink-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <Instagram className={`w-5 h-5 ${selectedPlatforms.includes('instagram') ? 'text-pink-500' : ''}`} />
                        <span className="text-sm font-bold">Instagram</span>
                      </button>
                      <button 
                        onClick={() => togglePlatform('facebook')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('facebook') ? 'bg-blue-600/20 border-blue-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <Facebook className={`w-5 h-5 ${selectedPlatforms.includes('facebook') ? 'text-blue-600' : ''}`} />
                        <span className="text-sm font-bold">Facebook</span>
                      </button>

                      {/* New Platforms */}
                      <button 
                        onClick={() => togglePlatform('tiktok')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('tiktok') ? 'bg-black/50 border-white text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <Video className={`w-5 h-5 ${selectedPlatforms.includes('tiktok') ? 'text-cyan-400' : ''}`} />
                        <span className="text-sm font-bold">TikTok</span>
                      </button>
                      <button 
                        onClick={() => togglePlatform('youtube_shorts')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('youtube_shorts') ? 'bg-red-600/20 border-red-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <Youtube className={`w-5 h-5 ${selectedPlatforms.includes('youtube_shorts') ? 'text-red-600' : ''}`} />
                        <span className="text-sm font-bold">Shorts</span>
                      </button>
                      <button 
                        onClick={() => togglePlatform('threads')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('threads') ? 'bg-white/10 border-white text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <AtSign className={`w-5 h-5 ${selectedPlatforms.includes('threads') ? 'text-white' : ''}`} />
                        <span className="text-sm font-bold">Threads</span>
                      </button>
                      <button 
                        onClick={() => togglePlatform('pinterest')}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatforms.includes('pinterest') ? 'bg-red-600/20 border-red-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <Pin className={`w-5 h-5 ${selectedPlatforms.includes('pinterest') ? 'text-red-600' : ''}`} />
                        <span className="text-sm font-bold">Pinterest</span>
                      </button>
                  </div>
               </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
               <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Sliders className="w-4 h-4" /> Configuration
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs text-slate-500 font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Tone (Attitude)</label>
                     <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                     >
                        <option>Professional</option>
                        <option>Witty & Fun</option>
                        <option>Urgent / Sales</option>
                        <option>Casual</option>
                        <option>Inspirational</option>
                     </select>
                  </div>
                  
                  <div className="space-y-1">
                     <label className="text-xs text-slate-500 font-semibold flex items-center gap-1"><Sliders className="w-3 h-3"/> Style (Format)</label>
                     <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                     >
                        <option>Standard</option>
                        <option>Storytelling</option>
                        <option>Bullet Points</option>
                        <option>Short & Punchy</option>
                        <option>Question & Answer</option>
                     </select>
                  </div>

                  <div className="space-y-1">
                     <label className="text-xs text-slate-500 font-semibold flex items-center gap-1"><Globe className="w-3 h-3"/> Language</label>
                     <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                     >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Portuguese</option>
                        <option>Chinese (Simplified)</option>
                        <option>Japanese</option>
                     </select>
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                     <label className="text-sm text-white font-medium flex items-center gap-2">
                        <Smile className="w-4 h-4 text-yellow-500" />
                        Include Emojis
                     </label>
                     <button 
                        onClick={() => setUseEmojis(!useEmojis)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${useEmojis ? 'bg-green-500' : 'bg-slate-700'}`}
                     >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${useEmojis ? 'translate-x-6' : ''}`}></div>
                     </button>
                  </div>
               </div>
            </div>

            <button
               onClick={handleGenerate}
               disabled={!topic || selectedPlatforms.length === 0 || status === 'loading'}
               className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg 
                  ${(!topic || selectedPlatforms.length === 0 || status === 'loading') 
                     ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                     : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Share2 />}
               {status === 'loading' ? 'Generating...' : 
                 selectedPlatforms.length === 0 ? 'Select at least one platform' : 
                 !topic ? 'Enter a Topic' :
                 'Generate Campaign'}
            </button>
         </div>

         {/* RIGHT COLUMN: Results */}
         <div className="lg:col-span-2 space-y-6">
            {!campaign && status !== 'loading' && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 min-h-[400px]">
                  <Share2 className="w-16 h-16 opacity-20 mb-4" />
                  <p>Configure your campaign and hit Generate.</p>
               </div>
            )}

            {/* LinkedIn Result */}
            {campaign?.linkedin && selectedPlatforms.includes('linkedin') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-[#0077b5] p-4 flex flex-col justify-between text-white">
                     <div className="flex items-center gap-2 font-bold text-lg"><Linkedin className="w-6 h-6" /> LinkedIn</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-video flex items-center justify-center overflow-hidden">
                        {images.linkedin ? <img src={images.linkedin} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap flex-1">
                        {Array.isArray(campaign.linkedin.text) ? campaign.linkedin.text.join('\n\n') : campaign.linkedin.text}
                     </div>
                     <button onClick={() => handleCopy(Array.isArray(campaign.linkedin.text) ? campaign.linkedin.text.join('\n\n') : campaign.linkedin.text as string, 'li')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'li' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy
                     </button>
                  </div>
               </div>
            )}

            {/* Twitter Result */}
            {campaign?.twitter && selectedPlatforms.includes('twitter') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-black p-4 flex flex-col justify-between text-white border-r border-slate-800">
                     <div className="flex items-center gap-2 font-bold text-lg"><Twitter className="w-6 h-6" /> X / Twitter</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-video flex items-center justify-center overflow-hidden">
                        {images.twitter ? <img src={images.twitter} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="space-y-3">
                        {(Array.isArray(campaign.twitter.text) ? campaign.twitter.text : [campaign.twitter.text]).map((tweet, i) => (
                           <div key={i} className="bg-slate-950 p-3 rounded-lg text-sm text-slate-300 border border-slate-800 relative pl-8">
                              <span className="absolute left-2 top-3 text-slate-500 text-xs font-bold">{i+1}</span>
                              {tweet}
                           </div>
                        ))}
                     </div>
                     <button onClick={() => handleCopy((Array.isArray(campaign.twitter.text) ? campaign.twitter.text : [campaign.twitter.text]).join('\n\n'), 'tw')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'tw' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy Thread
                     </button>
                  </div>
               </div>
            )}

            {/* Instagram Result */}
            {campaign?.instagram && selectedPlatforms.includes('instagram') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-gradient-to-br from-purple-600 to-pink-600 p-4 flex flex-col justify-between text-white">
                     <div className="flex items-center gap-2 font-bold text-lg"><Instagram className="w-6 h-6" /> Instagram</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-square flex items-center justify-center overflow-hidden">
                        {images.instagram ? <img src={images.instagram} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap flex-1">
                        <p>{Array.isArray(campaign.instagram.text) ? campaign.instagram.text.join(' ') : campaign.instagram.text}</p>
                        {campaign.instagram.hashtags && <p className="mt-2 text-pink-400">{campaign.instagram.hashtags}</p>}
                     </div>
                     <button onClick={() => handleCopy(`${Array.isArray(campaign.instagram.text) ? campaign.instagram.text.join(' ') : campaign.instagram.text}\n\n${campaign.instagram.hashtags}`, 'ig')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'ig' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy Caption
                     </button>
                  </div>
               </div>
            )}

            {/* Facebook Result */}
            {campaign?.facebook && selectedPlatforms.includes('facebook') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-[#1877F2] p-4 flex flex-col justify-between text-white">
                     <div className="flex items-center gap-2 font-bold text-lg"><Facebook className="w-6 h-6" /> Facebook</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-video flex items-center justify-center overflow-hidden">
                        {images.facebook ? <img src={images.facebook} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap flex-1">
                        {Array.isArray(campaign.facebook.text) ? campaign.facebook.text.join('\n\n') : campaign.facebook.text}
                     </div>
                     <button onClick={() => handleCopy(Array.isArray(campaign.facebook.text) ? campaign.facebook.text.join('\n\n') : campaign.facebook.text as string, 'fb')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'fb' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy Post
                     </button>
                  </div>
               </div>
            )}

            {/* TikTok Result */}
            {campaign?.tiktok && selectedPlatforms.includes('tiktok') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-black p-4 flex flex-col justify-between text-white border-r border-slate-800">
                     <div className="flex items-center gap-2 font-bold text-lg"><Video className="w-6 h-6 text-cyan-400" /> TikTok</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-[9/16] flex items-center justify-center overflow-hidden max-w-[120px] mx-auto">
                        {images.tiktok ? <img src={images.tiktok} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap flex-1 font-mono">
                        {Array.isArray(campaign.tiktok.text) ? campaign.tiktok.text.join('\n\n') : campaign.tiktok.text}
                     </div>
                     <button onClick={() => handleCopy(Array.isArray(campaign.tiktok.text) ? campaign.tiktok.text.join('\n\n') : campaign.tiktok.text as string, 'tk')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'tk' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy Script
                     </button>
                  </div>
               </div>
            )}

            {/* YouTube Shorts Result */}
            {campaign?.youtube_shorts && selectedPlatforms.includes('youtube_shorts') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-red-600 p-4 flex flex-col justify-between text-white">
                     <div className="flex items-center gap-2 font-bold text-lg"><Youtube className="w-6 h-6" /> Shorts</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-[9/16] flex items-center justify-center overflow-hidden max-w-[120px] mx-auto">
                        {images.youtube_shorts ? <img src={images.youtube_shorts} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap flex-1 font-mono">
                        {Array.isArray(campaign.youtube_shorts.text) ? campaign.youtube_shorts.text.join('\n\n') : campaign.youtube_shorts.text}
                     </div>
                     <button onClick={() => handleCopy(Array.isArray(campaign.youtube_shorts.text) ? campaign.youtube_shorts.text.join('\n\n') : campaign.youtube_shorts.text as string, 'yt')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'yt' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy Script
                     </button>
                  </div>
               </div>
            )}

            {/* Threads Result */}
            {campaign?.threads && selectedPlatforms.includes('threads') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-black p-4 flex flex-col justify-between text-white border-r border-slate-800">
                     <div className="flex items-center gap-2 font-bold text-lg"><AtSign className="w-6 h-6" /> Threads</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-square flex items-center justify-center overflow-hidden max-w-[150px] mx-auto">
                        {images.threads ? <img src={images.threads} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap flex-1">
                        {Array.isArray(campaign.threads.text) ? campaign.threads.text.join('\n\n') : campaign.threads.text}
                     </div>
                     <button onClick={() => handleCopy(Array.isArray(campaign.threads.text) ? campaign.threads.text.join('\n\n') : campaign.threads.text as string, 'th')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'th' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy Thread
                     </button>
                  </div>
               </div>
            )}

            {/* Pinterest Result */}
            {campaign?.pinterest && selectedPlatforms.includes('pinterest') && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                  <div className="md:w-1/3 bg-red-600 p-4 flex flex-col justify-between text-white">
                     <div className="flex items-center gap-2 font-bold text-lg"><Pin className="w-6 h-6" /> Pinterest</div>
                     <div className="mt-4 bg-white/10 rounded-lg p-2 aspect-[9/16] flex items-center justify-center overflow-hidden max-w-[120px] mx-auto">
                        {images.pinterest ? <img src={images.pinterest} className="w-full h-full object-cover"/> : (
                           imageStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-6 h-6 opacity-50"/>
                        )}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap flex-1">
                        {Array.isArray(campaign.pinterest.text) ? campaign.pinterest.text.join('\n\n') : campaign.pinterest.text}
                     </div>
                     <button onClick={() => handleCopy(Array.isArray(campaign.pinterest.text) ? campaign.pinterest.text.join('\n\n') : campaign.pinterest.text as string, 'pi')} className="self-end flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {copied === 'pi' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy Pin
                     </button>
                  </div>
               </div>
            )}

         </div>
      </div>
    </div>
  );
};

export default SocialTool;