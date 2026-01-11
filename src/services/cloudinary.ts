/**
 * Cloudinary Upload Service
 * 
 * For this to work, you need to:
 * 1. Create a Cloudinary account at https://cloudinary.com
 * 2. Go to Settings > Upload > Upload presets
 * 3. Create an "Unsigned" upload preset (for mobile apps)
 * 4. Add your cloud name and upload preset to .env:
 *    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
 */

import { Platform } from 'react-native';

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_VIDEO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

export interface CloudinaryUploadResponse {
    success: boolean;
    url?: string;
    publicId?: string;
    error?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

/**
 * Check if Cloudinary is properly configured
 */
export const isCloudinaryConfigured = (): boolean => {
    return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
};

/**
 * Upload an image to Cloudinary
 * @param imageUri - Local file URI of the image
 * @param folder - Optional folder name in Cloudinary (e.g., 'profiles', 'verification')
 * @param onProgress - Optional callback for upload progress
 */
export const uploadImage = async (
    imageUri: string,
    folder: string = 'metll/profiles',
    onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse> => {
    if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary not configured. Add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env file');
        return {
            success: false,
            error: 'Cloudinary not configured',
        };
    }

    try {
        // Create form data
        const formData = new FormData();
        
        // Get file name and type from URI
        const uriParts = imageUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;

        // Append file to form data
        formData.append('file', {
            uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
            type: mimeType,
            name: fileName,
        } as any);

        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', folder);

        console.log('📤 Uploading image to Cloudinary...', { fileName, folder });

        // Upload to Cloudinary
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const data = await response.json();

        if (response.ok && data.secure_url) {
            console.log('✅ Image uploaded successfully:', data.secure_url);
            return {
                success: true,
                url: data.secure_url,
                publicId: data.public_id,
            };
        } else {
            console.error('❌ Cloudinary upload failed:', data);
            return {
                success: false,
                error: data.error?.message || 'Upload failed',
            };
        }
    } catch (error: any) {
        console.error('❌ Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message || 'Network error during upload',
        };
    }
};

/**
 * Upload a video to Cloudinary
 * @param videoUri - Local file URI of the video
 * @param folder - Optional folder name in Cloudinary
 * @param onProgress - Optional callback for upload progress
 */
export const uploadVideo = async (
    videoUri: string,
    folder: string = 'metll/videos',
    onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse> => {
    if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary not configured');
        return {
            success: false,
            error: 'Cloudinary not configured',
        };
    }

    try {
        const formData = new FormData();
        
        const uriParts = videoUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop()?.toLowerCase() || 'mp4';
        const mimeType = `video/${fileType}`;

        formData.append('file', {
            uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
            type: mimeType,
            name: fileName,
        } as any);

        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', folder);
        formData.append('resource_type', 'video');

        console.log('📤 Uploading video to Cloudinary...', { fileName, folder });

        const response = await fetch(CLOUDINARY_VIDEO_UPLOAD_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const data = await response.json();

        if (response.ok && data.secure_url) {
            console.log('✅ Video uploaded successfully:', data.secure_url);
            return {
                success: true,
                url: data.secure_url,
                publicId: data.public_id,
            };
        } else {
            console.error('❌ Cloudinary video upload failed:', data);
            return {
                success: false,
                error: data.error?.message || 'Video upload failed',
            };
        }
    } catch (error: any) {
        console.error('❌ Cloudinary video upload error:', error);
        return {
            success: false,
            error: error.message || 'Network error during video upload',
        };
    }
};

/**
 * Upload multiple images to Cloudinary
 * @param imageUris - Array of local file URIs
 * @param folder - Optional folder name
 * @param onProgress - Callback with overall progress
 */
export const uploadMultipleImages = async (
    imageUris: string[],
    folder: string = 'metll/profiles',
    onProgress?: (completed: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> => {
    const urls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        onProgress?.(i, imageUris.length);

        const result = await uploadImage(uri, folder);
        
        if (result.success && result.url) {
            urls.push(result.url);
        } else {
            errors.push(result.error || `Failed to upload image ${i + 1}`);
        }
    }

    onProgress?.(imageUris.length, imageUris.length);
    return { urls, errors };
};

export default {
    uploadImage,
    uploadVideo,
    uploadMultipleImages,
    isCloudinaryConfigured,
};

