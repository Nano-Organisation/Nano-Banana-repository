import React, { useState, useEffect, useRef } from 'react';
import { Music, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Download, ImageIcon, PlayCircle, Star, Volume2, VolumeX } from 'lucide-react';
import { generateImageWithGemini } from '../../services/geminiService';
import { LoadingState, RhymeData } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

// Pre-defined library of rhymes for instant access
// Replace musicUrl values with your actual mp3 file paths.
const PREBAKED_RHYMES: Record<string, RhymeData & { musicUrl: string }> = {
  "Twinkle Twinkle Little Star": {
    title: "Twinkle Twinkle Little Star",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    panels: [
      { lyrics: "Twinkle, twinkle, little star, How I wonder what you are!", imagePrompt: "A friendly golden star smiling in a deep blue night sky filled with clouds." },
      { lyrics: "Up above the world so high, Like a diamond in the sky.", imagePrompt: "The golden star shining brightly over a sleepy village with cozy houses." },
      { lyrics: "When the blazing sun is gone, When he nothing shines upon,", imagePrompt: "Twilight transition where the sun sets behind purple mountains." },
      { lyrics: "Then you show your little light, Twinkle, twinkle, all the night.", imagePrompt: "Close up of the star winking at a little boy looking through a window." }
    ]
  },
  "Humpty Dumpty": {
    title: "Humpty Dumpty",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    panels: [
      { lyrics: "Humpty Dumpty sat on a wall,", imagePrompt: "A cheerful egg-shaped character wearing a bowtie sitting on a stone garden wall." },
      { lyrics: "Humpty Dumpty had a great fall.", imagePrompt: "Humpty Dumpty falling through the air with a surprised expression." },
      { lyrics: "All the king's horses and all the king's men,", imagePrompt: "Knights in shiny armor and white horses rushing toward a garden wall." },
      { lyrics: "Couldn't put Humpty together again.", imagePrompt: "The knights looking puzzled at eggshells while Humpty winks at the viewer." }
    ]
  },
  "The Itsy Bitsy Spider": {
    title: "The Itsy Bitsy Spider",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    panels: [
      { lyrics: "The itsy bitsy spider climbed up the waterspout.", imagePrompt: "A cute tiny spider with large eyes climbing a blue metal pipe." },
      { lyrics: "Down came the rain and washed the spider out.", imagePrompt: "Big cartoon raindrops splashing against the pipe as the spider slides down." },
      { lyrics: "Out came the sun and dried up all the rain,", imagePrompt: "A big bright sun smiling in the corner, drying a wet brick wall." },
      { lyrics: "And the itsy bitsy spider climbed up the spout again.", imagePrompt: "The spider successfully reaching the top of the spout with a happy grin." }
    ]
  },
  "Mary Had a Little Lamb": {
    title: "Mary Had a Little Lamb",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    panels: [
      { lyrics: "Mary had a little lamb, Its fleece was white as snow.", imagePrompt: "A young girl in a pink dress walking with a fluffy white lamb." },
      { lyrics: "And everywhere that Mary went, The lamb was sure to go.", imagePrompt: "Mary skipping through a green meadow with the lamb following closely behind." },
      { lyrics: "It followed her to school one day, Which was against the rule.", imagePrompt: "The lamb peeking into a classroom door while students look surprised." },
      { lyrics: "It made the children laugh and play, To see a lamb at school.", imagePrompt: "Children cheering and petting the lamb in a bright classroom." }
    ]
  },
  "The Wheels on the Bus": {
    title: "The Wheels on the Bus",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    panels: [
      { lyrics: "The wheels on the bus go round and round.", imagePrompt: "A bright yellow school bus driving down a sunny street with spinning wheels." },
      { lyrics: "The wipers on the bus go swish, swish, swish.", imagePrompt: "The bus wipers moving in the rain with friendly eyes on the windshield." },
      { lyrics: "The horn on the bus goes beep, beep, beep.", imagePrompt: "A bus driver pressing a horn while kids wave from the windows." },
      { lyrics: "The people on the bus go up and down.", imagePrompt: "Happy children bouncing in their seats as the bus goes over a small bump." }
    ]
  },
  "Old MacDonald Had a Farm": {
    title: "Old MacDonald Had a Farm",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    panels: [
      { lyrics: "Old MacDonald had a farm, E-I-E-I-O!", imagePrompt: "A friendly farmer with a straw hat standing in front of a red barn." },
      { lyrics: "And on that farm he had a cow, E-I-E-I-O! With a moo-moo here and a moo-moo there!", imagePrompt: "A black and white spotted cow chewing grass near a wooden fence." },
      { lyrics: "And on that farm he had a goat, E-I-E-I-O! With a maa-maa here and a maa-maa there!", imagePrompt: "A cute brown and white goat standing on a small rock in the sun." },
      { lyrics: "And on that farm he had a lamb, E-I-E-I-O! With a baa-baa here and a baa-baa there!", imagePrompt: "A fluffy white lamb skipping in a lush green pasture." },
      { lyrics: "And on that farm he had a pig, E-I-E-I-O! With an oink-oink here and an oink-oink there!", imagePrompt: "A cheerful pink piglet sitting happily in a clean mud puddle." },
      { lyrics: "And on that farm he had a chicken, E-I-E-I-O! With a cluck-cluck here and a cluck-cluck there!", imagePrompt: "A bright red hen pecking at golden seeds in the barnyard." },
      { lyrics: "Old MacDonald had a farm, E-I-E-I-O!", imagePrompt: "A wide shot of the farm with all the animals, including cows, goats, lambs, pigs, and chickens celebrate together." }
    ]
  },
  "Baa Baa Black Sheep": {
    title: "Baa Baa Black Sheep",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    panels: [
      { lyrics: "Baa, baa, black sheep, Have you any wool?", imagePrompt: "A fluffy black sheep standing in a stable looking proud." },
      { lyrics: "Yes, sir, yes, sir, Three bags full.", imagePrompt: "Three large burlap sacks filled to the brim with soft wool." },
      { lyrics: "One for the master, One for the dame,", imagePrompt: "A man and a lady receiving their bags of wool with smiles." },
      { lyrics: "And one for the little boy who lives down the lane.", imagePrompt: "A little boy in a blue sweater waving from a small cottage." }
    ]
  },
  "Row Row Row Your Boat": {
    title: "Row Row Row Your Boat",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    panels: [
      { lyrics: "Row, row, row your boat, Gently down the stream.", imagePrompt: "A small wooden boat floating on a sparkling blue river with ducks." },
      { lyrics: "Merrily, merrily, merrily, merrily, Life is but a dream.", imagePrompt: "A family laughing and rowing together under a rainbow." },
      { lyrics: "Row, row, row your boat, If you see a crocodile,", imagePrompt: "A boat passing a friendly green crocodile peeking out from lily pads." },
      { lyrics: "Don't forget to scream!", imagePrompt: "The family playfully covering their mouths in faux-surprise while the croc smiles." }
    ]
  }
};

