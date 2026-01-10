import { useState, useEffect, useRef } from 'react';
import { supabase, GratitudePost } from './lib/supabase';

function App() {
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [loading, setLoading] = useState(true);
  const JIZO_IPHONE = "https://res.cloudinary.com/dh6zibjr8/image/upload/v1767939481/jizo_iphone_hqrogw.png";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from('gratitude_posts').select('*');
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div style={{ backgroundColor: '#fdfcf8', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', fontFamily: 'serif' }}>サイズ確認テスト</h1>
      
      {/* 基準となるボタン（比較用） */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <button style={{ width: '300px', padding: '20px', backgroundColor: '#4a4030', color: 'white', borderRadius: '8px', border: 'none' }}>
          ありがとうを灯す（幅300px）
        </button>
      </div>

      <div style={{ 
        border: '2px solid red', 
        position: 'relative', 
        width: '100%', 
        height: '400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p style={{ position: 'absolute', top: 10, fontSize: '12px' }}>↓この地蔵がボタンと同じくらいの幅に見えるか？</p>
        
        {/* 地蔵画像：あえてCSSクラスを使わず、直接強力にサイズ指定 */}
        <img 
          src={JIZO_IPHONE} 
          style={{ 
            width: '290px', 
            height: 'auto', 
            display: 'block',
            opacity: 0.8
          }} 
        />
      </div>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
        赤い枠の中に、ボタンとほぼ同じ横幅でお地蔵様がいますか？<br/>
        もしこれでも小さいなら、ブラウザ自体が画像を縮小表示しています。
      </p>
    </div>
  );
}

export default App;
