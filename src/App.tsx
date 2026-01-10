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

    const channel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gratitude_posts' }, () => {
        fetchPosts(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-bg-primary flex items-center justify-center font-gothic text-text-secondary text-sm">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-bg-primary font-gothic font-extralight text-text-primary relative" ref={topRef}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

      <style>{`
        @keyframes scrollText {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .scrolling-container {
          overflow: hidden;
          position: relative;
        }
        .scrolling-content {
          display: flex;
          flex-direction: column;
          animation: scrollText 45s linear infinite;
        }
      `}</style>

      <div className="max-w-site mx-auto px-6 py-12 sm:py-20">
        <div className="flex flex-col items-center mb-10 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-mincho font-extralight mb-10 tracking-widest cursor-pointer" onClick={() => window.location.reload()}>ありがと地蔵</h1>

          {!showForm && !hasInteracted && (
            <div className="w-full max-w-4xl mb-16">
              
              <div className="flex flex-col items-center md:hidden gap-6">
                <div className="w-[140px] pointer-events-none">
                  <img src={JIZO_DESKTOP} alt="地蔵" className="w-full h-auto object-contain" />
                </div>

                <div className="w-full bg-white/30 border border-border/30 rounded-xl scrolling-container" style={{ height: '200px' }}>
                  <div className="scrolling-content px-8 py-6 space-y-12 text-[15px] leading-relaxed tracking-wider text-left">
                    <div className="space-y-8">
                      <p>今日という一日を、そっと振り返ってみる。</p>
                      <p>特別なことがなくても、いつもの場所にいつものものがちゃんとあって、誰かのささやかな親切や、自分だけが知っている小さな頑張りが、気づけば心を支えてくれていたりする。</p>
                      <p>そのぬくもりを手のひらで包むような気持ちで、ありがとうの気持ちを静かに押し出してみる。</p>
                      <p>言葉は、あとからゆっくりついてくる。<br />まずはここに、今日のありがとうを、小さく灯してみませんか。</p>
                    </div>
                    <div className="space-y-8">
                      <p>今日という一日を、そっと振り返ってみる。</p>
                      <p>特別なことがなくても、いつもの場所にいつものものがちゃんとあって、誰かのささやかな親切や、自分だけが知っている小さな頑張りが、気づけば心を支えてくれていたりする。</p>
                      <p>そのぬくもりを手のひらで包むような気持ちで、ありがとうの気持ちを静かに押し出してみる。</p>
                      <p>言葉は、あとからゆっくりついてくる。<br />まずはここに、今日のありがとうを、小さく灯してみませんか。</p>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-bg-primary/60 to-transparent pointer-events-none z-10"></div>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-primary/60 to-transparent pointer-events-none z-10"></div>
                </div>
              </div>

              <div className="hidden md:flex flex-row items-center gap-16 bg-white/20 p-12 rounded-2xl border border-border/30">
                <div className="flex justify-start items-center w-2/5 pointer-events-none">
                  <img src={JIZO_DESKTOP} alt="" style={{ width: '380px', height: 'auto' }} className="object-contain" />
                </div>
                <div className="flex-1 text-left space-y-8 leading-relaxed opacity-95 text-base tracking-wider">
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
                <button onClick={handleShowForm} className="bg-[#4a4030] hover:bg-[#3d3428] text-white w-full font-medium shadow-lg text-lg py-5 rounded-lg transition-colors tracking-widest">ありがとうを灯す</button>
                <button type="button" onClick={toggleMute} className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors">
                  <span className="material-symbols-outlined text-xl">{isMuted ? 'music_note' : 'music_off'}</span>
                  <span className="text-[10px] tracking-widest uppercase">{isMuted ? 'Play BGM' : 'Mute BGM'}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 bg-bg-secondary p-8 sm:p-10 card shadow-subtle relative w-full border border-border">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-[10px] tracking-[0.2em] text-text-tertiary font-mincho uppercase">Writing with BGM</p>
                  <button type="button" onClick={toggleMute} className="flex items-center justify-center w-12 h-12 rounded-full bg-white/50 border border-border/50 shadow-sm">
                    <span className="material-symbols-outlined text-text-secondary text-2xl">{isMuted ? 'music_note' : 'music_off'}</span>
                  </button>
                </div>
                <div>
                  <label className="block text-xs mb-3 font-mincho tracking-wide text-text-secondary">お名前(ニックネーム)</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base text-base bg-white py-3 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs mb-3 font-mincho tracking-wide text-text-secondary">本文</label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="input-base resize-none text-base bg-white py-3 outline-none" required />
                </div>
                <div className="flex flex-col gap-4 pt-4">
                  <button type="submit" disabled={submitting} className="bg-[#4a4030] hover:bg-[#3d3428] text-white w-full font-medium text-base py-4 rounded-lg shadow-md">{submitting ? '地蔵に届けています...' : '地蔵に届ける'}</button>
                  <button type="button" onClick={() => { setShowForm(false); }} className="btn-secondary w-full text-base py-4">やめる</button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-12 max-w-4xl mx-auto">
          {posts.map((post) => (
            <article key={post.id} className="border border-border rounded-lg overflow-hidden bg-white shadow-subtle">
              <div className="p-6 sm:p-12 pb-8 flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0 overflow-hidden bg-[#fafaf5] border border-border/40 shadow-inner flex items-center justify-center">
                  <img src={CANDLE_GIF} alt="灯" className="w-[140%] h-[140%] object-cover mix-blend-multiply opacity-90" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-baseline gap-4 text-[10px] sm:text-xs mb-5">
                    <time className="text-text-secondary">{new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    <span className="font-mincho tracking-wide text-text-secondary">{post.name}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-loose text-sm sm:text-base opacity-90">{post.content}</p>
                </div>
              </div>

              {post.ai_reply && (
                <div className="px-4 pb-4 sm:px-10 sm:pb-10 pt-0">
                  <div className="bg-[#fafaf5] rounded-lg p-5 sm:p-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 border border-[#f0eee5]">
                    <div style={{ width: '80px', height: '80px' }} className="rounded-full flex-shrink-0 overflow-hidden border border-border/30 shadow-sm bg-white">
                      <img src={JIZO_DESKTOP} alt="地蔵" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] text-text-tertiary mb-2 font-mincho tracking-widest uppercase">ありがと地蔵</div>
                      <p className="leading-loose text-sm sm:text-base">{post.ai_reply}</p>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
