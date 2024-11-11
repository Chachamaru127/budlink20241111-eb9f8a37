import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/auth';
import { getAuth, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, authType, idToken } = body;

    if (!authType) {
      return NextResponse.json({ error: '必要なパラメータが不足しています' }, { status: 400 });
    }

    if (authType !== 'email' && authType !== 'google') {
      return NextResponse.json({ error: 'サポートされていない認証方式です' }, { status: 400 });
    }

    if (authType === 'email') {
      if (!email || !password) {
        return NextResponse.json({ error: '必要なパラメータが不足しています' }, { status: 400 });
      }

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || password.length < 8) {
        return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
      }
    }

    if (authType === 'google' && !idToken) {
      return NextResponse.json({ error: '必要なパラメータが不足しています' }, { status: 400 });
    }

    let firebaseUser;
    try {
      if (authType === 'email') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = result.user;
      } else {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        firebaseUser = result.user;
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credentials' || error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
      }
      throw error;
    }

    let { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', firebaseUser.email)
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'データベースエラーが発生しました' }, { status: 500 });
    }

    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: firebaseUser.email,
            firebase_uid: firebaseUser.uid,
            role: 'buyer',
            company_name: '',
            license_info: {
              license_number: '',
              expiry_date: null,
              license_type: ''
            }
          }
        ])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'ユーザー登録に失敗しました' }, { status: 500 });
      }

      user = newUser;
    }

    try {
      const customToken = await auth.currentUser?.getIdToken();
      if (!customToken) {
        throw new Error('トークンの生成に失敗しました');
      }

      return NextResponse.json({
        token: customToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          company_name: user.company_name,
          license_info: user.license_info
        }
      });
    } catch (error) {
      return NextResponse.json({ error: 'トークンの生成に失敗しました' }, { status: 500 });
    }
  } catch (error) {
    console.error('認証エラー:', error);
    return NextResponse.json({ error: '予期せぬエラーが発生しました' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: '許可されていないメソッドです' }, { status: 405 });
}