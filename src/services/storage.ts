import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage';
import { storage } from './firebase';

export interface StorageStats {
  totalBytes: number;
  totalFiles: number;
  percentUsed: number;
}

const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB

// Upload file (image or PDF) for an invoice
export const uploadInvoiceAttachment = async (
  invoiceId: string,
  file: File,
  _onProgress?: (progress: number) => void
): Promise<string> => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `invoices/${invoiceId}/${timestamp}.${extension}`;
  const storageRef = ref(storage, fileName);

  // Upload file
  await uploadBytes(storageRef, file);

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Delete attachment by URL
export const deleteAttachment = async (downloadURL: string): Promise<void> => {
  try {
    const storageRef = ref(storage, downloadURL);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting attachment:', error);
  }
};

// Delete attachment by path
export const deleteAttachmentByPath = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting attachment:', error);
  }
};

// Get storage statistics
export const getStorageStats = async (): Promise<StorageStats> => {
  let totalBytes = 0;
  let totalFiles = 0;

  try {
    const invoicesRef = ref(storage, 'invoices');
    const result = await listAll(invoicesRef);

    // Iterate through invoice folders
    for (const folderRef of result.prefixes) {
      const folderContents = await listAll(folderRef);

      for (const fileRef of folderContents.items) {
        try {
          const metadata = await getMetadata(fileRef);
          totalBytes += metadata.size;
          totalFiles++;
        } catch (error) {
          console.error('Error getting file metadata:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error getting storage stats:', error);
  }

  return {
    totalBytes,
    totalFiles,
    percentUsed: (totalBytes / MAX_STORAGE_BYTES) * 100,
  };
};

// Delete attachments older than specified months
export const deleteOldAttachments = async (monthsOld: number = 12): Promise<{ deleted: number; freedBytes: number }> => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
  const cutoffTimestamp = cutoffDate.getTime();

  let deleted = 0;
  let freedBytes = 0;

  try {
    const invoicesRef = ref(storage, 'invoices');
    const result = await listAll(invoicesRef);

    for (const folderRef of result.prefixes) {
      const folderContents = await listAll(folderRef);

      for (const fileRef of folderContents.items) {
        try {
          const metadata = await getMetadata(fileRef);
          const fileTimestamp = new Date(metadata.timeCreated).getTime();

          if (fileTimestamp < cutoffTimestamp) {
            const fileSize = metadata.size;
            await deleteObject(fileRef);
            deleted++;
            freedBytes += fileSize;
          }
        } catch (error) {
          console.error('Error processing file:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error deleting old attachments:', error);
  }

  return { deleted, freedBytes };
};

// Format bytes to human readable string
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
