// pages/api/monthly-reset.js

// Firebase Admin SDK 설정 (다른 파일에 분리해도 됩니다)
import admin from 'firebase-admin';
import { serviceAccount } from '../../serviceAccountKey'; // Firebase 서비스 계정 키 파일 경로

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Vercel Cron Job의 무단 접근을 막기 위한 간단한 보안 장치
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // --- 1. 현재 리더보드 데이터 읽기 ---
    const leaderboardRef = db.collection('leaderboard');
    const snapshot = await leaderboardRef.orderBy('score', 'desc').get();

    if (snapshot.empty) {
      console.log('No data in the current leaderboard. Skipping snapshot.');
    } else {
      const leaderboardData = snapshot.docs.map(doc => doc.data());

      // --- 2. 스냅샷으로 저장하기 ---
      // 이전 달의 연도와 월을 이름으로 사용 (예: "2025-08")
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = previousMonth.getFullYear();
      const month = String(previousMonth.getMonth() + 1).padStart(2, '0'); // 08월처럼 두 자리로
      const snapshotId = `${year}-${month}`;

      const pastLeaderboardRef = db.collection('past_leaderboards').doc(snapshotId);
      await pastLeaderboardRef.set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ranking: leaderboardData,
      });

      console.log(`Successfully created snapshot for ${snapshotId}`);
    }

    // --- 3. 현재 리더보드 초기화하기 ---
    // 모든 유저의 점수를 0으로 업데이트
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { score: 0 });
    });
    await batch.commit();

    console.log('Leaderboard has been successfully reset.');

    res.status(200).json({ message: 'Leaderboard snapshot and reset completed successfully.' });

  } catch (error) {
    console.error('Error during monthly reset:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
