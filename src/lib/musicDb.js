// Permanent Offline IndexedDB Storage for Trek Quest Music
const DB_NAME = 'trekquest_music_db';
const DB_VERSION = 1;
const STORE_NAME = 'user_tracks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all permanently saved user tracks from IndexedDB
 */
export async function getSavedUserTracks() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = req.result || [];
        // Convert stored Blobs into usable ObjectURLs
        const tracks = items.map((item) => ({
          id: item.id,
          name: item.name, // EXACT original file name
          url: item.blob ? URL.createObjectURL(item.blob) : item.url,
          blob: item.blob,
          category: item.category || 'My Music',
          duration: item.duration || '0:00',
          isUserUploaded: true,
          addedAt: item.addedAt || Date.now(),
        }));
        resolve(tracks);
      };

      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB read notice:', err);
    return [];
  }
}

/**
 * Permanently save a user-uploaded audio file to IndexedDB
 */
export async function saveUserTrack({ id, name, file, category }) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        id: id || 'track_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: name, // Exact original file name, no renaming!
        blob: file, // Store the raw File/Blob permanently
        category: category || 'My Music',
        addedAt: Date.now(),
      };

      const req = store.put(record);
      req.onsuccess = () => {
        resolve({
          ...record,
          url: URL.createObjectURL(file),
          isUserUploaded: true,
        });
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save track to IndexedDB:', err);
    throw err;
  }
}

/**
 * Permanently delete a track from IndexedDB
 */
export async function deleteUserTrack(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete track from IndexedDB:', err);
    return false;
  }
}

/**
 * Allow the user (and ONLY the user) to rename a track if they choose
 */
export async function updateUserTrackName(id, newName) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result;
        if (!record) return resolve(false);
        record.name = newName;
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.error('Failed to rename track in IndexedDB:', err);
    return false;
  }
}