const RHYMES = Object.keys(PREBAKED_RHYMES);

const NurseryRhymesTool: React.FC = () => {
  const [selectedRhyme, setSelectedRhyme] = useState(RHYMES[0]);
  const [rhymeData, setRhymeData] = useState<RhymeData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [viewIndex, setViewIndex] = useState(0);

  // Music State
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle Mute/Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25; 
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, musicUrl]);

  const handleOpenRhyme = async () => {
    // FIXED STATE: Clear previous data but enter the SUCCESS state immediately with text
    const data = PREBAKED_RHYMES[selectedRhyme];
    
    setMusicUrl(data.musicUrl);
    setViewIndex(0);
    
    // Initialize the book with lyrics immediately
    const initialBook: RhymeData = {
      title: data.title,
      panels: data.panels.map(p => ({ lyrics: p.lyrics, imagePrompt: p.imagePrompt }))
    };
    setRhymeData(initialBook);
    setStatus('success'); // Switch to book view immediately

    // BACKGROUND TASK: Generate images one by one
    const panelsWithImages = [...initialBook.panels];
    for (let i = 0; i < panelsWithImages.length; i++) {
      try {
        const stylePrompt = `Children's book illustration for "${data.title}". Scene: ${panelsWithImages[i].imagePrompt}. Style: Soft, vibrant, whimsical, digital painting, storybook aesthetic, high quality.`;
        const imageUrl = await generateImageWithGemini(stylePrompt, '1:1');
        panelsWithImages[i] = { ...panelsWithImages[i], imageUrl };

        // Update state as each image arrives so they appear "live"
        setRhymeData(prev => prev ? { ...prev, panels: [...panelsWithImages] } : null);
        
        // Anti-throttle buffer
        if (i < panelsWithImages.length - 1) await new Promise(r => setTimeout(r, 800));
      } catch (err) {
        console.error(`Failed to generate image for panel ${i}`, err);
      }
    }
  };

  const handleDownloadImage = async (url: string, index: number) => {
    const watermarked = await addWatermarkToImage(url);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `nursery-rhyme-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Music className="w-8 h-8 text-pink-500" />
          AI Nursery Rhymes
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Fixed-state storybooks with background music and AI illustrations.</p>
      </div>

      {status !== 'success' || !rhymeData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl space-y-8">
           <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block text-center">Select a Nursery Rhyme</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {RHYMES.map(rhyme => (
                    <button
                       key={rhyme}
                       onClick={() => setSelectedRhyme(rhyme)}
                       className={`p-4 rounded-2xl border text-sm font-bold transition-all text-center h-24 flex items-center justify-center ${
                          selectedRhyme === rhyme 
                          ? 'bg-pink-600 border-pink-500 text-white shadow-lg scale-105' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                       }`}
                    >
                       {rhyme}
                    </button>
                 ))}
              </div>
           </div>

           <button
              onClick={handleOpenRhyme}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-pink-900/20"
           >
              <Sparkles className="w-5 h-5 fill-current" />
              Open Rhyme Instantly
           </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
           {/* Header Area */}
           <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-4">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2">{rhymeData.title}</h3>
                 
                 {/* Music Controls */}
                 {musicUrl && (
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                       <button 
                         onClick={() => setIsMuted(!isMuted)}
                         className="text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 transition-colors"
                         title={isMuted ? "Unmute Music" : "Mute Music"}
                       >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                       </button>
                       <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                         {isMuted ? 'Muted' : 'Tune Playing'}
                       </span>
                       <audio ref={audioRef} src={musicUrl} autoPlay loop className="hidden" />
                    </div>
                 )}
              </div>

              <button 
                onClick={() => {
                   setStatus('idle');
                   setRhymeData(null);
                   setMusicUrl(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm font-bold"
              >
                 Library
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Image Preview */}
              <div className="aspect-square bg-slate-200 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden relative group shadow-2xl">
                 {rhymeData.panels[viewIndex]?.imageUrl ? (
                    <>
                       <img src={rhymeData.panels[viewIndex].imageUrl} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => handleDownloadImage(rhymeData.panels[viewIndex].imageUrl!, viewIndex)}
                            className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                             <Download className="w-4 h-4" /> Download
                          </button>
                       </div>
                    </>
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4">
                       <RefreshCw className="w-12 h-12 animate-spin text-pink-500" />
                       <p className="font-bold animate-pulse">Illustrating Panel {viewIndex + 1}...</p>
                    </div>
                 )}
                 <div className="absolute top-4 left-4 bg-white/60 dark:bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-slate-900 dark:text-white text-[10px] font-black uppercase">
                    Panel {viewIndex + 1} / {rhymeData.panels.length}
                 </div>
              </div>

              {/* Lyrics Card */}
              <div className="bg-pink-50 dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-pink-200 dark:border-pink-900/30 flex flex-col justify-center min-h-[300px] shadow-inner">
                 <div className="relative">
                    <Star className="absolute -top-6 -left-6 w-8 h-8 text-yellow-400 opacity-50 animate-pulse" />
                    <p className="text-2xl md:text-3xl font-serif text-slate-800 dark:text-pink-100 leading-relaxed italic text-center">
                       "{rhymeData.panels[viewIndex]?.lyrics}"
                    </p>
                    <Star className="absolute -bottom-6 -right-6 w-8 h-8 text-yellow-400 opacity-50 animate-pulse" style={{ animationDelay: '500ms' }} />
                 </div>
              </div>
           </div>

           {/* Navigation */}
           <div className="flex items-center justify-center gap-6">
              <button 
                 disabled={viewIndex === 0}
                 onClick={() => setViewIndex(v => v - 1)}
                 className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-20 text-slate-900 dark:text-white rounded-full transition-all shadow-md"
              >
                 <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2">
                 {rhymeData.panels.map((_, i) => (
                    <button 
                       key={i} 
                       onClick={() => setViewIndex(i)}
                       className={`h-2 rounded-full transition-all ${viewIndex === i ? 'w-8 bg-pink-500' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
                    />
                 ))}
              </div>

              <button 
                 disabled={viewIndex === rhymeData.panels.length - 1}
                 onClick={() => setViewIndex(v => v + 1)}
                 className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-20 text-slate-900 dark:text-white rounded-full transition-all shadow-md"
              >
                 <ChevronRight className="w-6 h-6" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default NurseryRhymesTool;