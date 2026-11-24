/** One applied file per browser origin. Preview files never enter storage. */
async function fontRecord(write?: File | null): Promise<File | undefined> {
 const db = await new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('SoftWet.localFont', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('fonts');
  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
 });
 try {
  return await new Promise<File | undefined>((resolve, reject) => {
   const transaction = db.transaction('fonts', write === undefined ? 'readonly' : 'readwrite');
   const store = transaction.objectStore('fonts');
   const request = write === undefined ? store.get('active')
    : write === null ? store.delete('active') : store.put(write, 'active');
   transaction.onabort = () => reject(transaction.error ?? new Error('字体存储未完成'));
   transaction.oncomplete = () => resolve(request.result instanceof File ? request.result : undefined);
  });
 } finally { db.close() }
}
export {fontRecord};
export const importedFamily = 'SoftWet Imported TTF';
export async function decodeLocalFont(file: File, family: string) {
 if (!/\.ttf$/i.test(file.name) || file.size < 12) throw new Error('请选择有效的 TTF 文件。');
 const signature = new DataView(await file.slice(0, 4).arrayBuffer()).getUint32(0);
 if (signature !== 0x00010000 && signature !== 0x74727565) throw new Error('文件不是支持的 TrueType 字体。');
 try { return await new FontFace(family, await file.arrayBuffer()).load() }
 catch { throw new Error('浏览器无法读取这个字体，请换一个 TTF 文件。') }
}
