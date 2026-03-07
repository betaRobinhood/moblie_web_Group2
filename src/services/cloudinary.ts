import { Cloudinary } from '@cloudinary/url-gen';

import { fill } from "@cloudinary/url-gen/actions/resize";

const cld = new Cloudinary({
    cloud: {
        cloudName: ''
    }
});

export const getCloudinaryUrl = (publicId: string, width = 400, height = 400) => {
    return cld.image(publicId)
        .format('auto')
        .quality('auto')
        .resize(fill().width(width).height(height))
        .toURL();
};

export const uploadToCloudinary = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ezydine_unsigned'); // Use one common unsigned preset name
    formData.append('folder', folder); // Categorize by folder instead of preset

    const response = await fetch(`https://api.cloudinary.com/v1_1/dim2nvzq5/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
    }
    return await response.json();
};


export default cld;

