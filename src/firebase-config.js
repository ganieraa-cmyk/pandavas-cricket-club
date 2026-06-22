// src/firebase-config.js - ADD uploadFile EXPORT
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBbyUmKvhpFf0ZYBlfdH7X1EWDfOH3PDgk",
  authDomain: "pandavas-cc-scorer.firebaseapp.com",
  projectId: "pandavas-cc-scorer",
  storageBucket: "pandavas-cc-scorer.firebasestorage.app",
  messagingSenderId: "531872663001",
  appId: "1:531872663001:web:28459979ad5110c8e0c5c8",
  measurementId: "G-EE3XDFJBYY"
};

const app = initializeApp(firebaseConfig);

// ✅ EXPORT ALL FIREBASE SERVICES
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

// ✅ ADD THIS: uploadFile function
export async function uploadFile(path, file) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Firestore helpers
export const firestore = {
  async create(collectionName, data) {
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, { ...data, id: docRef.id, createdAt: serverTimestamp() });
    return docRef.id;
  },
  
  async getAll(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  async getOne(collectionName, id) {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },
  
  async update(collectionName, id, data) {
    await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
  },
  
  async delete(collectionName, id) {
    await deleteDoc(doc(db, collectionName, id));
  },
  
  async query(collectionName, conditions = [], orderByField = null, limitCount = null) {
    let q = collection(db, collectionName);
    if (conditions.length) {
      conditions.forEach(cond => {
        q = query(q, where(cond.field, cond.operator, cond.value));
      });
    }
    if (orderByField) q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
    if (limitCount) q = query(q, limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  listen(collectionName, callback, conditions = []) {
    let q = collection(db, collectionName);
    if (conditions.length) {
      conditions.forEach(cond => {
        q = query(q, where(cond.field, cond.operator, cond.value));
      });
    }
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  },
  
  async batchWrite(operations) {
    const batch = writeBatch(db);
    operations.forEach(op => {
      const ref = doc(db, op.collection, op.id || doc(collection(db, op.collection)).id);
      if (op.type === 'set') batch.set(ref, op.data);
      else if (op.type === 'update') batch.update(ref, op.data);
      else if (op.type === 'delete') batch.delete(ref);
    });
    await batch.commit();
  }
};

// Auth helpers
export const authService = {
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  },
  
  async signOut() {
    await signOut(auth);
  },
  
  getCurrentUser() {
    return auth.currentUser;
  },
  
  onAuthStateChange(callback) {
    return auth.onAuthStateChanged(callback);
  }
};
