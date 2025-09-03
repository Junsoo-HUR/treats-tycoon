// /api/monthly-reset.js

import admin from 'firebase-admin';
// Firebase 서비스 계정 키 파일 경로를 확인해주세요.
// 프로젝트 루트에 있다면 ../serviceAccountKey 처럼 경로를 수정해야 할 수 있습니다.
import { serviceAccount } from '../../serviceAccountKey'; 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // --- 1. 현재 리더보드 데이터 읽기 ---
    // 변경점 1: 'leaderboard' 대신 'players' 컬렉션을 사용합니다.
    const playersRef = db.collection('players');
    // 변경점 2: 'score' 필드를 기준으로 내림차순 정렬하여 순위를 만듭니다.
    const snapshot = await playersRef.orderBy('score', 'desc').get();

    if (snapshot.empty) {
      console.log('No players found. Skipping snapshot.');
    } else {
      const leaderboardData = snapshot.docs.map(doc => {
        const data = doc.data();
        // 스냅샷에 저장할 유용한 정보만 추출합니다 (예: 이름, 점수).
        return {
          name: data.name || 'Unknown', // 'name' 필드가 없다면 기본값 사용
          score: data.score || 0,
          companyLevel: data.companyLevel || 1,
          email: data.email || 'guest'
        };
      });

      // --- 2. 스냅샷으로 저장하기 ---
      const now = new Date();
      // 한국 시간 기준(KST, UTC+9)으로 이전 달 계산
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstNow = new Date(now.getTime() + kstOffset);
      const previousMonth = new Date(kstNow.getFullYear(), kstNow.getMonth() - 1, 1);
      
      const year = previousMonth.getFullYear();
      const month = String(previousMonth.getMonth() + 1).padStart(2, '0');
      const snapshotId = `${year}-${month}`;

      const pastLeaderboardRef = db.collection('past_leaderboards').doc(snapshotId);
      await pastLeaderboardRef.set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ranking: leaderboardData,
      });

      console.log(`Successfully created snapshot for ${snapshotId}`);
    }

    // --- 3. 현재 리더보드 초기화하기 ---
    // 모든 플레이어 문서의 'score'와 'monthlySales' 필드를 0으로 업데이트합니다.
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        score: 0,
        monthlySales: 0 // 월간 매출도 초기화
      });
    });
    await batch.commit();

    console.log('Player scores and monthly sales have been successfully reset.');

    res.status(200).json({ message: 'Leaderboard snapshot and reset completed successfully.' });

  } catch (error) {
    console.error('Error during monthly reset:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
