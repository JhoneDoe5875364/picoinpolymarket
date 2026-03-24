
import { db, firebaseInitializationPromise } from './firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Market } from './types';

type GetMarketsOptions = {
    status?: Market['status'];
    category?: string;
    sort?: 'volume' | 'newest' | 'closing-soon';
    count?: number;
}

// This function converts Firestore Timestamps to serializable strings
const marketFromDoc = (doc: any): Market => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate,
    };
}


export async function getMarkets(options: GetMarketsOptions = {}): Promise<Market[]> {
    await firebaseInitializationPromise; // Ensure Firebase is initialized
    
    const { status, category = 'All', sort = 'volume', count = 100 } = options;

    try {
        const marketsRef = collection(db, 'markets');
        
        let q = query(marketsRef);

        // --- Filtering ---
        if (status) {
            q = query(q, where('status', '==', status));
        }
        if (category && category !== 'All') {
            q = query(q, where('category', '==', category));
        }

        // --- Sorting ---
        if (sort === 'volume') {
            q = query(q, orderBy('volume', 'desc'));
        } else if (sort === 'newest') {
            q = query(q, orderBy('createdAt', 'desc'));
        } else if (sort === 'closing-soon') {
            // Firestore requires the first orderBy to match the inequality field
            q = query(q, where('endDate', '!=', null), orderBy('endDate', 'asc'));
        }

        // --- Limiting ---
        q = query(q, limit(count));

        const querySnapshot = await getDocs(q);
        const markets = querySnapshot.docs.map(marketFromDoc);
        
        return markets;
    } catch (error) {
        console.error("Error fetching markets from Firestore: ", error);
        // This is a critical error for the page, so we throw it to be caught by Next.js error boundary
        throw new Error('Failed to fetch markets. Please ensure Firestore is set up correctly.');
    }
}
