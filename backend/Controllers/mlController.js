import axios from 'axios';
import FormData from 'form-data';
import multer from 'multer';

// Configure multer to store files in memory
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// @desc    Send image to Python ML microservice
// @route   POST /api/ml/identify-plant
// @access  Private
// @req.file  Incoming multipart image
export const identifyPlant = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Create form-data object to send to Python Server
        const form = new FormData();

        // Append the buffer. form-data requires a filename when appending a buffer
        form.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Make request to local Python Microservice
        const response = await axios.post('http://127.0.0.1:5001/predict', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // Pass response data securely down to React
        res.json(response.data);

    } catch (error) {
        console.error('Error in identifying plant:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ message: 'Error connecting to ML microservice locally or offline.', details: error.message });
    }
};
