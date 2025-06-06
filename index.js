import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import querystring from 'querystring';

dotenv.config();
const app = express();
const port = process.env.PORT || 8888;

app.use(cors());

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const frontend_uri = process.env.FRONTEND_URI;

// 認可URLへリダイレクト
app.get('/login', (req, res) => {
  const scope = 'playlist-read-private playlist-read-collaborative';
  const params = querystring.stringify({
    response_type: 'code',
    client_id,
    scope,
    redirect_uri
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// コールバック処理
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokenRes = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id,
        client_secret
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    const { access_token, refresh_token } = tokenRes.data;
    console.log('✅ トークン取得成功');
    res.redirect(`${frontend_uri}/?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (err) {
    console.error('🔴 /callback エラー:', err.response?.data || err.message);
    res.status(500).json({ error: 'Token取得失敗', details: err.response?.data });
  }
});

// トークン更新
app.get('/refresh_token', async (req, res) => {
  const refresh_token = req.query.refresh_token;
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token,
        client_id,
        client_secret
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    console.log('♻️ アクセストークン更新成功');
    res.json({ access_token: response.data.access_token });
  } catch (err) {
    console.error('🔴 /refresh_token エラー:', err.response?.data || err.message);
    res.status(500).json({ error: 'トークン更新失敗', details: err.response?.data });
  }
});

app.listen(port, () => {
  console.log(`🎧 Spotify Auth Server running on port ${port}`);
});
