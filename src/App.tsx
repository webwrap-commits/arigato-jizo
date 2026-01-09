import { useState, useEffect, useRef } from 'react';
import { supabase, GratitudePost } from './lib/supabase';

function App() {
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const topRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const BGM_URL = "https://res.cloudinary.com/dh6zibjr8/video/upload/v1767851964/arigatojizo_jyb8kh.mp3";
  const CANDLE_GIF = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767936137/rousoku_anime2_cj4vpe.gif";
  const JIZO_DESKTOP = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767939481/jizo_desktop_pwkcpp.png";
  const JIZO_IPHONE = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767939481/jizo_iphone_hqrogw.png";

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('gratitude_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setPosts(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const audio = new Audio(BGM_URL);
    audio.loop = true;
    audio.volume = 0.2;
    audio.setAttribute('playsinline', 'true');
    audioRef.current = audio;

    // --- スマホでブラウザを閉じたり隠れたりした時に音を止める設定 ---
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current) {
        audioRef.current.pause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // ---------------------------------------------------------

    const channel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gratitude_posts' }, () => {
        fetchPosts(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playBGM = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsMuted(false);
      if (showForm || hasInteracted) playBGM();
    }
  };

  const handleShowForm = () => {
    setShowForm(true);
    playBGM();
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('gratitude_posts')
        .insert([{ name: name.trim(), content: content.trim() }])
        .select(); 
      if (error) throw error;
      await new Promise(resolve => setTimeout(resolve, 800));
      setName('');
      setContent('');
      setShowForm(false);
      setHasInteracted(true); 
      await fetchPosts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Submit error:", error);
      alert('地蔵への送信に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center font-gothic text-text-secondary text-sm">
      読み込み中...
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary font-gothic font-extralight text-text-primary relative" ref={topRef}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

      <div className="max-w-site mx-auto px-6 py-12 sm:py-20">
        <div className="flex flex-col items-center mb-10 sm:mb-16">
          <h1 
            className="text-4xl sm:text-5xl font-mincho font-extralight mb-10 tracking-widest cursor-pointer" 
            onClick={() => window.location.reload()}
          >
            ありがと地蔵
          </h1>

          {!showForm && !hasInteracted && (
            <div className="w-full max-w-4xl mb-16">
              <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 bg-white/20 p-8 md:p-12 rounded-2xl overflow-hidden min-h-[350px] md:min-h-0 border border-border/30">
                <div className="absolute inset-0 flex justify-center items-center md:hidden opacity-40 pointer-events-none">
                  <img src={JIZO_IPHONE} alt="" style={{ width: '100%', maxWidth: '300px' }} className="h-auto object-contain px-4" />
                </div>
                <div className="hidden md:flex justify-start items-center md:w-2/5 pointer-events-none">
                  <img src={JIZO_DESKTOP} alt="" className="w-full h-auto object-contain" />
                </div>
                <div className="relative z-10 flex-1 text-left space-y-8 leading-relaxed opacity-95 text-[15px] sm:text-base tracking-wider">
                  <p>今日という一日を、そっと振り返ってみる。</p>
                  <p>特別なことがなくても、いつもの場所にいつものものがちゃんとあって、誰かのささやかな親切や、自分だけが知っている小さな頑張りが、気づけば心を支えてくれていたりする。</p>
                  <p>そのぬくもりを手のひらで包むような気持ちで、ありがとうの気持ちを静かに押し出してみる。</p>
                  <p>言葉は、あとからゆっくりついてくる。<br />まずはここに、今日のありがとうを、小さく灯してみませんか。</p>
                </div>
              </div>
            </div>
          )}

          <div className="w-full max-w-lg mb-12" ref={formRef}>
            {!showForm ? (
              <div className="space-y-6 flex flex-col items-center">
                <button
                  onClick={handleShowForm}
                  className="bg-[#4a4030] hover:bg-[#3d3428] text-white w-full font-medium shadow-lg text-lg py-5 rounded-lg transition-colors tracking-widest"
                >
                  ありがとうを灯す
                </button>
                <button type="button" onClick={toggleMute} className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors">
                  <span className="material-symbols-outlined text-xl">{isMuted ? 'music_note' : 'music_off'}</span>
                  <span className="text-[10px] tracking-widest uppercase">{isMuted ? 'Play BGM' : 'Mute BGM'}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 bg-bg-secondary p-8
