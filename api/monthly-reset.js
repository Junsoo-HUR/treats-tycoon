// /api/monthly-reset.js

import admin from 'firebase-admin';

// 파일 import 대신, Vercel 환경 변수에서 인증 정보를 읽어옵니다.
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
    // 헤더 인증은 그대로 유지합니다.
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const playersRef = db.collection('players');
        const snapshot = await playersRef.orderBy('score', 'desc').get();

        if (!snapshot.empty) {
            const leaderboardData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    name: data.name || 'Unknown',
                    score: data.score || 0,
                    companyLevel: data.companyLevel || 1,
                    email: data.email || 'guest'
                };
            });
            
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

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                score: 0,
                monthlySales: 0
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
