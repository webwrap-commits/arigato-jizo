import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [loading, setLoading] = useState(true);
  
  // URLに /w_600/ を追加して、Cloudinary側から大きな画像を出力させます
  const JIZO_IPHONE = "https://res.cloudinary.com/dh6zibjr8/image/upload/w_600/v1767939481/jizo_iphone_hqrogw.png";

  useEffect(() => {
    const fetchPosts = async () => {
      await supabase.from('gratitude_posts').select('*');
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div style={{ backgroundColor: '#fdfcf8', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', fontFamily: 'serif', fontSize: '20px' }}>サイズ確認：最終テスト</h1>
      
      {/* 比較用のボタン（幅300px） */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <button style={{ 
          width: '300px', 
          padding: '20px', 
          backgroundColor: '#4a4030', 
          color: 'white', 
          borderRadius: '8px', 
          border: 'none',
          fontSize: '16px'
        }}>
          ありがとうを灯す(300px)
        </button>
      </div>

      <div style={{ 
        border: '3px solid red', 
        width: '100%', 
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
      }}>
        <p style={{ marginBottom: '10px', fontSize: '12px', color: 'red', fontWeight: 'bold' }}>
          ↓ この地蔵が上のボタンと「ほぼ同じ幅」なら成功！
        </p>
        
        <img 
          src={JIZO_IPHONE} 
          style={{ 
            width: '290px',      // ここで290pxを指定
            minWidth: '290px',   // 強制的に290pxを維持
            height: 'auto', 
            display: 'block',
            border: '1px solid #ccc'
          }} 
        />
      </div>

      <div style={{ marginTop: '20px', padding: '10px', fontSize: '13px', lineHeight: '1.6' }}>
        <p>もしこれでも「ボタンの3分の1」しかないのであれば、画像やプログラムの問題ではなく、スマホ側の表示設定（index.html）に原因が絞られます。</p>
      </div>
    </div>
  );
}

export default App;
