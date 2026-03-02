import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();

// Configure Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("WARNING: Supabase URL or Service Role Key missing in environment variables.");
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Configure Multer for in-memory uploads (perfect for intermediate transit)
// For large files (> 50MB), you might consider disk storage or direct client uploads using signed URLs.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit to match Supabase bucket limits
});

// Middleware to check Admin Secret
const requireAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        return res.status(500).json({ error: 'Server not configured with ADMIN_EMAIL' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the JWT token securely with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Verify the user is the designated admin
        if (user.email !== adminEmail) {
            return res.status(403).json({ error: 'Forbidden: You do not have admin clearance' });
        }

        // Attach user to request for downstream use if needed
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

// --- Routes ---

// Login / Token Verification Endpoint
router.post('/verify', requireAdmin, (req, res) => {
    // If the middleware passes, the token is valid
    res.status(200).json({ success: true, message: 'Token verified' });
});

// Upload PDF & Metadata Endpoint
router.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF files are allowed' });
        }

        // Extract metadata from body
        const { title, college, degree, branch, year, sem, subject, examtype } = req.body;

        // Basic validation
        if (!title || !college || !degree || !branch || !year || !sem || !subject || !examtype) {
            return res.status(400).json({ error: 'Missing required metadata fields.' });
        }

        // Generate unique filename to avoid collisions
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `papers/${uniqueFileName}`;

        console.log(`Starting upload for ${filePath} (${file.size} bytes)...`);

        // 1. Upload to Storage using Service Role
        const { data: storageData, error: storageError } = await supabase.storage
            .from('exam-vault-assets')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (storageError) {
            console.error("Supabase storage error:", storageError);
            return res.status(500).json({ error: 'Failed to upload file to storage', details: storageError.message });
        }

        // 2. Insert Metadata into Database using Service Role
        const { data: dbData, error: dbError } = await supabase
            .from('exam_papers')
            .insert([
                {
                    college: college,
                    degree: degree,
                    branch: branch,
                    year: parseInt(year),
                    semester: parseInt(sem),
                    subject: subject,
                    exam_type: examtype,
                    file_path: filePath,
                    view_count: 0
                    // "title" is roughly captured as "subject", or we can append it.
                    // The schema has: college, degree, branch, year, semester, subject, exam_type, file_path
                }
            ])
            .select();

        if (dbError) {
            console.error("Supabase DB error:", dbError);
            // Optional: Should we delete the file from storage if DB insert fails?
            // await supabase.storage.from('exam-vault-assets').remove([filePath]);
            return res.status(500).json({ error: 'Failed to save metadata to database', details: dbError.message });
        }

        res.status(200).json({
            success: true,
            message: 'File uploaded and metadata saved successfully',
            path: filePath,
            record: dbData[0]
        });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: 'Internal server error during upload' });
    }
});

// Delete Paper & Storage File Endpoint
router.delete('/delete/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Paper ID is required.' });
        }

        // 1. Fetch the file_path first so we can delete from storage
        const { data: paper, error: fetchError } = await supabase
            .from('exam_papers')
            .select('file_path')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Fetch for delete error:', fetchError);
            return res.status(404).json({ error: 'Paper not found.' });
        }

        // 2. Delete from Storage (best-effort)
        if (paper?.file_path) {
            const { error: storageError } = await supabase.storage
                .from('exam-vault-assets')
                .remove([paper.file_path]);

            if (storageError) {
                console.warn('Storage delete warning (continuing):', storageError.message);
            }
        }

        // 3. Delete DB record
        const { error: dbError } = await supabase
            .from('exam_papers')
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error('DB delete error:', dbError);
            return res.status(500).json({ error: 'Failed to delete record from database.', details: dbError.message });
        }

        return res.status(200).json({ success: true, message: 'Paper deleted successfully.' });

    } catch (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Internal server error during deletion.' });
    }
});

export default router;
