import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase configuration from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 
                     process.env.EXPO_PUBLIC_SUPABASE_URL || 
                     'https://gstxothkjosohcqqcqyj.supabase.co';

const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 
                          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdHhvdGhram9zb2hjcXFjcXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4OTc2ODcsImV4cCI6MjA0OTQ3MzY4N30.Q-FKR-xHRCxb7GnXSTU5zfAXfOlgIhzGGb1UjWm_IiI';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Upload image to Supabase Storage
 * @param {string} uri - Local file URI
 * @param {string} bucket - Storage bucket name (e.g., 'images')
 * @param {string} folder - Folder path (e.g., 'employees', 'cmt')
 * @param {string} filename - File name (e.g., 'employee_123.jpg')
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImage = async (uri, bucket, folder, filename) => {
  try {

    // Generate file path
    const filePath = `${folder}/${filename}`;
    
    // Detect content type from URI
    let contentType = 'image/jpeg';
    const lowerUri = uri.toLowerCase();
    if (lowerUri.includes('.png')) contentType = 'image/png';
    else if (lowerUri.includes('.jpg') || lowerUri.includes('.jpeg')) contentType = 'image/jpeg';

    // For React Native, we need to use FormData or direct file upload
    // Create file data for upload
    const fileExt = contentType === 'image/png' ? 'png' : 'jpg';
    const fileName = filePath.split('/').pop() || `file.${fileExt}`;
    
    // Use fetch to get the file as ArrayBuffer
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const fileSize = arrayBuffer.byteLength;

    // Upload to Supabase Storage using ArrayBuffer
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: `Upload failed: ${error.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: error.message || 'Unknown upload error' };
  }
};

/**
 * Upload multiple images
 * @param {string[]} uris - Array of local file URIs
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder path
 * @param {string} prefix - Filename prefix
 * @returns {Promise<{success: boolean, urls?: string[], error?: string}>}
 */
export const uploadMultipleImages = async (uris, bucket, folder, prefix) => {
  try {

    const uploadPromises = uris.map((uri, index) => {
      // Generate unique filename with timestamp and index
      const timestamp = Date.now();
      const ext = uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
      const filename = `${prefix}_${timestamp}_${index}.${ext}`;
      return uploadImage(uri, bucket, folder, filename);
    });

    const results = await Promise.all(uploadPromises);
    
    const failedUploads = results.filter(r => !r.success);
    if (failedUploads.length > 0) {
      console.error('Some uploads failed:', failedUploads);
      return {
        success: false,
        error: `Failed to upload ${failedUploads.length} of ${uris.length} images: ${failedUploads.map(f => f.error).join(', ')}`,
      };
    }

    const urls = results.map(r => r.url);

    return {
      success: true,
      urls,
    };
  } catch (error) {
    console.error('Multiple upload exception:', error);
    return { success: false, error: error.message || 'Unknown error during multiple upload' };
  }
};

/**
 * Delete image from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Full file path
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImage = async (bucket, filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
