// /api/monthly-reset.js

import admin from 'firebase-admin';

// Vercel 환경 변수에서 인증 정보를 읽어옵니다.
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error('Firebase Admin Initialization Error', e);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // ✨ 변경점: orderBy를 제거하여 'players' 컬렉션의 모든 문서를 가져옵니다.
        const allPlayersSnapshot = await db.collection('players').get();

        // --- 스냅샷 생성 ---
        if (!allPlayersSnapshot.empty) {
            // 가져온 모든 플레이어 데이터를 메모리에서 정렬하여 랭킹을 만듭니다.
            const rankedData = allPlayersSnapshot.docs
                .map(doc => doc.data())
                .sort((a, b) => (b.monthlySales || 0) - (a.monthlySales || 0));

            const leaderboardData = rankedData.map(data => ({
                name: data.name || 'Unknown',
                score: data.score || 0,
                monthlySales: data.monthlySales || 0,
                companyLevel: data.companyLevel || 1,
                email: data.email || 'guest'
            }));
            
            // 이전 달 계산 로직
            const now = new Date();
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

        // --- 모든 플레이어 초기화 ---
        const batch = db.batch();
        allPlayersSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                score: 0,
                monthlySales: 0
            });
        });
        await batch.commit();

        console.log('All player scores and monthly sales have been successfully reset.');
        res.status(200).json({ message: 'Leaderboard snapshot and reset completed successfully.' });

    } catch (error) {
        console.error('Error during monthly reset:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
