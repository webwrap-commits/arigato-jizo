import { useState, useEffect, useRef } from 'react';
import { supabase, GratitudePost } from './lib/supabase';

function App() {
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // --- ローカルストレージ関連 ---
  const [name, setName] = useState(() => localStorage.getItem('jizo_name') || '');
  const [myPostIds, setMyPostIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('jizo_my_posts') || '[]'));
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('jizo_favorites') || '[]'));
  const [virtue, setVirtue] = useState(() => Number(localStorage.getItem('jizo_virtue')) || 0);
  const [omusubiCount, setOmusubiCount] = useState(() => Number(localStorage.getItem('jizo_omusubi')) || 0);
  const [dangoCount, setDangoCount] = useState(() => Number(localStorage.getItem('jizo_dango')) || 0);
  
  const [viewMode, setViewMode] = useState<'all' | 'mypage'>('all');
  const [myTab, setMyTab] = useState<'posts' | 'favorites'>('posts');

  const [content, setContent] = useState('');
  const [selectedOffering, setSelectedOffering] = useState<'none' | 'omusubi' | 'dango'>('none');
  const [offeringEffect, setOfferingEffect] = useState<'none' | 'omusubi' | 'dango'>('none');
  const [offeringMessage, setOfferingMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const topRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const BGM_URL = "https://res.cloudinary.com/dh6zibjr8/video/upload/v1767851964/arigatojizo_jyb8kh.mp3";
  const CANDLE_GIF = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767936137/rousoku_anime2_cj4vpe.gif";
  const JIZO_DESKTOP = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767939481/jizo_desktop_pwkcpp.png";
  const IMG_OMUSUBI = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1768025069/omusubi_m5oghs.png";
  const IMG_DANGO = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1768025069/dango_xsut90.png";

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase.from('gratitude_posts').select('*').order('created_at', { ascending: false });
      if (!error) setPosts(data || []);
    } catch (err) { console.error("Fetch error:", err); } finally { setLoading(false); }
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
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const toggleFavorite = (id: string) => {
    const newFavorites = favoriteIds.includes(id) ? favoriteIds.filter(f => f !== id) : [...favoriteIds, id];
    setFavoriteIds(newFavorites);
    localStorage.setItem('jizo_favorites', JSON.stringify(newFavorites));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !name.trim() || submitting) return;
    setSubmitting(true);

    try {
      let customReply = "";
      if (selectedOffering === 'omusubi') {
        customReply = "おむすび、ありがたく。心がお腹いっぱいになります。";
      } else if (selectedOffering === 'dango') {
        customReply = "見事な彩り、心が晴れやかになります。あなたの歩む道が、これからも光で照らされますように。";
      }

      const { data, error } = await supabase
        .from('gratitude_posts')
        .insert([{ 
          name: name.trim(), 
          content: content.trim(),
          ai_reply: customReply || null 
        }])
        .select(); 
      
      if (error) throw error;

      if (data && data[0]) {
        localStorage.setItem('jizo_name', name.trim());
        const newMyPosts = [...myPostIds, data[0].id];
        setMyPostIds(newMyPosts);
        localStorage.setItem('jizo_my_posts', JSON.stringify(newMyPosts));
        
        const newVirtue = virtue + 1;
        setVirtue(newVirtue);
        localStorage.setItem('jizo_virtue', String(newVirtue));

        if (newVirtue % 3 === 0) {
          const newO = omusubiCount + 1;
          setOmusubiCount(newO);
          localStorage.setItem('jizo_omusubi', String(newO));
        }
        if (newVirtue % 10 === 0) {
          const newD = dangoCount + 1;
          setDangoCount(newD);
          localStorage.setItem('jizo_dango', String(newD));
        }

        if (selectedOffering === 'omusubi') {
          setOmusubiCount(prev => prev - 1);
          localStorage.setItem('jizo_omusubi', String(omusubiCount - 1));
        } else if (selectedOffering === 'dango') {
          setDangoCount(prev => prev - 1);
          localStorage.setItem('jizo_dango', String(dangoCount - 1));
        }

        // お供え演出をセット（お供えがある場合のみ）
        if (selectedOffering !== 'none') {
          setOfferingEffect(selectedOffering);
          setOfferingMessage(customReply);
          setTimeout(() => {
            setOfferingEffect('none');
            setOfferingMessage('');
          }, 5000); // 5秒で演出を終了
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setContent('');
      setSelectedOffering('none');
      setShowForm(false);
      setHasInteracted(true); 
      await fetchPosts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { console.error("Submit error:", error); } finally { setSubmitting(false); }
  };

  const displayedPosts = posts.filter(post => {
    if (viewMode === 'all') return true;
    if (myTab === 'posts') return myPostIds.includes(post.id);
    if (myTab === 'favorites') return favoriteIds.includes(post.id);
    return true;
  });

  if (loading) return <div className="min-h-screen bg-bg-primary flex items-center justify-center font-gothic text-text-secondary text-sm">読み込み中...</div>;

  const NavLinks = () => (
    <div className="flex justify-center gap-12">
      <button onClick={() => { setViewMode('all'); setHasInteracted(false); }} className={`text-xs tracking-[0.2em] transition-colors pb-1 ${viewMode === 'all' ? 'text-text-primary border-b border-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>みんなの灯火</button>
      <button onClick={() => { setViewMode('mypage'); setHasInteracted(false); }} className={`text-xs tracking-[0.2em] transition-colors pb-1 ${viewMode === 'mypage' ? 'text-text-primary border-b border-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>心覚えの部屋</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary font-gothic font-extralight text-text-primary relative" ref={topRef}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0" />

      <style>{`
        @keyframes scrollText { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        .scrolling-container { overflow: hidden; position: relative; }
        .scrolling-content { display: flex; flex-direction: column; animation: scrollText 45s linear infinite; }
        .fill-1 { font-variation-settings: 'FILL' 1; }
        .fade-in { animation: fadeIn 1s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <nav className="md:hidden py-5 border-b border-border/10 sticky top-0 bg-bg-primary/90 backdrop-blur-md z-50"><NavLinks /></nav>

      <div className="max-w-site mx-auto px-6 py-12 sm:py-20">
        <div className="flex flex-col items-center mb-10 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-mincho font-extralight mb-10 tracking-widest cursor-pointer" onClick={() => setViewMode('all')}>ありがと地蔵</h1>
          <nav className="hidden md:block mb-12"><NavLinks /></nav>

          {viewMode === 'mypage' ? (
            <div className="w-full max-w-lg mb-12 text-center fade-in">
              <div className="bg-white/40 p-8 rounded-2xl border border-border/30 mb-8 flex flex-col items-center">
                <div className="text-[10px] tracking-[0.2em] text-text-tertiary uppercase mb-2">積んだ功徳</div>
                <div className="text-4xl font-mincho text-[#4a4030] mb-6">{virtue}</div>
                <div className="flex gap-6 border-t border-border/20 pt-6 w-full justify-center">
                  <div className="text-center">
                    <img src={IMG_OMUSUBI} alt="" className="w-8 h-8 mx-auto mb-1 opacity-80" />
                    <div className="text-[10px] text-text-tertiary">おむすび × {omusubiCount}</div>
                  </div>
                  <div className="text-center">
                    <img src={IMG_DANGO} alt="" className="w-8 h-8 mx-auto mb-1 opacity-80" />
                    <div className="text-[10px] text-text-tertiary">お団子 × {dangoCount}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-8 border-b border-border/20">
                <button onClick={() => setMyTab('posts')} className={`pb-3 text-xs tracking-widest ${myTab === 'posts' ? 'text-text-primary border-b-2 border-[#4a4030]' : 'text-text-tertiary'}`}>自分の灯火</button>
                <button onClick={() => setMyTab('favorites')} className={`pb-3 text-xs tracking-widest ${myTab === 'favorites' ? 'text-text-primary border-b-2 border-[#4a4030]' : 'text-text-tertiary'}`}>心に留めた灯火</button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mb-16 relative">
              
              {/* お供え演出中のみ表示されるレイヤー */}
              {offeringEffect !== 'none' && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none fade-in">
                  <img 
                    src={offeringEffect === 'omusubi' ? IMG_OMUSUBI : IMG_DANGO} 
                    className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-xl" 
                    alt="お供え物"
                  />
                  {offeringMessage && (
                    <div className="mt-4 bg-white/90 px-6 py-2 rounded-full shadow-sm text-sm tracking-widest font-mincho text-[#4a4030]">
                      {offeringMessage}
                    </div>
                  )}
                </div>
              )}

              {/* お地蔵様とメッセージ本体 */}
              {!showForm && (
                <>
                  <div className="flex flex-col items-center md:hidden gap-6">
                    <div className="w-[140px]"><img src={JIZO_DESKTOP} alt="地蔵" className="w-full h-auto object-contain" /></div>
                    <div className="w-full bg-white/30 border border-border/30 rounded-xl scrolling-container" style={{ height: '200px' }}>
                      <div className="scrolling-content px-8 py-6 space-y-12 text-[15px] leading-relaxed tracking-wider text-left text-text-secondary">
                        <div className="space-y-8">
                          <p>今日という一日を、そっと振り返ってみる。</p>
                          <p>特別なことがなくても、いつもの場所にいつものものがちゃんとあって、誰かのささやかな親切や、自分だけが知っている小さな頑張りが、気づけば心を支えてくれていたりする。</p>
                          <p>そのぬくもりを手のひらで包むような気持ちで、ありがとうの気持ちを静かに押し出してみる。</p>
                          <p>言葉は、あとからゆっくりついてくる。<br />まずはここに、今日のありがとうを、小さく灯してみませんか。</p>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-bg-primary to-transparent pointer-events-none z-10"></div>
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none z-10"></div>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-row items-center gap-16 bg-white/20 p-12 rounded-2xl border border-border/30">
                    <div className="flex justify-start items-center w-2/5"><img src={JIZO_DESKTOP} alt="" style={{ width: '380px', height: 'auto' }} className="object-contain" /></div>
                    <div className="flex-1 text-left space-y-8 leading-relaxed opacity-95 text-base tracking-wider text-text-secondary">
                      <p>今日という一日を、そっと振り返ってみる。</p>
                      <p>特別なことがなくても、いつもの場所にいつものものがちゃんとあって、誰かのささやかな親切や、自分だけが知っている小さな頑張りが、気づけば心を支えてくれていたりする。</p>
                      <p>そのぬくもりを手のひらで包むような気持ちで、ありがとうの気持ちを静かに押し出してみる。</p>
                      <p>言葉は、あとからゆっくりついてくる。<br />まずはここに、今日のありがとうを、小さく灯してみませんか。</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {viewMode === 'all' && (
            <div className="w-full max-w-lg mb-12" ref={formRef}>
              {!showForm ? (
                <div className="space-y-6 flex flex-col items-center">
                  <button onClick={() => { setShowForm(true); setHasInteracted(false); if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {}); }} className="bg-[#4a4030] hover:bg-[#3d3428] text-white w-full font-medium shadow-lg text-lg py-5 rounded-lg transition-colors tracking-widest">ありがとうを灯す</button>
                  <button type="button" onClick={() => { setIsMuted(!isMuted); if (audioRef.current) !isMuted ? audioRef.current.pause() : audioRef.current.play().catch(() => {}); }} className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors">
                    <span className="material-symbols-outlined text-xl">{isMuted ? 'music_note' : 'music_off'}</span>
                    <span className="text-[10px] tracking-widest uppercase">{isMuted ? 'Play BGM' : 'Mute BGM'}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 bg-bg-secondary p-8 sm:p-10 card shadow-subtle relative w-full border border-border">
                  <div>
                    <label className="block text-xs mb-3 font-mincho tracking-wide text-text-secondary">お名前(ニックネーム)</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base text-base bg-white py-3 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs mb-3 font-mincho tracking-wide text-text-secondary">本文</label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="input-base resize-none text-base bg-white py-3 outline-none" required />
                  </div>
                  
                  {(omusubiCount > 0 || dangoCount > 0) && (
                    <div className="pt-2 border-t border-border/10">
                      <p className="text-[10px] tracking-widest text-text-tertiary mb-4 text-center uppercase">お供え物を添える</p>
                      <div className="flex justify-center gap-8">
                        {omusubiCount > 0 && (
                          <button type="button" onClick={() => setSelectedOffering(selectedOffering === 'omusubi' ? 'none' : 'omusubi')} className={`flex flex-col items-center transition-all ${selectedOffering === 'omusubi' ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-60'}`}>
                            <img src={IMG_OMUSUBI} alt="おむすび" className="w-10 h-10 mb-1" />
                            <span className="text-[8px] tracking-tighter">おむすび({omusubiCount})</span>
                          </button>
                        )}
                        {dangoCount > 0 && (
                          <button type="button" onClick={() => setSelectedOffering(selectedOffering === 'dango' ? 'none' : 'dango')} className={`flex flex-col items-center transition-all ${selectedOffering === 'dango' ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-60'}`}>
                            <img src={IMG_DANGO} alt="お団子" className="w-10 h-10 mb-1" />
                            <span className="text-[8px] tracking-tighter">お団子({dangoCount})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 pt-4">
                    <button type="submit" disabled={submitting} className="bg-[#4a4030] hover:bg-[#3d3428] text-white w-full font-medium text-base py-4 rounded-lg shadow-md">{submitting ? '地蔵に届けています...' : '地蔵に届ける'}</button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary w-full text-base py-4">やめる</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="space-y-12 max-w-4xl mx-auto">
          {displayedPosts.length === 0 && viewMode === 'mypage' ? (
            <div className="text-center py-20 text-text-tertiary font-mincho tracking-widest animate-pulse">まだ記録がありません</div>
          ) : (
            displayedPosts.map((post) => (
              <article key={post.id} className="group relative border border-border rounded-lg overflow-hidden bg-white shadow-subtle">
                <div className="absolute top-4 right-4 flex gap-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {myPostIds.includes(post.id) && (
                    <button className="text-text-tertiary hover:text-[#4a4030]"><span className="material-symbols-outlined text-lg">edit</span></button>
                  )}
                  <button onClick={() => toggleFavorite(post.id)} className={`${favoriteIds.includes(post.id) ? 'text-red-400' : 'text-text-tertiary hover:text-red-300'} transition-colors`}>
                    <span className={`material-symbols-outlined text-lg ${favoriteIds.includes(post.id) ? 'fill-1' : ''}`}>favorite</span>
                  </button>
                </div>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
