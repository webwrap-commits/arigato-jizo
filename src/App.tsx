import { useState, useEffect, useRef } from 'react';
import { supabase, GratitudePost } from './lib/supabase';

function App() {
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // ローカルストレージからの読み込み
  const [name, setName] = useState(() => localStorage.getItem('jizo_name') || '');
  const [myPostIds, setMyPostIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('jizo_my_posts') || '[]'));
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('jizo_favorites') || '[]'));
  const [virtue, setVirtue] = useState(() => Number(localStorage.getItem('jizo_virtue')) || 0);
  const [omusubiCount, setOmusubiCount] = useState(() => Number(localStorage.getItem('jizo_omusubi')) || 0);
  const [dangoCount, setDangoCount] = useState(() => Number(localStorage.getItem('jizo_dango')) || 0);
  
  // 投稿制限のための状態
  const [dailyCount, setDailyCount] = useState(() => {
    const lastDate = localStorage.getItem('jizo_last_post_date');
    const today = new Date().toLocaleDateString('ja-JP');
    if (lastDate !== today) return 0; // 日付が変わっていたらリセット
    return Number(localStorage.getItem('jizo_daily_count')) || 0;
  });

  const [viewMode, setViewMode] = useState<'all' | 'mypage'>('all');
  const [myTab, setMyTab] = useState<'posts' | 'favorites'>('posts');

  const [content, setContent] = useState('');
  const [selectedOffering, setSelectedOffering] = useState<'none' | 'omusubi' | 'dango'>('none');
  const [offeringEffect, setOfferingEffect] = useState<'none' | 'omusubi' | 'dango'>('none');
  const [offeringMessage, setOfferingMessage] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const formRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const BGM_URL = "https://res.cloudinary.com/dh6zibjr8/video/upload/v1767851964/arigatojizo_jyb8kh.mp3";
  const CANDLE_GIF = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767936137/rousoku_anime2_cj4vpe.gif";
  const JIZO_DESKTOP = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767939481/jizo_desktop_pwkcpp.png";
  const IMG_OMUSUBI = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1768025069/omusubi_m5oghs.png";
  const IMG_DANGO = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1768025069/dango_xsut90.png";

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('gratitude_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error) setPosts(data || []);
    } catch (err) { console.error("Fetch error:", err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPosts();
    const audio = new Audio(BGM_URL);
    audio.loop = true;
    audio.volume = 0.2;
    audioRef.current = audio;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        audio.pause();
      } else if (!isMuted) {
        audio.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const channel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gratitude_posts' }, () => {
        fetchPosts(); 
      })
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
      audio.pause();
    };
  }, []);

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (audioRef.current) {
      if (newMuteState) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = favoriteIds.includes(id) ? favoriteIds.filter(f => f !== id) : [...favoriteIds, id];
    setFavoriteIds(newFavorites);
    localStorage.setItem('jizo_favorites', JSON.stringify(newFavorites));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !name.trim() || submitting || dailyCount >= 5) return;
    setSubmitting(true);

    try {
      let customReply = "";
      if (selectedOffering === 'omusubi') customReply = "おむすび、ありがたく。";
      else if (selectedOffering === 'dango') customReply = "見事な彩り、ありがたく。";

      const { data, error } = await supabase
        .from('gratitude_posts')
        .insert([{ name: name.trim(), content: content.trim(), ai_reply: customReply || null }])
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

        // 投稿制限のカウント更新
        const newDailyCount = dailyCount + 1;
        const today = new Date().toLocaleDateString('ja-JP');
        setDailyCount(newDailyCount);
        localStorage.setItem('jizo_daily_count', String(newDailyCount));
        localStorage.setItem('jizo_last_post_date', today);

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

        if (selectedOffering !== 'none') {
          if (selectedOffering === 'omusubi') {
            const val = omusubiCount - 1;
            setOmusubiCount(val);
            localStorage.setItem('jizo_omusubi', String(val));
          } else {
            const val = dangoCount - 1;
            setDangoCount(val);
            localStorage.setItem('jizo_dango', String(val));
          }
          setOfferingEffect(selectedOffering);
          setOfferingMessage(customReply);
        } else {
          setOfferingEffect('none');
          setOfferingMessage('');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setContent('');
      setSelectedOffering('none');
      setShowForm(false);
      setHasInteracted(true); 
      if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {});
      await fetchPosts();
    } catch (error) { console.error("Submit error:", error); } finally { setSubmitting(false); }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('gratitude_posts')
        .update({ content: editContent.trim() })
        .eq('id', id);
      
      if (error) throw error;
      setEditingId(null);
      fetchPosts();
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const displayedPosts = posts.filter((post: GratitudePost) => {
    if (viewMode === 'all') return true;
    if (myTab === 'posts') return myPostIds.includes(post.id);
    if (myTab === 'favorites') return favoriteIds.includes(post.id);
    return true;
  });

  if (loading) return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-sm">読み込み中...</div>;

  const NavLinks = () => (
    <div className="flex justify-center gap-12">
      <button onClick={() => { setViewMode('all'); setHasInteracted(false); if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {}); }} className={`text-xs tracking-[0.2em] transition-colors pb-1 ${viewMode === 'all' ? 'text-text-primary border-b border-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>みんなの灯火</button>
      <button onClick={() => { setViewMode('mypage'); setHasInteracted(false); if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {}); }} className={`text-xs tracking-[0.2em] transition-colors pb-1 ${viewMode === 'mypage' ? 'text-text-primary border-b border-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>心覚えの部屋</button>
    </div>
  );

  const MuteButton = () => (
    <button type="button" onClick={toggleMute} className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors mt-4">
      <span className="material-symbols-outlined text-lg">{isMuted ? 'volume_off' : 'volume_up'}</span>
      <span className="text-[10px] tracking-[0.2em] uppercase">{isMuted ? 'Muted' : 'Mute'}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-bg-primary font-gothic font-extralight text-text-primary relative">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0" />

      <style>{`
        @keyframes scrollText { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        .scrolling-container { overflow: hidden; position: relative; }
        .scrolling-content { display: flex; flex-direction: column; animation: scrollText 45s linear infinite; }
        .fade-in { animation: fadeIn 1.2s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fill-1 { font-variation-settings: 'FILL' 1; }
      `}</style>

      <nav className={`md:hidden ${hasInteracted ? 'py-2' : 'py-5'} border-b border-border/10 sticky top-0 bg-bg-primary/90 backdrop-blur-md z-50`}><NavLinks /></nav>

      <div className={`max-w-site mx-auto px-6 ${hasInteracted ? 'py-2 sm:py-20' : 'py-8 sm:py-20'}`}>
        <div className="flex flex-col items-center">
          <h1 className={`font-mincho font-extralight tracking-widest cursor-pointer ${hasInteracted ? 'text-2xl sm:text-5xl mb-4 sm:mb-10' : 'text-4xl sm:text-5xl mb-10'}`} onClick={() => { setViewMode('all'); setHasInteracted(false); }}>ありがと地蔵</h1>
          <nav className="hidden md:block mb-12"><NavLinks /></nav>

          {viewMode === 'mypage' ? (
            <div className="w-full max-w-lg mb-12 text-center fade-in flex flex-col items-center">
              <div className="bg-white/40 p-8 rounded-2xl border border-border/30 mb-4 flex flex-col items-center w-full">
                <div className="text-[10px] tracking-[0.2em] text-text-tertiary uppercase mb-2">積んだ功徳</div>
                <div className="text-4xl font-mincho text-[#4a4030] mb-6">{virtue}</div>
                <div className="flex gap-6 border-t border-border/20 pt-6 w-full justify-center">
                  <div className="text-center">
                    <img src={IMG_OMUSUBI} alt="" className="w-10 h-10 mx-auto mb-1 object-contain opacity-80" />
                    <div className="text-[10px] text-text-tertiary uppercase">おむすび × {omusubiCount}</div>
                  </div>
                  <div className="text-center">
                    <img src={IMG_DANGO} alt="" className="w-10 h-10 mx-auto mb-1 object-contain opacity-80" />
                    <div className="text-[10px] text-text-tertiary uppercase">お団子 × {dangoCount}</div>
                  </div>
                </div>
              </div>
              <MuteButton />
              <div className="flex justify-center gap-8 border-b border-border/20 w-full mt-8">
                <button onClick={() => setMyTab('posts')} className={`pb-3 text-xs tracking-widest ${myTab === 'posts' ? 'text-text-primary border-b-2 border-[#4a4030]' : 'text-text-tertiary'}`}>自分の灯火</button>
                <button onClick={() => setMyTab('favorites')} className={`pb-3 text-xs tracking-widest ${myTab === 'favorites' ? 'text-text-primary border-b-2 border-[#4a4030]' : 'text-text-tertiary'}`}>心に留めた灯火</button>
              </div>
            </div>
          ) : (
            <div className={`w-full max-w-4xl relative flex flex-col items-center ${hasInteracted ? 'mb-4' : 'mb-16'}`}>
              {hasInteracted ? (
                <div className="flex flex-col items-center fade-in py-0 relative w-full">
                  <div className="relative w-[150px] sm:w-[240px]">
                    <img src={JIZO_DESKTOP} alt="地蔵" className="w-full h-auto object-contain" />
                    {offeringEffect !== 'none' && (
                      <img 
                        src={offeringEffect === 'omusubi' ? IMG_OMUSUBI : IMG_DANGO} 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-lg fade-in" 
                        alt="お供え"
                      />
                    )}
                  </div>
                  {offeringMessage && (
                    <div className="mt-1 bg-white/70 backdrop-blur px-6 py-2 rounded-full border border-border/30 text-sm sm:text-base font-mincho tracking-widest fade-in text-[#4a4030]">
                      {offeringMessage}
                    </div>
                  )}
                  <button onClick={() => setHasInteracted(false)} className="mt-4 text-[10px] tracking-widest text-text-tertiary border-b border-text-tertiary pb-0 hover:text-text-secondary transition-colors">戻る</button>
                  <MuteButton />
                </div>
              ) : !showForm && (
                <>
                  <div className="flex flex-col items-center md:hidden gap-6 w-full">
                    <div className="w-[140px]"><img src={JIZO_DESKTOP} alt="地蔵" className="w-full h-auto object-contain" /></div>
                    <div className="w-full bg-white/30 border border-border/30 rounded-xl scrolling-container" style={{ height: '200px' }}>
                      <div className="scrolling-content px-8 py-6 space-y-12 text-[15px] leading-relaxed tracking-wider text-left text-text-secondary">
                        <div className="space-y-8">
                          <p>今日という一日を、そっと振り返ってみる。</p>
                          <p>特別なことがなくても、誰かのささやかな親切や、自分だけが知っている小さな頑張りが、気づけば心を支えてくれていたりする。</p>
                          <p>そのぬくもりを手のひらで包むような気持ちで、ありがとうの気持ちを静かに押し出してみる。</p>
                          <p>言葉は、あとからゆっくりついてくる。<br />まずはここに、今日のありがとうを、小さく灯してみませんか。</p>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-bg-primary to-transparent pointer-events-none z-10"></div>
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none z-10"></div>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-row items-center gap-16 bg-white/20 p-12 rounded-2xl border border-border/30 w-full">
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

          {viewMode === 'all' && !hasInteracted && (
            <div className="w-full max-w-lg mb-12 flex flex-col items-center" ref={formRef}>
              {!showForm ? (
                <>
                  {dailyCount >= 5 ? (
                    <div className="w-full flex flex-col items-center space-y-4 fade-in">
                      <p className="text-sm font-mincho tracking-widest text-[#4a4030] bg-white/50 px-6 py-4 rounded-lg border border-border/30">今日はたくさん灯してくれましたな。また明日、おいでなされ。</p>
                    </div>
                  ) : (
                    <button onClick={() => { setShowForm(true); setOfferingEffect('none'); setOfferingMessage(''); if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {}); }} className="bg-[#4a4030] hover:bg-[#3d3428] text-white w-full font-medium shadow-lg text-lg py-5 rounded-lg transition-colors tracking-widest">ありがとうを灯す</button>
                  )}
                  <MuteButton />
                </>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-8 bg-bg-secondary p-8 sm:p-10 card shadow-subtle relative w-full border border-border">
                    <div>
                      <label className="block text-xs mb-3 font-mincho tracking-wide text-text-secondary uppercase">お名前</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base text-base bg-white py-3 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-xs mb-3 font-mincho tracking-wide text-text-secondary uppercase">本文</label>
                      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="input-base resize-none text-base bg-white py-3 outline-none" required />
                    </div>
                    
                    {(omusubiCount > 0 || dangoCount > 0) && (
                      <div className="pt-2 border-t border-border/10">
                        <p className="text-[10px] tracking-[0.2em] text-text-tertiary mb-4 text-center uppercase">お供え物を添える（1つだけ）</p>
                        <div className="flex justify-center gap-8">
                          {omusubiCount > 0 && (
                            <button type="button" onClick={() => setSelectedOffering(selectedOffering === 'omusubi' ? 'none' : 'omusubi')} className={`flex flex-col items-center transition-all ${selectedOffering === 'omusubi' ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-60'}`}>
                              <img src={IMG_OMUSUBI} alt="おむすび" className="w-10 h-10 mb-1 object-contain" />
                              <span className="text-[8px]">おむすび({omusubiCount})</span>
                            </button>
                          )}
                          {dangoCount > 0 && (
                            <button type="button" onClick={() => setSelectedOffering(selectedOffering === 'dango' ? 'none' : 'dango')} className={`flex flex-col items-center transition-all ${selectedOffering === 'dango' ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-60'}`}>
                              <img src={IMG_DANGO} alt="お団子" className="w-10 h-10 mb-1 object-contain" />
                              <span className="text-[8px]">お団子({dangoCount})</span>
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
                  <MuteButton />
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-12 max-w-4xl mx-auto">
          {displayedPosts.length === 0 && viewMode === 'mypage' ? (
            <div className="text-center py-20 text-text-tertiary font-mincho tracking-widest">まだ記録がありません</div>
          ) : (
            displayedPosts.map((post: GratitudePost) => (
              <article key={post.id} className="relative border border-border rounded-lg overflow-hidden bg-white shadow-subtle">
                <div className="absolute top-4 right-4 flex gap-4 z-20">
                  <button onClick={() => toggleFavorite(post.id)} className={`${favoriteIds.includes(post.id) ? 'text-red-400' : 'text-text-tertiary hover:text-red-300'} transition-colors`}>
                    <span className={`material-symbols-outlined text-lg ${favoriteIds.includes(post.id) ? 'fill-1' : ''}`}>favorite</span>
                  </button>
                </div>
                <div className="p-6 sm:p-12 pb-8 flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0 overflow-hidden bg-[#fafaf5] border border-border/40 shadow-inner flex items-center justify-center">
                    <img src={CANDLE_GIF} alt="灯" className="w-[140%] h-[140%] object-cover mix-blend-multiply opacity-90" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex items-baseline gap-4 text-[10px] sm:text-xs mb-5 uppercase">
                      <time className="text-text-secondary">{new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                      <span className="font-mincho tracking-wide text-text-secondary">{post.name}</span>
                    </div>
                    {editingId === post.id ? (
                      <div className="space-y-4">
                        <textarea 
                          value={editContent} 
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-4 border border-border rounded-md bg-[#fafaf5] outline-none text-sm sm:text-base leading-loose"
                          rows={4}
                        />
                        <div className="flex gap-4">
                          <button onClick={() => handleUpdate(post.id)} className="text-xs bg-[#4a4030] text-white px-4 py-2 rounded-md">保存</button>
                          <button onClick={() => setEditingId(null)} className="text-xs border border-border px-4 py-2 rounded-md">キャンセル</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap leading-loose text-sm sm:text-base opacity-90">{post.content}</p>
                        {myPostIds.includes(post.id) && (
                          <div className="mt-4 flex justify-end">
                            <button 
                              onClick={() => { setEditingId(post.id); setEditContent(post.content); }}
                              className="flex items-center gap-1 text-[10px] tracking-widest text-text-tertiary border-b border-border hover:text-text-secondary transition-colors pb-0.5"
                            >
                              <span className="material-symbols-outlined text-xs">edit</span>
                              <span>編集する</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {post.ai_reply && (
                  <div className="px-4 pb-4 sm:px-10 sm:pb-10 pt-0">
                    <div className="bg-[#fafaf5] rounded-lg p-5 sm:p-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 border border-[#f0eee5]">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0 overflow-hidden border border-border/30 shadow-sm bg-white">
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
